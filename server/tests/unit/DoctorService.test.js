/**
 * @fileoverview Unit Tests for DoctorService - Patient Identification and Record Access
 * @description Focused test suite for DoctorService with >80% coverage
 * @author UrbanCare Development Team
 * @version 1.0.0
 */

// Mock dependencies BEFORE importing anything
jest.mock('../../models/User', () => ({
  find: jest.fn(),
  findById: jest.fn(),
  countDocuments: jest.fn(),
  aggregate: jest.fn()
}));

jest.mock('../../models/MedicalRecord', () => ({
  find: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  aggregate: jest.fn()
}));

jest.mock('../../models/Appointment', () => ({
  find: jest.fn(),
  findById: jest.fn(),
  create: jest.fn()
}));

jest.mock('../../models/AuditLog', () => ({
  create: jest.fn()
}));

jest.mock('mongoose', () => ({
  startSession: jest.fn()
}));

const DoctorService = require('../../services/DoctorService');
const User = require('../../models/User');
const MedicalRecord = require('../../models/MedicalRecord');
const Appointment = require('../../models/Appointment');
const AuditLog = require('../../models/AuditLog');
const mongoose = require('mongoose');

describe('DoctorService - >80% Coverage Tests', () => {
  const mockRequestInfo = {
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0'
  };

  const mockPatient = {
    _id: '507f1f77bcf86cd799439011',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@test.com',
    phone: '+1-555-0100',
    digitalHealthCardId: 'HC-123456',
    role: 'patient',
    isActive: true
  };

  const mockSession = {
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    abortTransaction: jest.fn(),
    endSession: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mongoose.startSession.mockResolvedValue(mockSession);
  });

  // ============================================================================
  // PATIENT SEARCH TESTS
  // ============================================================================
  describe('searchPatients', () => {
    test('should search patients by name', async () => {
      const mockPatients = [mockPatient];
      User.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockPatients)
      });
      User.countDocuments.mockResolvedValue(1);
      AuditLog.create.mockResolvedValue({});

      const result = await DoctorService.searchPatients('John', {}, 'doctor123', mockRequestInfo);

      expect(result.success).toBe(true);
      expect(result.patients).toEqual(mockPatients);
      expect(User.find).toHaveBeenCalled();
      expect(AuditLog.create).toHaveBeenCalled();
    });

    test('should search patients by health card ID', async () => {
      User.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockPatient])
      });
      User.countDocuments.mockResolvedValue(1);
      AuditLog.create.mockResolvedValue({});

      const result = await DoctorService.searchPatients('HC-123456', {}, 'doctor123', mockRequestInfo);

      expect(result.success).toBe(true);
      expect(User.find).toHaveBeenCalledWith(expect.objectContaining({
        digitalHealthCardId: 'HC-123456'
      }));
    });

    test('should search patients by phone', async () => {
      User.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockPatient])
      });
      User.countDocuments.mockResolvedValue(1);
      AuditLog.create.mockResolvedValue({});

      const result = await DoctorService.searchPatients('555-0100', {}, 'doctor123', mockRequestInfo);

      expect(result.success).toBe(true);
      expect(User.find).toHaveBeenCalledWith(expect.objectContaining({
        phone: expect.any(Object)
      }));
    });

    test('should search patients by email', async () => {
      User.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockPatient])
      });
      User.countDocuments.mockResolvedValue(1);
      AuditLog.create.mockResolvedValue({});

      const result = await DoctorService.searchPatients('john@test.com', {}, 'doctor123', mockRequestInfo);

      expect(result.success).toBe(true);
      expect(User.find).toHaveBeenCalledWith(expect.objectContaining({
        email: expect.any(Object)
      }));
    });

    test('should handle search errors', async () => {
      User.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      await expect(DoctorService.searchPatients('John', {}, 'doctor123', mockRequestInfo))
        .rejects.toThrow('Database error');
    });
  });

  // ============================================================================
  // RECENT PATIENTS TESTS
  // ============================================================================
  describe('getRecentPatients', () => {
    test('should get recent patients successfully', async () => {
      const mockAggregateResult = [{ _id: mockPatient._id, patient: mockPatient, lastVisit: new Date() }];
      MedicalRecord.aggregate.mockResolvedValue(mockAggregateResult);
      AuditLog.create.mockResolvedValue({});

      const result = await DoctorService.getRecentPatients('doctor123', 10, mockRequestInfo);

      expect(result.success).toBe(true);
      expect(result.patients).toBeDefined();
      expect(MedicalRecord.aggregate).toHaveBeenCalled();
      expect(AuditLog.create).toHaveBeenCalled();
    });

    test('should handle database errors', async () => {
      MedicalRecord.aggregate.mockRejectedValue(new Error('Database error'));

      await expect(DoctorService.getRecentPatients('doctor123', 10, mockRequestInfo))
        .rejects.toThrow('Database error');
    });
  });

  // ============================================================================
  // MEDICAL HISTORY TESTS
  // ============================================================================
  describe('getPatientMedicalHistory', () => {
    test('should get patient medical history successfully', async () => {
      User.findById.mockResolvedValue(mockPatient);
      MedicalRecord.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([])
      });
      Appointment.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([])
      });
      AuditLog.create.mockResolvedValue({});

      const result = await DoctorService.getPatientMedicalHistory(
        '507f1f77bcf86cd799439011',
        'doctor123',
        mockRequestInfo
      );

      expect(result.success).toBe(true);
      expect(result.patient).toEqual(mockPatient);
      expect(User.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(AuditLog.create).toHaveBeenCalled();
    });

    test('should handle patient not found', async () => {
      User.findById.mockResolvedValue(null);

      await expect(DoctorService.getPatientMedicalHistory(
        'nonexistent',
        'doctor123',
        mockRequestInfo
      )).rejects.toThrow('Patient not found');
    });

    test('should handle database errors', async () => {
      User.findById.mockRejectedValue(new Error('Database error'));

      await expect(DoctorService.getPatientMedicalHistory(
        '507f1f77bcf86cd799439011',
        'doctor123',
        mockRequestInfo
      )).rejects.toThrow('Database error');
    });
  });

  // ============================================================================
  // TREATMENT NOTES TESTS
  // ============================================================================
  describe('addTreatmentNote', () => {
    test('should add treatment note successfully', async () => {
      const mockTreatmentData = {
        diagnosis: 'Hypertension',
        treatment: 'Medication prescribed',
        notes: 'Patient responding well'
      };

      User.findById.mockResolvedValue(mockPatient);
      MedicalRecord.create.mockResolvedValue({
        _id: '507f1f77bcf86cd799439020',
        save: jest.fn().mockResolvedValue(true)
      });
      AuditLog.create.mockResolvedValue({});

      const result = await DoctorService.addTreatmentNote(
        '507f1f77bcf86cd799439011',
        mockTreatmentData,
        'doctor123',
        mockRequestInfo
      );

      expect(result.success).toBe(true);
      expect(User.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(MedicalRecord.create).toHaveBeenCalled();
      expect(AuditLog.create).toHaveBeenCalled();
    });

    test('should handle patient not found', async () => {
      const mockTreatmentData = { diagnosis: 'Test', treatment: 'Test' };
      User.findById.mockResolvedValue(null);

      await expect(DoctorService.addTreatmentNote(
        'nonexistent',
        mockTreatmentData,
        'doctor123',
        mockRequestInfo
      )).rejects.toThrow('Patient not found');
    });
  });

  // ============================================================================
  // UPDATE TREATMENT NOTES TESTS
  // ============================================================================
  describe('updateTreatmentNote', () => {
    test('should update treatment note successfully', async () => {
      const mockUpdateData = { diagnosis: 'Updated diagnosis' };
      const mockRecord = {
        _id: '507f1f77bcf86cd799439020',
        doctor: 'doctor123',
        save: jest.fn().mockResolvedValue(true)
      };

      MedicalRecord.findById.mockResolvedValue(mockRecord);
      AuditLog.create.mockResolvedValue({});

      const result = await DoctorService.updateTreatmentNote(
        '507f1f77bcf86cd799439020',
        mockUpdateData,
        'doctor123',
        mockRequestInfo
      );

      expect(result.success).toBe(true);
      expect(MedicalRecord.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439020');
      expect(mockRecord.save).toHaveBeenCalled();
      expect(AuditLog.create).toHaveBeenCalled();
    });

    test('should handle record not found', async () => {
      MedicalRecord.findById.mockResolvedValue(null);

      await expect(DoctorService.updateTreatmentNote(
        'nonexistent',
        { diagnosis: 'Test' },
        'doctor123',
        mockRequestInfo
      )).rejects.toThrow('Medical record not found');
    });
  });

  // ============================================================================
  // SCHEDULE TESTS
  // ============================================================================
  describe('getDoctorSchedule', () => {
    test('should get doctor schedule successfully', async () => {
      const mockDoctor = { _id: 'doctor123', firstName: 'Dr', lastName: 'Smith', availability: {} };
      User.findById.mockResolvedValue(mockDoctor);
      Appointment.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([])
      });
      AuditLog.create.mockResolvedValue({});

      const result = await DoctorService.getDoctorSchedule('doctor123', mockRequestInfo);

      expect(result.success).toBe(true);
      expect(User.findById).toHaveBeenCalledWith('doctor123');
      expect(AuditLog.create).toHaveBeenCalled();
    });
  });

  describe('updateAvailability', () => {
    test('should update availability successfully', async () => {
      const mockAvailabilityData = { date: '2024-12-25', startTime: '09:00', endTime: '17:00' };
      const mockDoctor = { _id: 'doctor123', availability: {}, save: jest.fn().mockResolvedValue(true) };
      
      User.findById.mockResolvedValue(mockDoctor);
      AuditLog.create.mockResolvedValue({});

      const result = await DoctorService.updateAvailability('doctor123', mockAvailabilityData, mockRequestInfo);

      expect(result.success).toBe(true);
      expect(User.findById).toHaveBeenCalledWith('doctor123');
      expect(AuditLog.create).toHaveBeenCalled();
    });
  });
});
