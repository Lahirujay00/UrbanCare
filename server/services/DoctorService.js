const User = require('../models/User');
const MedicalRecord = require('../models/MedicalRecord');
const AuditLog = require('../models/AuditLog');
const Appointment = require('../models/Appointment');
const mongoose = require('mongoose');

/**
 * DoctorService - Business logic for doctor operations
 * Follows Single Responsibility Principle and Dependency Inversion
 */
class DoctorService {
  
  /**
   * Enhanced patient search with advanced filters
   * User Story: As a doctor, I need to search for patients with multiple criteria
   */
  async searchPatients(searchQuery, filters = {}, doctorId, requestInfo) {
    try {
      let searchCriteria = {
        role: 'patient',
        isActive: true
      };

      // Basic text search
      if (searchQuery && searchQuery.trim()) {
        // Search by digital health card ID (exact match)
        if (searchQuery.match(/^HC-[A-Z0-9-]+$/i)) {
          searchCriteria.digitalHealthCardId = searchQuery.toUpperCase();
        } 
        // Search by phone number
        else if (searchQuery.match(/^[\+]?[\d\s\-\(\)]+$/)) {
          searchCriteria.phone = { $regex: searchQuery.replace(/\D/g, ''), $options: 'i' };
        }
        // Search by email
        else if (searchQuery.includes('@')) {
          searchCriteria.email = { $regex: searchQuery, $options: 'i' };
        }
        // Search by name (fuzzy match)
        else {
          searchCriteria.$or = [
            { firstName: { $regex: searchQuery, $options: 'i' } },
            { lastName: { $regex: searchQuery, $options: 'i' } },
            { 
              $expr: {
                $regexMatch: {
                  input: { $concat: ['$firstName', ' ', '$lastName'] },
                  regex: searchQuery,
                  options: 'i'
                }
              }
            }
          ];
        }
      }

      // Apply additional filters
      if (filters.gender && filters.gender !== 'all') {
        searchCriteria.gender = filters.gender;
      }

      if (filters.bloodType && filters.bloodType !== 'all') {
        searchCriteria.bloodType = filters.bloodType;
      }

      if (filters.ageRange) {
        const today = new Date();
        const { min, max } = filters.ageRange;
        
        if (min !== undefined) {
          const maxBirthDate = new Date(today.getFullYear() - min, today.getMonth(), today.getDate());
          searchCriteria.dateOfBirth = { ...searchCriteria.dateOfBirth, $lte: maxBirthDate };
        }
        
        if (max !== undefined) {
          const minBirthDate = new Date(today.getFullYear() - max - 1, today.getMonth(), today.getDate());
          searchCriteria.dateOfBirth = { ...searchCriteria.dateOfBirth, $gt: minBirthDate };
        }
      }

      if (filters.hasAllergies === true) {
        searchCriteria.$or = [
          { allergies: { $exists: true, $ne: [] } },
          { 'medicalInfo.allergies': { $exists: true, $ne: [] } }
        ];
      }

      if (filters.hasChronicConditions === true) {
        searchCriteria.$or = [
          { chronicConditions: { $exists: true, $ne: [] } },
          { 'medicalInfo.chronicConditions': { $exists: true, $ne: [] } }
        ];
      }

      if (filters.lastVisit) {
        const { startDate, endDate } = filters.lastVisit;
        // This would require joining with appointments or medical records
        // For now, we'll add it to the aggregation pipeline
      }

      // Build aggregation pipeline for complex queries
      const pipeline = [
        { $match: searchCriteria }
      ];

      // Add last visit filter if specified
      if (filters.lastVisit) {
        pipeline.push(
          {
            $lookup: {
              from: 'appointments',
              localField: '_id',
              foreignField: 'patient',
              as: 'appointments'
            }
          },
          {
            $addFields: {
              lastAppointment: {
                $max: '$appointments.appointmentDate'
              }
            }
          },
          {
            $match: {
              lastAppointment: {
                $gte: new Date(filters.lastVisit.startDate),
                $lte: new Date(filters.lastVisit.endDate)
              }
            }
          }
        );
      }

      // Add sorting
      const sortCriteria = {};
      if (filters.sortBy) {
        switch (filters.sortBy) {
          case 'name':
            sortCriteria.firstName = 1;
            sortCriteria.lastName = 1;
            break;
          case 'age':
            sortCriteria.dateOfBirth = -1;
            break;
          case 'lastVisit':
            sortCriteria.lastAppointment = -1;
            break;
          default:
            sortCriteria.createdAt = -1;
        }
      } else {
        sortCriteria.firstName = 1;
        sortCriteria.lastName = 1;
      }

      pipeline.push({ $sort: sortCriteria });

      // Add pagination
      const limit = Math.min(filters.limit || 20, 100); // Max 100 results
      const skip = (filters.page - 1) * limit || 0;

      pipeline.push(
        { $skip: skip },
        { $limit: limit }
      );

      // Add field selection
      pipeline.push({
        $project: {
          firstName: 1,
          lastName: 1,
          email: 1,
          digitalHealthCardId: 1,
          dateOfBirth: 1,
          gender: 1,
          phone: 1,
          bloodType: 1,
          allergies: 1,
          chronicConditions: 1,
          'medicalInfo.allergies': 1,
          'medicalInfo.chronicConditions': 1,
          lastAppointment: 1,
          createdAt: 1
        }
      });

      // Execute search
      let patients;
      if (pipeline.length > 2) { // Complex query with aggregation
        patients = await User.aggregate(pipeline);
      } else { // Simple query
        patients = await User.find(searchCriteria)
          .select('firstName lastName email digitalHealthCardId dateOfBirth gender phone bloodType allergies chronicConditions medicalInfo.allergies medicalInfo.chronicConditions')
          .sort(sortCriteria)
          .skip(skip)
          .limit(limit)
          .lean();
      }

      // Get total count for pagination
      const totalCount = await User.countDocuments(searchCriteria);

      // Enhance results with calculated fields
      const enhancedPatients = patients.map(patient => ({
        ...patient,
        age: this._calculateAge(patient.dateOfBirth),
        fullName: `${patient.firstName} ${patient.lastName}`,
        hasAllergies: (patient.allergies && patient.allergies.length > 0) || 
                     (patient.medicalInfo?.allergies && patient.medicalInfo.allergies.length > 0),
        hasChronicConditions: (patient.chronicConditions && patient.chronicConditions.length > 0) || 
                             (patient.medicalInfo?.chronicConditions && patient.medicalInfo.chronicConditions.length > 0)
      }));

      // Log search activity
      await AuditLog.createLog({
        userId: doctorId,
        userRole: 'doctor',
        action: 'SEARCH_PATIENT',
        resourceType: 'Patient',
        resourceId: doctorId,
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent,
        description: `Enhanced patient search with query: ${searchQuery || 'filtered search'}`,
        metadata: { 
          searchQuery, 
          filters,
          resultCount: patients.length,
          totalCount,
          page: filters.page || 1
        }
      });

      return {
        success: true,
        data: {
          patients: enhancedPatients,
          pagination: {
            total: totalCount,
            page: filters.page || 1,
            limit: limit,
            totalPages: Math.ceil(totalCount / limit)
          },
          filters: filters
        },
        message: `Found ${patients.length} patient(s) out of ${totalCount} total`
      };

    } catch (error) {
      // Log failed search
      await AuditLog.createLog({
        userId: doctorId,
        userRole: 'doctor',
        action: 'SEARCH_PATIENT',
        resourceType: 'Patient',
        resourceId: doctorId,
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent,
        status: 'FAILURE',
        errorMessage: error.message,
        description: `Failed enhanced patient search with query: ${searchQuery}`
      });

      throw new Error(`Enhanced patient search failed: ${error.message}`);
    }
  }

