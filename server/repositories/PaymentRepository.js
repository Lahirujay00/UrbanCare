/**
 * @fileoverview Payment Repository implementing data access for Payment model
 * @author UrbanCare Development Team
 * @version 1.0.0
 */

const BaseRepository = require('../core/BaseRepository');
const Payment = require('../models/Payment');
const Logger = require('../utils/Logger');
const { BusinessLogicError, ValidationError } = require('../utils/errors');

/**
 * PaymentRepository class handling Payment-specific data operations
 * Extends BaseRepository following Repository pattern
 */
class PaymentRepository extends BaseRepository {
  /**
   * Creates an instance of PaymentRepository
   */
  constructor() {
    super(Payment, Logger.getLogger('PaymentRepository'));
  }

  /**
   * Finds payments by patient ID
   * @param {string} patientId - Patient ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Paginated payments result
   */
  async findByPatientId(patientId, options = {}) {
    try {
      this.logger.debug('Finding payments by patient ID', { patientId });
      
      return await this.findMany({ patient: patientId }, {
        ...options,
        populate: [
          { path: 'patient', select: 'firstName lastName email' },
          { path: 'appointment', select: 'appointmentDate department reasonForVisit' }
        ]
      });
    } catch (error) {
      this.logger.error('Error finding payments by patient ID:', error);
      throw error;
    }
  }

  /**
   * Finds payments by appointment ID
   * @param {string} appointmentId - Appointment ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Paginated payments result
   */
  async findByAppointmentId(appointmentId, options = {}) {
    try {
      this.logger.debug('Finding payments by appointment ID', { appointmentId });
      
      return await this.findMany({ appointment: appointmentId }, {
        ...options,
        populate: [
          { path: 'patient', select: 'firstName lastName email' },
          { path: 'appointment', select: 'appointmentDate department reasonForVisit' }
        ]
      });
    } catch (error) {
      this.logger.error('Error finding payments by appointment ID:', error);
      throw error;
    }
  }

  /**
   * Finds payments by status
   * @param {string} status - Payment status
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Paginated payments result
   */
  async findByStatus(status, options = {}) {
    try {
      this.logger.debug('Finding payments by status', { status });
      
      return await this.findMany({ status }, {
        ...options,
        populate: [
          { path: 'patient', select: 'firstName lastName email' },
          { path: 'appointment', select: 'appointmentDate department reasonForVisit' }
        ]
      });
    } catch (error) {
      this.logger.error('Error finding payments by status:', error);
      throw error;
    }
  }

  /**
   * Finds payments by payment method
   * @param {string} paymentMethod - Payment method
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Paginated payments result
   */
  async findByPaymentMethod(paymentMethod, options = {}) {
    try {
      this.logger.debug('Finding payments by payment method', { paymentMethod });
      
      return await this.findMany({ paymentMethod }, {
        ...options,
        populate: [
          { path: 'patient', select: 'firstName lastName email' },
          { path: 'appointment', select: 'appointmentDate department reasonForVisit' }
        ]
      });
    } catch (error) {
      this.logger.error('Error finding payments by payment method:', error);
      throw error;
    }
  }

  /**
   * Finds payments by date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {Object} filters - Additional filters
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Paginated payments result
   */
  async findByDateRange(startDate, endDate, filters = {}, options = {}) {
    try {
      this.logger.debug('Finding payments by date range', { startDate, endDate });
      
      const query = {
        ...filters,
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      };
      
      return await this.findMany(query, {
        ...options,
        populate: [
          { path: 'patient', select: 'firstName lastName email' },
          { path: 'appointment', select: 'appointmentDate department reasonForVisit' }
        ]
      });
    } catch (error) {
      this.logger.error('Error finding payments by date range:', error);
      throw error;
    }
  }

  /**
   * Creates a new payment with validation
   * @param {Object} paymentData - Payment data
   * @param {Object} options - Creation options
   * @returns {Promise<Object>} Created payment document
   */
  async createPayment(paymentData, options = {}) {
    try {
      this.logger.debug('Creating new payment', { 
        appointmentId: paymentData.appointment,
        amount: paymentData.amount 
      });
      
      // Validate payment amount
      if (paymentData.amount <= 0) {
        throw new ValidationError('Payment amount must be greater than zero');
      }
      
      // Check for duplicate payments for the same appointment
      if (paymentData.appointment) {
        const existingPayment = await this.findOne({
          appointment: paymentData.appointment,
          status: { $in: ['completed', 'pending'] }
        });
        
        if (existingPayment) {
          throw new BusinessLogicError('Payment already exists for this appointment');
        }
      }
      
      return await this.create(paymentData, options);
    } catch (error) {
      this.logger.error('Error creating payment:', error);
      throw error;
    }
  }

  /**
   * Updates payment status
   * @param {string} paymentId - Payment ID
   * @param {string} status - New status
   * @param {Object} additionalData - Additional data to update
   * @param {Object} options - Update options
   * @returns {Promise<Object>} Updated payment document
   */
  async updateStatus(paymentId, status, additionalData = {}, options = {}) {
    try {
      this.logger.debug('Updating payment status', { paymentId, status });
      
      const updateData = {
        status,
        updatedAt: new Date(),
        ...additionalData
      };
      
      // Add completion timestamp for completed payments
      if (status === 'completed') {
        updateData.completedAt = new Date();
      }
      
      // Add failure timestamp and reason for failed payments
      if (status === 'failed') {
        updateData.failedAt = new Date();
      }
      
      return await this.updateById(paymentId, updateData, options);
    } catch (error) {
      this.logger.error('Error updating payment status:', error);
      throw error;
    }
  }

