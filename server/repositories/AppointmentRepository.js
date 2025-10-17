/**
 * @fileoverview Appointment Repository implementing data access for Appointment model
 * @author UrbanCare Development Team
 * @version 1.0.0
 */

const BaseRepository = require('../core/BaseRepository');
const Appointment = require('../models/Appointment');
const Logger = require('../utils/Logger');
const { ConflictError, BusinessLogicError } = require('../utils/errors');

/**
 * AppointmentRepository class handling Appointment-specific data operations
 * Extends BaseRepository following Repository pattern
 */
class AppointmentRepository extends BaseRepository {
  /**
   * Creates an instance of AppointmentRepository
   */
  constructor() {
    super(Appointment, Logger.getLogger('AppointmentRepository'));
  }

  /**
   * Finds appointments by patient ID
   * @param {string} patientId - Patient ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Paginated appointments result
   */
  async findByPatientId(patientId, options = {}) {
    try {
      this.logger.debug('Finding appointments by patient ID', { patientId });
      
      return await this.findMany({ patient: patientId }, {
        ...options,
        populate: [
          { path: 'doctor', select: 'firstName lastName specialization' },
          { path: 'patient', select: 'firstName lastName email phone' }
        ]
      });
    } catch (error) {
      this.logger.error('Error finding appointments by patient ID:', error);
      throw error;
    }
  }

  /**
   * Finds appointments by doctor ID
   * @param {string} doctorId - Doctor ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Paginated appointments result
   */
  async findByDoctorId(doctorId, options = {}) {
    try {
      this.logger.debug('Finding appointments by doctor ID', { doctorId });
      
      return await this.findMany({ doctor: doctorId }, {
        ...options,
        populate: [
          { path: 'patient', select: 'firstName lastName email phone' },
          { path: 'doctor', select: 'firstName lastName specialization' }
        ]
      });
    } catch (error) {
      this.logger.error('Error finding appointments by doctor ID:', error);
      throw error;
    }
  }

  /**
   * Finds appointments by date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {Object} filters - Additional filters
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Paginated appointments result
   */
  async findByDateRange(startDate, endDate, filters = {}, options = {}) {
    try {
      this.logger.debug('Finding appointments by date range', { startDate, endDate });
      
      const query = {
        ...filters,
        appointmentDate: {
          $gte: startDate,
          $lte: endDate
        }
      };
      
      return await this.findMany(query, {
        ...options,
        populate: [
          { path: 'patient', select: 'firstName lastName email phone' },
          { path: 'doctor', select: 'firstName lastName specialization' }
        ]
      });
    } catch (error) {
      this.logger.error('Error finding appointments by date range:', error);
      throw error;
    }
  }

  /**
   * Finds appointments by status
   * @param {string} status - Appointment status
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Paginated appointments result
   */
  async findByStatus(status, options = {}) {
    try {
      this.logger.debug('Finding appointments by status', { status });
      
      return await this.findMany({ status }, {
        ...options,
        populate: [
          { path: 'patient', select: 'firstName lastName email phone' },
          { path: 'doctor', select: 'firstName lastName specialization' }
        ]
      });
    } catch (error) {
      this.logger.error('Error finding appointments by status:', error);
      throw error;
    }
  }

  /**
   * Creates a new appointment with conflict checking
   * @param {Object} appointmentData - Appointment data
   * @param {Object} options - Creation options
   * @returns {Promise<Object>} Created appointment document
   */
  async createAppointment(appointmentData, options = {}) {
    try {
      this.logger.debug('Creating new appointment', { 
        doctorId: appointmentData.doctor,
        appointmentDate: appointmentData.appointmentDate 
      });
      
      // Check for scheduling conflicts
      await this.checkSchedulingConflicts(
        appointmentData.doctor,
        appointmentData.appointmentDate,
        appointmentData.duration || 30
      );
      
      return await this.create(appointmentData, options);
    } catch (error) {
      this.logger.error('Error creating appointment:', error);
      throw error;
    }
  }

  /**
   * Updates appointment status
   * @param {string} appointmentId - Appointment ID
   * @param {string} status - New status
   * @param {Object} options - Update options
   * @returns {Promise<Object>} Updated appointment document
   */
  async updateStatus(appointmentId, status, options = {}) {
    try {
      this.logger.debug('Updating appointment status', { appointmentId, status });
      
      const updateData = { 
        status,
        updatedAt: new Date()
      };
      
      // Add completion timestamp for completed appointments
      if (status === 'completed') {
        updateData.completedAt = new Date();
      }
      
      return await this.updateById(appointmentId, updateData, options);
    } catch (error) {
      this.logger.error('Error updating appointment status:', error);
      throw error;
    }
  }

  /**
   * Reschedules an appointment
   * @param {string} appointmentId - Appointment ID
   * @param {Date} newDate - New appointment date
   * @param {number} duration - Appointment duration
   * @param {Object} options - Update options
   * @returns {Promise<Object>} Updated appointment document
   */
  async reschedule(appointmentId, newDate, duration = 30, options = {}) {
    try {
      this.logger.debug('Rescheduling appointment', { appointmentId, newDate });
      
      // Get current appointment to check doctor
      const appointment = await this.findById(appointmentId);
      if (!appointment) {
        throw new NotFoundError('Appointment not found');
      }
      
      // Check for conflicts with new date
      await this.checkSchedulingConflicts(appointment.doctor, newDate, duration, appointmentId);
      
      return await this.updateById(appointmentId, {
        appointmentDate: newDate,
        duration,
        status: 'rescheduled',
        updatedAt: new Date()
      }, options);
    } catch (error) {
      this.logger.error('Error rescheduling appointment:', error);
      throw error;
    }
  }

