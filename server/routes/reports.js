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
// @access  Private (Manager)
router.get('/dashboard', auth, authorize('manager'), async (req, res) => {
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
    
    // Get total revenue from consultation fees (paid appointments)
    const revenueData = await Appointment.aggregate([
      { 
        $match: { 
          paymentStatus: { $in: ['paid', 'pay-at-hospital'] }
        } 
      },
      { 
        $group: { 
          _id: null, 
          total: { $sum: '$consultationFee' } 
        } 
      }
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
    
    let query = { paymentStatus: { $in: ['paid', 'pay-at-hospital'] } };
    if (startDate && endDate) {
      query.appointmentDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const appointments = await Appointment.find(query)
      .populate('patient', 'firstName lastName')
      .populate('doctor', 'firstName lastName')
      .sort({ appointmentDate: -1 });
    
    // Calculate revenue by payment method
    const revenueByMethod = appointments.reduce((acc, appointment) => {
      const method = appointment.paymentMethod || 'not-specified';
      acc[method] = (acc[method] || 0) + (appointment.consultationFee || 0);
      return acc;
    }, {});
    
    const totalRevenue = appointments.reduce((sum, appointment) => sum + (appointment.consultationFee || 0), 0);
    
    res.json({
      success: true,
      data: {
        appointments,
        summary: {
          totalRevenue,
          totalTransactions: appointments.length,
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

// @desc    Generate report preview
// @route   GET /api/reports/generate/:reportType
// @access  Private (Manager)
router.get('/generate/:reportType', auth, authorize('manager'), async (req, res) => {
  try {
    const { reportType } = req.params;
    const { startDate, endDate, department, staffRole } = req.query;

    const filters = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    let data;
    switch (reportType) {
      case 'patient-visit':
        // Get patient visit data
        data = await Appointment.find(filters)
          .populate('patient', 'firstName lastName email')
          .populate('doctor', 'firstName lastName')
          .select('appointmentDate status reasonForVisit');
        break;

      case 'staff-utilization':
        // Get staff utilization data
        const staffFilters = { role: staffRole || { $in: ['doctor', 'staff'] }, isActive: true };
        const staff = await User.find(staffFilters).select('firstName lastName role');
        
        const staffData = await Promise.all(staff.map(async (member) => {
          const appointments = await Appointment.countDocuments({
            doctor: member._id,
            appointmentDate: filters.createdAt
          });
          return {
            staff: `${member.firstName} ${member.lastName}`,
            role: member.role,
            appointments
          };
        }));
        data = staffData;
        break;

      case 'weekly-summary':
        // Get weekly summary
        const weeklyAppointments = await Appointment.countDocuments(filters);
        
        // Calculate revenue from consultation fees
        const weeklyRevenueData = await Appointment.aggregate([
          { 
            $match: { 
              createdAt: filters.createdAt,
              paymentStatus: { $in: ['paid', 'pay-at-hospital'] }
            } 
          },
          { 
            $group: { 
              _id: null, 
              total: { $sum: '$consultationFee' } 
            } 
          }
        ]);
        
        data = {
          appointments: weeklyAppointments,
          revenue: weeklyRevenueData[0]?.total || 0
        };
        break;

      case 'monthly-billing':
        // Get monthly billing data
        const billingData = await Payment.find({
          ...filters,
          status: 'completed'
        })
          .populate('patient', 'firstName lastName')
          .populate('appointment')
          .select('amount paymentMethod createdAt');
        data = billingData;
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid report type'
        });
    }

    res.json({
      success: true,
      data: {
        reportType,
        dateRange: { startDate, endDate },
        totalRecords: Array.isArray(data) ? data.length : 1,
        preview: data
      }
    });
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Download report as PDF
// @route   GET /api/reports/download/:reportType
// @access  Private (Manager)
router.get('/download/:reportType', auth, authorize('manager'), async (req, res) => {
  try {
    const { reportType } = req.params;
    const { startDate, endDate } = req.query;

    // For now, return a simple text response
    // In production, you would use a PDF library like pdfkit or puppeteer
    const reportContent = `UrbanCare Healthcare Report
Report Type: ${reportType}
Date Range: ${startDate} to ${endDate}
Generated: ${new Date().toLocaleString()}

This is a placeholder for PDF generation.
Implement with pdfkit or similar library.`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${reportType}-report.pdf"`);
    res.send(Buffer.from(reportContent));
  } catch (error) {
    console.error('Download report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Log report generation event
// @route   POST /api/reports/log
// @access  Private (Manager)
router.post('/log', auth, authorize('manager'), async (req, res) => {
  try {
    const { reportType, dateRange, filters, generatedBy } = req.body;

    const report = await Report.create({
      title: `${reportType} Report`,
      type: reportType,
      generatedBy: req.user.id,
      dateRange,
      filters,
      status: 'completed'
    });

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Log report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
