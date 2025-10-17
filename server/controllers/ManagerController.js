/**
 * @fileoverview Manager Controller implementing manager-specific endpoints
 * @author UrbanCare Development Team
 * @version 1.0.0
 */

const BaseController = require('../core/BaseController');
const ManagerService = require('../services/ManagerService');
const UserRepository = require('../repositories/UserRepository');
const AppointmentRepository = require('../repositories/AppointmentRepository');
const PaymentRepository = require('../repositories/PaymentRepository');
const ValidationHelper = require('../utils/ValidationHelper');
const Logger = require('../utils/Logger');

/**
 * ManagerController class handling manager-specific HTTP requests
 * Extends BaseController following SOLID principles
 */
class ManagerController extends BaseController {
  /**
   * Creates an instance of ManagerController
   */
  constructor() {
    // Initialize repositories
    const userRepository = new UserRepository();
    const appointmentRepository = new AppointmentRepository();
    const paymentRepository = new PaymentRepository();
    
    // Initialize service with dependency injection
    const managerService = new ManagerService(
      userRepository,
      appointmentRepository,
      paymentRepository
    );
    
    super(managerService, Logger.getLogger('ManagerController'));
  }
  /**
   * Gets dashboard overview statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getDashboardOverview(req, res) {
    await this.handleAsync(async (req, res) => {
      this.logAction('getDashboardOverview', req);
      
      const dashboardData = await this.service.getDashboardOverview();
      
      this.sendSuccess(res, dashboardData, 'Dashboard overview retrieved successfully');
    }, req, res);
  }

  /**
   * Generates patient visit report
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getPatientVisitReport(req, res) {
    await this.handleAsync(async (req, res) => {
      this.logAction('getPatientVisitReport', req, { filters: req.query });
      
      const filters = this.buildFilters(req, ['startDate', 'endDate', 'department', 'status']);
      const reportData = await this.service.generatePatientVisitReport(filters);
      
      this.sendSuccess(res, reportData, 'Patient visit report generated successfully');
    }, req, res);
  }

  /**
   * Generates staff utilization report
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getStaffUtilizationReport(req, res) {
    await this.handleAsync(async (req, res) => {
      this.logAction('getStaffUtilizationReport', req, { filters: req.query });
      
      const filters = this.buildFilters(req, ['startDate', 'endDate', 'department']);
      const reportData = await this.service.generateStaffUtilizationReport(filters);
      
      this.sendSuccess(res, reportData, 'Staff utilization report generated successfully');
    }, req, res);
  }

  /**
   * Generates financial summary report
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getFinancialSummaryReport(req, res) {
    await this.handleAsync(async (req, res) => {
      this.logAction('getFinancialSummaryReport', req, { filters: req.query });
      
      const filters = this.buildFilters(req, ['startDate', 'endDate', 'paymentMethod', 'status']);
      const reportData = await this.service.generateFinancialSummaryReport(filters);
      
      this.sendSuccess(res, reportData, 'Financial summary report generated successfully');
    }, req, res);
  }
  
  /**
   * Gets resource name for base controller
   * @returns {string} Resource name
   */
  getResourceName() {
    return 'Manager';
  }
}

// Export singleton instance
module.exports = new ManagerController();
