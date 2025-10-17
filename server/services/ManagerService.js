/**
 * @fileoverview Manager Service implementing business logic for manager operations
 * @author UrbanCare Development Team
 * @version 1.0.0
 */

const BaseService = require('../core/BaseService');
const Logger = require('../utils/Logger');
const { BusinessLogicError, ValidationError } = require('../utils/errors');

/**
 * ManagerService class handling manager-specific business logic
 * Extends BaseService following SOLID principles
 */
class ManagerService extends BaseService {
  /**
   * Creates an instance of ManagerService
   * @param {Object} userRepository - User repository instance
   * @param {Object} appointmentRepository - Appointment repository instance
   * @param {Object} paymentRepository - Payment repository instance
   */
  constructor(userRepository, appointmentRepository, paymentRepository) {
    super(null, Logger.getLogger('ManagerService'));
    this.userRepository = userRepository;
    this.appointmentRepository = appointmentRepository;
    this.paymentRepository = paymentRepository;
  }

  /**
   * Gets comprehensive dashboard overview statistics
   * @returns {Promise<Object>} Dashboard statistics
   */
  async getDashboardOverview() {
    try {
      this.logger.info('Fetching dashboard overview statistics');

      // Get current date for today's calculations
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      // Execute parallel queries for better performance
      const [
        totalUsers,
        totalDoctors,
        todayAppointments,
        pendingAppointments,
        completedAppointments,
        recentAppointments,
        totalRevenue,
        recentPayments
      ] = await Promise.all([
        this.userRepository.count({ role: 'patient' }),
        this.userRepository.count({ role: 'doctor' }),
        this.appointmentRepository.count({
          appointmentDate: { $gte: startOfDay, $lt: endOfDay }
        }),
        this.appointmentRepository.count({
          status: { $in: ['scheduled', 'confirmed'] }
        }),
        this.appointmentRepository.count({ status: 'completed' }),
        this.appointmentRepository.findMany(
          {},
          {
            limit: 5,
            sort: { createdAt: -1 },
            populate: [
              { path: 'patient', select: 'firstName lastName email' },
              { path: 'doctor', select: 'firstName lastName specialization' }
            ]
          }
        ),
        this.calculateTotalRevenue(),
        this.paymentRepository.findMany(
          { status: 'completed' },
          {
            limit: 5,
            sort: { createdAt: -1 },
            populate: [{ path: 'patient', select: 'firstName lastName email' }]
          }
        )
      ]);

      const dashboardData = {
        totalUsers,
        totalDoctors,
        todayAppointments,
        pendingAppointments,
        completedAppointments,
        totalRevenue,
        recentAppointments: recentAppointments.data,
        recentPayments: recentPayments.data
      };

      this.logger.info('Dashboard overview statistics fetched successfully', {
        totalUsers,
        totalDoctors,
        todayAppointments
      });

      // Emit business event for audit
      this.emit('dashboardAccessed', { statistics: dashboardData });

      return dashboardData;
    } catch (error) {
      this.logger.error('Error fetching dashboard overview:', error);
      throw this.handleServiceError(error);
    }
  }

  /**
   * Generates patient visit report with analytics
   * @param {Object} filters - Report filters
   * @returns {Promise<Object>} Patient visit report data
   */
  async generatePatientVisitReport(filters = {}) {
    try {
      this.logger.info('Generating patient visit report', { filters });

      const { startDate, endDate, department, status } = filters;

      // Build query filters
      const query = {};
      if (startDate && endDate) {
        query.appointmentDate = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }
      if (department) query.department = department;
      if (status) query.status = status;

      // Fetch appointments with populated data
      const appointmentsResult = await this.appointmentRepository.findMany(query, {
        sort: { appointmentDate: -1 },
        populate: [
          { path: 'patient', select: 'firstName lastName email phone' },
          { path: 'doctor', select: 'firstName lastName specialization' }
        ]
      });

      const appointments = appointmentsResult.data;

      // Generate analytics
      const analytics = this.generateVisitAnalytics(appointments);

      const reportData = {
        appointments,
        analytics,
        summary: {
          totalRecords: appointments.length,
          dateRange: { startDate, endDate },
          filters: { department, status }
        }
      };

      this.logger.info('Patient visit report generated successfully', {
        totalRecords: appointments.length
      });

      // Emit business event
      this.emit('reportGenerated', {
        type: 'patient-visit',
        recordCount: appointments.length,
        filters
      });

      return reportData;
    } catch (error) {
      this.logger.error('Error generating patient visit report:', error);
      throw this.handleServiceError(error);
    }
  }

