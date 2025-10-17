const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');

class ManagerController {
  // Get dashboard overview statistics
  static async getDashboardOverview(req, res) {
    try {
      // Get current date for today's calculations
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      // Parallel queries for better performance
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
        // Total users (patients)
        User.countDocuments({ role: 'patient' }),
        
        // Total doctors
        User.countDocuments({ role: 'doctor' }),
        
        // Today's appointments
        Appointment.countDocuments({
          appointmentDate: {
            $gte: startOfDay,
            $lt: endOfDay
          }
        }),
        
        // Pending appointments
        Appointment.countDocuments({
          status: { $in: ['scheduled', 'confirmed'] }
        }),
        
        // Completed appointments
        Appointment.countDocuments({
          status: 'completed'
        }),
        
        // Recent appointments (last 5)
        Appointment.find()
          .populate('patient', 'firstName lastName email')
          .populate('doctor', 'firstName lastName specialization')
          .sort({ createdAt: -1 })
          .limit(5),
        
        // Total revenue
        Payment.aggregate([
          { $match: { status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        
        // Recent payments (last 5)
        Payment.find({ status: 'completed' })
          .populate('patient', 'firstName lastName email')
          .sort({ createdAt: -1 })
          .limit(5)
      ]);

      // Extract total revenue
      const revenueTotal = totalRevenue.length > 0 ? totalRevenue[0].total : 0;

      // Prepare response data
      const dashboardData = {
        totalUsers,
        totalDoctors,
        todayAppointments,
        pendingAppointments,
        completedAppointments,
        totalRevenue: revenueTotal,
        recentAppointments,
        recentPayments
      };

      res.json({
        success: true,
        data: dashboardData
      });

    } catch (error) {
      console.error('Error fetching dashboard overview:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard overview',
        error: error.message
      });
    }
  }

  // Get patient visit reports
  static async getPatientVisitReport(req, res) {
    try {
      const { startDate, endDate, department, status } = req.query;

      // Build query
      const query = {};
      if (startDate && endDate) {
        query.appointmentDate = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }
      if (department) {
        query.department = department;
      }
      if (status) {
        query.status = status;
      }

      // Get appointments with populated data
      const appointments = await Appointment.find(query)
        .populate('patient', 'firstName lastName email phone')
        .populate('doctor', 'firstName lastName specialization')
        .sort({ appointmentDate: -1 });

      // Calculate analytics
      const analytics = {
        totalVisits: appointments.length,
        dailyBreakdown: {},
        departmentBreakdown: {},
        statusBreakdown: {},
        doctorBreakdown: {}
      };

      appointments.forEach(apt => {
        const date = apt.appointmentDate.toISOString().split('T')[0];
        analytics.dailyBreakdown[date] = (analytics.dailyBreakdown[date] || 0) + 1;
        analytics.departmentBreakdown[apt.department] = (analytics.departmentBreakdown[apt.department] || 0) + 1;
        analytics.statusBreakdown[apt.status] = (analytics.statusBreakdown[apt.status] || 0) + 1;
        
        const doctorName = `${apt.doctor.firstName} ${apt.doctor.lastName}`;
        analytics.doctorBreakdown[doctorName] = (analytics.doctorBreakdown[doctorName] || 0) + 1;
      });

      res.json({
        success: true,
        data: {
          appointments,
          analytics,
          summary: {
            totalRecords: appointments.length,
            dateRange: { startDate, endDate }
          }
        }
      });

    } catch (error) {
      console.error('Error generating patient visit report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate patient visit report',
        error: error.message
      });
    }
  }

