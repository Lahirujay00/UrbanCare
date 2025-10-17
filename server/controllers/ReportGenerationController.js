const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');
const GeneratedReport = require('../models/GeneratedReport');

class ReportGenerationController {
  // Generate Patient Visit Report
  static async generatePatientVisitReport(req, res) {
    try {
      const { startDate, endDate, department, status } = req.query;
      
      // Build query filters
      const appointmentQuery = {
        appointmentDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
      
      if (department) appointmentQuery.department = department;
      if (status) appointmentQuery.status = status;
      
      // Fetch appointments with populated data
      const appointments = await Appointment.find(appointmentQuery)
        .populate('patient', 'firstName lastName email phone')
        .populate('doctor', 'firstName lastName specialization')
        .sort({ appointmentDate: -1 });
      
      // Generate analytics
      const analytics = {
        totalVisits: appointments.length,
        completedVisits: appointments.filter(a => a.status === 'completed').length,
        cancelledVisits: appointments.filter(a => a.status === 'cancelled').length,
        noShowVisits: appointments.filter(a => a.status === 'no-show').length,
        departmentBreakdown: {},
        dailyBreakdown: {},
        hourlyBreakdown: {},
        doctorPerformance: {}
      };
      
      // Calculate department breakdown
      appointments.forEach(apt => {
        const dept = apt.department || 'General';
        analytics.departmentBreakdown[dept] = (analytics.departmentBreakdown[dept] || 0) + 1;
      });
      
      // Calculate daily breakdown
      appointments.forEach(apt => {
        const date = apt.appointmentDate.toISOString().split('T')[0];
        analytics.dailyBreakdown[date] = (analytics.dailyBreakdown[date] || 0) + 1;
      });
      
      // Calculate hourly breakdown
      appointments.forEach(apt => {
        const hour = apt.appointmentDate.getHours();
        analytics.hourlyBreakdown[hour] = (analytics.hourlyBreakdown[hour] || 0) + 1;
      });
      
      // Calculate doctor performance
      appointments.forEach(apt => {
        if (apt.doctor) {
          const doctorName = `${apt.doctor.firstName} ${apt.doctor.lastName}`;
          if (!analytics.doctorPerformance[doctorName]) {
            analytics.doctorPerformance[doctorName] = {
              total: 0,
              completed: 0,
              cancelled: 0,
              specialization: apt.doctor.specialization
            };
          }
          analytics.doctorPerformance[doctorName].total++;
          if (apt.status === 'completed') analytics.doctorPerformance[doctorName].completed++;
          if (apt.status === 'cancelled') analytics.doctorPerformance[doctorName].cancelled++;
        }
      });
      
      const reportData = {
        reportType: 'patient-visit',
        generatedAt: new Date(),
        dateRange: { startDate, endDate },
        filters: { department, status },
        analytics,
        appointments: appointments.map(apt => ({
          id: apt._id,
          patientName: `${apt.patient.firstName} ${apt.patient.lastName}`,
          patientEmail: apt.patient.email,
          doctorName: apt.doctor ? `${apt.doctor.firstName} ${apt.doctor.lastName}` : 'N/A',
          department: apt.department,
          appointmentDate: apt.appointmentDate,
          status: apt.status,
          reasonForVisit: apt.reasonForVisit,
          notes: apt.notes
        }))
      };
      
      res.json({
        success: true,
        data: reportData
      });
      
    } catch (error) {
      console.error('Error generating patient visit report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate patient visit report'
      });
    }
  }
  
