/**
 * @fileoverview Appointment Service implementing business logic for appointment operations
 * @author UrbanCare Development Team
 * @version 1.0.0
 */

const BaseService = require('../core/BaseService');
const Logger = require('../utils/Logger');
const { ValidationError, ConflictError, NotFoundError, BusinessLogicError } = require('../utils/errors');

/**
 * AppointmentService class handling appointment-specific business logic
 * Extends BaseService following SOLID principles
 */
class AppointmentService extends BaseService {
  /**
   * Creates an instance of AppointmentService
   * @param {Object} appointmentRepository - Appointment repository instance
   * @param {Object} userRepository - User repository instance
   * @param {Object} paymentService - Payment service instance
   */
  constructor(appointmentRepository, userRepository, paymentService) {
    super(appointmentRepository, Logger.getLogger('AppointmentService'));
    this.userRepository = userRepository;
    this.paymentService = paymentService;
  }

  /**
   * Creates a new appointment with comprehensive validation
   * @param {Object} appointmentData - Appointment data
   * @returns {Promise<Object>} Created appointment
   */
  async createAppointment(appointmentData) {
    try {
      this.logger.info('Creating new appointment', { appointmentData });

      // Step 1: Validate input data
      this.validateAppointmentInput(appointmentData);

      // Step 2: Validate patient exists and has correct role
      const patient = await this.validatePatient(appointmentData.patientId);

      // Step 3: Validate doctor exists and has correct role
      const doctor = await this.validateDoctor(appointmentData.doctorId);

      // Step 4: Validate business rules
      this.validateBusinessRules(appointmentData, doctor);

      // Step 5: Check for scheduling conflicts
      await this.repository.checkSchedulingConflicts(
        appointmentData.doctorId,
        appointmentData.appointmentDate,
        appointmentData.duration || 30
      );

      // Step 6: Create the appointment
      const appointment = await this.repository.createAppointment(appointmentData);

      this.logger.info('Appointment created successfully', { appointmentId: appointment._id });
      this.logBusinessEvent('appointment_created', { 
        appointmentId: appointment._id,
        patientId: appointmentData.patientId,
        doctorId: appointmentData.doctorId 
      });

      return appointment;
    } catch (error) {
      this.logger.error('Error creating appointment:', error);
      throw this.handleServiceError(error);
    }
  }

  /**
   * Gets alternative doctors when requested doctor is unavailable
   * @param {string} department - Department/specialization
   * @param {Date} appointmentDate - Desired appointment date
   * @returns {Promise<Array>} Array of alternative doctors
   */
  async getAlternativeDoctors(department, appointmentDate) {
    try {
      this.logger.info('Finding alternative doctors', { department, appointmentDate });

      const doctorsResult = await this.userRepository.findByRole('doctor', {
        populate: [{ path: 'specialization' }]
      });

      const availableDoctors = doctorsResult.data.filter(doctor => {
        return doctor.specialization === department && doctor.isActive;
      });

      // TODO: Check actual availability for each doctor
      // For now, return all doctors in the department
      return availableDoctors;
    } catch (error) {
      this.logger.error('Error finding alternative doctors:', error);
      throw this.handleServiceError(error);
    }
  }

  /**
   * Cancels an appointment with refund handling
   * @param {string} appointmentId - Appointment ID
   * @param {string} cancellationReason - Reason for cancellation
   * @param {string} cancelledBy - Who cancelled (patient/doctor/admin)
   * @returns {Promise<Object>} Updated appointment
   */
  async cancelAppointment(appointmentId, cancellationReason, cancelledBy) {
    try {
      this.logger.info('Cancelling appointment', { appointmentId, cancelledBy });

      // Get appointment details
      const appointment = await this.repository.findById(appointmentId);
      if (!appointment) {
        throw new NotFoundError('Appointment not found');
      }

      // Validate cancellation is allowed
      this.validateCancellation(appointment);

      // Cancel the appointment
      const cancelledAppointment = await this.repository.cancelAppointment(
        appointmentId, 
        cancellationReason
      );

      // Handle refund if payment was made
      if (appointment.paymentId) {
        await this.handleRefund(appointment);
      }

      this.logBusinessEvent('appointment_cancelled', {
        appointmentId,
        cancelledBy,
        reason: cancellationReason
      });

      return cancelledAppointment;
    } catch (error) {
      this.logger.error('Error cancelling appointment:', error);
      throw this.handleServiceError(error);
    }
  }

  /**
   * Validates appointment input data
   * @param {Object} appointmentData - Appointment data to validate
   * @throws {ValidationError} If validation fails
   * @private
   */
  validateAppointmentInput(appointmentData) {
    const requiredFields = ['patientId', 'doctorId', 'appointmentDate', 'reasonForVisit', 'department'];
    
    for (const field of requiredFields) {
      if (!appointmentData[field]) {
        throw new ValidationError(`${field} is required`);
      }
    }

    // Validate ObjectId format
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    if (!objectIdRegex.test(appointmentData.patientId)) {
      throw new ValidationError('Invalid patient ID format');
    }
    if (!objectIdRegex.test(appointmentData.doctorId)) {
      throw new ValidationError('Invalid doctor ID format');
    }

    // Validate appointment date
    const appointmentDate = new Date(appointmentData.appointmentDate);
    if (isNaN(appointmentDate.getTime())) {
      throw new ValidationError('Invalid appointment date');
    }

    // Validate duration
    if (appointmentData.duration && (appointmentData.duration < 15 || appointmentData.duration > 480)) {
      throw new ValidationError('Duration must be between 15 and 480 minutes');
    }

    // Validate reason for visit length
    if (appointmentData.reasonForVisit.length < 5 || appointmentData.reasonForVisit.length > 500) {
      throw new ValidationError('Reason for visit must be between 5 and 500 characters');
    }
  }

