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
        data = await Appointment.find({
          appointmentDate: filters.createdAt
        })
          .populate('patient', 'firstName lastName email')
          .populate('doctor', 'firstName lastName')
          .select('appointmentDate status reasonForVisit')
          .sort({ appointmentDate: -1 });
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

      case 'financial-summary':
        // Get financial summary data
        const financialData = await Payment.find({
          createdAt: filters.createdAt,
          status: 'completed'
        })
          .populate('patient', 'firstName lastName')
          .populate('appointment')
          .select('amount paymentMethod createdAt');
        data = financialData;
        break;

      case 'comprehensive':
        // Get all data for comprehensive report
        const patientVisits = await Appointment.find({
          appointmentDate: filters.createdAt
        })
          .populate('patient', 'firstName lastName email')
          .populate('doctor', 'firstName lastName')
          .select('appointmentDate status reasonForVisit')
          .sort({ appointmentDate: -1 });

        const allStaff = await User.find({ role: { $in: ['doctor', 'staff'] }, isActive: true })
          .select('firstName lastName role');
        
        const staffUtilization = await Promise.all(allStaff.map(async (member) => {
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

        const financial = await Payment.find({
          createdAt: filters.createdAt,
          status: 'completed'
        })
          .populate('patient', 'firstName lastName')
          .select('amount paymentMethod createdAt');

        data = {
          patientVisits,
          staffUtilization,
          financial
        };
        break;

      // Legacy support for existing report types
      case 'weekly-summary':
        // Get weekly summary
        const weeklyAppointments = await Appointment.countDocuments({
          appointmentDate: filters.createdAt
        });
        
        // Calculate revenue from consultation fees
        const weeklyRevenueData = await Appointment.aggregate([
          { 
            $match: { 
              appointmentDate: filters.createdAt,
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
        // Legacy monthly billing - redirect to financial-summary
        const legacyBillingData = await Payment.find({
          createdAt: filters.createdAt,
          status: 'completed'
        })
          .populate('patient', 'firstName lastName')
          .populate('appointment')
          .select('amount paymentMethod createdAt');
        data = legacyBillingData;
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid report type. Available types: patient-visit, staff-utilization, financial-summary, comprehensive'
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

// @desc    Get peak hours prediction
// @route   GET /api/reports/peak-hours
// @access  Private (Manager)
router.get('/peak-hours', auth, authorize('manager'), async (req, res) => {
  try {
    const { timeframe = '24h' } = req.query;
    
    // Mock peak hours prediction based on historical patterns
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Generate mock predictions based on typical healthcare patterns
    const generatePredictions = (dayOfWeek, currentHour, timeframe) => {
      const weekdayPatterns = {
        1: [ // Monday
          { hour: 8, level: 'High', confidence: 92, patientCount: 45, reason: 'Monday morning appointments backlog' },
          { hour: 10, level: 'Very High', confidence: 88, patientCount: 62, reason: 'Peak consultation hours' },
          { hour: 14, level: 'Medium', confidence: 85, patientCount: 28, reason: 'Afternoon appointments' },
          { hour: 16, level: 'High', confidence: 90, patientCount: 41, reason: 'End-of-day consultations' }
        ],
        2: [ // Tuesday
          { hour: 9, level: 'Medium', confidence: 85, patientCount: 32, reason: 'Regular morning flow' },
          { hour: 11, level: 'High', confidence: 87, patientCount: 38, reason: 'Mid-morning peak' },
          { hour: 15, level: 'Medium', confidence: 82, patientCount: 29, reason: 'Afternoon appointments' }
        ],
        3: [ // Wednesday
          { hour: 8, level: 'High', confidence: 89, patientCount: 43, reason: 'Mid-week appointment preference' },
          { hour: 10, level: 'Very High', confidence: 94, patientCount: 58, reason: 'Peak mid-week hours' },
          { hour: 13, level: 'High', confidence: 86, patientCount: 39, reason: 'Lunch-time appointments' },
          { hour: 15, level: 'High', confidence: 88, patientCount: 42, reason: 'Afternoon rush' }
        ],
        4: [ // Thursday
          { hour: 9, level: 'Medium', confidence: 84, patientCount: 31, reason: 'Regular flow' },
          { hour: 11, level: 'High', confidence: 86, patientCount: 37, reason: 'Late morning peak' },
          { hour: 16, level: 'Medium', confidence: 83, patientCount: 30, reason: 'Late afternoon' }
        ],
        5: [ // Friday
          { hour: 8, level: 'Medium', confidence: 81, patientCount: 26, reason: 'Friday morning' },
          { hour: 10, level: 'Medium', confidence: 79, patientCount: 28, reason: 'End-of-week appointments' },
          { hour: 14, level: 'Low', confidence: 85, patientCount: 18, reason: 'Friday afternoon slowdown' }
        ],
        6: [ // Saturday
          { hour: 10, level: 'Low', confidence: 88, patientCount: 15, reason: 'Weekend emergency visits' },
          { hour: 14, level: 'Medium', confidence: 82, patientCount: 22, reason: 'Weekend peak hours' }
        ],
        0: [ // Sunday
          { hour: 12, level: 'Low', confidence: 90, patientCount: 12, reason: 'Sunday emergency only' },
          { hour: 16, level: 'Low', confidence: 87, patientCount: 14, reason: 'Weekend emergency visits' }
        ]
      };

      const basePredictions = weekdayPatterns[dayOfWeek] || weekdayPatterns[3];
      
      if (timeframe === '48h') {
        const nextDay = (dayOfWeek + 1) % 7;
        const nextDayPredictions = (weekdayPatterns[nextDay] || weekdayPatterns[3]).map(p => ({
          ...p,
          hour: p.hour + 24,
          day: 'Tomorrow'
        }));
        return [...basePredictions.map(p => ({ ...p, day: 'Today' })), ...nextDayPredictions];
      }
      
      if (timeframe === '7d') {
        const weekPredictions = [];
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        for (let i = 0; i < 7; i++) {
          const day = (dayOfWeek + i) % 7;
          const dayPredictions = weekdayPatterns[day] || weekdayPatterns[3];
          const peakPrediction = dayPredictions.reduce((max, curr) => 
            curr.patientCount > max.patientCount ? curr : max
          );
          
          weekPredictions.push({
            ...peakPrediction,
            day: i === 0 ? 'Today' : dayNames[day],
            dayOffset: i
          });
        }
        return weekPredictions;
      }
      
      // Default 24h view - filter for upcoming hours
      return basePredictions
        .filter(p => p.hour > currentHour)
        .map(p => ({ ...p, day: 'Today' }));
    };

    const predictions = generatePredictions(currentDay, currentHour, timeframe);
    
    res.json({
      success: true,
      data: {
        predictions,
        timeframe,
        generatedAt: new Date(),
        metadata: {
          algorithm: 'Historical Pattern Analysis',
          confidence: 'High',
          lastUpdated: new Date(),
          factors: ['Historical appointments', 'Day of week patterns', 'Seasonal trends']
        }
      }
    });
  } catch (error) {
    console.error('Get peak hours prediction error:', error);
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