  // Get staff utilization reports
  static async getStaffUtilizationReport(req, res) {
    try {
      const { startDate, endDate, department } = req.query;

      // Build appointment query
      const appointmentQuery = {};
      if (startDate && endDate) {
        appointmentQuery.appointmentDate = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }
      if (department) {
        appointmentQuery.department = department;
      }

      // Get all doctors
      const doctorQuery = { role: 'doctor' };
      if (department) {
        doctorQuery.specialization = department;
      }

      const [doctors, appointments] = await Promise.all([
        User.find(doctorQuery),
        Appointment.find(appointmentQuery).populate('doctor')
      ]);

      // Calculate utilization for each doctor
      const staffUtilization = doctors.map(doctor => {
        const doctorAppointments = appointments.filter(apt => 
          apt.doctor._id.toString() === doctor._id.toString()
        );

        const completedAppointments = doctorAppointments.filter(apt => apt.status === 'completed');
        const completionRate = doctorAppointments.length > 0 
          ? Math.round((completedAppointments.length / doctorAppointments.length) * 100)
          : 0;

        return {
          doctorId: doctor._id,
          name: `${doctor.firstName} ${doctor.lastName}`,
          specialization: doctor.specialization,
          totalAppointments: doctorAppointments.length,
          completedAppointments: completedAppointments.length,
          completionRate,
          utilizationRate: Math.min(Math.round((doctorAppointments.length / 40) * 100), 100) // Assuming 40 appointments per period is 100%
        };
      });

      // Calculate summary
      const summary = {
        totalStaff: doctors.length,
        averageUtilization: Math.round(
          staffUtilization.reduce((sum, staff) => sum + staff.utilizationRate, 0) / staffUtilization.length
        ),
        averageCompletion: Math.round(
          staffUtilization.reduce((sum, staff) => sum + staff.completionRate, 0) / staffUtilization.length
        )
      };

      res.json({
        success: true,
        data: {
          staffUtilization,
          summary: {
            ...summary,
            totalRecords: staffUtilization.length,
            dateRange: { startDate, endDate }
          }
        }
      });

    } catch (error) {
      console.error('Error generating staff utilization report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate staff utilization report',
        error: error.message
      });
    }
  }

  // Get financial summary reports
  static async getFinancialSummaryReport(req, res) {
    try {
      const { startDate, endDate, paymentMethod, status } = req.query;

      // Build query
      const query = {};
      if (startDate && endDate) {
        query.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }
      if (paymentMethod) {
        query.paymentMethod = paymentMethod;
      }
      if (status) {
        query.status = status;
      }

      // Get payments with populated data
      const payments = await Payment.find(query)
        .populate('patient', 'firstName lastName email')
        .populate('appointment', 'department reasonForVisit')
        .sort({ createdAt: -1 });

      // Calculate analytics
      const analytics = {
        totalRevenue: payments.reduce((sum, payment) => sum + payment.amount, 0),
        totalTransactions: payments.length,
        paymentMethodBreakdown: {},
        dailyRevenue: {},
        departmentRevenue: {},
        averageTransaction: 0
      };

      payments.forEach(payment => {
        // Payment method breakdown
        analytics.paymentMethodBreakdown[payment.paymentMethod] = 
          (analytics.paymentMethodBreakdown[payment.paymentMethod] || 0) + payment.amount;

        // Daily revenue
        const date = payment.createdAt.toISOString().split('T')[0];
        analytics.dailyRevenue[date] = (analytics.dailyRevenue[date] || 0) + payment.amount;

        // Department revenue
        const department = payment.appointment?.department || 'Unknown';
        analytics.departmentRevenue[department] = (analytics.departmentRevenue[department] || 0) + payment.amount;
      });

      analytics.averageTransaction = payments.length > 0 
        ? Math.round(analytics.totalRevenue / payments.length * 100) / 100
        : 0;

      res.json({
        success: true,
        data: {
          transactions: payments,
          analytics,
          summary: {
            totalRecords: payments.length,
            totalRevenue: analytics.totalRevenue,
            dateRange: { startDate, endDate }
          }
        }
      });

    } catch (error) {
      console.error('Error generating financial summary report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate financial summary report',
        error: error.message
      });
    }
  }
}

module.exports = ManagerController;
