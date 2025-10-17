/**
 * @fileoverview Unit Tests for AppointmentService - Make an Appointment Use Case (UC02)
 * @author UrbanCare Development Team
 * @version 1.0.0
 */

const AppointmentService = require('../../../services/AppointmentService');
const AppointmentRepository = require('../../../repositories/AppointmentRepository');
const UserRepository = require('../../../repositories/UserRepository');
const PaymentService = require('../../../services/PaymentService');
const { ValidationError, ConflictError, NotFoundError } = require('../../../utils/errors');

// Mock dependencies
jest.mock('../../../repositories/AppointmentRepository');
jest.mock('../../../repositories/UserRepository');
jest.mock('../../../services/PaymentService');

describe('AppointmentService - Make an Appointment (UC02)', () => {
  let appointmentService;
  let mockAppointmentRepo;
  let mockUserRepo;
  let mockPaymentService;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock instances
    mockAppointmentRepo = new AppointmentRepository();
    mockUserRepo = new UserRepository();
    mockPaymentService = new PaymentService();
    
    // Create service instance
    appointmentService = new AppointmentService(
      mockAppointmentRepo,
      mockUserRepo,
      mockPaymentService
    );
  });

  describe('createAppointment - Main Success Scenario', () => {
    const validAppointmentData = {
      patientId: '507f1f77bcf86cd799439011',
      doctorId: '507f1f77bcf86cd799439013',
      appointmentDate: new Date(Date.now() + 86400000), // Tomorrow
      duration: 30,
      reasonForVisit: 'Regular checkup',
      department: 'General Medicine'
    };

    test('should successfully create appointment with valid data', async () => {
      // Arrange
      const mockPatient = testUtils.createMockUser({ role: 'patient' });
      const mockDoctor = testUtils.createMockUser({ role: 'doctor' });
      const mockAppointment = testUtils.createMockAppointment();

      mockUserRepo.findById
        .mockResolvedValueOnce(mockPatient) // Patient lookup
        .mockResolvedValueOnce(mockDoctor); // Doctor lookup
      
      mockAppointmentRepo.checkSchedulingConflicts.mockResolvedValue(null);
      mockAppointmentRepo.createAppointment.mockResolvedValue(mockAppointment);

      // Act
      const result = await appointmentService.createAppointment(validAppointmentData);

      // Assert
      expect(result).toEqual(mockAppointment);
      expect(mockUserRepo.findById).toHaveBeenCalledTimes(2);
      expect(mockUserRepo.findById).toHaveBeenCalledWith(validAppointmentData.patientId);
      expect(mockUserRepo.findById).toHaveBeenCalledWith(validAppointmentData.doctorId);
      expect(mockAppointmentRepo.checkSchedulingConflicts).toHaveBeenCalledWith(
        validAppointmentData.doctorId,
        validAppointmentData.appointmentDate,
        validAppointmentData.duration
      );
      expect(mockAppointmentRepo.createAppointment).toHaveBeenCalledWith(validAppointmentData);
    });

    test('should validate appointment is in the future', async () => {
      // Arrange
      const pastAppointmentData = {
        ...validAppointmentData,
        appointmentDate: new Date(Date.now() - 86400000) // Yesterday
      };

      // Act & Assert
      await expect(appointmentService.createAppointment(pastAppointmentData))
        .rejects
        .toThrow(ValidationError);
    });

    test('should validate appointment is during business hours', async () => {
      // Arrange
      const afterHoursDate = new Date();
      afterHoursDate.setHours(22, 0, 0, 0); // 10 PM
      
      const afterHoursAppointmentData = {
        ...validAppointmentData,
        appointmentDate: afterHoursDate
      };

      // Act & Assert
      await expect(appointmentService.createAppointment(afterHoursAppointmentData))
        .rejects
        .toThrow(ValidationError);
    });

    test('should validate appointment is on weekday', async () => {
      // Arrange
      const sunday = new Date();
      sunday.setDate(sunday.getDate() + (7 - sunday.getDay())); // Next Sunday
      
      const weekendAppointmentData = {
        ...validAppointmentData,
        appointmentDate: sunday
      };

      // Act & Assert
      await expect(appointmentService.createAppointment(weekendAppointmentData))
        .rejects
        .toThrow(ValidationError);
    });
  });

  describe('createAppointment - Alternate Flows', () => {
    const validAppointmentData = {
      patientId: '507f1f77bcf86cd799439011',
      doctorId: '507f1f77bcf86cd799439013',
      appointmentDate: new Date(Date.now() + 86400000),
      duration: 30,
      reasonForVisit: 'Regular checkup',
      department: 'General Medicine'
    };

    test('should handle doctor not found (4a. Doctor Fully Booked)', async () => {
      // Arrange
      const mockPatient = testUtils.createMockUser({ role: 'patient' });
      
      mockUserRepo.findById
        .mockResolvedValueOnce(mockPatient) // Patient lookup
        .mockResolvedValueOnce(null); // Doctor not found

      // Act & Assert
      await expect(appointmentService.createAppointment(validAppointmentData))
        .rejects
        .toThrow(NotFoundError);
      
      expect(mockUserRepo.findById).toHaveBeenCalledTimes(2);
    });

    test('should handle scheduling conflicts (4a. Doctor Fully Booked)', async () => {
      // Arrange
      const mockPatient = testUtils.createMockUser({ role: 'patient' });
      const mockDoctor = testUtils.createMockUser({ role: 'doctor' });

      mockUserRepo.findById
        .mockResolvedValueOnce(mockPatient)
        .mockResolvedValueOnce(mockDoctor);
      
      mockAppointmentRepo.checkSchedulingConflicts
        .mockRejectedValue(new ConflictError('Doctor is not available at the requested time'));

      // Act & Assert
      await expect(appointmentService.createAppointment(validAppointmentData))
        .rejects
        .toThrow(ConflictError);
    });

    test('should suggest alternative doctors when requested doctor is unavailable', async () => {
      // Arrange
      const mockPatient = testUtils.createMockUser({ role: 'patient' });
      const alternativeDoctors = [
        testUtils.createMockUser({ role: 'doctor', specialization: 'General Medicine' }),
        testUtils.createMockUser({ role: 'doctor', specialization: 'General Medicine' })
      ];

      mockUserRepo.findById.mockResolvedValueOnce(mockPatient);
      mockUserRepo.findByRole.mockResolvedValue({ data: alternativeDoctors });

      // Act
      const alternatives = await appointmentService.getAlternativeDoctors(
        validAppointmentData.department,
        validAppointmentData.appointmentDate
      );

      // Assert
      expect(alternatives).toHaveLength(2);
      expect(mockUserRepo.findByRole).toHaveBeenCalledWith('doctor');
    });
  });

  describe('createAppointment - Exception Flows', () => {
    const validAppointmentData = {
      patientId: '507f1f77bcf86cd799439011',
      doctorId: '507f1f77bcf86cd799439013',
      appointmentDate: new Date(Date.now() + 86400000),
      duration: 30,
      reasonForVisit: 'Regular checkup',
      department: 'General Medicine'
    };

    test('should handle patient not found', async () => {
      // Arrange
      mockUserRepo.findById.mockResolvedValueOnce(null); // Patient not found

      // Act & Assert
      await expect(appointmentService.createAppointment(validAppointmentData))
        .rejects
        .toThrow(NotFoundError);
    });

    test('should handle invalid patient role', async () => {
      // Arrange
      const mockDoctor = testUtils.createMockUser({ role: 'doctor' });
      mockUserRepo.findById.mockResolvedValueOnce(mockDoctor); // Doctor instead of patient

      // Act & Assert
      await expect(appointmentService.createAppointment(validAppointmentData))
        .rejects
        .toThrow(ValidationError);
    });

    test('should handle database errors gracefully', async () => {
      // Arrange
      const mockPatient = testUtils.createMockUser({ role: 'patient' });
      const mockDoctor = testUtils.createMockUser({ role: 'doctor' });

      mockUserRepo.findById
        .mockResolvedValueOnce(mockPatient)
        .mockResolvedValueOnce(mockDoctor);
      
      mockAppointmentRepo.checkSchedulingConflicts.mockResolvedValue(null);
      mockAppointmentRepo.createAppointment.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(appointmentService.createAppointment(validAppointmentData))
        .rejects
        .toThrow('Database connection failed');
    });

    test('should handle concurrent booking attempts', async () => {
      // Arrange
      const mockPatient = testUtils.createMockUser({ role: 'patient' });
      const mockDoctor = testUtils.createMockUser({ role: 'doctor' });

      mockUserRepo.findById
        .mockResolvedValueOnce(mockPatient)
        .mockResolvedValueOnce(mockDoctor);
      
      // Simulate race condition - slot becomes unavailable between check and creation
      mockAppointmentRepo.checkSchedulingConflicts.mockResolvedValue(null);
      mockAppointmentRepo.createAppointment
        .mockRejectedValue(new ConflictError('Appointment slot no longer available'));

      // Act & Assert
      await expect(appointmentService.createAppointment(validAppointmentData))
        .rejects
        .toThrow(ConflictError);
    });
  });

  describe('Input Validation - Edge Cases', () => {
    test('should reject appointment with missing required fields', async () => {
      // Arrange
      const incompleteData = {
        patientId: '507f1f77bcf86cd799439011'
        // Missing doctorId, appointmentDate, etc.
      };

      // Act & Assert
      await expect(appointmentService.createAppointment(incompleteData))
        .rejects
        .toThrow(ValidationError);
    });

    test('should reject appointment with invalid duration', async () => {
      // Arrange
      const invalidDurationData = {
        patientId: '507f1f77bcf86cd799439011',
        doctorId: '507f1f77bcf86cd799439013',
        appointmentDate: new Date(Date.now() + 86400000),
        duration: 0, // Invalid duration
        reasonForVisit: 'Regular checkup',
        department: 'General Medicine'
      };

      // Act & Assert
      await expect(appointmentService.createAppointment(invalidDurationData))
        .rejects
        .toThrow(ValidationError);
    });

    test('should reject appointment with reason too short', async () => {
      // Arrange
      const shortReasonData = {
        patientId: '507f1f77bcf86cd799439011',
        doctorId: '507f1f77bcf86cd799439013',
        appointmentDate: new Date(Date.now() + 86400000),
        duration: 30,
        reasonForVisit: 'Hi', // Too short
        department: 'General Medicine'
      };

      // Act & Assert
      await expect(appointmentService.createAppointment(shortReasonData))
        .rejects
        .toThrow(ValidationError);
    });

    test('should reject appointment with reason too long', async () => {
      // Arrange
      const longReasonData = {
        patientId: '507f1f77bcf86cd799439011',
        doctorId: '507f1f77bcf86cd799439013',
        appointmentDate: new Date(Date.now() + 86400000),
        duration: 30,
        reasonForVisit: 'A'.repeat(501), // Too long (>500 chars)
        department: 'General Medicine'
      };

      // Act & Assert
      await expect(appointmentService.createAppointment(longReasonData))
        .rejects
        .toThrow(ValidationError);
    });

    test('should handle invalid ObjectId format', async () => {
      // Arrange
      const invalidIdData = {
        patientId: 'invalid-id-format',
        doctorId: '507f1f77bcf86cd799439013',
        appointmentDate: new Date(Date.now() + 86400000),
        duration: 30,
        reasonForVisit: 'Regular checkup',
        department: 'General Medicine'
      };

      // Act & Assert
      await expect(appointmentService.createAppointment(invalidIdData))
        .rejects
        .toThrow(ValidationError);
    });
  });

  describe('Business Logic Validation', () => {
    test('should enforce minimum advance booking time (24 hours)', async () => {
      // Arrange
      const tooSoonDate = new Date(Date.now() + 3600000); // 1 hour from now
      const tooSoonData = {
        patientId: '507f1f77bcf86cd799439011',
        doctorId: '507f1f77bcf86cd799439013',
        appointmentDate: tooSoonDate,
        duration: 30,
        reasonForVisit: 'Emergency',
        department: 'General Medicine'
      };

      // Act & Assert
      await expect(appointmentService.createAppointment(tooSoonData))
        .rejects
        .toThrow(ValidationError);
    });

    test('should enforce maximum advance booking time (90 days)', async () => {
      // Arrange
      const tooFarDate = new Date(Date.now() + (91 * 24 * 60 * 60 * 1000)); // 91 days
      const tooFarData = {
        patientId: '507f1f77bcf86cd799439011',
        doctorId: '507f1f77bcf86cd799439013',
        appointmentDate: tooFarDate,
        duration: 30,
        reasonForVisit: 'Regular checkup',
        department: 'General Medicine'
      };

      // Act & Assert
      await expect(appointmentService.createAppointment(tooFarData))
        .rejects
        .toThrow(ValidationError);
    });

    test('should validate doctor specialization matches department', async () => {
      // Arrange
      const mockPatient = testUtils.createMockUser({ role: 'patient' });
      const mockDoctor = testUtils.createMockUser({ 
        role: 'doctor', 
        specialization: 'Cardiology' 
      });

      mockUserRepo.findById
        .mockResolvedValueOnce(mockPatient)
        .mockResolvedValueOnce(mockDoctor);

      const mismatchedData = {
        patientId: '507f1f77bcf86cd799439011',
        doctorId: '507f1f77bcf86cd799439013',
        appointmentDate: new Date(Date.now() + 86400000),
        duration: 30,
        reasonForVisit: 'Regular checkup',
        department: 'General Medicine' // Doesn't match doctor's specialization
      };

      // Act & Assert
      await expect(appointmentService.createAppointment(mismatchedData))
        .rejects
        .toThrow(ValidationError);
    });
  });

  describe('Performance and Reliability', () => {
    test('should complete appointment creation within acceptable time', async () => {
      // Arrange
      const mockPatient = testUtils.createMockUser({ role: 'patient' });
      const mockDoctor = testUtils.createMockUser({ role: 'doctor' });
      const mockAppointment = testUtils.createMockAppointment();

      mockUserRepo.findById
        .mockResolvedValueOnce(mockPatient)
        .mockResolvedValueOnce(mockDoctor);
      
      mockAppointmentRepo.checkSchedulingConflicts.mockResolvedValue(null);
      mockAppointmentRepo.createAppointment.mockResolvedValue(mockAppointment);

      const validAppointmentData = {
        patientId: '507f1f77bcf86cd799439011',
        doctorId: '507f1f77bcf86cd799439013',
        appointmentDate: new Date(Date.now() + 86400000),
        duration: 30,
        reasonForVisit: 'Regular checkup',
        department: 'General Medicine'
      };

      // Act
      const startTime = Date.now();
      await appointmentService.createAppointment(validAppointmentData);
      const endTime = Date.now();

      // Assert - Should complete within 1 second
      expect(endTime - startTime).toBeLessThan(1000);
    });

    test('should handle high concurrent load gracefully', async () => {
      // Arrange
      const mockPatient = testUtils.createMockUser({ role: 'patient' });
      const mockDoctor = testUtils.createMockUser({ role: 'doctor' });
      const mockAppointment = testUtils.createMockAppointment();

      mockUserRepo.findById
        .mockResolvedValue(mockPatient)
        .mockResolvedValue(mockDoctor);
      
      mockAppointmentRepo.checkSchedulingConflicts.mockResolvedValue(null);
      mockAppointmentRepo.createAppointment.mockResolvedValue(mockAppointment);

      const validAppointmentData = {
        patientId: '507f1f77bcf86cd799439011',
        doctorId: '507f1f77bcf86cd799439013',
        appointmentDate: new Date(Date.now() + 86400000),
        duration: 30,
        reasonForVisit: 'Regular checkup',
        department: 'General Medicine'
      };

      // Act - Simulate 10 concurrent requests
      const promises = Array(10).fill().map(() => 
        appointmentService.createAppointment(validAppointmentData)
      );

      // Assert - All should complete successfully
      const results = await Promise.allSettled(promises);
      expect(results.every(result => result.status === 'fulfilled')).toBe(true);
    });
  });
});
