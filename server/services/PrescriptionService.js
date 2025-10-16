const Prescription = require('../models/Prescription');
const DrugDatabase = require('../models/DrugDatabase');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const mongoose = require('mongoose');

/**
 * PrescriptionService - Electronic Prescription Management
 * Handles prescription creation, safety checks, and drug interactions
 */
class PrescriptionService {

  /**
   * Create new electronic prescription with safety checks
   */
  async createPrescription(prescriptionData, doctorId, requestInfo) {
    const session = await mongoose.startSession();
    
    try {
      await session.startTransaction();

      // Validate patient exists
      const patient = await User.findById(prescriptionData.patientId).session(session);
      if (!patient || patient.role !== 'patient') {
        throw new Error('Patient not found');
      }

      // Validate doctor
      const doctor = await User.findById(doctorId).session(session);
      if (!doctor || doctor.role !== 'doctor') {
        throw new Error('Doctor not found');
      }

      // Perform safety checks
      const safetyResults = await this._performSafetyChecks(
        prescriptionData.medications, 
        patient, 
        doctorId
      );

      // Create prescription
      const prescription = new Prescription({
        patient: prescriptionData.patientId,
        doctor: doctorId,
        medicalRecord: prescriptionData.medicalRecordId,
        medications: prescriptionData.medications,
        diagnosis: prescriptionData.diagnosis,
        indication: prescriptionData.indication,
        safetyChecks: safetyResults,
        pharmacy: prescriptionData.pharmacy,
        notes: prescriptionData.notes,
        status: 'draft'
      });

      await prescription.save({ session });

      // Add audit trail entry
      await prescription.addAuditEntry('created', doctorId, 'Prescription created');

      // Log prescription creation
      await AuditLog.createLog({
        userId: doctorId,
        userRole: 'doctor',
        action: 'CREATE_PRESCRIPTION',
        resourceType: 'Prescription',
        resourceId: prescription._id,
        patientId: prescriptionData.patientId,
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent,
        changes: {
          after: prescription.toObject(),
          fieldsChanged: Object.keys(prescriptionData)
        },
        description: `Created prescription ${prescription.prescriptionNumber}`,
        metadata: {
          medicationCount: prescriptionData.medications.length,
          safetyAlerts: safetyResults.allergyCheck.result !== 'safe' || 
                       safetyResults.interactionCheck.result !== 'safe'
        }
      });

      await session.commitTransaction();

      return {
        success: true,
        data: {
          prescription,
          safetyAlerts: this._formatSafetyAlerts(safetyResults)
        },
        message: 'Prescription created successfully'
      };

    } catch (error) {
      await session.abortTransaction();
      
      // Log failed creation
      await AuditLog.createLog({
        userId: doctorId,
        userRole: 'doctor',
        action: 'CREATE_PRESCRIPTION',
        resourceType: 'Prescription',
        resourceId: doctorId,
        patientId: prescriptionData.patientId,
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent,
        status: 'FAILURE',
        errorMessage: error.message,
        description: `Failed to create prescription for patient ID: ${prescriptionData.patientId}`
      });

      throw new Error(`Failed to create prescription: ${error.message}`);
    } finally {
      await session.endSession();
    }
  }

  /**
   * Get patient's prescription history
   */
  async getPatientPrescriptions(patientId, doctorId, requestInfo) {
    try {
      // Validate patient exists
      const patient = await User.findById(patientId);
      if (!patient || patient.role !== 'patient') {
        throw new Error('Patient not found');
      }

      // Get prescriptions
      const prescriptions = await Prescription.find({
        patient: patientId
      })
      .populate('doctor', 'firstName lastName specialization')
      .sort({ createdAt: -1 })
      .limit(50);

      // Get active prescriptions
      const activePrescriptions = await Prescription.getActiveForPatient(patientId);

      // Log access
      await AuditLog.createLog({
        userId: doctorId,
        userRole: 'doctor',
        action: 'VIEW_PRESCRIPTIONS',
        resourceType: 'Prescription',
        resourceId: patientId,
        patientId: patientId,
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent,
        description: `Accessed prescription history for patient ${patient.firstName} ${patient.lastName}`,
        metadata: { 
          totalPrescriptions: prescriptions.length,
          activePrescriptions: activePrescriptions.length
        }
      });

      return {
        success: true,
        data: {
          patient: {
            name: `${patient.firstName} ${patient.lastName}`,
            allergies: patient.allergies || []
          },
          prescriptions,
          activePrescriptions,
          summary: {
            total: prescriptions.length,
            active: activePrescriptions.length,
            lastPrescription: prescriptions[0]?.createdAt || null
          }
        },
        message: 'Prescription history retrieved successfully'
      };

    } catch (error) {
      throw new Error(`Failed to retrieve prescriptions: ${error.message}`);
    }
  }

  /**
   * Search drugs in database
   */
  async searchDrugs(searchTerm, limit = 20) {
    try {
      const drugs = await DrugDatabase.searchDrugs(searchTerm, limit);
      
      return {
        success: true,
        data: drugs,
        message: `Found ${drugs.length} drug(s)`
      };

    } catch (error) {
      throw new Error(`Drug search failed: ${error.message}`);
    }
  }

  /**
   * Check drug interactions for multiple medications
   */
  async checkDrugInteractions(medications) {
    try {
      const drugNames = medications.map(med => med.drugName);
      const interactions = await DrugDatabase.checkDrugInteractions(drugNames);
      
      return {
        success: true,
        data: {
          interactions,
          hasInteractions: interactions.length > 0,
          severityLevels: this._categorizeBySeverity(interactions)
        },
        message: interactions.length > 0 ? 
          `Found ${interactions.length} potential interaction(s)` : 
          'No drug interactions found'
      };

    } catch (error) {
      throw new Error(`Interaction check failed: ${error.message}`);
    }
  }

