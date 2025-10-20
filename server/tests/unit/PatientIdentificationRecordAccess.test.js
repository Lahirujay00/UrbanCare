/**
 * @fileoverview Unit Tests for Patient Identification and Record Access Use Case
 * @description Comprehensive test suite covering patient search, identification, and medical record access
 * @author UrbanCare Development Team
 * @version 1.0.0
 * 
 * Test Coverage Areas:
 * - Patient Search and Identification
 * - Medical Record Access and Retrieval
 * - Document Management
 * - Privacy and Security Controls
 * - Audit Logging and Compliance
 * - Emergency Access Protocols
 * 
 * Target Coverage: >80%
 */

const ManagerController = require('../../controllers/ManagerController');
const DoctorController = require('../../controllers/DoctorController');
const User = require('../../models/User');
const MedicalRecord = require('../../models/MedicalRecord');
const Document = require('../../models/Document');
const AuditLog = require('../../models/AuditLog');
const EmergencyAccess = require('../../models/EmergencyAccess');

// Mock dependencies
jest.mock('../../models/User');
jest.mock('../../models/MedicalRecord');
jest.mock('../../models/Document');
jest.mock('../../models/AuditLog');
jest.mock('../../models/EmergencyAccess');

describe('UC03 - Patient Identification and Record Access', () => {
  let mockPatient, mockDoctor, mockManager, mockMedicalRecord, mockDocument;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockPatient = {
      _id: '507f1f77bcf86cd799439011',
      firstName: 'John',
      lastName: 'Patient',
      email: 'patient@test.com',
      phone: '+1-555-0100',
      medicalRecordNumber: 'MRN001234',
      dateOfBirth: new Date('1990-01-15'),
      role: 'patient',
      isActive: true,
      address: {
        street: '123 Main St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345'
      },
      emergencyContact: {
        name: 'Jane Doe',
        phone: '+1-555-0101'
      }
    };

    mockDoctor = {
      _id: '507f1f77bcf86cd799439012',
      firstName: 'Dr. Jane',
      lastName: 'Doctor',
      email: 'doctor@test.com',
      role: 'doctor',
      specialization: 'Cardiology'
    };

    mockManager = {
      _id: '507f1f77bcf86cd799439013',
      firstName: 'Manager',
      lastName: 'Admin',
      email: 'manager@test.com',
      role: 'manager'
    };

    mockMedicalRecord = {
      _id: '507f1f77bcf86cd799439014',
      patient: mockPatient._id,
      doctor: mockDoctor._id,
      recordType: 'Consultation',
      diagnosis: 'Hypertension',
      treatment: 'Medication prescribed',
      medications: ['Lisinopril 10mg'],
      date: new Date(),
      isActive: true
    };

    mockDocument = {
      _id: '507f1f77bcf86cd799439015',
      patient: mockPatient._id,
      uploadedBy: mockDoctor._id,
      fileName: 'lab_results.pdf',
      fileUrl: '/uploads/documents/lab_results.pdf',
      fileType: 'application/pdf',
      documentType: 'lab-report',
      uploadDate: new Date()
    };
  });

  describe('Patient Search and Identification', () => {
    describe('Positive Cases', () => {
      test('should successfully search patients by name', async () => {
        const searchQuery = 'John Patient';
        const mockReq = {
          query: { search: searchQuery, type: 'name' },
          user: mockManager,
          ip: '127.0.0.1'
        };
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };

        User.find.mockResolvedValue([mockPatient]);
        AuditLog.create.mockResolvedValue({});

        await ManagerController.searchPatients(mockReq, mockRes);

        expect(User.find).toHaveBeenCalledWith({
          role: 'patient',
          $or: expect.arrayContaining([
            { firstName: expect.objectContaining({ $regex: searchQuery, $options: 'i' }) },
            { lastName: expect.objectContaining({ $regex: searchQuery, $options: 'i' }) }
          ])
        });
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          patients: expect.arrayContaining([expect.objectContaining({
            _id: mockPatient._id,
            firstName: 'John',
            lastName: 'Patient'
          })])
        });
      });

      test('should successfully search patients by email', async () => {
        const mockReq = {
          query: { search: 'patient@test.com', type: 'email' },
          user: mockManager,
          ip: '127.0.0.1'
        };
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };

        User.find.mockResolvedValue([mockPatient]);
        AuditLog.create.mockResolvedValue({});

        await ManagerController.searchPatients(mockReq, mockRes);

        expect(User.find).toHaveBeenCalledWith({
          role: 'patient',
          email: expect.objectContaining({ $regex: 'patient@test.com', $options: 'i' })
        });
        expect(mockRes.status).toHaveBeenCalledWith(200);
      });

      test('should successfully search patients by phone number', async () => {
        const mockReq = {
          query: { search: '+1-555-0100', type: 'phone' },
          user: mockManager,
          ip: '127.0.0.1'
        };
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };

        User.find.mockResolvedValue([mockPatient]);
        AuditLog.create.mockResolvedValue({});

        await ManagerController.searchPatients(mockReq, mockRes);

        expect(User.find).toHaveBeenCalledWith({
          role: 'patient',
          phone: expect.objectContaining({ $regex: '+1-555-0100', $options: 'i' })
        });
        expect(mockRes.status).toHaveBeenCalledWith(200);
      });

      test('should successfully search patients by medical record number', async () => {
        const mockReq = {
          query: { search: 'MRN001234', type: 'mrn' },
          user: mockManager,
          ip: '127.0.0.1'
        };
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };

        User.find.mockResolvedValue([mockPatient]);
        AuditLog.create.mockResolvedValue({});

        await ManagerController.searchPatients(mockReq, mockRes);

        expect(User.find).toHaveBeenCalledWith({
          role: 'patient',
          medicalRecordNumber: expect.objectContaining({ $regex: 'MRN001234', $options: 'i' })
        });
        expect(mockRes.status).toHaveBeenCalledWith(200);
      });
    });

    describe('Negative Cases', () => {
      test('should handle search with no results', async () => {
        const mockReq = {
          query: { search: 'NonExistent Patient', type: 'name' },
          user: mockManager,
          ip: '127.0.0.1'
        };
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };

        User.find.mockResolvedValue([]);
        AuditLog.create.mockResolvedValue({});

        await ManagerController.searchPatients(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          patients: [],
          message: 'No patients found matching the search criteria'
        });
      });

      test('should reject search without proper authorization', async () => {
        const mockReq = {
          query: { search: 'John Patient', type: 'name' },
          user: { ...mockPatient, role: 'patient' }, // Patient trying to search
          ip: '127.0.0.1'
        };
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };

        await ManagerController.searchPatients(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          message: 'Access denied. Insufficient permissions.'
        });
      });

      test('should handle invalid search type', async () => {
        const mockReq = {
          query: { search: 'John Patient', type: 'invalid' },
          user: mockManager,
          ip: '127.0.0.1'
        };
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };

        await ManagerController.searchPatients(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          message: 'Invalid search type. Supported types: name, email, phone, mrn'
        });
      });
    });

    describe('Edge Cases', () => {
      test('should handle empty search query', async () => {
        const mockReq = {
          query: { search: '', type: 'name' },
          user: mockManager,
          ip: '127.0.0.1'
        };
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };

        await ManagerController.searchPatients(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          message: 'Search query is required'
        });
      });

      test('should handle database errors during search', async () => {
        const mockReq = {
          query: { search: 'John Patient', type: 'name' },
          user: mockManager,
          ip: '127.0.0.1'
        };
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };

        User.find.mockRejectedValue(new Error('Database connection failed'));

        await ManagerController.searchPatients(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          message: 'Patient search failed due to server error'
        });
      });

      test('should handle special characters in search query', async () => {
        const mockReq = {
          query: { search: "O'Connor", type: 'name' },
          user: mockManager,
          ip: '127.0.0.1'
        };
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };

        User.find.mockResolvedValue([]);
        AuditLog.create.mockResolvedValue({});

        await ManagerController.searchPatients(mockReq, mockRes);

        expect(User.find).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(200);
      });
    });
  });

  describe('Medical Record Access and Retrieval', () => {
    describe('Positive Cases', () => {
      test('should successfully retrieve patient medical records for authorized doctor', async () => {
        const mockReq = {
          params: { patientId: mockPatient._id },
          user: mockDoctor,
          ip: '127.0.0.1'
        };
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };

        User.findById.mockResolvedValue(mockPatient);
        MedicalRecord.find.mockResolvedValue([mockMedicalRecord]);
        AuditLog.create.mockResolvedValue({});

        await DoctorController.getPatientMedicalRecords(mockReq, mockRes);

        expect(MedicalRecord.find).toHaveBeenCalledWith({
          patient: mockPatient._id,
          isActive: true
        });
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          records: expect.arrayContaining([expect.objectContaining({
            _id: mockMedicalRecord._id,
            diagnosis: 'Hypertension'
          })])
        });
      });

      test('should successfully retrieve specific medical record by ID', async () => {
        const mockReq = {
          params: { recordId: mockMedicalRecord._id },
          user: mockDoctor,
          ip: '127.0.0.1'
        };
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };

        MedicalRecord.findById.mockResolvedValue(mockMedicalRecord);
        AuditLog.create.mockResolvedValue({});

        await DoctorController.getMedicalRecordById(mockReq, mockRes);

        expect(MedicalRecord.findById).toHaveBeenCalledWith(mockMedicalRecord._id);
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          record: expect.objectContaining({
            _id: mockMedicalRecord._id,
            diagnosis: 'Hypertension'
          })
        });
      });

      test('should filter medical records by date range', async () => {
        const mockReq = {
          params: { patientId: mockPatient._id },
          query: { 
            startDate: '2024-01-01',
            endDate: '2024-12-31'
          },
          user: mockDoctor,
          ip: '127.0.0.1'
        };
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };

        User.findById.mockResolvedValue(mockPatient);
        MedicalRecord.find.mockResolvedValue([mockMedicalRecord]);
        AuditLog.create.mockResolvedValue({});

        await DoctorController.getPatientMedicalRecords(mockReq, mockRes);

        expect(MedicalRecord.find).toHaveBeenCalledWith({
          patient: mockPatient._id,
          isActive: true,
          date: {
            $gte: new Date('2024-01-01'),
            $lte: new Date('2024-12-31')
          }
        });
        expect(mockRes.status).toHaveBeenCalledWith(200);
      });
    });

    describe('Negative Cases', () => {
      test('should reject access to non-existent patient records', async () => {
        const mockReq = {
          params: { patientId: 'nonexistent-id' },
          user: mockDoctor,
          ip: '127.0.0.1'
        };
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };

        User.findById.mockResolvedValue(null);

        await DoctorController.getPatientMedicalRecords(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(404);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          message: 'Patient not found'
        });
      });

      test('should reject unauthorized access to medical records', async () => {
        const mockReq = {
          params: { patientId: mockPatient._id },
          user: { ...mockPatient, role: 'patient' }, // Patient trying to access another's records
          ip: '127.0.0.1'
        };
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };

        await DoctorController.getPatientMedicalRecords(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          message: 'Access denied. Insufficient permissions to access medical records.'
        });
      });

      test('should handle invalid medical record ID', async () => {
        const mockReq = {
          params: { recordId: 'invalid-id' },
          user: mockDoctor,
          ip: '127.0.0.1'
        };
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };

        MedicalRecord.findById.mockResolvedValue(null);

        await DoctorController.getMedicalRecordById(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(404);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          message: 'Medical record not found'
        });
      });
    });

    describe('Edge Cases', () => {
      test('should handle large number of medical records with pagination', async () => {
        const mockReq = {
          params: { patientId: mockPatient._id },
          query: { page: '2', limit: '10' },
          user: mockDoctor,
          ip: '127.0.0.1'
        };
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };

        const mockRecords = Array(10).fill(mockMedicalRecord);
        User.findById.mockResolvedValue(mockPatient);
        MedicalRecord.find.mockReturnValue({
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          sort: jest.fn().mockResolvedValue(mockRecords)
        });
        MedicalRecord.countDocuments.mockResolvedValue(25);
        AuditLog.create.mockResolvedValue({});

        await DoctorController.getPatientMedicalRecords(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          records: mockRecords,
          pagination: {
            currentPage: 2,
            totalPages: 3,
            totalRecords: 25,
            hasNext: true,
            hasPrev: true
          }
        });
      });

      test('should handle database errors during record retrieval', async () => {
        const mockReq = {
          params: { patientId: mockPatient._id },
          user: mockDoctor,
          ip: '127.0.0.1'
        };
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };

        User.findById.mockResolvedValue(mockPatient);
        MedicalRecord.find.mockRejectedValue(new Error('Database error'));

        await DoctorController.getPatientMedicalRecords(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          message: 'Failed to retrieve medical records due to server error'
        });
      });
    });
  });

  describe('Document Management', () => {
    describe('Positive Cases', () => {
      test('should successfully retrieve patient documents', async () => {
        const mockReq = {
          params: { patientId: mockPatient._id },
          user: mockDoctor,
          ip: '127.0.0.1'
        };
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };

        Document.find.mockResolvedValue([mockDocument]);
        AuditLog.create.mockResolvedValue({});

        await DoctorController.getPatientDocuments(mockReq, mockRes);

        expect(Document.find).toHaveBeenCalledWith({
          patient: mockPatient._id
        });
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          documents: expect.arrayContaining([expect.objectContaining({
            _id: mockDocument._id,
            fileName: 'lab_results.pdf'
          })])
        });
      });

      test('should filter documents by type', async () => {
        const mockReq = {
          params: { patientId: mockPatient._id },
          query: { type: 'lab-report' },
          user: mockDoctor,
          ip: '127.0.0.1'
        };
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };

        Document.find.mockResolvedValue([mockDocument]);
        AuditLog.create.mockResolvedValue({});

        await DoctorController.getPatientDocuments(mockReq, mockRes);

        expect(Document.find).toHaveBeenCalledWith({
          patient: mockPatient._id,
          documentType: 'lab-report'
        });
        expect(mockRes.status).toHaveBeenCalledWith(200);
      });
    });

    describe('Negative Cases', () => {
      test('should handle no documents found', async () => {
        const mockReq = {
          params: { patientId: mockPatient._id },
          user: mockDoctor,
          ip: '127.0.0.1'
        };
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };

        Document.find.mockResolvedValue([]);
        AuditLog.create.mockResolvedValue({});

        await DoctorController.getPatientDocuments(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          documents: [],
          message: 'No documents found for this patient'
        });
      });

      test('should reject unauthorized document access', async () => {
        const mockReq = {
          params: { patientId: mockPatient._id },
          user: { role: 'patient', _id: 'different-patient-id' },
          ip: '127.0.0.1'
        };
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };

        await DoctorController.getPatientDocuments(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          message: 'Access denied. Insufficient permissions to access patient documents.'
        });
      });
    });
  });

  describe('Audit Logging and Compliance', () => {
    describe('Positive Cases', () => {
      test('should log patient record access for compliance', async () => {
        const mockReq = {
          params: { patientId: mockPatient._id },
          user: mockDoctor,
          ip: '127.0.0.1'
        };
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };

        User.findById.mockResolvedValue(mockPatient);
        MedicalRecord.find.mockResolvedValue([mockMedicalRecord]);
        AuditLog.create.mockResolvedValue({});

        await DoctorController.getPatientMedicalRecords(mockReq, mockRes);

        expect(AuditLog.create).toHaveBeenCalledWith({
          user: mockDoctor._id,
          action: 'PATIENT_RECORD_ACCESS',
          resourceType: 'MedicalRecord',
          resourceId: mockPatient._id,
          ipAddress: '127.0.0.1',
          userAgent: undefined,
          complianceLevel: 'HIPAA',
          details: {
            patientId: mockPatient._id,
            accessType: 'medical_records',
            recordCount: 1
          }
        });
      });

      test('should retrieve audit logs for compliance reporting', async () => {
        const mockReq = {
          query: { 
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            action: 'PATIENT_RECORD_ACCESS'
          },
          user: mockManager,
          ip: '127.0.0.1'
        };
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };

        const mockAuditLogs = [
          {
            _id: 'audit1',
            user: mockDoctor._id,
            action: 'PATIENT_RECORD_ACCESS',
            resourceType: 'MedicalRecord',
            timestamp: new Date(),
            ipAddress: '127.0.0.1'
          }
        ];

        AuditLog.find.mockResolvedValue(mockAuditLogs);

        await ManagerController.getAuditLogs(mockReq, mockRes);

        expect(AuditLog.find).toHaveBeenCalledWith({
          timestamp: {
            $gte: new Date('2024-01-01'),
            $lte: new Date('2024-12-31')
          },
          action: 'PATIENT_RECORD_ACCESS'
        });
        expect(mockRes.status).toHaveBeenCalledWith(200);
      });
    });

    describe('Negative Cases', () => {
      test('should handle audit log creation failures gracefully', async () => {
        const mockReq = {
          params: { patientId: mockPatient._id },
          user: mockDoctor,
          ip: '127.0.0.1'
        };
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };

        User.findById.mockResolvedValue(mockPatient);
        MedicalRecord.find.mockResolvedValue([mockMedicalRecord]);
        AuditLog.create.mockRejectedValue(new Error('Audit log failed'));

        await DoctorController.getPatientMedicalRecords(mockReq, mockRes);

        // Should still return records even if audit logging fails
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          records: expect.any(Array)
        });
      });
    });
  });

  describe('Emergency Access Protocols', () => {
    describe('Positive Cases', () => {
      test('should allow emergency access to patient records', async () => {
        const mockReq = {
          params: { patientId: mockPatient._id },
          body: { 
            emergencyReason: 'Patient unconscious, need medical history',
            emergencyCode: 'EMG123456'
          },
          user: mockDoctor,
          ip: '127.0.0.1'
        };
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };

        User.findById.mockResolvedValue(mockPatient);
        MedicalRecord.find.mockResolvedValue([mockMedicalRecord]);
        EmergencyAccess.create.mockResolvedValue({});
        AuditLog.create.mockResolvedValue({});

        await DoctorController.emergencyPatientAccess(mockReq, mockRes);

        expect(EmergencyAccess.create).toHaveBeenCalledWith({
          doctor: mockDoctor._id,
          patient: mockPatient._id,
          reason: 'Patient unconscious, need medical history',
          emergencyCode: 'EMG123456',
          accessTime: expect.any(Date),
          ipAddress: '127.0.0.1'
        });
        expect(mockRes.status).toHaveBeenCalledWith(200);
      });
    });

    describe('Negative Cases', () => {
      test('should reject emergency access without proper justification', async () => {
        const mockReq = {
          params: { patientId: mockPatient._id },
          body: { emergencyReason: '' }, // Empty reason
          user: mockDoctor,
          ip: '127.0.0.1'
        };
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };

        await DoctorController.emergencyPatientAccess(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          message: 'Emergency reason is required for emergency access'
        });
      });
    });
  });
});
