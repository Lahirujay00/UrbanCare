const express = require('express');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');
const Report = require('../models/Report');

const router = express.Router();

// @desc    Get dashboard statistics
// @route   GET /api/reports/dashboard
// @access  Private (Manager/Admin)
router.get('/dashboard', auth, authorize('manager', 'admin'), async (req, res) => {
  try {
    // Get total counts
    const totalPatients = await User.countDocuments({ role: 'patient', isActive: true });
    const totalDoctors = await User.countDocuments({ role: 'doctor', isActive: true });
    const totalStaff = await User.countDocuments({ role: 'staff', isActive: true });
    
    // Get today's appointments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const appointmentsToday = await Appointment.countDocuments({
      appointmentDate: { $gte: today, $lt: tomorrow }
    });
    
    // Get total revenue (completed payments)
    const revenueData = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const revenue = revenueData.length > 0 ? revenueData[0].total : 0;
    
    res.json({
      success: true,
      data: {
        totalPatients,
        totalDoctors,
        totalStaff,
        appointmentsToday,
        revenue
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get appointment reports
// @route   GET /api/reports/appointments
// @access  Private (Manager/Admin)
router.get('/appointments', auth, authorize('manager', 'admin'), async (req, res) => {
  try {
    const { startDate, endDate, doctorId, department } = req.query;
    
    // Build query
    let query = {};
    if (startDate && endDate) {
      query.appointmentDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    if (doctorId) query.doctor = doctorId;
    
    const appointments = await Appointment.find(query)
      .populate('patient', 'firstName lastName email')
      .populate('doctor', 'firstName lastName specialization')
      .sort({ appointmentDate: -1 });
    
    // Generate summary statistics
    const summary = {
      totalAppointments: appointments.length,
      completedAppointments: appointments.filter(a => a.status === 'completed').length,
      cancelledAppointments: appointments.filter(a => a.status === 'cancelled').length,
      pendingAppointments: appointments.filter(a => a.status === 'scheduled').length
    };
    
    res.json({
      success: true,
      data: {
        appointments,
        summary
      }
    });
  } catch (error) {
    console.error('Get appointment reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get revenue reports
// @route   GET /api/reports/revenue
// @access  Private (Manager/Admin)
router.get('/revenue', auth, authorize('manager', 'admin'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = { status: 'completed' };
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const payments = await Payment.find(query)
      .populate('appointment', 'appointmentDate consultationFee')
      .populate('patient', 'firstName lastName')
      .sort({ createdAt: -1 });
    
    // Calculate revenue by payment method
    const revenueByMethod = payments.reduce((acc, payment) => {
      acc[payment.paymentMethod] = (acc[payment.paymentMethod] || 0) + payment.amount;
      return acc;
    }, {});
    
    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
    
    res.json({
      success: true,
      data: {
        payments,
        summary: {
          totalRevenue,
          totalTransactions: payments.length,
          revenueByMethod
        }
      }
    });
  } catch (error) {
    console.error('Get revenue reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get user reports
// @route   GET /api/reports/users
// @access  Private (Admin)
router.get('/users', auth, authorize('admin'), async (req, res) => {
  try {
    const { role, startDate, endDate } = req.query;
    
    let query = { isActive: true };
    if (role) query.role = role;
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const users = await User.find(query)
      .select('-password -refreshTokens')
      .sort({ createdAt: -1 });
    
    // Generate summary by role
    const usersByRole = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});
    
    res.json({
      success: true,
      data: {
        users,
        summary: {
          totalUsers: users.length,
          usersByRole
        }
      }
    });
  } catch (error) {
    console.error('Get user reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Export report
// @route   GET /api/reports/export/:type
// @access  Private (Manager/Admin)
router.get('/export/:type', auth, authorize('manager', 'admin'), async (req, res) => {
  try {
    const { type } = req.params;
    const { format = 'json' } = req.query;
    
    // Mock export functionality
    const exportData = {
      type,
      generatedAt: new Date(),
      format,
      message: `${type} report exported as ${format.toUpperCase()}`
    };
    
    if (format === 'json') {
      res.json({
        success: true,
        data: exportData
      });
    } else {
      // For other formats, return a download response
      res.setHeader('Content-Disposition', `attachment; filename="${type}-report.${format}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
      res.send(JSON.stringify(exportData, null, 2));
    }
  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