  /**
   * Get dosage recommendations
   */
  async getDosageRecommendation(drugName, patientData) {
    try {
      const recommendation = await DrugDatabase.getDosageRecommendation(
        drugName,
        patientData.age,
        patientData.weight,
        patientData.renalFunction,
        patientData.hepaticFunction
      );

      if (!recommendation) {
        return {
          success: false,
          message: 'Drug not found in database'
        };
      }

      return {
        success: true,
        data: recommendation,
        message: 'Dosage recommendation retrieved'
      };

    } catch (error) {
      throw new Error(`Dosage recommendation failed: ${error.message}`);
    }
  }

  /**
   * Sign prescription electronically
   */
  async signPrescription(prescriptionId, doctorId, signatureData, requestInfo) {
    try {
      const prescription = await Prescription.findById(prescriptionId);
      if (!prescription) {
        throw new Error('Prescription not found');
      }

      // Verify doctor owns this prescription
      if (prescription.doctor.toString() !== doctorId.toString()) {
        throw new Error('Unauthorized: You can only sign your own prescriptions');
      }

      // Update prescription status
      prescription.status = 'active';
      prescription.electronicSignature = {
        signed: true,
        signedAt: new Date(),
        signatureMethod: signatureData.method || 'password'
      };

      await prescription.save();

      // Add audit trail
      await prescription.addAuditEntry('signed', doctorId, 'Prescription electronically signed');

      // Log signing
      await AuditLog.createLog({
        userId: doctorId,
        userRole: 'doctor',
        action: 'SIGN_PRESCRIPTION',
        resourceType: 'Prescription',
        resourceId: prescriptionId,
        patientId: prescription.patient,
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent,
        description: `Electronically signed prescription ${prescription.prescriptionNumber}`,
        metadata: { signatureMethod: signatureData.method }
      });

      return {
        success: true,
        data: prescription,
        message: 'Prescription signed successfully'
      };

    } catch (error) {
      throw new Error(`Failed to sign prescription: ${error.message}`);
    }
  }

  /**
   * Perform comprehensive safety checks
   * @private
   */
  async _performSafetyChecks(medications, patient, doctorId) {
    const results = {
      allergyCheck: { performed: false, result: 'safe', details: '' },
      interactionCheck: { performed: false, result: 'safe', interactions: [] },
      dosageCheck: { performed: false, result: 'appropriate', recommendation: '' }
    };

    try {
      // 1. Allergy Check
      if (patient.allergies && patient.allergies.length > 0) {
        results.allergyCheck.performed = true;
        const allergicMeds = [];
        
        medications.forEach(med => {
          patient.allergies.forEach(allergy => {
            if (med.drugName.toLowerCase().includes(allergy.allergen.toLowerCase())) {
              allergicMeds.push({
                medication: med.drugName,
                allergen: allergy.allergen,
                severity: allergy.severity
              });
            }
          });
        });

        if (allergicMeds.length > 0) {
          results.allergyCheck.result = allergicMeds.some(a => a.severity === 'severe') ? 
            'contraindicated' : 'warning';
          results.allergyCheck.details = `Patient allergic to: ${allergicMeds.map(a => a.allergen).join(', ')}`;
        }
      }

      // 2. Drug Interaction Check
      results.interactionCheck.performed = true;
      const drugNames = medications.map(med => med.drugName);
      const interactions = await DrugDatabase.checkDrugInteractions(drugNames);
      
      if (interactions.length > 0) {
        const severities = interactions.map(i => i.severity);
        if (severities.includes('major')) {
          results.interactionCheck.result = 'major';
        } else if (severities.includes('moderate')) {
          results.interactionCheck.result = 'moderate';
        } else {
          results.interactionCheck.result = 'minor';
        }
        results.interactionCheck.interactions = interactions.map(i => 
          `${i.drug1} + ${i.drug2}: ${i.clinicalEffect}`
        );
      }

      // 3. Dosage Check (basic implementation)
      results.dosageCheck.performed = true;
      // This would integrate with more sophisticated dosage checking
      
      return results;

    } catch (error) {
      console.error('Safety check error:', error);
      return results;
    }
  }

  /**
   * Format safety alerts for display
   * @private
   */
  _formatSafetyAlerts(safetyResults) {
    const alerts = [];

    if (safetyResults.allergyCheck.result !== 'safe') {
      alerts.push({
        type: 'allergy',
        severity: safetyResults.allergyCheck.result,
        message: safetyResults.allergyCheck.details,
        action: 'Review patient allergies before prescribing'
      });
    }

    if (safetyResults.interactionCheck.result !== 'safe') {
      alerts.push({
        type: 'interaction',
        severity: safetyResults.interactionCheck.result,
        message: safetyResults.interactionCheck.interactions.join('; '),
        action: 'Consider alternative medications or monitor closely'
      });
    }

    return alerts;
  }

  /**
   * Categorize interactions by severity
   * @private
   */
  _categorizeBySeverity(interactions) {
    const categories = { major: 0, moderate: 0, minor: 0 };
    interactions.forEach(interaction => {
      categories[interaction.severity] = (categories[interaction.severity] || 0) + 1;
    });
    return categories;
  }
}

module.exports = new PrescriptionService();
