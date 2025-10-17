/**
 * @fileoverview Appointment Controller implementing appointment-specific endpoints
 * @author UrbanCare Development Team
 * @version 1.0.0
 */

const BaseController = require('../core/BaseController');
const AppointmentService = require('../services/AppointmentService');
const AppointmentRepository = require('../repositories/AppointmentRepository');
const UserRepository = require('../repositories/UserRepository');
const PaymentService = require('../services/PaymentService');
const ValidationHelper = require('../utils/ValidationHelper');
const Logger = require('../utils/Logger');

/**
 * AppointmentController class handling appointment-specific HTTP requests
 * Extends BaseController following SOLID principles
 */
class AppointmentController extends BaseController {
  /**
   * Creates an instance of AppointmentController
   */
  constructor() {
    // Initialize repositories
    const appointmentRepository = new AppointmentRepository();
    const userRepository = new UserRepository();
    const paymentService = new PaymentService();
    
    // Initialize service with dependency injection
    const appointmentService = new AppointmentService(
      appointmentRepository,
      userRepository,
      paymentService
    );
    
    super(appointmentService, Logger.getLogger('AppointmentController'));
  }

  /**
   * Creates a new appointment
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createAppointment(req, res) {
    await this.handleAsync(async (req, res) => {
      this.logAction('createAppointment', req);

      // Check authentication
      if (!req.user) {
        return res.status(401).json(
          this.responseFormatter.authenticationError('Authentication required')
        );
      }

      // Check authorization - only patients can book appointments
      if (req.user.role !== 'patient') {
        return res.status(403).json(
          this.responseFormatter.authorizationError('Only patients can book appointments')
        );
      }

      // Validate required fields
      this.validateRequiredFields(req, ['doctorId', 'appointmentDate', 'reasonForVisit', 'department']);

      // Sanitize input
      const sanitizedData = this.sanitizeAppointmentData(req.body);

      // Prepare appointment data
      const appointmentData = {
        ...sanitizedData,
        patientId: req.user.id,
        appointmentDate: new Date(sanitizedData.appointmentDate)
      };

      // Validate ObjectId format
      if (!this.isValidObjectId(appointmentData.doctorId)) {
        return res.status(400).json(
          this.responseFormatter.validationError(null, 'Invalid doctor ID format')
        );
      }

      // Create appointment
      const appointment = await this.service.createAppointment(appointmentData);

      this.sendCreated(res, appointment, 'Appointment created successfully');
    }, req, res);
  }

  /**
   * Gets appointments for a specific patient
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getPatientAppointments(req, res) {
    await this.handleAsync(async (req, res) => {
      this.logAction('getPatientAppointments', req);

      const { patientId } = req.params;

      // Validate ObjectId format
      if (!this.isValidObjectId(patientId)) {
        return res.status(400).json(
          this.responseFormatter.validationError(null, 'Invalid patient ID format')
        );
      }

      // Authorization check - patients can only access their own appointments
      // Doctors and staff can access any patient's appointments
      if (req.user.role === 'patient' && req.user.id !== patientId) {
        return res.status(403).json(
          this.responseFormatter.authorizationError('Access denied')
        );
      }

      // Build pagination options
      const paginationOptions = this.buildPaginationOptions(req);

      // Get appointments
      const appointments = await this.service.getPatientAppointments(patientId, paginationOptions);

      this.sendSuccess(res, appointments, 'Appointments retrieved successfully');
    }, req, res);
  }

  /**
   * Cancels an appointment
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async cancelAppointment(req, res) {
    await this.handleAsync(async (req, res) => {
      this.logAction('cancelAppointment', req);

      const { appointmentId } = req.params;
      const { reason } = req.body;

      // Validate ObjectId format
      if (!this.isValidObjectId(appointmentId)) {
        return res.status(400).json(
          this.responseFormatter.validationError(null, 'Invalid appointment ID format')
        );
      }

      // Validate cancellation reason
      if (!reason || reason.trim().length === 0) {
        return res.status(400).json(
          this.responseFormatter.validationError(null, 'Cancellation reason is required')
        );
      }

      // Cancel appointment
      const cancelledAppointment = await this.service.cancelAppointment(
        appointmentId,
        reason.trim(),
        req.user.id
      );

      this.sendSuccess(res, cancelledAppointment, 'Appointment cancelled successfully');
    }, req, res);
  }

  /**
   * Gets alternative doctors when requested doctor is unavailable
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAlternativeDoctors(req, res) {
    await this.handleAsync(async (req, res) => {
      this.logAction('getAlternativeDoctors', req);

      const { department, appointmentDate } = req.query;

      // Validate required parameters
      if (!department || !appointmentDate) {
        return res.status(400).json(
          this.responseFormatter.validationError(null, 'Department and appointment date are required')
        );
      }

      // Validate date format
      const parsedDate = new Date(appointmentDate);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json(
          this.responseFormatter.validationError(null, 'Invalid appointment date format')
        );
      }

      // Get alternative doctors
      const alternativeDoctors = await this.service.getAlternativeDoctors(department, parsedDate);

      if (alternativeDoctors.length === 0) {
        this.sendSuccess(res, alternativeDoctors, 'No alternative doctors available');
      } else {
        this.sendSuccess(res, alternativeDoctors, 'Alternative doctors retrieved successfully');
      }
    }, req, res);
  }

  /**
   * Gets upcoming appointments for a patient
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getUpcomingAppointments(req, res) {
    await this.handleAsync(async (req, res) => {
      this.logAction('getUpcomingAppointments', req);

      const { patientId } = req.params;
      const limit = parseInt(req.query.limit) || 5;

      // Validate ObjectId format
      if (!this.isValidObjectId(patientId)) {
        return res.status(400).json(
          this.responseFormatter.validationError(null, 'Invalid patient ID format')
        );
      }

      // Authorization check
      if (req.user.role === 'patient' && req.user.id !== patientId) {
        return res.status(403).json(
          this.responseFormatter.authorizationError('Access denied')
        );
      }

      // Get upcoming appointments
      const upcomingAppointments = await this.service.getUpcomingAppointments(patientId, limit);

      this.sendSuccess(res, upcomingAppointments, 'Upcoming appointments retrieved successfully');
    }, req, res);
  }

  /**
   * Updates appointment status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateAppointmentStatus(req, res) {
    await this.handleAsync(async (req, res) => {
      this.logAction('updateAppointmentStatus', req);

      const { appointmentId } = req.params;
      const { status } = req.body;

      // Validate ObjectId format
      if (!this.isValidObjectId(appointmentId)) {
        return res.status(400).json(
          this.responseFormatter.validationError(null, 'Invalid appointment ID format')
        );
      }

      // Validate status
      const validStatuses = ['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json(
          this.responseFormatter.validationError(null, 'Invalid appointment status')
        );
      }

      // Only doctors and staff can update appointment status
      if (!['doctor', 'staff', 'admin'].includes(req.user.role)) {
        return res.status(403).json(
          this.responseFormatter.authorizationError('Insufficient permissions')
        );
      }

      // Update appointment status
      const updatedAppointment = await this.service.updateAppointmentStatus(appointmentId, status);

      this.sendSuccess(res, updatedAppointment, 'Appointment status updated successfully');
    }, req, res);
  }

  /**
   * Sanitizes appointment data to prevent XSS and other attacks
   * @param {Object} data - Raw appointment data
   * @returns {Object} Sanitized appointment data
   * @private
   */
  sanitizeAppointmentData(data) {
    return {
      doctorId: data.doctorId?.trim(),
      appointmentDate: data.appointmentDate,
      duration: parseInt(data.duration) || 30,
      reasonForVisit: data.reasonForVisit?.replace(/<[^>]*>/g, '').trim(),
      department: data.department?.trim(),
      notes: data.notes?.replace(/<[^>]*>/g, '').trim()
    };
  }

  /**
   * Validates if a string is a valid MongoDB ObjectId
   * @param {string} id - ID to validate
   * @returns {boolean} True if valid ObjectId
   * @private
   */
  isValidObjectId(id) {
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    return objectIdRegex.test(id);
  }

  /**
   * Gets resource name for base controller
   * @returns {string} Resource name
   */
  getResourceName() {
    return 'Appointment';
  }
}

module.exports = AppointmentController;
