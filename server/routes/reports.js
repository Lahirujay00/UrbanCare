const express = require('express');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');

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

module.exports = router;
