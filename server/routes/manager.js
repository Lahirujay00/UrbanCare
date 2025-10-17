const express = require('express');
const router = express.Router();
const ManagerController = require('../controllers/ManagerController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// @desc    Get dashboard overview statistics
// @route   GET /api/manager/dashboard/overview
// @access  Private (Manager only)
router.get('/dashboard/overview', auth, authorize('manager'), ManagerController.getDashboardOverview);

// @desc    Get patient visit report
// @route   GET /api/manager/reports/patient-visits
// @access  Private (Manager, Staff)
router.get('/reports/patient-visits', auth, authorize('manager', 'staff'), ManagerController.getPatientVisitReport);

// @desc    Get staff utilization report
// @route   GET /api/manager/reports/staff-utilization
// @access  Private (Manager, Staff)
router.get('/reports/staff-utilization', auth, authorize('manager', 'staff'), ManagerController.getStaffUtilizationReport);

// @desc    Get financial summary report
// @route   GET /api/manager/reports/financial-summary
// @access  Private (Manager, Staff)
router.get('/reports/financial-summary', auth, authorize('manager', 'staff'), ManagerController.getFinancialSummaryReport);

module.exports = router;
