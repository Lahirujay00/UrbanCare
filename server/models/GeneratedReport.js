const mongoose = require('mongoose');

const generatedReportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  reportType: {
    type: String,
    required: true,
    enum: [
      'patient-visit',
      'staff-utilization', 
      'financial-summary',
      'comprehensive',
      'peak-hours',
      'appointment-analytics',
      'revenue-analysis'
    ]
  },
  description: {
    type: String,
    trim: true
  },
  dateRange: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  filters: {
    department: String,
    staffRole: String,
    paymentMethod: String,
    status: String
  },
  summary: {
    totalRecords: {
      type: Number,
      default: 0
    },
    keyMetrics: {
      type: Map,
      of: mongoose.Schema.Types.Mixed
    }
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  status: {
    type: String,
    enum: ['generating', 'completed', 'failed'],
    default: 'completed'
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  fileSize: {
    type: Number,
    default: 0
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  lastDownloaded: {
    type: Date
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
generatedReportSchema.index({ reportType: 1, generatedAt: -1 });
generatedReportSchema.index({ generatedBy: 1, generatedAt: -1 });
generatedReportSchema.index({ 'dateRange.startDate': 1, 'dateRange.endDate': 1 });

// Virtual for report period
generatedReportSchema.virtual('reportPeriod').get(function() {
  const start = this.dateRange.startDate.toLocaleDateString();
  const end = this.dateRange.endDate.toLocaleDateString();
  return `${start} - ${end}`;
});

// Static method to get reports by type
generatedReportSchema.statics.getReportsByType = function(reportType, limit = 10) {
  return this.find({ reportType, isArchived: false })
    .populate('generatedBy', 'firstName lastName email')
    .sort({ generatedAt: -1 })
    .limit(limit);
};

// Static method to get recent reports
generatedReportSchema.statics.getRecentReports = function(limit = 20) {
  return this.find({ isArchived: false })
    .populate('generatedBy', 'firstName lastName email')
    .sort({ generatedAt: -1 })
    .limit(limit);
};

// Instance method to increment download count
generatedReportSchema.methods.recordDownload = function() {
  this.downloadCount += 1;
  this.lastDownloaded = new Date();
  return this.save();
};

// Pre-save middleware to calculate file size estimate
generatedReportSchema.pre('save', function(next) {
  if (this.data) {
    // Estimate file size based on data content
    const dataString = JSON.stringify(this.data);
    this.fileSize = Buffer.byteLength(dataString, 'utf8');
  }
  next();
});

module.exports = mongoose.model('GeneratedReport', generatedReportSchema);