  /**
   * Generates staff utilization report
   * @param {Object} filters - Report filters
   * @returns {Promise<Object>} Staff utilization report data
   */
  async generateStaffUtilizationReport(filters = {}) {
    try {
      this.logger.info('Generating staff utilization report', { filters });

      const { startDate, endDate, department } = filters;

      // Build queries
      const appointmentQuery = {};
      if (startDate && endDate) {
        appointmentQuery.appointmentDate = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }
      if (department) appointmentQuery.department = department;

      const doctorQuery = { role: 'doctor' };
      if (department) doctorQuery.specialization = department;

      // Fetch data in parallel
      const [doctorsResult, appointmentsResult] = await Promise.all([
        this.userRepository.findMany(doctorQuery),
        this.appointmentRepository.findMany(appointmentQuery, {
          populate: [{ path: 'doctor', select: 'firstName lastName specialization' }]
        })
      ]);

      const doctors = doctorsResult.data;
      const appointments = appointmentsResult.data;

      // Calculate utilization metrics
      const staffUtilization = this.calculateStaffUtilization(doctors, appointments);
      const summary = this.calculateUtilizationSummary(staffUtilization);

      const reportData = {
        staffUtilization,
        summary: {
          ...summary,
          totalRecords: staffUtilization.length,
          dateRange: { startDate, endDate },
          filters: { department }
        }
      };

      this.logger.info('Staff utilization report generated successfully', {
        totalStaff: doctors.length
      });

      // Emit business event
      this.emit('reportGenerated', {
        type: 'staff-utilization',
        staffCount: doctors.length,
        filters
      });

      return reportData;
    } catch (error) {
      this.logger.error('Error generating staff utilization report:', error);
      throw this.handleServiceError(error);
    }
  }

  /**
   * Generates financial summary report
   * @param {Object} filters - Report filters
   * @returns {Promise<Object>} Financial summary report data
   */
  async generateFinancialSummaryReport(filters = {}) {
    try {
      this.logger.info('Generating financial summary report', { filters });

      const { startDate, endDate, paymentMethod, status } = filters;

      // Build query
      const query = {};
      if (startDate && endDate) {
        query.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }
      if (paymentMethod) query.paymentMethod = paymentMethod;
      if (status) query.status = status;

      // Fetch payments with populated data
      const paymentsResult = await this.paymentRepository.findMany(query, {
        sort: { createdAt: -1 },
        populate: [
          { path: 'patient', select: 'firstName lastName email' },
          { path: 'appointment', select: 'department reasonForVisit' }
        ]
      });

      const payments = paymentsResult.data;

      // Generate financial analytics
      const analytics = this.generateFinancialAnalytics(payments);

      const reportData = {
        transactions: payments,
        analytics,
        summary: {
          totalRecords: payments.length,
          totalRevenue: analytics.totalRevenue,
          dateRange: { startDate, endDate },
          filters: { paymentMethod, status }
        }
      };

      this.logger.info('Financial summary report generated successfully', {
        totalTransactions: payments.length,
        totalRevenue: analytics.totalRevenue
      });

      // Emit business event
      this.emit('reportGenerated', {
        type: 'financial-summary',
        transactionCount: payments.length,
        totalRevenue: analytics.totalRevenue,
        filters
      });

      return reportData;
    } catch (error) {
      this.logger.error('Error generating financial summary report:', error);
      throw this.handleServiceError(error);
    }
  }

  /**
   * Calculates total revenue from completed payments
   * @returns {Promise<number>} Total revenue amount
   * @private
   */
  async calculateTotalRevenue() {
    try {
      const result = await this.paymentRepository.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      return result.length > 0 ? result[0].total : 0;
    } catch (error) {
      this.logger.error('Error calculating total revenue:', error);
      return 0;
    }
  }