  /**
   * Validates patient exists and has correct role
   * @param {string} patientId - Patient ID
   * @returns {Promise<Object>} Patient object
   * @throws {NotFoundError|ValidationError} If patient not found or invalid role
   * @private
   */
  async validatePatient(patientId) {
    const patient = await this.userRepository.findById(patientId);
    if (!patient) {
      throw new NotFoundError('Patient not found');
    }
    if (patient.role !== 'patient') {
      throw new ValidationError('User is not a patient');
    }
    if (!patient.isActive) {
      throw new ValidationError('Patient account is inactive');
    }
    return patient;
  }

  /**
   * Validates doctor exists and has correct role
   * @param {string} doctorId - Doctor ID
   * @returns {Promise<Object>} Doctor object
   * @throws {NotFoundError|ValidationError} If doctor not found or invalid role
   * @private
   */
  async validateDoctor(doctorId) {
    const doctor = await this.userRepository.findById(doctorId);
    if (!doctor) {
      throw new NotFoundError('Doctor not found');
    }
    if (doctor.role !== 'doctor') {
      throw new ValidationError('User is not a doctor');
    }
    if (!doctor.isActive) {
      throw new ValidationError('Doctor account is inactive');
    }
    return doctor;
  }

  /**
   * Validates business rules for appointment creation
   * @param {Object} appointmentData - Appointment data
   * @param {Object} doctor - Doctor object
   * @throws {ValidationError} If business rules are violated
   * @private
   */
  validateBusinessRules(appointmentData, doctor) {
    const appointmentDate = new Date(appointmentData.appointmentDate);
    const now = new Date();

    // Rule 1: Appointment must be in the future
    if (appointmentDate <= now) {
      throw new ValidationError('Appointment date must be in the future');
    }

    // Rule 2: Minimum 24 hours advance booking
    const hoursInAdvance = (appointmentDate - now) / (1000 * 60 * 60);
    if (hoursInAdvance < 24) {
      throw new ValidationError('Appointments must be scheduled at least 24 hours in advance');
    }

    // Rule 3: Maximum 90 days advance booking
    const daysInAdvance = hoursInAdvance / 24;
    if (daysInAdvance > 90) {
      throw new ValidationError('Appointments cannot be scheduled more than 90 days in advance');
    }

    // Rule 4: Business hours (9 AM - 5 PM)
    const hour = appointmentDate.getHours();
    if (hour < 9 || hour >= 17) {
      throw new ValidationError('Appointments must be scheduled between 9 AM and 5 PM');
    }

    // Rule 5: Weekdays only
    const dayOfWeek = appointmentDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      throw new ValidationError('Appointments can only be scheduled on weekdays');
    }

    // Rule 6: Doctor specialization must match department
    if (doctor.specialization && doctor.specialization !== appointmentData.department) {
      throw new ValidationError('Doctor specialization does not match requested department');
    }
  }

  /**
   * Validates if cancellation is allowed
   * @param {Object} appointment - Appointment object
   * @throws {ValidationError} If cancellation is not allowed
   * @private
   */
  validateCancellation(appointment) {
    if (appointment.status === 'cancelled') {
      throw new ValidationError('Appointment is already cancelled');
    }
    if (appointment.status === 'completed') {
      throw new ValidationError('Cannot cancel completed appointment');
    }

    // Check if cancellation is within allowed timeframe (24 hours before)
    const appointmentDate = new Date(appointment.appointmentDate);
    const now = new Date();
    const hoursUntilAppointment = (appointmentDate - now) / (1000 * 60 * 60);

    if (hoursUntilAppointment < 24) {
      throw new ValidationError('Cannot cancel appointment less than 24 hours before scheduled time');
    }
  }

  /**
   * Handles refund for cancelled appointment
   * @param {Object} appointment - Appointment object
   * @private
   */
  async handleRefund(appointment) {
    try {
      if (this.paymentService && appointment.paymentId) {
        await this.paymentService.processRefund(
          appointment.paymentId,
          appointment.amount,
          'Appointment cancelled by patient'
        );
        this.logger.info('Refund processed for cancelled appointment', {
          appointmentId: appointment._id,
          paymentId: appointment.paymentId
        });
      }
    } catch (error) {
      this.logger.error('Error processing refund:', error);
      // Don't throw error here - appointment cancellation should still succeed
    }
  }

  /**
   * Gets resource name for base service
   * @returns {string} Resource name
   */
  getResourceName() {
    return 'Appointment';
  }
}

module.exports = AppointmentService;
