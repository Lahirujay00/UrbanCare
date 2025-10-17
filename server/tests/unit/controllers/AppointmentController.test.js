/**
 * @fileoverview Unit Tests for AppointmentController - API Layer Testing
 * @author UrbanCare Development Team
 * @version 1.0.0
 */

const AppointmentController = require('../../../controllers/AppointmentController');
const AppointmentService = require('../../../services/AppointmentService');
const { ValidationError, ConflictError, NotFoundError } = require('../../../utils/errors');

// Mock dependencies
jest.mock('../../../services/AppointmentService');

describe('AppointmentController - API Layer Tests', () => {
  let appointmentController;
  let mockAppointmentService;
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock service
    mockAppointmentService = new AppointmentService();
    
    // Create controller instance
    appointmentController = new AppointmentController(mockAppointmentService);
    
    // Create mock request, response, and next
    mockReq = testUtils.createMockRequest();
    mockRes = testUtils.createMockResponse();
    mockNext = testUtils.createMockNext();
  });

  describe('createAppointment - POST /api/appointments', () => {
    const validAppointmentData = {
      doctorId: '507f1f77bcf86cd799439013',
      appointmentDate: new Date(Date.now() + 86400000).toISOString(),
      duration: 30,
      reasonForVisit: 'Regular checkup',
      department: 'General Medicine'
    };

    test('should successfully create appointment with valid data', async () => {
      // Arrange
      mockReq.body = validAppointmentData;
      mockReq.user = { id: '507f1f77bcf86cd799439011', role: 'patient' };
      
      const mockCreatedAppointment = testUtils.createMockAppointment({
        ...validAppointmentData,
        patient: mockReq.user.id
      });

      mockAppointmentService.createAppointment.mockResolvedValue(mockCreatedAppointment);

      // Act
      await appointmentController.createAppointment(mockReq, mockRes);

      // Assert
      expect(mockAppointmentService.createAppointment).toHaveBeenCalledWith({
        ...validAppointmentData,
        patientId: mockReq.user.id,
        appointmentDate: new Date(validAppointmentData.appointmentDate)
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Appointment created successfully',
          data: mockCreatedAppointment
        })
      );
    });

    test('should return 400 for missing required fields', async () => {
      // Arrange
      mockReq.body = { doctorId: '507f1f77bcf86cd799439013' }; // Missing required fields
      mockReq.user = { id: '507f1f77bcf86cd799439011', role: 'patient' };

      mockAppointmentService.createAppointment.mockRejectedValue(
        new ValidationError('appointmentDate is required')
      );

      // Act
      await appointmentController.createAppointment(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'appointmentDate is required'
        })
      );
    });

    test('should return 409 for scheduling conflicts', async () => {
      // Arrange
      mockReq.body = validAppointmentData;
      mockReq.user = { id: '507f1f77bcf86cd799439011', role: 'patient' };

      mockAppointmentService.createAppointment.mockRejectedValue(
        new ConflictError('Doctor is not available at the requested time')
      );

      // Act
      await appointmentController.createAppointment(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Doctor is not available at the requested time'
        })
      );
    });

    test('should return 401 for unauthenticated requests', async () => {
      // Arrange
      mockReq.body = validAppointmentData;
      mockReq.user = null; // No authenticated user

      // Act
      await appointmentController.createAppointment(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Authentication required'
        })
      );
    });

    test('should return 403 for non-patient users', async () => {
      // Arrange
      mockReq.body = validAppointmentData;
      mockReq.user = { id: '507f1f77bcf86cd799439013', role: 'doctor' }; // Doctor trying to book

      // Act
      await appointmentController.createAppointment(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Only patients can book appointments'
        })
      );
    });

    test('should handle invalid date format', async () => {
      // Arrange
      mockReq.body = {
        ...validAppointmentData,
        appointmentDate: 'invalid-date'
      };
      mockReq.user = { id: '507f1f77bcf86cd799439011', role: 'patient' };

      mockAppointmentService.createAppointment.mockRejectedValue(
        new ValidationError('Invalid appointment date format')
      );

      // Act
      await appointmentController.createAppointment(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid appointment date format'
        })
      );
    });

    test('should handle server errors gracefully', async () => {
      // Arrange
      mockReq.body = validAppointmentData;
      mockReq.user = { id: '507f1f77bcf86cd799439011', role: 'patient' };

      mockAppointmentService.createAppointment.mockRejectedValue(
        new Error('Database connection failed')
      );

      // Act
      await appointmentController.createAppointment(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Internal server error'
        })
      );
    });
  });

  describe('getPatientAppointments - GET /api/appointments/patient/:patientId', () => {
    test('should return patient appointments successfully', async () => {
      // Arrange
      const patientId = '507f1f77bcf86cd799439011';
      mockReq.params = { patientId };
      mockReq.user = { id: patientId, role: 'patient' };
      mockReq.query = { page: '1', limit: '10' };

      const mockAppointments = {
        data: [testUtils.createMockAppointment({ patient: patientId })],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 }
      };

      mockAppointmentService.getPatientAppointments.mockResolvedValue(mockAppointments);

      // Act
      await appointmentController.getPatientAppointments(mockReq, mockRes);

      // Assert
      expect(mockAppointmentService.getPatientAppointments).toHaveBeenCalledWith(
        patientId,
        expect.objectContaining({ page: 1, limit: 10 })
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockAppointments
        })
      );
    });

    test('should enforce patient can only access own appointments', async () => {
      // Arrange
      const patientId = '507f1f77bcf86cd799439011';
      const otherPatientId = '507f1f77bcf86cd799439099';
      mockReq.params = { patientId: otherPatientId };
      mockReq.user = { id: patientId, role: 'patient' };

      // Act
      await appointmentController.getPatientAppointments(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Access denied'
        })
      );
    });

    test('should allow doctors to access patient appointments', async () => {
      // Arrange
      const patientId = '507f1f77bcf86cd799439011';
      mockReq.params = { patientId };
      mockReq.user = { id: '507f1f77bcf86cd799439013', role: 'doctor' };
      mockReq.query = {};

      const mockAppointments = {
        data: [testUtils.createMockAppointment({ patient: patientId })],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 }
      };

      mockAppointmentService.getPatientAppointments.mockResolvedValue(mockAppointments);

      // Act
      await appointmentController.getPatientAppointments(mockReq, mockRes);

      // Assert
      expect(mockAppointmentService.getPatientAppointments).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('cancelAppointment - PUT /api/appointments/:appointmentId/cancel', () => {
    test('should successfully cancel appointment', async () => {
      // Arrange
      const appointmentId = '507f1f77bcf86cd799439012';
      const cancellationReason = 'Patient requested cancellation';
      
      mockReq.params = { appointmentId };
      mockReq.body = { reason: cancellationReason };
      mockReq.user = { id: '507f1f77bcf86cd799439011', role: 'patient' };

      const mockCancelledAppointment = testUtils.createMockAppointment({
        _id: appointmentId,
        status: 'cancelled',
        cancellationReason
      });

      mockAppointmentService.cancelAppointment.mockResolvedValue(mockCancelledAppointment);

      // Act
      await appointmentController.cancelAppointment(mockReq, mockRes);

      // Assert
      expect(mockAppointmentService.cancelAppointment).toHaveBeenCalledWith(
        appointmentId,
        cancellationReason,
        mockReq.user.id
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Appointment cancelled successfully',
          data: mockCancelledAppointment
        })
      );
    });

    test('should return 404 for non-existent appointment', async () => {
      // Arrange
      const appointmentId = '507f1f77bcf86cd799439099';
      mockReq.params = { appointmentId };
      mockReq.body = { reason: 'Patient requested cancellation' };
      mockReq.user = { id: '507f1f77bcf86cd799439011', role: 'patient' };

      mockAppointmentService.cancelAppointment.mockRejectedValue(
        new NotFoundError('Appointment not found')
      );

      // Act
      await appointmentController.cancelAppointment(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Appointment not found'
        })
      );
    });

    test('should return 400 for missing cancellation reason', async () => {
      // Arrange
      const appointmentId = '507f1f77bcf86cd799439012';
      mockReq.params = { appointmentId };
      mockReq.body = {}; // Missing reason
      mockReq.user = { id: '507f1f77bcf86cd799439011', role: 'patient' };

      // Act
      await appointmentController.cancelAppointment(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Cancellation reason is required'
        })
      );
    });

    test('should handle already cancelled appointments', async () => {
      // Arrange
      const appointmentId = '507f1f77bcf86cd799439012';
      mockReq.params = { appointmentId };
      mockReq.body = { reason: 'Patient requested cancellation' };
      mockReq.user = { id: '507f1f77bcf86cd799439011', role: 'patient' };

      mockAppointmentService.cancelAppointment.mockRejectedValue(
        new ValidationError('Appointment is already cancelled')
      );

      // Act
      await appointmentController.cancelAppointment(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Appointment is already cancelled'
        })
      );
    });
  });

  describe('getAlternativeDoctors - GET /api/appointments/alternatives', () => {
    test('should return alternative doctors successfully', async () => {
      // Arrange
      mockReq.query = {
        department: 'General Medicine',
        appointmentDate: new Date(Date.now() + 86400000).toISOString()
      };
      mockReq.user = { id: '507f1f77bcf86cd799439011', role: 'patient' };

      const mockAlternativeDoctors = [
        testUtils.createMockUser({ role: 'doctor', specialization: 'General Medicine' }),
        testUtils.createMockUser({ role: 'doctor', specialization: 'General Medicine' })
      ];

      mockAppointmentService.getAlternativeDoctors.mockResolvedValue(mockAlternativeDoctors);

      // Act
      await appointmentController.getAlternativeDoctors(mockReq, mockRes);

      // Assert
      expect(mockAppointmentService.getAlternativeDoctors).toHaveBeenCalledWith(
        'General Medicine',
        new Date(mockReq.query.appointmentDate)
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockAlternativeDoctors
        })
      );
    });

    test('should return 400 for missing department parameter', async () => {
      // Arrange
      mockReq.query = {
        appointmentDate: new Date(Date.now() + 86400000).toISOString()
        // Missing department
      };
      mockReq.user = { id: '507f1f77bcf86cd799439011', role: 'patient' };

      // Act
      await appointmentController.getAlternativeDoctors(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Department and appointment date are required'
        })
      );
    });

    test('should return empty array when no alternatives available', async () => {
      // Arrange
      mockReq.query = {
        department: 'Rare Specialty',
        appointmentDate: new Date(Date.now() + 86400000).toISOString()
      };
      mockReq.user = { id: '507f1f77bcf86cd799439011', role: 'patient' };

      mockAppointmentService.getAlternativeDoctors.mockResolvedValue([]);

      // Act
      await appointmentController.getAlternativeDoctors(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: [],
          message: 'No alternative doctors available'
        })
      );
    });
  });

  describe('Input Validation and Sanitization', () => {
    test('should sanitize malicious input in appointment creation', async () => {
      // Arrange
      mockReq.body = {
        doctorId: '507f1f77bcf86cd799439013',
        appointmentDate: new Date(Date.now() + 86400000).toISOString(),
        duration: 30,
        reasonForVisit: '<script>alert("xss")</script>Regular checkup',
        department: 'General Medicine'
      };
      mockReq.user = { id: '507f1f77bcf86cd799439011', role: 'patient' };

      const mockCreatedAppointment = testUtils.createMockAppointment({
        reasonForVisit: 'Regular checkup' // XSS removed
      });

      mockAppointmentService.createAppointment.mockResolvedValue(mockCreatedAppointment);

      // Act
      await appointmentController.createAppointment(mockReq, mockRes);

      // Assert
      expect(mockAppointmentService.createAppointment).toHaveBeenCalledWith(
        expect.objectContaining({
          reasonForVisit: 'Regular checkup' // Should be sanitized
        })
      );
    });

    test('should validate appointment ID format in parameters', async () => {
      // Arrange
      mockReq.params = { appointmentId: 'invalid-id-format' };
      mockReq.body = { reason: 'Patient requested cancellation' };
      mockReq.user = { id: '507f1f77bcf86cd799439011', role: 'patient' };

      // Act
      await appointmentController.cancelAppointment(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid appointment ID format'
        })
      );
    });

    test('should handle SQL injection attempts gracefully', async () => {
      // Arrange
      mockReq.body = {
        doctorId: "'; DROP TABLE appointments; --",
        appointmentDate: new Date(Date.now() + 86400000).toISOString(),
        reasonForVisit: 'Regular checkup',
        department: 'General Medicine'
      };
      mockReq.user = { id: '507f1f77bcf86cd799439011', role: 'patient' };

      mockAppointmentService.createAppointment.mockRejectedValue(
        new ValidationError('Invalid doctor ID format')
      );

      // Act
      await appointmentController.createAppointment(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid doctor ID format'
        })
      );
    });
  });

  describe('Performance and Load Testing', () => {
    test('should handle high concurrent appointment requests', async () => {
      // Arrange
      const validAppointmentData = {
        doctorId: '507f1f77bcf86cd799439013',
        appointmentDate: new Date(Date.now() + 86400000).toISOString(),
        duration: 30,
        reasonForVisit: 'Regular checkup',
        department: 'General Medicine'
      };

      mockReq.body = validAppointmentData;
      mockReq.user = { id: '507f1f77bcf86cd799439011', role: 'patient' };

      const mockCreatedAppointment = testUtils.createMockAppointment();
      mockAppointmentService.createAppointment.mockResolvedValue(mockCreatedAppointment);

      // Act - Simulate 50 concurrent requests
      const promises = Array(50).fill().map(() => 
        appointmentController.createAppointment(mockReq, mockRes)
      );

      const startTime = Date.now();
      await Promise.allSettled(promises);
      const endTime = Date.now();

      // Assert - Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(2000); // 2 seconds
    });

    test('should handle large pagination requests efficiently', async () => {
      // Arrange
      const patientId = '507f1f77bcf86cd799439011';
      mockReq.params = { patientId };
      mockReq.user = { id: patientId, role: 'patient' };
      mockReq.query = { page: '1', limit: '1000' }; // Large page size

      const mockAppointments = {
        data: Array(1000).fill().map(() => testUtils.createMockAppointment()),
        pagination: { page: 1, limit: 1000, total: 1000, totalPages: 1 }
      };

      mockAppointmentService.getPatientAppointments.mockResolvedValue(mockAppointments);

      // Act
      const startTime = Date.now();
      await appointmentController.getPatientAppointments(mockReq, mockRes);
      const endTime = Date.now();

      // Assert
      expect(endTime - startTime).toBeLessThan(1000); // 1 second
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });
});