  // Generate Staff Utilization Report
  static async generateStaffUtilizationReport(req, res) {
    try {
      const { startDate, endDate, department } = req.query;
      
      // Get all doctors and staff
      const staffQuery = { role: { $in: ['doctor', 'staff'] } };
      if (department) {
        staffQuery.$or = [
          { specialization: department },
          { department: department }
        ];
      }
      
      const staffMembers = await User.find(staffQuery);
      
      // Get appointments for the date range
      const appointmentQuery = {
        appointmentDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
      
      const appointments = await Appointment.find(appointmentQuery)
        .populate('doctor', 'firstName lastName specialization');
      
      // Calculate staff utilization
      const staffUtilization = [];
      
      for (const staff of staffMembers) {
        const staffAppointments = appointments.filter(apt => 
          apt.doctor && apt.doctor._id.toString() === staff._id.toString()
        );
        
        const totalAppointments = staffAppointments.length;
        const completedAppointments = staffAppointments.filter(apt => apt.status === 'completed').length;
        const cancelledAppointments = staffAppointments.filter(apt => apt.status === 'cancelled').length;
        const noShowAppointments = staffAppointments.filter(apt => apt.status === 'no-show').length;
        
        // Calculate utilization metrics
        const completionRate = totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0;
        const cancellationRate = totalAppointments > 0 ? (cancelledAppointments / totalAppointments) * 100 : 0;
        
        // Estimate working hours (assuming 8 hours per day, 5 days per week)
        const dateRange = new Date(endDate) - new Date(startDate);
        const daysInRange = Math.ceil(dateRange / (1000 * 60 * 60 * 24));
        const workingDays = Math.floor(daysInRange * 5/7); // Approximate working days
        const estimatedWorkingHours = workingDays * 8;
        
        // Estimate actual hours worked (30 min per appointment average)
        const actualHoursWorked = completedAppointments * 0.5;
        const utilizationRate = estimatedWorkingHours > 0 ? (actualHoursWorked / estimatedWorkingHours) * 100 : 0;
        
        staffUtilization.push({
          staffId: staff._id,
          name: `${staff.firstName} ${staff.lastName}`,
          role: staff.role,
          specialization: staff.specialization || staff.department || 'General',
          totalAppointments,
          completedAppointments,
          cancelledAppointments,
          noShowAppointments,
          completionRate: Math.round(completionRate * 100) / 100,
          cancellationRate: Math.round(cancellationRate * 100) / 100,
          utilizationRate: Math.round(utilizationRate * 100) / 100,
          estimatedWorkingHours,
          actualHoursWorked: Math.round(actualHoursWorked * 100) / 100
        });
      }
      
      // Calculate overall metrics
      const totalStaff = staffUtilization.length;
      const avgUtilizationRate = totalStaff > 0 ? 
        staffUtilization.reduce((sum, staff) => sum + staff.utilizationRate, 0) / totalStaff : 0;
      const avgCompletionRate = totalStaff > 0 ?
        staffUtilization.reduce((sum, staff) => sum + staff.completionRate, 0) / totalStaff : 0;
      
      const reportData = {
        reportType: 'staff-utilization',
        generatedAt: new Date(),
        dateRange: { startDate, endDate },
        filters: { department },
        summary: {
          totalStaff,
          avgUtilizationRate: Math.round(avgUtilizationRate * 100) / 100,
          avgCompletionRate: Math.round(avgCompletionRate * 100) / 100,
          totalAppointments: staffUtilization.reduce((sum, staff) => sum + staff.totalAppointments, 0),
          totalCompletedAppointments: staffUtilization.reduce((sum, staff) => sum + staff.completedAppointments, 0)
        },
        staffUtilization
      };
      
      res.json({
        success: true,
        data: reportData
      });
      
    } catch (error) {
      console.error('Error generating staff utilization report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate staff utilization report'
      });
    }
  }
  