  /**
   * Generates analytics for patient visits
   * @param {Array} appointments - Array of appointments
   * @returns {Object} Visit analytics
   * @private
   */
  generateVisitAnalytics(appointments) {
    const analytics = {
      totalVisits: appointments.length,
      dailyBreakdown: {},
      departmentBreakdown: {},
      statusBreakdown: {},
      doctorBreakdown: {}
    };

    appointments.forEach(appointment => {
      // Daily breakdown
      const date = appointment.appointmentDate.toISOString().split('T')[0];
      analytics.dailyBreakdown[date] = (analytics.dailyBreakdown[date] || 0) + 1;

      // Department breakdown
      const dept = appointment.department || 'General';
      analytics.departmentBreakdown[dept] = (analytics.departmentBreakdown[dept] || 0) + 1;

      // Status breakdown
      analytics.statusBreakdown[appointment.status] = 
        (analytics.statusBreakdown[appointment.status] || 0) + 1;

      // Doctor breakdown
      if (appointment.doctor) {
        const doctorName = `${appointment.doctor.firstName} ${appointment.doctor.lastName}`;
        analytics.doctorBreakdown[doctorName] = 
          (analytics.doctorBreakdown[doctorName] || 0) + 1;
      }
    });

    return analytics;
  }

  /**
   * Calculates staff utilization metrics
   * @param {Array} doctors - Array of doctors
   * @param {Array} appointments - Array of appointments
   * @returns {Array} Staff utilization data
   * @private
   */
  calculateStaffUtilization(doctors, appointments) {
    return doctors.map(doctor => {
      const doctorAppointments = appointments.filter(apt => 
        apt.doctor && apt.doctor._id.toString() === doctor._id.toString()
      );

      const completedAppointments = doctorAppointments.filter(apt => 
        apt.status === 'completed'
      );

      const completionRate = doctorAppointments.length > 0 
        ? Math.round((completedAppointments.length / doctorAppointments.length) * 100)
        : 0;

      const utilizationRate = Math.min(
        Math.round((doctorAppointments.length / 40) * 100), 
        100
      ); // Assuming 40 appointments per period is 100%

      return {
        doctorId: doctor._id,
        name: `${doctor.firstName} ${doctor.lastName}`,
        specialization: doctor.specialization,
        totalAppointments: doctorAppointments.length,
        completedAppointments: completedAppointments.length,
        completionRate,
        utilizationRate
      };
    });
  }

  /**
   * Calculates utilization summary statistics
   * @param {Array} staffUtilization - Staff utilization data
   * @returns {Object} Summary statistics
   * @private
   */
  calculateUtilizationSummary(staffUtilization) {
    if (staffUtilization.length === 0) {
      return {
        totalStaff: 0,
        averageUtilization: 0,
        averageCompletion: 0
      };
    }

    const totalStaff = staffUtilization.length;
    const averageUtilization = Math.round(
      staffUtilization.reduce((sum, staff) => sum + staff.utilizationRate, 0) / totalStaff
    );
    const averageCompletion = Math.round(
      staffUtilization.reduce((sum, staff) => sum + staff.completionRate, 0) / totalStaff
    );

    return {
      totalStaff,
      averageUtilization,
      averageCompletion
    };
  }

  /**
   * Generates financial analytics
   * @param {Array} payments - Array of payments
   * @returns {Object} Financial analytics
   * @private
   */
  generateFinancialAnalytics(payments) {
    const analytics = {
      totalRevenue: 0,
      totalTransactions: payments.length,
      paymentMethodBreakdown: {},
      dailyRevenue: {},
      departmentRevenue: {},
      averageTransaction: 0
    };

    payments.forEach(payment => {
      // Total revenue (only completed payments)
      if (payment.status === 'completed') {
        analytics.totalRevenue += payment.amount || 0;
      }

      // Payment method breakdown
      const method = payment.paymentMethod || 'Unknown';
      analytics.paymentMethodBreakdown[method] = 
        (analytics.paymentMethodBreakdown[method] || 0) + (payment.amount || 0);

      // Daily revenue (only completed payments)
      if (payment.status === 'completed') {
        const date = payment.createdAt.toISOString().split('T')[0];
        analytics.dailyRevenue[date] = (analytics.dailyRevenue[date] || 0) + (payment.amount || 0);
      }

      // Department revenue
      if (payment.appointment && payment.status === 'completed') {
        const dept = payment.appointment.department || 'General';
        analytics.departmentRevenue[dept] = 
          (analytics.departmentRevenue[dept] || 0) + (payment.amount || 0);
      }
    });

    // Calculate average transaction
    const completedPayments = payments.filter(p => p.status === 'completed');
    analytics.averageTransaction = completedPayments.length > 0 
      ? Math.round((analytics.totalRevenue / completedPayments.length) * 100) / 100
      : 0;

    return analytics;
  }

  /**
   * Gets resource name for base service
   * @returns {string} Resource name
   */
  getResourceName() {
    return 'Manager';
  }
}

module.exports = ManagerService;
