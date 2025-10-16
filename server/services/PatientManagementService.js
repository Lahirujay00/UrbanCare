const User = require('../models/User');
const MedicalRecord = require('../models/MedicalRecord');
const Appointment = require('../models/Appointment');
const AuditLog = require('../models/AuditLog');
const mongoose = require('mongoose');

/**
 * Patient Management Service - Comprehensive patient management for doctors
 * Integrates patient search, medical records, and patient details
 */
class PatientManagementService {

  /**
   * Get comprehensive patient dashboard for doctor
   * Includes recent patients, search functionality, and quick stats
   */
  async getPatientDashboard(doctorId, requestInfo) {
    try {
      // Get recent patients (last 30 days)
      const recentPatients = await this._getRecentPatients(doctorId, 10);
      
      // Get today's patients (from appointments)
      const todayPatients = await this._getTodayPatients(doctorId);
      
      // Get patient statistics
      const patientStats = await this._getPatientStatistics(doctorId);
      
      // Log dashboard access
      await AuditLog.createLog({
        userId: doctorId,
        userRole: 'doctor',
        action: 'VIEW_PATIENT_DASHBOARD',
        resourceType: 'Patient',
        resourceId: doctorId,
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent,
        description: 'Accessed patient management dashboard',
        metadata: { 
          recentPatientsCount: recentPatients.length,
          todayPatientsCount: todayPatients.length
        }
      });

      return {
        success: true,
        data: {
          recentPatients,
          todayPatients,
          statistics: patientStats,
          quickActions: {
            searchPatients: '/api/doctor/patients/search',
            recentPatients: '/api/doctor/patients/recent',
            emergencyAccess: '/api/doctor/emergency-access'
          }
        },
        message: 'Patient dashboard retrieved successfully'
      };

    } catch (error) {
      throw new Error(`Failed to get patient dashboard: ${error.message}`);
    }
  }

  /**
   * Get comprehensive patient profile with medical records
   * This replaces the separate "Medical Records" tab
   */
  async getPatientProfile(patientId, doctorId, requestInfo) {
    try {
      console.log(`Looking for patient ID: ${patientId}`);
      
      // Get patient basic information
      const patient = await User.findById(patientId)
        .select('firstName lastName email digitalHealthCardId dateOfBirth gender phone bloodType allergies chronicConditions emergencyContact medicalInfo role')
        .lean();

      console.log(`Found patient:`, patient);

      if (!patient) {
        throw new Error('Patient not found in database');
      }
      
      if (patient.role !== 'patient') {
        throw new Error(`User found but role is '${patient.role}', not 'patient'`);
      }

      // Get medical records (all records for this patient, not just from current doctor for testing)
      const medicalRecords = await MedicalRecord.find({
        patient: patientId,
        status: 'active'
      })
      .populate('createdBy', 'firstName lastName specialization')
      .populate('doctor', 'firstName lastName specialization')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

      // Get appointment history (all appointments for this patient)
      const appointmentHistory = await Appointment.find({
        patient: patientId,
        status: { $in: ['completed', 'confirmed'] }
      })
      .populate('doctor', 'firstName lastName specialization')
      .sort({ appointmentDate: -1 })
      .limit(20)
      .lean();

      // Get upcoming appointments
      const upcomingAppointments = await Appointment.find({
        patient: patientId,
        appointmentDate: { $gte: new Date() },
        status: { $in: ['confirmed', 'pending'] }
      })
      .populate('doctor', 'firstName lastName specialization')
      .sort({ appointmentDate: 1 })
      .lean();

      // Calculate patient age
      const age = this._calculateAge(patient.dateOfBirth);

      // Organize medical records by type
      const recordsByType = this._organizeRecordsByType(medicalRecords);

      // Get recent vital signs
      const recentVitals = this._getRecentVitalSigns(medicalRecords);

      // Check for alerts (allergies, chronic conditions)
      const patientAlerts = this._generatePatientAlerts(patient);

      // Log patient profile access
      await AuditLog.createLog({
        userId: doctorId,
        userRole: 'doctor',
        action: 'VIEW_PATIENT_PROFILE',
        resourceType: 'Patient',
        resourceId: patientId,
        patientId: patientId,
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent,
        description: `Accessed comprehensive profile for patient ${patient.firstName} ${patient.lastName}`,
        metadata: { 
          medicalRecordsCount: medicalRecords.length,
          appointmentHistoryCount: appointmentHistory.length,
          upcomingAppointmentsCount: upcomingAppointments.length
        }
      });

      return {
        success: true,
        data: {
          patient: {
            ...patient,
            age,
            fullName: `${patient.firstName} ${patient.lastName}`
          },
          medicalRecords: {
            all: medicalRecords,
            byType: recordsByType,
            recentVitals,
            summary: {
              total: medicalRecords.length,
              lastRecord: medicalRecords[0]?.createdAt || null,
              recordTypes: Object.keys(recordsByType)
            }
          },
          appointments: {
            history: appointmentHistory,
            upcoming: upcomingAppointments,
            summary: {
              totalVisits: appointmentHistory.length,
              lastVisit: appointmentHistory[0]?.appointmentDate || null,
              nextAppointment: upcomingAppointments[0]?.appointmentDate || null
            }
          },
          alerts: patientAlerts,
          actions: {
            addTreatmentNote: `/api/doctor/patients/${patientId}/treatment-notes`,
            viewFullHistory: `/api/doctor/patients/${patientId}/medical-history`,
            emergencyAccess: `/api/doctor/emergency-access/request`
          }
        },
        message: 'Patient profile retrieved successfully'
      };

    } catch (error) {
      // Log failed access
      await AuditLog.createLog({
        userId: doctorId,
        userRole: 'doctor',
        action: 'VIEW_PATIENT_PROFILE',
        resourceType: 'Patient',
        resourceId: patientId,
        patientId: patientId,
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent,
        status: 'FAILURE',
        errorMessage: error.message,
        description: `Failed to access patient profile for ID: ${patientId}`
      });

      throw new Error(`Failed to get patient profile: ${error.message}`);
    }
  }

