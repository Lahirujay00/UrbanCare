const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  reportType: {
    type: String,
    enum: [
      'patient-visits',
      'staff-utilization',
      'revenue-analysis',
      'appointment-analytics',
      'doctor-performance',
      'payment-summary',
      'refund-analysis',
      'peak-hours',
      'department-wise',
      'monthly-summary',
      'yearly-summary',
      'custom'
    ],
    required: true
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  parameters: {
    startDate: Date,
    endDate: Date,
    department: String,
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    appointmentStatus: [String],
    paymentStatus: [String],
    customFilters: mongoose.Schema.Types.Mixed
  },
  data: {
    summary: {
      totalRecords: Number,
      totalRevenue: Number,
      averageValue: Number,
      growthPercentage: Number
    },
    charts: [{
      chartType: {
        type: String,
        enum: ['line', 'bar', 'pie', 'doughnut', 'area', 'scatter']
      },
      title: String,
      data: mongoose.Schema.Types.Mixed,
      labels: [String]
    }],
    tables: [{
      title: String,
      headers: [String],
      rows: [mongoose.Schema.Types.Mixed]
    }],
    metrics: [{
      name: String,
      value: mongoose.Schema.Types.Mixed,
      unit: String,
      trend: {
        direction: {
          type: String,
          enum: ['up', 'down', 'stable']
        },
        percentage: Number
      }
    }],
    insights: [{
      type: {
        type: String,
        enum: ['positive', 'negative', 'neutral', 'warning']
      },
      title: String,
      description: String,
      recommendation: String
    }]
  },
  format: {
    type: String,
    enum: ['json', 'pdf', 'excel', 'csv'],
    default: 'json'
  },
  filePath: String,
  fileUrl: String,
  fileSize: Number,
  status: {
    type: String,
    enum: ['generating', 'completed', 'failed', 'expired'],
    default: 'generating'
  },
  error: String,
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    }
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  lastDownloaded: Date,
  isScheduled: {
    type: Boolean,
    default: false
  },
  schedule: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']
    },
    nextRun: Date,
    lastRun: Date,
    recipients: [{
      email: String,
      role: String
    }]
  },
  visibility: {
    type: String,
    enum: ['private', 'department', 'public'],
    default: 'private'
  },
  sharedWith: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permissions: {
      type: String,
      enum: ['view', 'download', 'edit'],
      default: 'view'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for efficient queries
reportSchema.index({ reportType: 1, createdAt: -1 });
reportSchema.index({ generatedBy: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ expiresAt: 1 });
reportSchema.index({ 'parameters.startDate': 1, 'parameters.endDate': 1 });

// Auto-delete expired reports
reportSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for report age
reportSchema.virtual('age').get(function() {
  return Math.floor((new Date() - this.createdAt) / (1000 * 60 * 60 * 24)); // days
});

// Method to increment download count
reportSchema.methods.recordDownload = function() {
  this.downloadCount += 1;
  this.lastDownloaded = new Date();
  return this.save();
};

// Method to check if user has access
reportSchema.methods.hasAccess = function(userId, userRole) {
  // Report owner always has access
  if (this.generatedBy.toString() === userId.toString()) {
    return true;
  }
  
  // Admin and manager have access to all reports
  if (['admin', 'manager'].includes(userRole)) {
    return true;
  }
  
  // Check visibility settings
  if (this.visibility === 'public') {
    return true;
  }
  
  if (this.visibility === 'department' && ['staff', 'doctor'].includes(userRole)) {
    return true;
  }
  
  // Check if specifically shared
  const sharedAccess = this.sharedWith.find(
    share => share.user.toString() === userId.toString()
  );
  
  return !!sharedAccess;
};

// Static method to generate report data
reportSchema.statics.generateReportData = async function(reportType, parameters) {
  const Appointment = require('./Appointment');
  const User = require('./User');
  const Payment = require('./Payment');
  const Refund = require('./Refund');
  
  const { startDate, endDate, department, doctorId } = parameters;
  
  let dateFilter = {};
  if (startDate && endDate) {
    dateFilter.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  switch (reportType) {
    case 'patient-visits':
      return await this.generatePatientVisitsReport(dateFilter, parameters);
    
    case 'staff-utilization':
      return await this.generateStaffUtilizationReport(dateFilter, parameters);
    
    case 'revenue-analysis':
      return await this.generateRevenueAnalysisReport(dateFilter, parameters);
    
    case 'appointment-analytics':
      return await this.generateAppointmentAnalyticsReport(dateFilter, parameters);
    
    case 'peak-hours':
      return await this.generatePeakHoursReport(dateFilter, parameters);
    
    default:
      throw new Error('Unsupported report type');
  }
};

// Generate patient visits report
reportSchema.statics.generatePatientVisitsReport = async function(dateFilter, parameters) {
  const Appointment = require('./Appointment');
  
  const appointments = await Appointment.find({
    ...dateFilter,
    status: { $in: ['completed', 'in-progress'] }
  }).populate('patient doctor');
  
  const totalVisits = appointments.length;
  const uniquePatients = new Set(appointments.map(a => a.patient._id.toString())).size;
  
  // Group by date
  const visitsByDate = appointments.reduce((acc, appointment) => {
    const date = appointment.appointmentDate.toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});
  
  // Group by department
  const visitsByDepartment = appointments.reduce((acc, appointment) => {
    const dept = appointment.doctor.department || 'General';
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {});
  
  return {
    summary: {
      totalRecords: totalVisits,
      totalRevenue: appointments.reduce((sum, a) => sum + (a.consultationFee || 0), 0),
      averageValue: totalVisits > 0 ? appointments.reduce((sum, a) => sum + (a.consultationFee || 0), 0) / totalVisits : 0,
      uniquePatients
    },
    charts: [
      {
        chartType: 'line',
        title: 'Daily Patient Visits',
        data: Object.values(visitsByDate),
        labels: Object.keys(visitsByDate)
      },
      {
        chartType: 'pie',
        title: 'Visits by Department',
        data: Object.values(visitsByDepartment),
        labels: Object.keys(visitsByDepartment)
      }
    ],
    tables: [
      {
        title: 'Recent Visits',
        headers: ['Date', 'Patient', 'Doctor', 'Department', 'Status'],
        rows: appointments.slice(0, 10).map(a => [
          a.appointmentDate.toDateString(),
          `${a.patient.firstName} ${a.patient.lastName}`,
          `${a.doctor.firstName} ${a.doctor.lastName}`,
          a.doctor.department || 'General',
          a.status
        ])
      }
    ],
    metrics: [
      {
        name: 'Total Visits',
        value: totalVisits,
        unit: 'visits'
      },
      {
        name: 'Unique Patients',
        value: uniquePatients,
        unit: 'patients'
      },
      {
        name: 'Average Revenue per Visit',
        value: totalVisits > 0 ? Math.round(appointments.reduce((sum, a) => sum + (a.consultationFee || 0), 0) / totalVisits) : 0,
        unit: 'USD'
      }
    ]
  };
};

// Generate staff utilization report
reportSchema.statics.generateStaffUtilizationReport = async function(dateFilter, parameters) {
  const Appointment = require('./Appointment');
  const User = require('./User');
  
  const doctors = await User.find({ role: 'doctor' });
  const appointments = await Appointment.find({
    ...dateFilter,
    status: { $in: ['completed', 'in-progress', 'scheduled', 'confirmed'] }
  }).populate('doctor');
  
  const doctorStats = doctors.map(doctor => {
    const doctorAppointments = appointments.filter(a => 
      a.doctor && a.doctor._id.toString() === doctor._id.toString()
    );
    
    const totalAppointments = doctorAppointments.length;
    const completedAppointments = doctorAppointments.filter(a => a.status === 'completed').length;
    const revenue = doctorAppointments.reduce((sum, a) => sum + (a.consultationFee || 0), 0);
    
    return {
      doctor: `${doctor.firstName} ${doctor.lastName}`,
      department: doctor.department || 'General',
      totalAppointments,
      completedAppointments,
      completionRate: totalAppointments > 0 ? Math.round((completedAppointments / totalAppointments) * 100) : 0,
      revenue,
      utilization: Math.min(100, Math.round((totalAppointments / 40) * 100)) // Assuming 40 appointments per period is 100%
    };
  });
  
  return {
    summary: {
      totalRecords: doctors.length,
      averageUtilization: doctorStats.reduce((sum, d) => sum + d.utilization, 0) / doctors.length,
      totalRevenue: doctorStats.reduce((sum, d) => sum + d.revenue, 0)
    },
    charts: [
      {
        chartType: 'bar',
        title: 'Doctor Utilization Rate',
        data: doctorStats.map(d => d.utilization),
        labels: doctorStats.map(d => d.doctor)
      }
    ],
    tables: [
      {
        title: 'Staff Performance',
        headers: ['Doctor', 'Department', 'Total Appointments', 'Completed', 'Completion Rate', 'Revenue', 'Utilization'],
        rows: doctorStats.map(d => [
          d.doctor,
          d.department,
          d.totalAppointments,
          d.completedAppointments,
          `${d.completionRate}%`,
          `$${d.revenue}`,
          `${d.utilization}%`
        ])
      }
    ]
  };
};

// Generate peak hours analysis
reportSchema.statics.generatePeakHoursReport = async function(dateFilter, parameters) {
  const Appointment = require('./Appointment');
  
  const appointments = await Appointment.find(dateFilter);
  
  // Group by hour
  const hourlyData = appointments.reduce((acc, appointment) => {
    const hour = parseInt(appointment.appointmentTime.split(':')[0]);
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {});
  
  // Group by day of week
  const dailyData = appointments.reduce((acc, appointment) => {
    const day = appointment.appointmentDate.getDay();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[day];
    acc[dayName] = (acc[dayName] || 0) + 1;
    return acc;
  }, {});
  
  // Find peak hours
  const peakHour = Object.keys(hourlyData).reduce((a, b) => 
    hourlyData[a] > hourlyData[b] ? a : b
  );
  
  const peakDay = Object.keys(dailyData).reduce((a, b) => 
    dailyData[a] > dailyData[b] ? a : b
  );
  
  return {
    summary: {
      totalRecords: appointments.length,
      peakHour: `${peakHour}:00`,
      peakDay: peakDay,
      peakHourAppointments: hourlyData[peakHour] || 0
    },
    charts: [
      {
        chartType: 'bar',
        title: 'Appointments by Hour',
        data: Array.from({length: 24}, (_, i) => hourlyData[i] || 0),
        labels: Array.from({length: 24}, (_, i) => `${i}:00`)
      },
      {
        chartType: 'bar',
        title: 'Appointments by Day of Week',
        data: Object.values(dailyData),
        labels: Object.keys(dailyData)
      }
    ],
    insights: [
      {
        type: 'positive',
        title: 'Peak Hours Identified',
        description: `Peak appointment time is ${peakHour}:00 with ${hourlyData[peakHour]} appointments`,
        recommendation: 'Consider scheduling more staff during peak hours'
      },
      {
        type: 'neutral',
        title: 'Busiest Day',
        description: `${peakDay} is the busiest day with ${dailyData[peakDay]} appointments`,
        recommendation: 'Ensure adequate staffing on busy days'
      }
    ]
  };
};

module.exports = mongoose.model('Report', reportSchema);