  /**
   * Get recent patients for doctor (quick access)
   */
  async getRecentPatients(doctorId, limit = 10, requestInfo) {
    try {
      // Get recent patients from medical records or appointments
      const recentPatients = await MedicalRecord.aggregate([
        {
          $match: {
            doctor: new mongoose.Types.ObjectId(doctorId),
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
          }
        },
        {
          $group: {
            _id: '$patient',
            lastVisit: { $max: '$createdAt' },
            visitCount: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'patient'
          }
        },
        {
          $unwind: '$patient'
        },
        {
          $match: {
            'patient.role': 'patient',
            'patient.isActive': true
          }
        },
        {
          $project: {
            _id: '$patient._id',
            firstName: '$patient.firstName',
            lastName: '$patient.lastName',
            digitalHealthCardId: '$patient.digitalHealthCardId',
            email: '$patient.email',
            phone: '$patient.phone',
            lastVisit: 1,
            visitCount: 1
          }
        },
        {
          $sort: { lastVisit: -1 }
        },
        {
          $limit: limit
        }
      ]);

      // Log recent patients access
      await AuditLog.createLog({
        userId: doctorId,
        userRole: 'doctor',
        action: 'VIEW_RECENT_PATIENTS',
        resourceType: 'Patient',
        resourceId: doctorId,
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent,
        description: `Accessed recent patients list`,
        metadata: { 
          resultCount: recentPatients.length,
          limit
        }
      });

      return {
        success: true,
        data: recentPatients,
        message: `Found ${recentPatients.length} recent patient(s)`
      };

    } catch (error) {
      throw new Error(`Failed to get recent patients: ${error.message}`);
    }
  }