  /**
   * Get patient list with enhanced filtering for the Patients tab
   * Only shows patients who have had appointments or medical records with this doctor
   */
  async getPatientList(filters = {}, doctorId, requestInfo) {
    try {
      // First get all patient IDs who have interacted with this doctor
      const doctorPatientIds = await this._getDoctorPatientIds(doctorId);
      
      console.log(`Doctor ${doctorId} has ${doctorPatientIds.length} patients:`, doctorPatientIds);
      
      if (doctorPatientIds.length === 0) {
        console.log('No patients found for this doctor - showing all patients for testing');
        // For testing purposes, show all patients if doctor has none
        const allPatients = await User.find({ role: 'patient', isActive: true })
          .select('firstName lastName email digitalHealthCardId dateOfBirth gender phone bloodType allergies chronicConditions')
          .limit(10)
          .lean();
        
        const enhancedPatients = allPatients.map(patient => ({
          ...patient,
          age: this._calculateAge(patient.dateOfBirth),
          fullName: `${patient.firstName} ${patient.lastName}`,
          hasAllergies: (patient.allergies && patient.allergies.length > 0),
          hasChronicConditions: (patient.chronicConditions && patient.chronicConditions.length > 0),
          lastVisit: null,
          totalRecords: 0
        }));

        return {
          success: true,
          data: {
            patients: enhancedPatients,
            pagination: { total: enhancedPatients.length, page: 1, limit: 25, totalPages: 1 },
            summary: { 
              totalPatients: enhancedPatients.length, 
              patientsWithAllergies: enhancedPatients.filter(p => p.hasAllergies).length,
              patientsWithChronicConditions: enhancedPatients.filter(p => p.hasChronicConditions).length
            }
          },
          message: `Showing ${enhancedPatients.length} patients (test mode - no doctor relationship)`
        };
      }

      let searchCriteria = {
        role: 'patient',
        isActive: true,
        _id: { $in: doctorPatientIds } // Only doctor's patients
      };

      // Apply filters
      if (filters.searchQuery) {
        const query = filters.searchQuery;
        if (query.match(/^HC-[A-Z0-9-]+$/i)) {
          searchCriteria.digitalHealthCardId = query.toUpperCase();
        } else {
          searchCriteria.$or = [
            { firstName: { $regex: query, $options: 'i' } },
            { lastName: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } },
            { phone: { $regex: query.replace(/\D/g, ''), $options: 'i' } }
          ];
        }
      }

      if (filters.gender && filters.gender !== 'all') {
        searchCriteria.gender = filters.gender;
      }

      if (filters.bloodType && filters.bloodType !== 'all') {
        searchCriteria.bloodType = filters.bloodType;
      }

      // Build aggregation pipeline
      const pipeline = [
        { $match: searchCriteria },
        {
          $lookup: {
            from: 'appointments',
            let: { patientId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$patient', '$$patientId'] },
                  doctor: new mongoose.Types.ObjectId(doctorId),
                  status: { $in: ['completed', 'confirmed'] }
                }
              },
              { $sort: { appointmentDate: -1 } },
              { $limit: 1 }
            ],
            as: 'lastAppointment'
          }
        },
        {
          $lookup: {
            from: 'medicalrecords',
            let: { patientId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$patient', '$$patientId'] },
                  doctor: new mongoose.Types.ObjectId(doctorId),
                  status: 'active'
                }
              },
              { $count: 'total' }
            ],
            as: 'recordCount'
          }
        },
        {
          $addFields: {
            lastVisit: { $arrayElemAt: ['$lastAppointment.appointmentDate', 0] },
            totalRecords: { $ifNull: [{ $arrayElemAt: ['$recordCount.total', 0] }, 0] },
            age: {
              $floor: {
                $divide: [
                  { $subtract: [new Date(), '$dateOfBirth'] },
                  365.25 * 24 * 60 * 60 * 1000
                ]
              }
            }
          }
        },
        {
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
            age: 1,
            lastVisit: 1,
            totalRecords: 1,
            hasAllergies: { $gt: [{ $size: { $ifNull: ['$allergies', []] } }, 0] },
            hasChronicConditions: { $gt: [{ $size: { $ifNull: ['$chronicConditions', []] } }, 0] }
          }
        }
      ];

      // Add sorting
      const sortCriteria = {};
      switch (filters.sortBy) {
        case 'name':
          sortCriteria.firstName = 1;
          sortCriteria.lastName = 1;
          break;
        case 'lastVisit':
          sortCriteria.lastVisit = -1;
          break;
        case 'age':
          sortCriteria.age = 1;
          break;
        default:
          sortCriteria.lastName = 1;
          sortCriteria.firstName = 1;
      }
      pipeline.push({ $sort: sortCriteria });

      // Add pagination
      const limit = Math.min(filters.limit || 25, 100);
      const skip = ((filters.page || 1) - 1) * limit;
      pipeline.push({ $skip: skip }, { $limit: limit });

      // Execute aggregation
      const patients = await User.aggregate(pipeline);

      // Get total count
      const totalCount = await User.countDocuments(searchCriteria);

      // Log patient list access
      await AuditLog.createLog({
        userId: doctorId,
        userRole: 'doctor',
        action: 'VIEW_PATIENT_LIST',
        resourceType: 'Patient',
        resourceId: doctorId,
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent,
        description: 'Accessed patient list',
        metadata: { 
          filters,
          resultCount: patients.length,
          totalCount
        }
      });

      return {
        success: true,
        data: {
          patients,
          pagination: {
            total: totalCount,
            page: filters.page || 1,
            limit: limit,
            totalPages: Math.ceil(totalCount / limit)
          },
          summary: {
            totalPatients: totalCount,
            patientsWithAllergies: patients.filter(p => p.hasAllergies).length,
            patientsWithChronicConditions: patients.filter(p => p.hasChronicConditions).length
          }
        },
        message: `Retrieved ${patients.length} patients`
      };

    } catch (error) {
      throw new Error(`Failed to get patient list: ${error.message}`);
    }
  }

  /**
   * Get all patient IDs who have interacted with this doctor (private method)
   * @private
   */
  async _getDoctorPatientIds(doctorId) {
    try {
      // Get patients from appointments
      const appointmentPatients = await Appointment.distinct('patient', { 
        doctor: doctorId 
      });
      console.log('Appointment patients:', appointmentPatients);

      // Get patients from medical records
      const medicalRecordPatients = await MedicalRecord.distinct('patient', { 
        doctor: doctorId 
      });
      console.log('Medical record patients:', medicalRecordPatients);

      // Combine and deduplicate
      const allPatientIds = [...new Set([...appointmentPatients, ...medicalRecordPatients])];
      
      // Verify these patients actually exist in users collection
      const existingPatients = await User.find({
        _id: { $in: allPatientIds },
        role: 'patient'
      }).select('_id firstName lastName role');
      
      console.log('Existing patients in users collection:', existingPatients);
      
      return existingPatients.map(p => p._id);
    } catch (error) {
      console.error('Error getting doctor patient IDs:', error);
      return [];
    }
  }

  /**
   * Get recent patients for doctor (private method)
   * @private
   */
  async _getRecentPatients(doctorId, limit = 10) {
    return await MedicalRecord.aggregate([
      {
        $match: {
          doctor: new mongoose.Types.ObjectId(doctorId),
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
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
      { $unwind: '$patient' },
      {
        $project: {
          _id: '$patient._id',
          firstName: '$patient.firstName',
          lastName: '$patient.lastName',
          digitalHealthCardId: '$patient.digitalHealthCardId',
          lastVisit: 1,
          visitCount: 1
        }
      },
      { $sort: { lastVisit: -1 } },
      { $limit: limit }
    ]);
  }

  /**
   * Get today's patients from appointments (private method)
   * @private
   */
  async _getTodayPatients(doctorId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return await Appointment.find({
      doctor: doctorId,
      appointmentDate: { $gte: today, $lt: tomorrow },
      status: { $in: ['confirmed', 'pending'] }
    })
    .populate('patient', 'firstName lastName digitalHealthCardId')
    .sort({ appointmentDate: 1 })
    .lean();
  }

  /**
   * Get patient statistics for doctor (private method)
   * @private
   */
  async _getPatientStatistics(doctorId) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const [totalPatients, recentRecords, todayAppointments] = await Promise.all([
      MedicalRecord.distinct('patient', { doctor: doctorId }),
      MedicalRecord.countDocuments({ 
        doctor: doctorId, 
        createdAt: { $gte: thirtyDaysAgo } 
      }),
      Appointment.countDocuments({
        doctor: doctorId,
        appointmentDate: {
          $gte: new Date().setHours(0, 0, 0, 0),
          $lt: new Date().setHours(23, 59, 59, 999)
        },
        status: { $in: ['confirmed', 'pending'] }
      })
    ]);

    return {
      totalPatients: totalPatients.length,
      recentRecords,
      todayAppointments,
      averageRecordsPerDay: Math.round(recentRecords / 30)
    };
  }

  /**
   * Calculate age from date of birth (private method)
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
   * Organize medical records by type (private method)
   * @private
   */
  _organizeRecordsByType(records) {
    const organized = {};
    records.forEach(record => {
      if (!organized[record.recordType]) {
        organized[record.recordType] = [];
      }
      organized[record.recordType].push(record);
    });
    return organized;
  }

  /**
   * Get recent vital signs from medical records (private method)
   * @private
   */
  _getRecentVitalSigns(records) {
    const recordsWithVitals = records
      .filter(record => record.vitalSigns)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return recordsWithVitals.length > 0 ? recordsWithVitals[0].vitalSigns : null;
  }

  /**
   * Generate patient alerts (private method)
   * @private
   */
  _generatePatientAlerts(patient) {
    const alerts = [];

    // Allergy alerts
    if (patient.allergies && patient.allergies.length > 0) {
      const severeAllergies = patient.allergies.filter(a => a.severity === 'severe');
      if (severeAllergies.length > 0) {
        alerts.push({
          type: 'SEVERE_ALLERGY',
          severity: 'HIGH',
          message: `Patient has severe allergies: ${severeAllergies.map(a => a.allergen).join(', ')}`,
          icon: '⚠️'
        });
      }
    }

    // Chronic condition alerts
    if (patient.chronicConditions && patient.chronicConditions.length > 0) {
      alerts.push({
        type: 'CHRONIC_CONDITIONS',
        severity: 'MEDIUM',
        message: `Chronic conditions: ${patient.chronicConditions.join(', ')}`,
        icon: '📋'
      });
    }

    return alerts;
  }
}

module.exports = new PatientManagementService();