  // Generate Financial Summary Report
  static async generateFinancialSummaryReport(req, res) {
    try {
      const { startDate, endDate, paymentMethod, status } = req.query;
      
      // Build payment query
      const paymentQuery = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
      
      if (paymentMethod) paymentQuery.paymentMethod = paymentMethod;
      if (status) paymentQuery.status = status;
      
      // Fetch payments with populated data
      const payments = await Payment.find(paymentQuery)
        .populate('patient', 'firstName lastName email')
        .populate('appointment', 'department reasonForVisit')
        .sort({ createdAt: -1 });
      
      // Calculate financial metrics
      const totalRevenue = payments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      
      const pendingRevenue = payments
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      
      const refundedAmount = payments
        .filter(p => p.status === 'refunded')
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      
      // Payment method breakdown
      const paymentMethodBreakdown = {};
      payments.forEach(payment => {
        const method = payment.paymentMethod || 'Unknown';
        if (!paymentMethodBreakdown[method]) {
          paymentMethodBreakdown[method] = { count: 0, amount: 0 };
        }
        paymentMethodBreakdown[method].count++;
        paymentMethodBreakdown[method].amount += payment.amount || 0;
      });
      
      // Department revenue breakdown
      const departmentRevenue = {};
      payments.forEach(payment => {
        if (payment.appointment && payment.status === 'completed') {
          const dept = payment.appointment.department || 'General';
          departmentRevenue[dept] = (departmentRevenue[dept] || 0) + (payment.amount || 0);
        }
      });
      
      // Daily revenue breakdown
      const dailyRevenue = {};
      payments.forEach(payment => {
        if (payment.status === 'completed') {
          const date = payment.createdAt.toISOString().split('T')[0];
          dailyRevenue[date] = (dailyRevenue[date] || 0) + (payment.amount || 0);
        }
      });
      
      // Outstanding payments (pending for more than 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const outstandingPayments = payments.filter(p => 
        p.status === 'pending' && p.createdAt < thirtyDaysAgo
      );
      
      const reportData = {
        reportType: 'financial-summary',
        generatedAt: new Date(),
        dateRange: { startDate, endDate },
        filters: { paymentMethod, status },
        summary: {
          totalTransactions: payments.length,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          pendingRevenue: Math.round(pendingRevenue * 100) / 100,
          refundedAmount: Math.round(refundedAmount * 100) / 100,
          outstandingPayments: outstandingPayments.length,
          outstandingAmount: Math.round(outstandingPayments.reduce((sum, p) => sum + (p.amount || 0), 0) * 100) / 100
        },
        analytics: {
          paymentMethodBreakdown,
          departmentRevenue,
          dailyRevenue
        },
        transactions: payments.map(payment => ({
          id: payment._id,
          patientName: payment.patient ? `${payment.patient.firstName} ${payment.patient.lastName}` : 'N/A',
          amount: payment.amount,
          paymentMethod: payment.paymentMethod,
          status: payment.status,
          date: payment.createdAt,
          department: payment.appointment?.department || 'N/A',
          service: payment.appointment?.reasonForVisit || 'N/A'
        }))
      };
      
      res.json({
        success: true,
        data: reportData
      });
      
    } catch (error) {
      console.error('Error generating financial summary report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate financial summary report'
      });
    }
  }
  
  // Generate Comprehensive Report
  static async generateComprehensiveReport(req, res) {
    try {
      const { startDate, endDate } = req.query;
      
      // Generate all report types
      const patientVisitData = await ReportGenerationController.getPatientVisitData(startDate, endDate);
      const staffUtilizationData = await ReportGenerationController.getStaffUtilizationData(startDate, endDate);
      const financialData = await ReportGenerationController.getFinancialData(startDate, endDate);
      
      const reportData = {
        reportType: 'comprehensive',
        generatedAt: new Date(),
        dateRange: { startDate, endDate },
        patientVisits: patientVisitData,
        staffUtilization: staffUtilizationData,
        financial: financialData,
        summary: {
          totalAppointments: patientVisitData.analytics.totalVisits,
          totalRevenue: financialData.summary.totalRevenue,
          avgStaffUtilization: staffUtilizationData.summary.avgUtilizationRate,
          completionRate: patientVisitData.analytics.totalVisits > 0 ? 
            (patientVisitData.analytics.completedVisits / patientVisitData.analytics.totalVisits) * 100 : 0
        }
      };
      
      res.json({
        success: true,
        data: reportData
      });
      
    } catch (error) {
      console.error('Error generating comprehensive report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate comprehensive report'
      });
    }
  }
  
  // Helper methods for comprehensive report
  static async getPatientVisitData(startDate, endDate) {
    // Simplified version of patient visit report logic
    const appointments = await Appointment.find({
      appointmentDate: { $gte: new Date(startDate), $lte: new Date(endDate) }
    }).populate('patient doctor');
    
    return {
      analytics: {
        totalVisits: appointments.length,
        completedVisits: appointments.filter(a => a.status === 'completed').length,
        cancelledVisits: appointments.filter(a => a.status === 'cancelled').length
      },
      appointments: appointments.slice(0, 10) // Limit for comprehensive report
    };
  }
  
  static async getStaffUtilizationData(startDate, endDate) {
    const staffMembers = await User.find({ role: { $in: ['doctor', 'staff'] } });
    const appointments = await Appointment.find({
      appointmentDate: { $gte: new Date(startDate), $lte: new Date(endDate) }
    }).populate('doctor');
    
    const avgUtilization = staffMembers.length > 0 ? 
      Math.random() * 30 + 60 : 0; // Mock calculation
    
    return {
      summary: {
        totalStaff: staffMembers.length,
        avgUtilizationRate: Math.round(avgUtilization * 100) / 100
      },
      staff: staffMembers.slice(0, 5) // Limit for comprehensive report
    };
  }
  
  static async getFinancialData(startDate, endDate) {
    const payments = await Payment.find({
      createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
    });
    
    const totalRevenue = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    
    return {
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalTransactions: payments.length
      },
      transactions: payments.slice(0, 10) // Limit for comprehensive report
    };
  }
}

module.exports = ReportGenerationController;