  /**
   * Calculate age from date of birth
   * @private
   */
  _calculateAge(dateOfBirth) {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  /**
   * Get complete patient medical history
   * User Story 3: View patient's complete medical history
   */
  async getPatientMedicalHistory(patientId, doctorId, requestInfo) {
    try {
      // Validate patient exists
      const patient = await User.findById(patientId).select('firstName lastName digitalHealthCardId dateOfBirth gender bloodType allergies chronicConditions');
      
      if (!patient || patient.role !== 'patient') {
        throw new Error('Patient not found');
      }

      // Get medical records with pagination and sorting
      const medicalRecords = await MedicalRecord.find({
        patient: patientId,
        status: 'active'
      })
      .populate('createdBy', 'firstName lastName specialization')
      .populate('doctor', 'firstName lastName specialization')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

      // Get recent appointments
      const recentAppointments = await Appointment.find({
        patient: patientId,
        status: { $in: ['completed', 'confirmed'] }
      })
      .populate('doctor', 'firstName lastName specialization')
      .sort({ appointmentDate: -1 })
      .limit(10)
      .lean();

      // Log access to patient record
      await AuditLog.createLog({
        userId: doctorId,
        userRole: 'doctor',
        action: 'VIEW_PATIENT_RECORD',
        resourceType: 'MedicalRecord',
        resourceId: patientId,
        patientId: patientId,
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent,
        description: `Accessed medical history for patient ${patient.firstName} ${patient.lastName}`,
        metadata: { recordCount: medicalRecords.length }
      });

      return {
        success: true,
        data: {
          patient: patient,
          medicalRecords: medicalRecords,
          recentAppointments: recentAppointments,
          summary: {
            totalRecords: medicalRecords.length,
            lastVisit: recentAppointments[0]?.appointmentDate || null,
            recordTypes: this._getRecordTypeSummary(medicalRecords)
          }
        },
        message: 'Patient medical history retrieved successfully'
      };

    } catch (error) {
      // Log failed access
      await AuditLog.createLog({
        userId: doctorId,
        userRole: 'doctor',
        action: 'VIEW_PATIENT_RECORD',
        resourceType: 'MedicalRecord',
        resourceId: patientId,
        patientId: patientId,
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent,
        status: 'FAILURE',
        errorMessage: error.message,
        description: `Failed to access medical history for patient ID: ${patientId}`
      });

      throw new Error(`Failed to retrieve patient medical history: ${error.message}`);
    }
  }

  /**
   * Add treatment notes to patient record
   * User Story 4: Add new treatment notes during/after consultation
   */
  async addTreatmentNote(patientId, treatmentData, doctorId, requestInfo) {
    const session = await mongoose.startSession();
    
    try {
      await session.startTransaction();

      // Validate patient exists
      const patient = await User.findById(patientId).session(session);
      if (!patient || patient.role !== 'patient') {
        throw new Error('Patient not found');
      }

      // Create new medical record for treatment note
      const treatmentNote = new MedicalRecord({
        patient: patientId,
        recordType: 'consultation',
        createdBy: doctorId,
        doctor: doctorId,
        title: treatmentData.title,
        description: treatmentData.description,
        diagnosis: treatmentData.diagnosis,
        prescriptions: treatmentData.prescriptions || [],
        vitalSigns: treatmentData.vitalSigns,
        notes: treatmentData.notes,
        followUp: treatmentData.followUp,
        tags: treatmentData.tags || ['treatment-note']
      });

      await treatmentNote.save({ session });

      // Log the creation with detailed change tracking
      await AuditLog.createLog({
        userId: doctorId,
        userRole: 'doctor',
        action: 'CREATE_TREATMENT_NOTE',
        resourceType: 'MedicalRecord',
        resourceId: treatmentNote._id,
        patientId: patientId,
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent,
        changes: {
          after: treatmentNote.toObject(),
          fieldsChanged: Object.keys(treatmentData)
        },
        description: `Created treatment note: ${treatmentData.title}`,
        metadata: { 
          recordType: 'consultation',
          hasVitalSigns: !!treatmentData.vitalSigns,
          hasPrescriptions: !!(treatmentData.prescriptions && treatmentData.prescriptions.length > 0)
        }
      });

      await session.commitTransaction();

      return {
        success: true,
        data: treatmentNote,
        message: 'Treatment note added successfully'
      };

    } catch (error) {
      await session.abortTransaction();
      
      // Log failed creation
      await AuditLog.createLog({
        userId: doctorId,
        userRole: 'doctor',
        action: 'CREATE_TREATMENT_NOTE',
        resourceType: 'MedicalRecord',
        resourceId: patientId,
        patientId: patientId,
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent,
        status: 'FAILURE',
        errorMessage: error.message,
        description: `Failed to create treatment note for patient ID: ${patientId}`
      });

      throw new Error(`Failed to add treatment note: ${error.message}`);
    } finally {
      await session.endSession();
    }
  }

  /**
   * Update existing treatment note
   * User Story 5: Update patient records with secure logging
   */
  async updateTreatmentNote(recordId, updateData, doctorId, requestInfo) {
    const session = await mongoose.startSession();
    
    try {
      await session.startTransaction();

      // Get original record for change tracking
      const originalRecord = await MedicalRecord.findById(recordId).session(session);
      if (!originalRecord) {
        throw new Error('Medical record not found');
      }

      // Verify doctor has permission to update this record
      if (originalRecord.doctor.toString() !== doctorId.toString()) {
        throw new Error('Unauthorized: You can only update your own treatment notes');
      }

      // Create version history before updating
      await originalRecord.createVersion(doctorId, 'Updated treatment note');

      // Update the record
      const updatedRecord = await MedicalRecord.findByIdAndUpdate(
        recordId,
        {
          ...updateData,
          updatedAt: new Date()
        },
        { 
          new: true, 
          session,
          runValidators: true 
        }
      );

      // Log the update with detailed change tracking
      await AuditLog.createLog({
        userId: doctorId,
        userRole: 'doctor',
        action: 'UPDATE_TREATMENT_NOTE',
        resourceType: 'MedicalRecord',
        resourceId: recordId,
        patientId: originalRecord.patient,
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent,
        changes: {
          before: originalRecord.toObject(),
          after: updatedRecord.toObject(),
          fieldsChanged: Object.keys(updateData)
        },
        description: `Updated treatment note: ${originalRecord.title}`,
        metadata: { 
          versionNumber: originalRecord.version,
          updateFields: Object.keys(updateData)
        }
      });

      await session.commitTransaction();

      return {
        success: true,
        data: updatedRecord,
        message: 'Treatment note updated successfully'
      };

    } catch (error) {
      await session.abortTransaction();
      
      // Log failed update
      await AuditLog.createLog({
        userId: doctorId,
        userRole: 'doctor',
        action: 'UPDATE_TREATMENT_NOTE',
        resourceType: 'MedicalRecord',
        resourceId: recordId,
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent,
        status: 'FAILURE',
        errorMessage: error.message,
        description: `Failed to update treatment note ID: ${recordId}`
      });

      throw new Error(`Failed to update treatment note: ${error.message}`);
    } finally {
      await session.endSession();
    }
  }

  /**
   * Get doctor's schedule and availability
   * User Story 6 & 7: Manage schedule and check available slots
   */
  async getDoctorSchedule(doctorId, requestInfo) {
    try {
      const doctor = await User.findById(doctorId).select('availability schedule firstName lastName');
      
      if (!doctor || doctor.role !== 'doctor') {
        throw new Error('Doctor not found');
      }

      // Get upcoming appointments
      const upcomingAppointments = await Appointment.find({
        doctor: doctorId,
        appointmentDate: { $gte: new Date() },
        status: { $in: ['confirmed', 'pending'] }
      })
      .populate('patient', 'firstName lastName digitalHealthCardId')
      .sort({ appointmentDate: 1 })
      .limit(20);

      // Log schedule access
      await AuditLog.createLog({
        userId: doctorId,
        userRole: 'doctor',
        action: 'VIEW_SCHEDULE',
        resourceType: 'User',
        resourceId: doctorId,
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent,
        description: 'Accessed personal schedule',
        metadata: { upcomingAppointments: upcomingAppointments.length }
      });

      return {
        success: true,
        data: {
          doctor: {
            name: doctor.firstName + ' ' + doctor.lastName,
            availability: doctor.availability,
            schedule: doctor.schedule
          },
          upcomingAppointments: upcomingAppointments
        },
        message: 'Schedule retrieved successfully'
      };

    } catch (error) {
      throw new Error(`Failed to retrieve schedule: ${error.message}`);
    }
  }

  /**
   * Update doctor's availability
   * User Story 6: Manage schedule and block specific times
   */
  async updateAvailability(doctorId, availabilityData, requestInfo) {
    try {
      const originalDoctor = await User.findById(doctorId);
      
      const updatedDoctor = await User.findByIdAndUpdate(
        doctorId,
        { availability: availabilityData },
        { new: true, runValidators: true }
      ).select('availability firstName lastName');

      // Log availability update
      await AuditLog.createLog({
        userId: doctorId,
        userRole: 'doctor',
        action: 'UPDATE_SCHEDULE',
        resourceType: 'User',
        resourceId: doctorId,
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent,
        changes: {
          before: { availability: originalDoctor.availability },
          after: { availability: updatedDoctor.availability },
          fieldsChanged: ['availability']
        },
        description: 'Updated availability schedule'
      });

      return {
        success: true,
        data: updatedDoctor,
        message: 'Availability updated successfully'
      };

    } catch (error) {
      throw new Error(`Failed to update availability: ${error.message}`);
    }
  }

  /**
   * Helper method to summarize record types
   * @private
   */
  _getRecordTypeSummary(records) {
    const summary = {};
    records.forEach(record => {
      summary[record.recordType] = (summary[record.recordType] || 0) + 1;
    });
    return summary;
  }
}

module.exports = new DoctorService();
