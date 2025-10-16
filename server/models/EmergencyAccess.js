const mongoose = require('mongoose');

/**
 * Emergency Access Model - Break-glass access for critical situations
 * Allows authorized personnel to override normal access controls in emergencies
 */
const emergencyAccessSchema = new mongoose.Schema({
  // Access Information
  accessId: {
    type: String,
    unique: true,
    required: true
  },
  
  // Personnel Information
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Requesting user is required'],
    index: true
  },
  
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Patient Information
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Patient is required'],
    index: true
  },
  
  // Emergency Details
  emergencyType: {
    type: String,
    enum: [
      'CARDIAC_ARREST',
      'RESPIRATORY_FAILURE', 
      'SEVERE_TRAUMA',
      'STROKE',
      'ALLERGIC_REACTION',
      'DRUG_OVERDOSE',
      'PSYCHIATRIC_EMERGENCY',
      'PEDIATRIC_EMERGENCY',
      'OBSTETRIC_EMERGENCY',
      'OTHER_CRITICAL'
    ],
    required: [true, 'Emergency type is required']
  },
  
  severity: {
    type: String,
    enum: ['CRITICAL', 'HIGH', 'MODERATE'],
    required: [true, 'Severity is required'],
    default: 'CRITICAL'
  },
  
  // Justification
  reason: {
    type: String,
    required: [true, 'Emergency reason is required'],
    maxlength: [500, 'Reason cannot exceed 500 characters']
  },
  
  clinicalJustification: {
    type: String,
    required: [true, 'Clinical justification is required'],
    maxlength: [1000, 'Clinical justification cannot exceed 1000 characters']
  },
  
  // Access Details
  accessType: {
    type: String,
    enum: [
      'FULL_RECORD_ACCESS',
      'MEDICAL_HISTORY_ONLY',
      'ALLERGIES_MEDICATIONS',
      'EMERGENCY_CONTACTS',
      'VITAL_INFORMATION_ONLY'
    ],
    required: [true, 'Access type is required'],
    default: 'VITAL_INFORMATION_ONLY'
  },
  
  // Time Constraints
  requestedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  approvedAt: Date,
  
  accessStartTime: {
    type: Date,
    default: Date.now
  },
  
  accessEndTime: {
    type: Date,
    required: true
  },
  
  // Status
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'DENIED', 'ACTIVE', 'EXPIRED', 'REVOKED'],
    default: 'PENDING',
    index: true
  },
  
  // Approval Process
  requiresApproval: {
    type: Boolean,
    default: true
  },
  
  approvalLevel: {
    type: String,
    enum: ['SUPERVISOR', 'DEPARTMENT_HEAD', 'CHIEF_MEDICAL_OFFICER', 'ADMINISTRATOR'],
    default: 'SUPERVISOR'
  },
  
  // Override Information
  overrideReason: {
    type: String,
    maxlength: [300, 'Override reason cannot exceed 300 characters']
  },
  
  witnessedBy: [{
    witness: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    witnessedAt: {
      type: Date,
      default: Date.now
    },
    role: String
  }],
  
  // Location and Context
  location: {
    department: String,
    room: String,
    floor: String,
    building: String
  },
  
  // Patient Condition
  patientCondition: {
    consciousness: {
      type: String,
      enum: ['CONSCIOUS', 'UNCONSCIOUS', 'SEMICONSCIOUS', 'UNKNOWN']
    },
    vitalSigns: {
      bloodPressure: String,
      heartRate: Number,
      temperature: Number,
      respiratoryRate: Number,
      oxygenSaturation: Number
    },
    symptoms: [String],
    immediateThreats: [String]
  },
  
  // Access Log
  accessLog: [{
    action: {
      type: String,
      enum: ['RECORD_ACCESSED', 'DATA_VIEWED', 'DATA_MODIFIED', 'SESSION_ENDED']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: String,
    ipAddress: String,
    userAgent: String
  }],
  
  // Compliance and Legal
  legalBasis: {
    type: String,
    enum: [
      'LIFE_THREATENING_EMERGENCY',
      'PATIENT_SAFETY',
      'DUTY_OF_CARE',
      'MEDICAL_NECESSITY',
      'COURT_ORDER',
      'REGULATORY_REQUIREMENT'
    ],
    default: 'LIFE_THREATENING_EMERGENCY'
  },
  
  complianceNotes: {
    type: String,
    maxlength: [500, 'Compliance notes cannot exceed 500 characters']
  },
  
  // Post-Access Review
  postAccessReview: {
    required: {
      type: Boolean,
      default: true
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    reviewOutcome: {
      type: String,
      enum: ['JUSTIFIED', 'QUESTIONABLE', 'INAPPROPRIATE', 'UNDER_INVESTIGATION']
    },
    reviewComments: String,
    actionTaken: String
  },
  
  // Notifications
  notificationsSent: [{
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notificationType: {
      type: String,
      enum: ['EMAIL', 'SMS', 'SYSTEM_ALERT', 'PAGER']
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    delivered: {
      type: Boolean,
      default: false
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient querying
emergencyAccessSchema.index({ requestedBy: 1, createdAt: -1 });
emergencyAccessSchema.index({ patient: 1, createdAt: -1 });
emergencyAccessSchema.index({ status: 1, accessEndTime: 1 });
emergencyAccessSchema.index({ emergencyType: 1, severity: 1 });
emergencyAccessSchema.index({ 'postAccessReview.required': 1, 'postAccessReview.reviewedAt': 1 });

// Pre-save middleware to generate access ID
emergencyAccessSchema.pre('save', function(next) {
  if (!this.accessId) {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    this.accessId = `EMRG-${timestamp}-${randomStr}`.toUpperCase();
  }
  
  // Set default access end time (4 hours from start)
  if (!this.accessEndTime) {
    this.accessEndTime = new Date();
    this.accessEndTime.setHours(this.accessEndTime.getHours() + 4);
  }
  
  next();
});

// Virtual for access duration in minutes
emergencyAccessSchema.virtual('accessDurationMinutes').get(function() {
  const start = new Date(this.accessStartTime);
  const end = new Date(this.accessEndTime);
  return Math.floor((end - start) / (1000 * 60));
});

// Virtual for time remaining
emergencyAccessSchema.virtual('timeRemainingMinutes').get(function() {
  if (this.status !== 'ACTIVE') return 0;
  const now = new Date();
  const end = new Date(this.accessEndTime);
  const remaining = Math.floor((end - now) / (1000 * 60));
  return Math.max(0, remaining);
});

// Virtual to check if access is expired
emergencyAccessSchema.virtual('isExpired').get(function() {
  return new Date() > new Date(this.accessEndTime);
});

// Method to approve emergency access
emergencyAccessSchema.methods.approve = function(approverId, comments) {
  this.status = 'APPROVED';
  this.approvedBy = approverId;
  this.approvedAt = new Date();
  
  // Activate immediately for emergencies
  this.status = 'ACTIVE';
  this.accessStartTime = new Date();
  
  if (comments) {
    this.complianceNotes = comments;
  }
  
  return this.save();
};

// Method to deny emergency access
emergencyAccessSchema.methods.deny = function(approverId, reason) {
  this.status = 'DENIED';
  this.approvedBy = approverId;
  this.approvedAt = new Date();
  this.overrideReason = reason;
  
  return this.save();
};

// Method to revoke active access
emergencyAccessSchema.methods.revoke = function(revokedBy, reason) {
  this.status = 'REVOKED';
  this.accessEndTime = new Date();
  this.overrideReason = reason;
  
  // Log revocation
  this.accessLog.push({
    action: 'SESSION_ENDED',
    details: `Access revoked by ${revokedBy}: ${reason}`,
    timestamp: new Date()
  });
  
  return this.save();
};

// Method to log access activity
emergencyAccessSchema.methods.logAccess = function(action, details, ipAddress, userAgent) {
  this.accessLog.push({
    action,
    details,
    ipAddress,
    userAgent,
    timestamp: new Date()
  });
  return this.save();
};

// Static method to get active emergency accesses
emergencyAccessSchema.statics.getActiveAccesses = function(userId = null) {
  const query = {
    status: 'ACTIVE',
    accessEndTime: { $gt: new Date() }
  };
  
  if (userId) {
    query.requestedBy = userId;
  }
  
  return this.find(query)
    .populate('requestedBy', 'firstName lastName role department')
    .populate('patient', 'firstName lastName digitalHealthCardId')
    .populate('approvedBy', 'firstName lastName role')
    .sort({ accessStartTime: -1 });
};

// Static method to check for expired accesses
emergencyAccessSchema.statics.checkExpiredAccesses = async function() {
  const expiredAccesses = await this.find({
    status: 'ACTIVE',
    accessEndTime: { $lte: new Date() }
  });
  
  // Auto-expire them
  for (const access of expiredAccesses) {
    access.status = 'EXPIRED';
    access.accessLog.push({
      action: 'SESSION_ENDED',
      details: 'Access automatically expired',
      timestamp: new Date()
    });
    await access.save();
  }
  
  return expiredAccesses.length;
};

// Static method to create emergency access request
emergencyAccessSchema.statics.createEmergencyRequest = function(requestData) {
  return this.create({
    requestedBy: requestData.requestedBy,
    patient: requestData.patient,
    emergencyType: requestData.emergencyType,
    severity: requestData.severity || 'CRITICAL',
    reason: requestData.reason,
    clinicalJustification: requestData.clinicalJustification,
    accessType: requestData.accessType || 'VITAL_INFORMATION_ONLY',
    patientCondition: requestData.patientCondition,
    location: requestData.location,
    legalBasis: requestData.legalBasis || 'LIFE_THREATENING_EMERGENCY',
    requiresApproval: requestData.requiresApproval !== false, // Default true
    approvalLevel: requestData.approvalLevel || 'SUPERVISOR'
  });
};

// Static method to get pending approvals
emergencyAccessSchema.statics.getPendingApprovals = function(approverId = null) {
  const query = {
    status: 'PENDING',
    requiresApproval: true
  };
  
  return this.find(query)
    .populate('requestedBy', 'firstName lastName role department')
    .populate('patient', 'firstName lastName digitalHealthCardId')
    .sort({ requestedAt: 1 }); // Oldest first for urgency
};

module.exports = mongoose.model('EmergencyAccess', emergencyAccessSchema);