  /**
   * Processes a refund for a payment
   * @param {string} paymentId - Payment ID
   * @param {number} refundAmount - Refund amount
   * @param {string} refundReason - Reason for refund
   * @param {Object} options - Update options
   * @returns {Promise<Object>} Updated payment document
   */
  async processRefund(paymentId, refundAmount, refundReason, options = {}) {
    try {
      this.logger.debug('Processing refund', { paymentId, refundAmount, refundReason });
      
      const payment = await this.findById(paymentId);
      if (!payment) {
        throw new NotFoundError('Payment not found');
      }
      
      if (payment.status !== 'completed') {
        throw new BusinessLogicError('Can only refund completed payments');
      }
      
      if (refundAmount > payment.amount) {
        throw new ValidationError('Refund amount cannot exceed payment amount');
      }
      
      const updateData = {
        status: 'refunded',
        refundAmount,
        refundReason,
        refundedAt: new Date(),
        updatedAt: new Date()
      };
      
      return await this.updateById(paymentId, updateData, options);
    } catch (error) {
      this.logger.error('Error processing refund:', error);
      throw error;
    }
  }

  /**
   * Gets payment statistics
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Object>} Payment statistics
   */
  async getPaymentStatistics(filters = {}) {
    try {
      this.logger.debug('Getting payment statistics', { filters });
      
      const stats = await this.aggregate([
        { $match: filters },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            totalPayments: { $sum: 1 },
            completedAmount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0]
              }
            },
            completedCount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
              }
            },
            pendingAmount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0]
              }
            },
            pendingCount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'pending'] }, 1, 0]
              }
            },
            refundedAmount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'refunded'] }, '$refundAmount', 0]
              }
            },
            refundedCount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'refunded'] }, 1, 0]
              }
            }
          }
        }
      ]);
      
      return stats[0] || {
        totalAmount: 0,
        totalPayments: 0,
        completedAmount: 0,
        completedCount: 0,
        pendingAmount: 0,
        pendingCount: 0,
        refundedAmount: 0,
        refundedCount: 0
      };
    } catch (error) {
      this.logger.error('Error getting payment statistics:', error);
      throw error;
    }
  }

  /**
   * Gets revenue by payment method
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Array>} Revenue breakdown by payment method
   */
  async getRevenueByPaymentMethod(filters = {}) {
    try {
      this.logger.debug('Getting revenue by payment method', { filters });
      
      const revenue = await this.aggregate([
        { $match: { ...filters, status: 'completed' } },
        {
          $group: {
            _id: '$paymentMethod',
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            paymentMethod: '$_id',
            totalAmount: 1,
            count: 1,
            _id: 0
          }
        },
        { $sort: { totalAmount: -1 } }
      ]);
      
      return revenue;
    } catch (error) {
      this.logger.error('Error getting revenue by payment method:', error);
      throw error;
    }
  }

  /**
   * Gets daily revenue for a date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {Object} filters - Additional filters
   * @returns {Promise<Array>} Daily revenue data
   */
  async getDailyRevenue(startDate, endDate, filters = {}) {
    try {
      this.logger.debug('Getting daily revenue', { startDate, endDate });
      
      const revenue = await this.aggregate([
        {
          $match: {
            ...filters,
            status: 'completed',
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            date: {
              $dateFromParts: {
                year: '$_id.year',
                month: '$_id.month',
                day: '$_id.day'
              }
            },
            totalAmount: 1,
            count: 1,
            _id: 0
          }
        },
        { $sort: { date: 1 } }
      ]);
      
      return revenue;
    } catch (error) {
      this.logger.error('Error getting daily revenue:', error);
      throw error;
    }
  }

  /**
   * Gets pending payments older than specified days
   * @param {number} days - Number of days
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Overdue pending payments
   */
  async getOverduePendingPayments(days = 30, options = {}) {
    try {
      this.logger.debug('Getting overdue pending payments', { days });
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const result = await this.findMany({
        status: 'pending',
        createdAt: { $lte: cutoffDate }
      }, {
        ...options,
        populate: [
          { path: 'patient', select: 'firstName lastName email phone' },
          { path: 'appointment', select: 'appointmentDate department' }
        ]
      });
      
      return result.data;
    } catch (error) {
      this.logger.error('Error getting overdue pending payments:', error);
      throw error;
    }
  }

  /**
   * Gets recent payments
   * @param {number} limit - Number of payments to return
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Recent payments
   */
  async getRecentPayments(limit = 10, options = {}) {
    try {
      this.logger.debug('Getting recent payments', { limit });
      
      const result = await this.findMany({}, {
        ...options,
        limit,
        sort: { createdAt: -1 },
        populate: [
          { path: 'patient', select: 'firstName lastName email' },
          { path: 'appointment', select: 'appointmentDate department' }
        ]
      });
      
      return result.data;
    } catch (error) {
      this.logger.error('Error getting recent payments:', error);
      throw error;
    }
  }
}

module.exports = PaymentRepository;
