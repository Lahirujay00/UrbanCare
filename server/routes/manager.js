/**
 * @fileoverview Manager routes with enhanced validation and documentation
 * @author UrbanCare Development Team
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();
const managerController = require('../controllers/ManagerController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const ValidationHelper = require('../utils/ValidationHelper');
const Logger = require('../utils/Logger');

const logger = Logger.getLogger('ManagerRoutes');

// @desc    Get dashboard overview statistics
// @route   GET /api/manager/dashboard/overview
// @access  Private (Manager only)
// @validation None required
router.get('/dashboard/overview', 
  auth, 
  authorize('manager'), 
  managerController.getDashboardOverview.bind(managerController)
);

// @desc    Get patient visit report
// @route   GET /api/manager/reports/patient-visits
// @access  Private (Manager, Staff)
// @validation Date range and filter parameters
router.get('/reports/patient-visits', 
  auth, 
  authorize('manager', 'staff'),
  ValidationHelper.validateDateRange(),
  managerController.getPatientVisitReport.bind(managerController)
);

// @desc    Get staff utilization report
// @route   GET /api/manager/reports/staff-utilization
// @access  Private (Manager, Staff)
// @validation Date range parameters
router.get('/reports/staff-utilization', 
  auth, 
  authorize('manager', 'staff'),
  ValidationHelper.validateDateRange(),
  managerController.getStaffUtilizationReport.bind(managerController)
);

// @desc    Get financial summary report
// @route   GET /api/manager/reports/financial-summary
// @access  Private (Manager, Staff)
// @validation Date range and payment filter parameters
router.get('/reports/financial-summary', 
  auth, 
  authorize('manager', 'staff'),
  ValidationHelper.validateDateRange(),
  managerController.getFinancialSummaryReport.bind(managerController)
);

// Error handling middleware for manager routes
router.use((error, req, res, next) => {
  logger.error('Manager route error:', {
    error: error.message,
    stack: error.stack,
    method: req.method,
    url: req.originalUrl,
    userId: req.user?.id
  });
  next(error);
});

module.exports = router;
