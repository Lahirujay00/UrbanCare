/**
 * @fileoverview Unit Tests for AppointmentRepository - Data Layer Testing
 * @author UrbanCare Development Team
 * @version 1.0.0
 */

const AppointmentRepository = require('../../../repositories/AppointmentRepository');
<<<<<<< HEAD
const { ConflictError, NotFoundError } = require('../../../utils/errors');

// Mock the Appointment model and Logger
jest.mock('../../../models/Appointment');
jest.mock('../../../utils/Logger');

describe('AppointmentRepository - Data Layer Tests', () => {
  let appointmentRepository;
  let mockAppointment;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Appointment constructor
    mockAppointment = {
      save: jest.fn(),
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn()
    };
    
    const Appointment = require('../../../models/Appointment');
    Appointment.mockImplementation(() => mockAppointment);
    Appointment.findById = jest.fn();
    Appointment.find = jest.fn();
    Appointment.findOne = jest.fn();
    Appointment.findByIdAndUpdate = jest.fn();
    Appointment.findByIdAndDelete = jest.fn();
    Appointment.countDocuments = jest.fn();
    
=======
const Appointment = require('../../../models/Appointment');
const { ConflictError, NotFoundError } = require('../../../utils/errors');

// Mock the Appointment model
jest.mock('../../../models/Appointment');

describe('AppointmentRepository - Data Layer Tests', () => {
  let appointmentRepository;
  let mockAppointmentModel;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAppointmentModel = Appointment;
>>>>>>> 4ae9959964fa2aa87bf0bfb2629ca5d6193ec818
    appointmentRepository = new AppointmentRepository();
  });

  describe('createAppointment', () => {
    test('should successfully create appointment with valid data', async () => {
      // Arrange
      const appointmentData = testUtils.createMockAppointment();
      const mockCreatedAppointment = { ...appointmentData, _id: '507f1f77bcf86cd799439012' };
      
<<<<<<< HEAD
      mockAppointment.save.mockResolvedValue(mockCreatedAppointment);

      // Act
      const result = await appointmentRepository.create(appointmentData);

      // Assert
      expect(result).toEqual(mockCreatedAppointment);
      expect(mockAppointment.save).toHaveBeenCalledTimes(1);
=======
      mockAppointmentModel.prototype.save = jest.fn().mockResolvedValue(mockCreatedAppointment);

      // Act
      const result = await appointmentRepository.createAppointment(appointmentData);

      // Assert
      expect(result).toEqual(mockCreatedAppointment);
      expect(mockAppointmentModel.prototype.save).toHaveBeenCalledTimes(1);
>>>>>>> 4ae9959964fa2aa87bf0bfb2629ca5d6193ec818
    });

    test('should handle database errors during creation', async () => {
      // Arrange
      const appointmentData = testUtils.createMockAppointment();
<<<<<<< HEAD
      mockAppointment.save.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(appointmentRepository.create(appointmentData))
=======
      mockAppointmentModel.prototype.save = jest.fn().mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(appointmentRepository.createAppointment(appointmentData))
>>>>>>> 4ae9959964fa2aa87bf0bfb2629ca5d6193ec818
        .rejects
        .toThrow('Database error');
    });

    test('should handle duplicate key errors', async () => {
      // Arrange
      const appointmentData = testUtils.createMockAppointment();
      const duplicateError = new Error('Duplicate key');
      duplicateError.code = 11000;
<<<<<<< HEAD
      mockAppointment.save.mockRejectedValue(duplicateError);

      // Act & Assert
      await expect(appointmentRepository.create(appointmentData))
=======
      mockAppointmentModel.prototype.save = jest.fn().mockRejectedValue(duplicateError);

      // Act & Assert
      await expect(appointmentRepository.createAppointment(appointmentData))
>>>>>>> 4ae9959964fa2aa87bf0bfb2629ca5d6193ec818
        .rejects
        .toThrow('Duplicate key');
    });
  });

  describe('findByPatientId', () => {
    test('should return appointments for valid patient ID', async () => {
      // Arrange
      const patientId = '507f1f77bcf86cd799439011';
      const mockAppointments = [
        testUtils.createMockAppointment({ patient: patientId }),
        testUtils.createMockAppointment({ patient: patientId })
      ];

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockAppointments)
      };

<<<<<<< HEAD
      const Appointment = require('../../../models/Appointment');
      Appointment.find.mockReturnValue(mockQuery);
      Appointment.countDocuments.mockResolvedValue(2);
=======
      mockAppointmentModel.find = jest.fn().mockReturnValue(mockQuery);
      mockAppointmentModel.countDocuments = jest.fn().mockResolvedValue(2);
>>>>>>> 4ae9959964fa2aa87bf0bfb2629ca5d6193ec818

      // Act
      const result = await appointmentRepository.findByPatientId(patientId);

      // Assert
      expect(result.data).toEqual(mockAppointments);
      expect(result.pagination.total).toBe(2);
<<<<<<< HEAD
      expect(Appointment.find).toHaveBeenCalledWith({ patient: patientId });
=======
      expect(mockAppointmentModel.find).toHaveBeenCalledWith({ patient: patientId });
>>>>>>> 4ae9959964fa2aa87bf0bfb2629ca5d6193ec818
    });

    test('should return empty array for patient with no appointments', async () => {
      // Arrange
      const patientId = '507f1f77bcf86cd799439011';

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([])
      };

<<<<<<< HEAD
      Appointment.find = jest.fn().mockReturnValue(mockQuery);
      Appointment.countDocuments = jest.fn().mockResolvedValue(0);
=======
      mockAppointmentModel.find = jest.fn().mockReturnValue(mockQuery);
      mockAppointmentModel.countDocuments = jest.fn().mockResolvedValue(0);
>>>>>>> 4ae9959964fa2aa87bf0bfb2629ca5d6193ec818

      // Act
      const result = await appointmentRepository.findByPatientId(patientId);

      // Assert
      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });

    test('should handle invalid patient ID format', async () => {
      // Arrange
      const invalidPatientId = 'invalid-id';

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error('Invalid ObjectId'))
      };

<<<<<<< HEAD
      Appointment.find = jest.fn().mockReturnValue(mockQuery);
=======
      mockAppointmentModel.find = jest.fn().mockReturnValue(mockQuery);
>>>>>>> 4ae9959964fa2aa87bf0bfb2629ca5d6193ec818

      // Act & Assert
      await expect(appointmentRepository.findByPatientId(invalidPatientId))
        .rejects
        .toThrow('Invalid ObjectId');
    });
  });

  describe('checkSchedulingConflicts', () => {
    test('should pass when no conflicts exist', async () => {
      // Arrange
      const doctorId = '507f1f77bcf86cd799439013';
      const appointmentDate = new Date(Date.now() + 86400000);
      const duration = 30;

      const mockQuery = {
        exec: jest.fn().mockResolvedValue(null) // No conflicting appointment
      };

<<<<<<< HEAD
      const Appointment = require('../../../models/Appointment');
      Appointment.findOne.mockReturnValue(mockQuery);
=======
      mockAppointmentModel.findOne = jest.fn().mockReturnValue(mockQuery);
>>>>>>> 4ae9959964fa2aa87bf0bfb2629ca5d6193ec818

      // Act & Assert
      await expect(appointmentRepository.checkSchedulingConflicts(doctorId, appointmentDate, duration))
        .resolves
        .not.toThrow();
    });

    test('should throw ConflictError when scheduling conflict exists', async () => {
      // Arrange
      const doctorId = '507f1f77bcf86cd799439013';
      const appointmentDate = new Date(Date.now() + 86400000);
      const duration = 30;
      const conflictingAppointment = testUtils.createMockAppointment({ doctor: doctorId });

      const mockQuery = {
        exec: jest.fn().mockResolvedValue(conflictingAppointment)
      };

<<<<<<< HEAD
      Appointment.findOne = jest.fn().mockReturnValue(mockQuery);
=======
      mockAppointmentModel.findOne = jest.fn().mockReturnValue(mockQuery);
>>>>>>> 4ae9959964fa2aa87bf0bfb2629ca5d6193ec818

      // Act & Assert
      await expect(appointmentRepository.checkSchedulingConflicts(doctorId, appointmentDate, duration))
        .rejects
        .toThrow(ConflictError);
    });

    test('should handle overlapping appointment times correctly', async () => {
      // Arrange
      const doctorId = '507f1f77bcf86cd799439013';
      const appointmentDate = new Date('2024-01-15T10:00:00Z');
      const duration = 60; // 1 hour

      // Existing appointment from 9:30 to 10:30
      const existingAppointment = testUtils.createMockAppointment({
        doctor: doctorId,
        appointmentDate: new Date('2024-01-15T09:30:00Z'),
        duration: 60
      });

      const mockQuery = {
        exec: jest.fn().mockResolvedValue(existingAppointment)
      };

<<<<<<< HEAD
      Appointment.findOne = jest.fn().mockReturnValue(mockQuery);
=======
      mockAppointmentModel.findOne = jest.fn().mockReturnValue(mockQuery);
>>>>>>> 4ae9959964fa2aa87bf0bfb2629ca5d6193ec818

      // Act & Assert
      await expect(appointmentRepository.checkSchedulingConflicts(doctorId, appointmentDate, duration))
        .rejects
        .toThrow(ConflictError);
    });

    test('should exclude specific appointment from conflict check', async () => {
      // Arrange
      const doctorId = '507f1f77bcf86cd799439013';
      const appointmentDate = new Date(Date.now() + 86400000);
      const duration = 30;
      const excludeAppointmentId = '507f1f77bcf86cd799439012';

      const mockQuery = {
        exec: jest.fn().mockResolvedValue(null)
      };

<<<<<<< HEAD
      Appointment.findOne = jest.fn().mockReturnValue(mockQuery);
=======
      mockAppointmentModel.findOne = jest.fn().mockReturnValue(mockQuery);
>>>>>>> 4ae9959964fa2aa87bf0bfb2629ca5d6193ec818

      // Act
      await appointmentRepository.checkSchedulingConflicts(doctorId, appointmentDate, duration, excludeAppointmentId);

      // Assert
<<<<<<< HEAD
      expect(Appointment.findOne).toHaveBeenCalledWith(
=======
      expect(mockAppointmentModel.findOne).toHaveBeenCalledWith(
>>>>>>> 4ae9959964fa2aa87bf0bfb2629ca5d6193ec818
        expect.objectContaining({
          doctor: doctorId,
          _id: { $ne: excludeAppointmentId }
        })
      );
    });
  });

  describe('updateStatus', () => {
    test('should successfully update appointment status', async () => {
      // Arrange
      const appointmentId = '507f1f77bcf86cd799439012';
      const newStatus = 'completed';
      const updatedAppointment = testUtils.createMockAppointment({ 
        _id: appointmentId, 
        status: newStatus,
        completedAt: new Date()
      });

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(updatedAppointment)
      };

<<<<<<< HEAD
      Appointment.findByIdAndUpdate = jest.fn().mockReturnValue(mockQuery);
=======
      mockAppointmentModel.findByIdAndUpdate = jest.fn().mockReturnValue(mockQuery);
>>>>>>> 4ae9959964fa2aa87bf0bfb2629ca5d6193ec818

      // Act
      const result = await appointmentRepository.updateStatus(appointmentId, newStatus);

      // Assert
      expect(result).toEqual(updatedAppointment);
<<<<<<< HEAD
      expect(Appointment.findByIdAndUpdate).toHaveBeenCalledWith(
=======
      expect(mockAppointmentModel.findByIdAndUpdate).toHaveBeenCalledWith(
>>>>>>> 4ae9959964fa2aa87bf0bfb2629ca5d6193ec818
        appointmentId,
        expect.objectContaining({
          status: newStatus,
          completedAt: expect.any(Date)
        }),
        expect.objectContaining({ new: true, runValidators: true })
      );
    });

    test('should handle appointment not found during status update', async () => {
      // Arrange
      const appointmentId = '507f1f77bcf86cd799439012';
      const newStatus = 'completed';

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null)
      };

<<<<<<< HEAD
      Appointment.findByIdAndUpdate = jest.fn().mockReturnValue(mockQuery);
=======
      mockAppointmentModel.findByIdAndUpdate = jest.fn().mockReturnValue(mockQuery);
>>>>>>> 4ae9959964fa2aa87bf0bfb2629ca5d6193ec818

      // Act
      const result = await appointmentRepository.updateStatus(appointmentId, newStatus);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('cancelAppointment', () => {
    test('should successfully cancel appointment', async () => {
      // Arrange
      const appointmentId = '507f1f77bcf86cd799439012';
      const cancellationReason = 'Patient requested cancellation';
      const cancelledAppointment = testUtils.createMockAppointment({
        _id: appointmentId,
        status: 'cancelled',
        cancellationReason,
        cancelledAt: new Date()
      });

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(cancelledAppointment)
      };

<<<<<<< HEAD
      Appointment.findByIdAndUpdate = jest.fn().mockReturnValue(mockQuery);
=======
      mockAppointmentModel.findByIdAndUpdate = jest.fn().mockReturnValue(mockQuery);
>>>>>>> 4ae9959964fa2aa87bf0bfb2629ca5d6193ec818

      // Act
      const result = await appointmentRepository.cancelAppointment(appointmentId, cancellationReason);

      // Assert
      expect(result).toEqual(cancelledAppointment);
<<<<<<< HEAD
      expect(Appointment.findByIdAndUpdate).toHaveBeenCalledWith(
=======
      expect(mockAppointmentModel.findByIdAndUpdate).toHaveBeenCalledWith(
>>>>>>> 4ae9959964fa2aa87bf0bfb2629ca5d6193ec818
        appointmentId,
        expect.objectContaining({
          status: 'cancelled',
          cancellationReason,
          cancelledAt: expect.any(Date)
        }),
        expect.any(Object)
      );
    });
  });

  describe('getUpcomingAppointments', () => {
    test('should return upcoming appointments for patient', async () => {
      // Arrange
      const patientId = '507f1f77bcf86cd799439011';
      const limit = 5;
      const futureDate = new Date(Date.now() + 86400000);
      
      const mockAppointments = [
        testUtils.createMockAppointment({ 
          patient: patientId, 
          appointmentDate: futureDate,
          status: 'scheduled'
        })
      ];

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockAppointments)
      };

<<<<<<< HEAD
      Appointment.find = jest.fn().mockReturnValue(mockQuery);
      Appointment.countDocuments = jest.fn().mockResolvedValue(1);
=======
      mockAppointmentModel.find = jest.fn().mockReturnValue(mockQuery);
      mockAppointmentModel.countDocuments = jest.fn().mockResolvedValue(1);
>>>>>>> 4ae9959964fa2aa87bf0bfb2629ca5d6193ec818

      // Act
      const result = await appointmentRepository.getUpcomingAppointments(patientId, limit);

      // Assert
      expect(result).toEqual(mockAppointments);
<<<<<<< HEAD
      expect(Appointment.find).toHaveBeenCalledWith(
=======
      expect(mockAppointmentModel.find).toHaveBeenCalledWith(
>>>>>>> 4ae9959964fa2aa87bf0bfb2629ca5d6193ec818
        expect.objectContaining({
          patient: patientId,
          appointmentDate: { $gte: expect.any(Date) },
          status: { $in: ['scheduled', 'confirmed'] }
        })
      );
    });

    test('should return empty array when no upcoming appointments', async () => {
      // Arrange
      const patientId = '507f1f77bcf86cd799439011';
      const limit = 5;

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([])
      };

<<<<<<< HEAD
      Appointment.find = jest.fn().mockReturnValue(mockQuery);
      Appointment.countDocuments = jest.fn().mockResolvedValue(0);
=======
      mockAppointmentModel.find = jest.fn().mockReturnValue(mockQuery);
      mockAppointmentModel.countDocuments = jest.fn().mockResolvedValue(0);
>>>>>>> 4ae9959964fa2aa87bf0bfb2629ca5d6193ec818

      // Act
      const result = await appointmentRepository.getUpcomingAppointments(patientId, limit);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('getAppointmentStatistics', () => {
    test('should return appointment statistics', async () => {
      // Arrange
      const mockStats = [{
        _id: null,
        total: 100,
        statusBreakdown: [
          { status: 'scheduled', count: 30 },
          { status: 'completed', count: 50 },
          { status: 'cancelled', count: 20 }
        ]
      }];

<<<<<<< HEAD
      Appointment.aggregate = jest.fn().mockResolvedValue(mockStats);
=======
      mockAppointmentModel.aggregate = jest.fn().mockResolvedValue(mockStats);
>>>>>>> 4ae9959964fa2aa87bf0bfb2629ca5d6193ec818

      // Act
      const result = await appointmentRepository.getAppointmentStatistics();

      // Assert
      expect(result).toEqual(mockStats[0]);
<<<<<<< HEAD
      expect(Appointment.aggregate).toHaveBeenCalledWith(expect.any(Array));
=======
      expect(mockAppointmentModel.aggregate).toHaveBeenCalledWith(expect.any(Array));
>>>>>>> 4ae9959964fa2aa87bf0bfb2629ca5d6193ec818
    });

    test('should return default stats when no data', async () => {
      // Arrange
<<<<<<< HEAD
      Appointment.aggregate = jest.fn().mockResolvedValue([]);
=======
      mockAppointmentModel.aggregate = jest.fn().mockResolvedValue([]);
>>>>>>> 4ae9959964fa2aa87bf0bfb2629ca5d6193ec818

      // Act
      const result = await appointmentRepository.getAppointmentStatistics();

      // Assert
      expect(result).toEqual({ total: 0, statusBreakdown: [] });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle network timeouts gracefully', async () => {
      // Arrange
      const appointmentData = testUtils.createMockAppointment();
      const timeoutError = new Error('Network timeout');
      timeoutError.code = 'ETIMEDOUT';
      
<<<<<<< HEAD
      Appointment.prototype.save = jest.fn().mockRejectedValue(timeoutError);
=======
      mockAppointmentModel.prototype.save = jest.fn().mockRejectedValue(timeoutError);
>>>>>>> 4ae9959964fa2aa87bf0bfb2629ca5d6193ec818

      // Act & Assert
      await expect(appointmentRepository.createAppointment(appointmentData))
        .rejects
        .toThrow('Network timeout');
    });

    test('should handle malformed query parameters', async () => {
      // Arrange
      const malformedQuery = { invalidField: { $invalidOperator: 'value' } };
      
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error('Invalid query'))
      };

<<<<<<< HEAD
      Appointment.find = jest.fn().mockReturnValue(mockQuery);
=======
      mockAppointmentModel.find = jest.fn().mockReturnValue(mockQuery);
>>>>>>> 4ae9959964fa2aa87bf0bfb2629ca5d6193ec818

      // Act & Assert
      await expect(appointmentRepository.findMany(malformedQuery))
        .rejects
        .toThrow('Invalid query');
    });

    test('should handle extremely large result sets', async () => {
      // Arrange
      const largeResultSet = Array(10000).fill().map(() => testUtils.createMockAppointment());
      
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(largeResultSet)
      };

<<<<<<< HEAD
      Appointment.find = jest.fn().mockReturnValue(mockQuery);
      Appointment.countDocuments = jest.fn().mockResolvedValue(10000);
=======
      mockAppointmentModel.find = jest.fn().mockReturnValue(mockQuery);
      mockAppointmentModel.countDocuments = jest.fn().mockResolvedValue(10000);
>>>>>>> 4ae9959964fa2aa87bf0bfb2629ca5d6193ec818

      // Act
      const startTime = Date.now();
      const result = await appointmentRepository.findMany({}, { limit: 10000 });
      const endTime = Date.now();

      // Assert
      expect(result.data).toHaveLength(10000);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});
