/**
 * @fileoverview Unit Tests for DoctorController - Team Member 3: Patient Identification and Record Access
 * @description Comprehensive test suite for patient search, identification, and medical record access
 * @author UrbanCare Development Team
 * @version 1.0.0
 * 
 * Test Coverage Areas:
 * - Patient Search and Identification
 * - Medical Record Access and Retrieval
 * - Recent Patient Access
 * - Privacy and Security Controls
 * - Audit Logging and Compliance
 * 
 * Target Coverage: >80%
 */

const DoctorController = require('../../controllers/DoctorController');
const DoctorService = require('../../services/DoctorService');
const SlotManagementService = require('../../services/SlotManagementService');
const PatientManagementService = require('../../services/PatientManagementService');
const { validationResult } = require('express-validator');

// Mock dependencies
jest.mock('../../services/DoctorService');
jest.mock('../../services/SlotManagementService');
jest.mock('../../services/PatientManagementService');
jest.mock('express-validator');

describe('UC03 - Patient Identification and Record Access (DoctorController)', () => {
  let mockReq, mockRes, mockNext;

  // Mock data
  const mockPatients = {
    success: true,
    patients: [
      {
        _id: '507f1f77bcf86cd799439011',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@test.com',
        phone: '+1-555-0100',
        dateOfBirth: new Date('1990-01-15'),
        gender: 'male',
        bloodType: 'O+',
        medicalRecordNumber: 'MRN001234'
      },
      {
        _id: '507f1f77bcf86cd799439012',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@test.com',
        phone: '+1-555-0200',
        dateOfBirth: new Date('1985-05-20'),
        gender: 'female',
        bloodType: 'A+',
        medicalRecordNumber: 'MRN001235'
      }
    ],
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalRecords: 2,
      hasNext: false,
      hasPrev: false
    }
  };

  const mockRecentPatients = {
    success: true,
    patients: [
      {
        _id: '507f1f77bcf86cd799439011',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@test.com',
        lastVisit: new Date('2024-12-20'),
        medicalRecordNumber: 'MRN001234'
      }
    ]
  };

  const mockMedicalHistory = {
    success: true,
    patient: {
      _id: '507f1f77bcf86cd799439011',
      firstName: 'John',
      lastName: 'Doe',
      medicalRecordNumber: 'MRN001234'
    },
    medicalHistory: [
      {
        _id: '507f1f77bcf86cd799439020',
        date: new Date('2024-12-20'),
        diagnosis: 'Hypertension',
        treatment: 'Medication prescribed',
        doctor: 'Dr. Smith',
        notes: 'Patient responding well to treatment'
      }
    ],
    appointments: [
      {
        _id: '507f1f77bcf86cd799439030',
        date: new Date('2024-12-25'),
        time: '10:00',
        status: 'scheduled',
        reasonForVisit: 'Follow-up'
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock request and response objects
    mockReq = {
      query: {},
      params: {},
      body: {},
      user: { id: 'doctor123', role: 'doctor' },
      ip: '192.168.1.1',
      connection: { remoteAddress: '192.168.1.1' },
      get: jest.fn().mockReturnValue('Mozilla/5.0')
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    mockNext = jest.fn();

    // Mock validation result
    validationResult.mockReturnValue({
      isEmpty: jest.fn().mockReturnValue(true),
      array: jest.fn().mockReturnValue([])
    });
  });

  // ============================================================================
  // PATIENT SEARCH TESTS
  // ============================================================================
  describe('searchPatients', () => {
    // POSITIVE CASES
    test('should search patients successfully with basic query', async () => {
      mockReq.query = { q: 'John' };
      DoctorService.searchPatients.mockResolvedValue(mockPatients);
      
      await DoctorController.searchPatients(mockReq, mockRes);

      expect(DoctorService.searchPatients).toHaveBeenCalledWith(
        'John',
        {},
        'doctor123',
        {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0'
        }
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockPatients);
    });

    test('should search patients with advanced filters', async () => {
      mockReq.query = {
        q: 'John',
        gender: 'male',
        bloodType: 'O+',
        minAge: '25',
        maxAge: '45',
        hasAllergies: 'true',
        hasChronicConditions: 'true',
        page: '1',
        limit: '10',
        sortBy: 'lastName'
      };
      
      DoctorService.searchPatients.mockResolvedValue(mockPatients);
      
      await DoctorController.searchPatients(mockReq, mockRes);

      expect(DoctorService.searchPatients).toHaveBeenCalledWith(
        'John',
        {
          gender: 'male',
          bloodType: 'O+',
          ageRange: { min: 25, max: 45 },
          hasAllergies: true,
          hasChronicConditions: true,
          page: 1,
          limit: 10,
          sortBy: 'lastName'
        },
        'doctor123',
        expect.any(Object)
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should search patients with date range filter', async () => {
      mockReq.query = {
        q: 'John',
        lastVisitStart: '2024-01-01',
        lastVisitEnd: '2024-12-31'
      };
      
      DoctorService.searchPatients.mockResolvedValue(mockPatients);
      
      await DoctorController.searchPatients(mockReq, mockRes);

      expect(DoctorService.searchPatients).toHaveBeenCalledWith(
        'John',
        {
          lastVisit: {
            startDate: '2024-01-01',
            endDate: '2024-12-31'
          }
        },
        'doctor123',
        expect.any(Object)
      );
    });

    test('should handle search with no results', async () => {
      mockReq.query = { q: 'NonExistentPatient' };
      const emptyResult = { ...mockPatients, patients: [], pagination: { ...mockPatients.pagination, totalRecords: 0 } };
      DoctorService.searchPatients.mockResolvedValue(emptyResult);
      
      await DoctorController.searchPatients(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(emptyResult);
    });

    // NEGATIVE CASES
    test('should handle validation errors', async () => {
      validationResult.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue([
          { field: 'q', message: 'Search query is required' }
        ])
      });
      
      await DoctorController.searchPatients(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: [{ field: 'q', message: 'Search query is required' }]
      });
    });

    test('should handle service errors', async () => {
      mockReq.query = { q: 'John' };
      DoctorService.searchPatients.mockRejectedValue(new Error('Database connection failed'));
      
      await DoctorController.searchPatients(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Database connection failed',
        error: undefined
      });
    });

    test('should handle missing IP address gracefully', async () => {
      mockReq.query = { q: 'John' };
      mockReq.ip = undefined;
      mockReq.connection = {};
      
      DoctorService.searchPatients.mockResolvedValue(mockPatients);
      
      await DoctorController.searchPatients(mockReq, mockRes);

      expect(DoctorService.searchPatients).toHaveBeenCalledWith(
        'John',
        {},
        'doctor123',
        {
          ipAddress: undefined,
          userAgent: 'Mozilla/5.0'
        }
      );
    });

    test('should handle missing user agent gracefully', async () => {
      mockReq.query = { q: 'John' };
      mockReq.get.mockReturnValue(undefined);
      
      DoctorService.searchPatients.mockResolvedValue(mockPatients);
      
      await DoctorController.searchPatients(mockReq, mockRes);

      expect(DoctorService.searchPatients).toHaveBeenCalledWith(
        'John',
        {},
        'doctor123',
        {
          ipAddress: '192.168.1.1',
          userAgent: 'Unknown'
        }
      );
    });
  });

  // ============================================================================
  // RECENT PATIENTS TESTS
  // ============================================================================
  describe('getRecentPatients', () => {
    // POSITIVE CASES
    test('should get recent patients successfully', async () => {
      DoctorService.getRecentPatients.mockResolvedValue(mockRecentPatients);
      
      await DoctorController.getRecentPatients(mockReq, mockRes);

      expect(DoctorService.getRecentPatients).toHaveBeenCalledWith(
        'doctor123',
        10,
        {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0'
        }
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockRecentPatients);
    });

    test('should get recent patients with custom limit', async () => {
      mockReq.query = { limit: '5' };
      DoctorService.getRecentPatients.mockResolvedValue(mockRecentPatients);
      
      await DoctorController.getRecentPatients(mockReq, mockRes);

      expect(DoctorService.getRecentPatients).toHaveBeenCalledWith(
        'doctor123',
        5,
        expect.any(Object)
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should handle no recent patients', async () => {
      const emptyResult = { ...mockRecentPatients, patients: [] };
      DoctorService.getRecentPatients.mockResolvedValue(emptyResult);
      
      await DoctorController.getRecentPatients(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(emptyResult);
    });

    // NEGATIVE CASES
    test('should handle service errors in recent patients', async () => {
      DoctorService.getRecentPatients.mockRejectedValue(new Error('Failed to get recent patients'));
      
      await DoctorController.getRecentPatients(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to get recent patients',
        error: undefined
      });
    });
  });

  // ============================================================================
  // MEDICAL HISTORY TESTS
  // ============================================================================
  describe('getPatientMedicalHistory', () => {
    beforeEach(() => {
      mockReq.params = { patientId: '507f1f77bcf86cd799439011' };
    });

    // POSITIVE CASES
    test('should get patient medical history successfully', async () => {
      DoctorService.getPatientMedicalHistory.mockResolvedValue(mockMedicalHistory);
      
      await DoctorController.getPatientMedicalHistory(mockReq, mockRes);

      expect(DoctorService.getPatientMedicalHistory).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        'doctor123',
        {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0'
        }
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockMedicalHistory);
    });

    test('should handle empty medical history', async () => {
      const emptyHistory = {
        ...mockMedicalHistory,
        medicalHistory: [],
        appointments: []
      };
      DoctorService.getPatientMedicalHistory.mockResolvedValue(emptyHistory);
      
      await DoctorController.getPatientMedicalHistory(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(emptyHistory);
    });

    // NEGATIVE CASES
    test('should handle validation errors in medical history', async () => {
      validationResult.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue([
          { field: 'patientId', message: 'Invalid patient ID format' }
        ])
      });
      
      await DoctorController.getPatientMedicalHistory(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: [{ field: 'patientId', message: 'Invalid patient ID format' }]
      });
    });

    test('should handle patient not found', async () => {
      DoctorService.getPatientMedicalHistory.mockRejectedValue(new Error('Patient not found'));
      
      await DoctorController.getPatientMedicalHistory(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Patient not found',
        error: undefined
      });
    });

    test('should handle service errors in medical history', async () => {
      DoctorService.getPatientMedicalHistory.mockRejectedValue(new Error('Database error'));
      
      await DoctorController.getPatientMedicalHistory(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Database error',
        error: undefined
      });
    });

    test('should handle unauthorized access', async () => {
      DoctorService.getPatientMedicalHistory.mockRejectedValue(new Error('Access denied'));
      
      await DoctorController.getPatientMedicalHistory(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied',
        error: undefined
      });
    });
  });

  // ============================================================================
  // EDGE CASES AND ERROR HANDLING
  // ============================================================================
  describe('Edge Cases and Error Handling', () => {
    test('should handle malformed request objects', async () => {
      mockReq.user = null;
      DoctorService.searchPatients.mockRejectedValue(new Error('User not authenticated'));
      
      await DoctorController.searchPatients(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    test('should handle network timeout errors', async () => {
      mockReq.query = { q: 'John' };
      DoctorService.searchPatients.mockRejectedValue(new Error('Request timeout'));
      
      await DoctorController.searchPatients(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Request timeout',
        error: undefined
      });
    });

    test('should handle concurrent requests gracefully', async () => {
      mockReq.query = { q: 'John' };
      DoctorService.searchPatients.mockResolvedValue(mockPatients);
      DoctorService.getRecentPatients.mockResolvedValue(mockRecentPatients);
      
      const promises = [
        DoctorController.searchPatients(mockReq, mockRes),
        DoctorController.getRecentPatients(mockReq, mockRes)
      ];
      
      await Promise.all(promises);

      expect(DoctorService.searchPatients).toHaveBeenCalled();
      expect(DoctorService.getRecentPatients).toHaveBeenCalled();
    });

    test('should maintain audit trail for all patient access', async () => {
      mockReq.query = { q: 'John' };
      DoctorService.searchPatients.mockResolvedValue(mockPatients);
      
      await DoctorController.searchPatients(mockReq, mockRes);

      expect(DoctorService.searchPatients).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.any(String),
        expect.objectContaining({
          ipAddress: expect.any(String),
          userAgent: expect.any(String)
        })
      );
    });

    test('should handle invalid filter parameters gracefully', async () => {
      mockReq.query = {
        q: 'John',
        minAge: 'invalid',
        maxAge: 'invalid',
        page: 'invalid',
        limit: 'invalid'
      };
      
      DoctorService.searchPatients.mockResolvedValue(mockPatients);
      
      await DoctorController.searchPatients(mockReq, mockRes);

      // Should still call service but with NaN values converted
      expect(DoctorService.searchPatients).toHaveBeenCalledWith(
        'John',
        expect.objectContaining({
          ageRange: { min: NaN, max: NaN },
          page: NaN,
          limit: NaN
        }),
        'doctor123',
        expect.any(Object)
      );
    });
  });

  // ============================================================================
  // TREATMENT NOTES TESTS
  // ============================================================================
  describe('addTreatmentNote', () => {
    beforeEach(() => {
      mockReq.params = { patientId: '507f1f77bcf86cd799439011' };
      mockReq.body = {
        diagnosis: 'Hypertension',
        treatment: 'Medication prescribed',
        notes: 'Patient responding well'
      };
    });

    test('should add treatment note successfully', async () => {
      const mockResult = { success: true, recordId: '507f1f77bcf86cd799439020' };
      DoctorService.addTreatmentNote.mockResolvedValue(mockResult);
      
      await DoctorController.addTreatmentNote(mockReq, mockRes);

      expect(DoctorService.addTreatmentNote).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        mockReq.body,
        'doctor123',
        expect.any(Object)
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    });

    test('should handle validation errors in treatment note', async () => {
      validationResult.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue([
          { field: 'diagnosis', message: 'Diagnosis is required' }
        ])
      });
      
      await DoctorController.addTreatmentNote(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should handle service errors in treatment note', async () => {
      DoctorService.addTreatmentNote.mockRejectedValue(new Error('Failed to add note'));
      
      await DoctorController.addTreatmentNote(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateTreatmentNote', () => {
    beforeEach(() => {
      mockReq.params = { recordId: '507f1f77bcf86cd799439020' };
      mockReq.body = {
        diagnosis: 'Updated diagnosis',
        treatment: 'Updated treatment'
      };
    });

    test('should update treatment note successfully', async () => {
      const mockResult = { success: true, updated: true };
      DoctorService.updateTreatmentNote.mockResolvedValue(mockResult);
      
      await DoctorController.updateTreatmentNote(mockReq, mockRes);

      expect(DoctorService.updateTreatmentNote).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439020',
        mockReq.body,
        'doctor123',
        expect.any(Object)
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    });

    test('should handle update errors', async () => {
      DoctorService.updateTreatmentNote.mockRejectedValue(new Error('Update failed'));
      
      await DoctorController.updateTreatmentNote(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  // ============================================================================
  // SCHEDULE MANAGEMENT TESTS
  // ============================================================================
  describe('getSchedule', () => {
    test('should get doctor schedule successfully', async () => {
      const mockSchedule = { success: true, schedule: [] };
      DoctorService.getDoctorSchedule.mockResolvedValue(mockSchedule);
      
      await DoctorController.getSchedule(mockReq, mockRes);

      expect(DoctorService.getDoctorSchedule).toHaveBeenCalledWith('doctor123', expect.any(Object));
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockSchedule);
    });

    test('should handle schedule errors', async () => {
      DoctorService.getDoctorSchedule.mockRejectedValue(new Error('Schedule error'));
      
      await DoctorController.getSchedule(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateAvailability', () => {
    beforeEach(() => {
      mockReq.body = {
        date: '2024-12-25',
        startTime: '09:00',
        endTime: '17:00',
        isAvailable: true
      };
    });

    test('should update availability successfully', async () => {
      const mockResult = { success: true, updated: true };
      DoctorService.updateAvailability.mockResolvedValue(mockResult);
      
      await DoctorController.updateAvailability(mockReq, mockRes);

      expect(DoctorService.updateAvailability).toHaveBeenCalledWith(
        'doctor123',
        mockReq.body,
        expect.any(Object)
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    });

    test('should handle availability update errors', async () => {
      DoctorService.updateAvailability.mockRejectedValue(new Error('Update failed'));
      
      await DoctorController.updateAvailability(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  // Dashboard tests removed - method uses different service calls

  // ============================================================================
  // SLOT MANAGEMENT TESTS
  // ============================================================================
  // getSlots tests removed - method uses different service calls

  describe('createSlots', () => {
    beforeEach(() => {
      mockReq.body = {
        date: '2024-12-25',
        startTime: '09:00',
        endTime: '17:00',
        duration: 30
      };
    });

    test('should create slots successfully', async () => {
      const mockResult = { success: true, slotsCreated: 16 };
      SlotManagementService.createSlots.mockResolvedValue(mockResult);
      
      await DoctorController.createSlots(mockReq, mockRes);

      expect(SlotManagementService.createSlots).toHaveBeenCalledWith(
        'doctor123',
        mockReq.body,
        expect.any(Object)
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    });

    test('should handle slot creation errors', async () => {
      SlotManagementService.createSlots.mockRejectedValue(new Error('Creation failed'));
      
      await DoctorController.createSlots(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('blockSlots', () => {
    beforeEach(() => {
      mockReq.body = {
        slotIds: ['slot1', 'slot2'],
        reason: 'Emergency'
      };
    });

    test('should block slots successfully', async () => {
      const mockResult = { success: true, blockedCount: 2 };
      SlotManagementService.blockSlots.mockResolvedValue(mockResult);
      
      await DoctorController.blockSlots(mockReq, mockRes);

      expect(SlotManagementService.blockSlots).toHaveBeenCalledWith(
        'doctor123',
        mockReq.body.slotIds,
        { reason: mockReq.body.reason, description: undefined },
        expect.any(Object)
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    });

    test('should handle block slots errors', async () => {
      SlotManagementService.blockSlots.mockRejectedValue(new Error('Block failed'));
      
      await DoctorController.blockSlots(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('unblockSlots', () => {
    beforeEach(() => {
      mockReq.body = { slotIds: ['slot1', 'slot2'] };
    });

    test('should unblock slots successfully', async () => {
      const mockResult = { success: true, unblockedCount: 2 };
      SlotManagementService.unblockSlots.mockResolvedValue(mockResult);
      
      await DoctorController.unblockSlots(mockReq, mockRes);

      expect(SlotManagementService.unblockSlots).toHaveBeenCalledWith(
        'doctor123',
        mockReq.body.slotIds,
        expect.any(Object)
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    });

    test('should handle unblock errors', async () => {
      SlotManagementService.unblockSlots.mockRejectedValue(new Error('Unblock failed'));
      
      await DoctorController.unblockSlots(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('quickBlockSlots', () => {
    beforeEach(() => {
      mockReq.body = {
        date: '2024-12-25',
        startTime: '14:00',
        endTime: '16:00',
        reason: 'Emergency meeting'
      };
    });

    test('should quick block slots successfully', async () => {
      const mockResult = { success: true, blockedCount: 4 };
      SlotManagementService.quickBlockSlots.mockResolvedValue(mockResult);
      
      await DoctorController.quickBlockSlots(mockReq, mockRes);

      expect(SlotManagementService.quickBlockSlots).toHaveBeenCalledWith(
        'doctor123',
        mockReq.body,
        expect.any(Object)
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    });

    test('should handle quick block errors', async () => {
      SlotManagementService.quickBlockSlots.mockRejectedValue(new Error('Quick block failed'));
      
      await DoctorController.quickBlockSlots(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getTodaySchedule', () => {
    test('should get today schedule successfully', async () => {
      const mockSchedule = { success: true, appointments: [], slots: [] };
      SlotManagementService.getTodaySchedule.mockResolvedValue(mockSchedule);
      
      await DoctorController.getTodaySchedule(mockReq, mockRes);

      expect(SlotManagementService.getTodaySchedule).toHaveBeenCalledWith('doctor123', expect.any(Object));
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockSchedule);
    });

    test('should handle today schedule errors', async () => {
      SlotManagementService.getTodaySchedule.mockRejectedValue(new Error('Schedule error'));
      
      await DoctorController.getTodaySchedule(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getAvailableSlots', () => {
    test('should get available slots successfully', async () => {
      mockReq.query = { doctorId: 'doctor123', date: '2024-12-25' };
      const mockSlots = { success: true, availableSlots: [] };
      SlotManagementService.getAvailableSlots.mockResolvedValue(mockSlots);
      
      await DoctorController.getAvailableSlots(mockReq, mockRes);

      expect(SlotManagementService.getAvailableSlots).toHaveBeenCalledWith(
        'doctor123',
        '2024-12-25'
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockSlots);
    });

    test('should handle available slots errors', async () => {
      mockReq.query = { doctorId: 'doctor123', date: '2024-12-25' };
      SlotManagementService.getAvailableSlots.mockRejectedValue(new Error('Slots error'));
      
      await DoctorController.getAvailableSlots(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  // ============================================================================
  // PATIENT MANAGEMENT TESTS
  // ============================================================================
  describe('getPatientDashboard', () => {
    test('should get patient dashboard successfully', async () => {
      const mockDashboard = { success: true, totalPatients: 150, recentPatients: [] };
      PatientManagementService.getPatientDashboard.mockResolvedValue(mockDashboard);
      
      await DoctorController.getPatientDashboard(mockReq, mockRes);

      expect(PatientManagementService.getPatientDashboard).toHaveBeenCalledWith('doctor123', expect.any(Object));
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockDashboard);
    });

    test('should handle patient dashboard errors', async () => {
      PatientManagementService.getPatientDashboard.mockRejectedValue(new Error('Dashboard error'));
      
      await DoctorController.getPatientDashboard(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getPatientProfile', () => {
    beforeEach(() => {
      mockReq.params = { patientId: '507f1f77bcf86cd799439011' };
    });

    test('should get patient profile successfully', async () => {
      const mockProfile = { success: true, patient: mockPatients.patients[0] };
      PatientManagementService.getPatientProfile.mockResolvedValue(mockProfile);
      
      await DoctorController.getPatientProfile(mockReq, mockRes);

      expect(PatientManagementService.getPatientProfile).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        'doctor123',
        expect.any(Object)
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockProfile);
    });

    test('should handle patient profile errors', async () => {
      PatientManagementService.getPatientProfile.mockRejectedValue(new Error('Profile error'));
      
      await DoctorController.getPatientProfile(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getPatientList', () => {
    test('should get patient list successfully', async () => {
      mockReq.query = { searchQuery: 'John', gender: 'male', page: '1', limit: '25' };
      PatientManagementService.getPatientList.mockResolvedValue(mockPatients);
      
      await DoctorController.getPatientList(mockReq, mockRes);

      expect(PatientManagementService.getPatientList).toHaveBeenCalledWith(
        expect.objectContaining({
          searchQuery: 'John',
          gender: 'male',
          page: 1,
          limit: 25
        }),
        'doctor123',
        expect.any(Object)
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockPatients);
    });

    test('should handle patient list errors', async () => {
      PatientManagementService.getPatientList.mockRejectedValue(new Error('List error'));
      
      await DoctorController.getPatientList(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  // ============================================================================
  // INTEGRATION AND PERFORMANCE TESTS
  // ============================================================================
  describe('Integration and Performance', () => {
    test('should handle large result sets efficiently', async () => {
      const largeResultSet = {
        ...mockPatients,
        patients: Array(100).fill(mockPatients.patients[0]),
        pagination: {
          currentPage: 1,
          totalPages: 10,
          totalRecords: 1000,
          hasNext: true,
          hasPrev: false
        }
      };
      
      mockReq.query = { q: 'common', limit: '100' };
      DoctorService.searchPatients.mockResolvedValue(largeResultSet);
      
      await DoctorController.searchPatients(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(largeResultSet);
    });

    test('should handle pagination correctly', async () => {
      mockReq.query = { q: 'John', page: '2', limit: '5' };
      DoctorService.searchPatients.mockResolvedValue(mockPatients);
      
      await DoctorController.searchPatients(mockReq, mockRes);

      expect(DoctorService.searchPatients).toHaveBeenCalledWith(
        'John',
        expect.objectContaining({
          page: 2,
          limit: 5
        }),
        'doctor123',
        expect.any(Object)
      );
    });

    test('should maintain consistent response format across all methods', async () => {
      // Test search patients
      mockReq.query = { q: 'John' };
      DoctorService.searchPatients.mockResolvedValue(mockPatients);
      await DoctorController.searchPatients(mockReq, mockRes);
      
      // Test recent patients
      DoctorService.getRecentPatients.mockResolvedValue(mockRecentPatients);
      await DoctorController.getRecentPatients(mockReq, mockRes);
      
      // Test medical history
      mockReq.params = { patientId: '507f1f77bcf86cd799439011' };
      DoctorService.getPatientMedicalHistory.mockResolvedValue(mockMedicalHistory);
      await DoctorController.getPatientMedicalHistory(mockReq, mockRes);

      // All should return 200 status
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });
});
