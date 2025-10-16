const mongoose = require('mongoose');

/**
 * AuditLog Model - Tracks all system activities for compliance and security
 * Follows Single Responsibility Principle - Only handles audit logging
 */
const auditLogSchema = new mongoose.Schema({
  // User Information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  userRole: {
    type: String,
    enum: ['patient', 'doctor', 'staff', 'manager', 'admin'],
    required: [true, 'User role is required']
  },
  
  // Action Details
  action: {
    type: String,
    enum: [
      'LOGIN',
      'LOGOUT', 
      'VIEW_PATIENT_RECORD',
      'UPDATE_PATIENT_RECORD',
      'CREATE_TREATMENT_NOTE',
      'UPDATE_TREATMENT_NOTE',
      'VIEW_SCHEDULE',
      'UPDATE_SCHEDULE',
      'SEARCH_PATIENT',
      'ACCESS_DENIED',
      'VIEW_PATIENT_LIST',
      'VIEW_PATIENT_DASHBOARD',
      'VIEW_PATIENT_PROFILE',
      'VIEW_RECENT_PATIENTS',
      'VIEW_TODAY_SCHEDULE',
      'CREATE_SLOTS',
      'BLOCK_SLOTS',
      'UNBLOCK_SLOTS',
      'CREATE_PRESCRIPTION',
      'VIEW_PRESCRIPTIONS',
      'SIGN_PRESCRIPTION'
    ],
    required: [true, 'Action is required'],
    index: true
  },
  
  // Resource Information
  resourceType: {
    type: String,
    enum: ['User', 'MedicalRecord', 'Appointment', 'Schedule', 'Patient', 'DoctorSlot', 'Prescription'],
    required: [true, 'Resource type is required']
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Resource ID is required'],
    index: true
  },
  
  // Patient Context (for medical record access)
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  
  // Technical Details
  ipAddress: {
    type: String,
    required: [true, 'IP address is required']
  },
  userAgent: {
    type: String,
    required: [true, 'User agent is required']
  },
  sessionId: String,
  
  // Change Details (for update operations)
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed,
    fieldsChanged: [String]
  },
  
  // Status and Metadata
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILURE', 'WARNING'],
    default: 'SUCCESS',
    index: true
  },
  errorMessage: String,
  
  // Additional Context
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true,
  // Optimize for read operations
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for efficient querying
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ patientId: 1, action: 1, createdAt: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, status: 1, createdAt: -1 });

// TTL index - automatically delete logs older than 7 years (compliance requirement)
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 220752000 }); // 7 years

// Virtual for formatted timestamp
auditLogSchema.virtual('formattedTimestamp').get(function() {
  return this.createdAt.toISOString();
});

// Static method to create audit log entry
auditLogSchema.statics.createLog = async function(logData) {
  try {
    const log = new this(logData);
    await log.save();
    return log;
  } catch (error) {
    // Log to console if database logging fails (fallback)
    console.error('Failed to create audit log:', error);
    throw error;
  }
};

// Static method to get user activity summary
auditLogSchema.statics.getUserActivitySummary = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return await this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 },
        lastActivity: { $max: '$createdAt' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

// Static method to get patient access history
auditLogSchema.statics.getPatientAccessHistory = async function(patientId, limit = 50) {
  return await this.find({
    patientId: mongoose.Types.ObjectId(patientId),
    action: { $in: ['VIEW_PATIENT_RECORD', 'UPDATE_PATIENT_RECORD'] }
  })
  .populate('userId', 'firstName lastName role specialization')
  .sort({ createdAt: -1 })
  .limit(limit);
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