  /**
   * Gets today's appointments for a doctor
   * @param {string} doctorId - Doctor ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Today's appointments
   */
  async getTodayAppointments(doctorId, options = {}) {
    try {
      this.logger.debug('Getting today\'s appointments', { doctorId });
      
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      
      const result = await this.findByDateRange(startOfDay, endOfDay, { doctor: doctorId }, {
        ...options,
        sort: { appointmentDate: 1 }
      });
      
      return result.data;
    } catch (error) {
      this.logger.error('Error getting today\'s appointments:', error);
      throw error;
    }
  }

  /**
   * Gets upcoming appointments for a patient
   * @param {string} patientId - Patient ID
   * @param {number} limit - Number of appointments to return
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Upcoming appointments
   */
  async getUpcomingAppointments(patientId, limit = 10, options = {}) {
    try {
      this.logger.debug('Getting upcoming appointments', { patientId, limit });
      
      const now = new Date();
      const result = await this.findMany({
        patient: patientId,
        appointmentDate: { $gte: now },
        status: { $in: ['scheduled', 'confirmed'] }
      }, {
        ...options,
        limit,
        sort: { appointmentDate: 1 },
        populate: [{ path: 'doctor', select: 'firstName lastName specialization' }]
      });
      
      return result.data;
    } catch (error) {
      this.logger.error('Error getting upcoming appointments:', error);
      throw error;
    }
  }

  /**
   * Gets appointment statistics
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Object>} Appointment statistics
   */
  async getAppointmentStatistics(filters = {}) {
    try {
      this.logger.debug('Getting appointment statistics', { filters });
      
      const stats = await this.aggregate([
        { $match: filters },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$count' },
            statusBreakdown: {
              $push: {
                status: '$_id',
                count: '$count'
              }
            }
          }
        }
      ]);
      
      return stats[0] || { total: 0, statusBreakdown: [] };
    } catch (error) {
      this.logger.error('Error getting appointment statistics:', error);
      throw error;
    }
  }

  /**
   * Checks for scheduling conflicts
   * @param {string} doctorId - Doctor ID
   * @param {Date} appointmentDate - Appointment date
   * @param {number} duration - Appointment duration in minutes
   * @param {string} excludeAppointmentId - Appointment ID to exclude from conflict check
   * @throws {ConflictError} If scheduling conflict exists
   * @private
   */
  async checkSchedulingConflicts(doctorId, appointmentDate, duration, excludeAppointmentId = null) {
    try {
      const startTime = new Date(appointmentDate);
      const endTime = new Date(startTime.getTime() + (duration * 60000));
      
      const query = {
        doctor: doctorId,
        status: { $in: ['scheduled', 'confirmed'] },
        $or: [
          {
            appointmentDate: {
              $gte: startTime,
              $lt: endTime
            }
          },
          {
            $and: [
              { appointmentDate: { $lte: startTime } },
              {
                $expr: {
                  $gte: [
                    { $add: ['$appointmentDate', { $multiply: ['$duration', 60000] }] },
                    startTime
                  ]
                }
              }
            ]
          }
        ]
      };
      
      if (excludeAppointmentId) {
        query._id = { $ne: excludeAppointmentId };
      }
      
      const conflictingAppointment = await this.findOne(query);
      
      if (conflictingAppointment) {
        throw new ConflictError('Doctor is not available at the requested time');
      }
    } catch (error) {
      if (error instanceof ConflictError) {
        throw error;
      }
      this.logger.error('Error checking scheduling conflicts:', error);
      throw new BusinessLogicError('Unable to verify appointment availability');
    }
  }

  /**
   * Gets appointment history for a patient
   * @param {string} patientId - Patient ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Appointment history
   */
  async getAppointmentHistory(patientId, options = {}) {
    try {
      this.logger.debug('Getting appointment history', { patientId });
      
      return await this.findMany({ patient: patientId }, {
        ...options,
        sort: { appointmentDate: -1 },
        populate: [{ path: 'doctor', select: 'firstName lastName specialization' }]
      });
    } catch (error) {
      this.logger.error('Error getting appointment history:', error);
      throw error;
    }
  }

  /**
   * Cancels an appointment
   * @param {string} appointmentId - Appointment ID
   * @param {string} cancellationReason - Reason for cancellation
   * @param {Object} options - Update options
   * @returns {Promise<Object>} Updated appointment document
   */
  async cancelAppointment(appointmentId, cancellationReason, options = {}) {
    try {
      this.logger.debug('Cancelling appointment', { appointmentId, cancellationReason });
      
      return await this.updateById(appointmentId, {
        status: 'cancelled',
        cancellationReason,
        cancelledAt: new Date(),
        updatedAt: new Date()
      }, options);
    } catch (error) {
      this.logger.error('Error cancelling appointment:', error);
      throw error;
    }
  }
}

module.exports = AppointmentRepository;
