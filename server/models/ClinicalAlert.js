const mongoose = require('mongoose');

/**
 * Clinical Alert Model - Real-time safety alerts and warnings
 * Handles drug allergies, interactions, critical values, and patient safety alerts
 */
const clinicalAlertSchema = new mongoose.Schema({
  // Alert Identification
  alertId: {
    type: String,
    unique: true,
    required: true
  },
  
  // Patient and Provider
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Patient is required'],
    index: true
  },
  triggeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Triggered by user is required']
  },
  
  // Alert Type and Category
  alertType: {
    type: String,
    enum: [
      'DRUG_ALLERGY',
      'DRUG_INTERACTION', 
      'CRITICAL_LAB_VALUE',
      'DOSAGE_WARNING',
      'CONTRAINDICATION',
      'DUPLICATE_THERAPY',
      'PREGNANCY_WARNING',
      'AGE_INAPPROPRIATE',
      'RENAL_ADJUSTMENT',
      'HEPATIC_ADJUSTMENT',
      'EMERGENCY_ALERT'
    ],
    required: [true, 'Alert type is required'],
    index: true
  },
  
  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    required: [true, 'Severity is required'],
    index: true
  },
  
  priority: {
    type: String,
    enum: ['INFORMATIONAL', 'WARNING', 'URGENT', 'EMERGENCY'],
    required: [true, 'Priority is required']
  },
  
  // Alert Content
  title: {
    type: String,
    required: [true, 'Alert title is required'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  
  message: {
    type: String,
    required: [true, 'Alert message is required'],
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  
  recommendation: {
    type: String,
    maxlength: [500, 'Recommendation cannot exceed 500 characters']
  },
  
  // Context Information
  context: {
    // Related prescription or medication
    prescription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prescription'
    },
    
    // Related medical record
    medicalRecord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicalRecord'
    },
    
    // Specific medications involved
    medications: [{
      drugName: String,
      dosage: String,
      route: String
    }],
    
    // Lab values that triggered alert
    labValues: [{
      testName: String,
      value: String,
      normalRange: String,
      unit: String
    }],
    
    // Patient factors
    patientFactors: {
      age: Number,
      weight: Number,
      allergies: [String],
      conditions: [String],
      renalFunction: String,
      hepaticFunction: String,
      pregnancy: Boolean
    }
  },
  
  // Alert Rules and Logic
  ruleTriggered: {
    ruleId: String,
    ruleName: String,
    ruleDescription: String,
    ruleVersion: String
  },
  
  // Clinical Decision Support
  evidenceLevel: {
    type: String,
    enum: ['A', 'B', 'C', 'D'], // Evidence-based medicine levels
    default: 'C'
  },
  
  references: [{
    source: String,
    url: String,
    description: String
  }],
  
  // Alert Status and Actions
  status: {
    type: String,
    enum: ['ACTIVE', 'ACKNOWLEDGED', 'OVERRIDDEN', 'RESOLVED', 'EXPIRED'],
    default: 'ACTIVE',
    index: true
  },
  
  // Provider Actions
  providerResponse: {
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    respondedAt: Date,
    action: {
      type: String,
      enum: ['ACKNOWLEDGED', 'OVERRIDDEN', 'MODIFIED_ORDER', 'CANCELLED_ORDER', 'NO_ACTION']
    },
    reason: String,
    comments: String
  },
  
  // Override Information (for overridden alerts)
  override: {
    overriddenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    overriddenAt: Date,
    reason: {
      type: String,
      enum: [
        'CLINICAL_JUDGMENT',
        'PATIENT_PREFERENCE', 
        'BENEFIT_OUTWEIGHS_RISK',
        'ALTERNATIVE_NOT_AVAILABLE',
        'TEMPORARY_USE',
        'OTHER'
      ]
    },
    justification: {
      type: String,
      required: function() {
        return this.override && this.override.reason === 'OTHER';
      }
    },
    requiresSupervisorApproval: { type: Boolean, default: false },
    supervisorApproval: {
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      approvedAt: Date,
      comments: String
    }
  },
  
  // Timing and Expiration
  triggeredAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  expiresAt: {
    type: Date,
    index: true
  },
  
  // Auto-resolution
  autoResolve: {
    type: Boolean,
    default: false
  },
  
  resolvedAt: Date,
  
  // Notification Settings
  notifications: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    popup: { type: Boolean, default: true },
    sound: { type: Boolean, default: false }
  },
  
  // Escalation Rules
  escalation: {
    escalateAfter: Number, // minutes
    escalateTo: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    escalated: { type: Boolean, default: false },
    escalatedAt: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient querying
clinicalAlertSchema.index({ patient: 1, status: 1, triggeredAt: -1 });
clinicalAlertSchema.index({ triggeredBy: 1, status: 1, triggeredAt: -1 });
clinicalAlertSchema.index({ alertType: 1, severity: 1 });
clinicalAlertSchema.index({ status: 1, expiresAt: 1 });
clinicalAlertSchema.index({ 'escalation.escalateAfter': 1, 'escalation.escalated': 1 });

// Pre-save middleware to generate alert ID
clinicalAlertSchema.pre('save', function(next) {
  if (!this.alertId) {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    this.alertId = `ALERT-${timestamp}-${randomStr}`.toUpperCase();
  }
  
  // Set expiration if not provided (default 24 hours for most alerts)
  if (!this.expiresAt && this.alertType !== 'EMERGENCY_ALERT') {
    this.expiresAt = new Date();
    this.expiresAt.setHours(this.expiresAt.getHours() + 24);
  }
  
  next();
});

// Virtual for alert age in minutes
clinicalAlertSchema.virtual('alertAgeMinutes').get(function() {
  const now = new Date();
  const triggered = new Date(this.triggeredAt);
  return Math.floor((now - triggered) / (1000 * 60));
});

// Virtual for time until expiry
clinicalAlertSchema.virtual('minutesUntilExpiry').get(function() {
  if (!this.expiresAt) return null;
  const now = new Date();
  const expiry = new Date(this.expiresAt);
  return Math.floor((expiry - now) / (1000 * 60));
});

// Method to acknowledge alert
clinicalAlertSchema.methods.acknowledge = function(userId, reason, comments) {
  this.status = 'ACKNOWLEDGED';
  this.providerResponse = {
    respondedBy: userId,
    respondedAt: new Date(),
    action: 'ACKNOWLEDGED',
    reason,
    comments
  };
  return this.save();
};

// Method to override alert
clinicalAlertSchema.methods.override = function(userId, overrideReason, justification, requiresSupervisor = false) {
  this.status = 'OVERRIDDEN';
  this.override = {
    overriddenBy: userId,
    overriddenAt: new Date(),
    reason: overrideReason,
    justification,
    requiresSupervisorApproval: requiresSupervisor
  };
  this.providerResponse = {
    respondedBy: userId,
    respondedAt: new Date(),
    action: 'OVERRIDDEN',
    reason: overrideReason,
    comments: justification
  };
  return this.save();
};

// Static method to get active alerts for patient
clinicalAlertSchema.statics.getActiveForPatient = function(patientId) {
  return this.find({
    patient: patientId,
    status: 'ACTIVE',
    $or: [
      { expiresAt: { $gt: new Date() } },
      { expiresAt: null }
    ]
  })
  .populate('triggeredBy', 'firstName lastName role')
  .sort({ severity: -1, triggeredAt: -1 });
};

// Static method to get alerts by severity
clinicalAlertSchema.statics.getAlertsBySeverity = function(severity, limit = 50) {
  return this.find({
    severity,
    status: 'ACTIVE',
    $or: [
      { expiresAt: { $gt: new Date() } },
      { expiresAt: null }
    ]
  })
  .populate('patient', 'firstName lastName digitalHealthCardId')
  .populate('triggeredBy', 'firstName lastName role')
  .sort({ triggeredAt: -1 })
  .limit(limit);
};

// Static method to check for escalation
clinicalAlertSchema.statics.checkEscalation = async function() {
  const alerts = await this.find({
    status: 'ACTIVE',
    'escalation.escalated': false,
    'escalation.escalateAfter': { $exists: true }
  });
  
  const now = new Date();
  const alertsToEscalate = alerts.filter(alert => {
    const triggerTime = new Date(alert.triggeredAt);
    const minutesSinceTrigger = (now - triggerTime) / (1000 * 60);
    return minutesSinceTrigger >= alert.escalation.escalateAfter;
  });
  
  return alertsToEscalate;
};

// Static method to create drug allergy alert
clinicalAlertSchema.statics.createDrugAllergyAlert = function(patientId, userId, allergen, medication, severity) {
  return this.create({
    patient: patientId,
    triggeredBy: userId,
    alertType: 'DRUG_ALLERGY',
    severity: severity === 'severe' ? 'CRITICAL' : 'HIGH',
    priority: severity === 'severe' ? 'EMERGENCY' : 'URGENT',
    title: `Drug Allergy Alert: ${allergen}`,
    message: `Patient is allergic to ${allergen}. Prescribed medication ${medication} may contain this allergen.`,
    recommendation: 'Review patient allergies and consider alternative medication.',
    context: {
      medications: [{ drugName: medication }],
      patientFactors: { allergies: [allergen] }
    },
    ruleTriggered: {
      ruleId: 'ALLERGY_001',
      ruleName: 'Drug Allergy Check',
      ruleDescription: 'Checks prescribed medications against patient allergies'
    }
  });
};

// Static method to create drug interaction alert
clinicalAlertSchema.statics.createDrugInteractionAlert = function(patientId, userId, drug1, drug2, interactionSeverity, clinicalEffect) {
  const severityMap = {
    'minor': 'LOW',
    'moderate': 'MEDIUM', 
    'major': 'HIGH'
  };
  
  return this.create({
    patient: patientId,
    triggeredBy: userId,
    alertType: 'DRUG_INTERACTION',
    severity: severityMap[interactionSeverity] || 'MEDIUM',
    priority: interactionSeverity === 'major' ? 'URGENT' : 'WARNING',
    title: `Drug Interaction: ${drug1} + ${drug2}`,
    message: `Potential ${interactionSeverity} interaction between ${drug1} and ${drug2}. ${clinicalEffect}`,
    recommendation: 'Consider alternative medications or adjust dosing. Monitor patient closely.',
    context: {
      medications: [
        { drugName: drug1 },
        { drugName: drug2 }
      ]
    },
    ruleTriggered: {
      ruleId: 'INTERACTION_001',
      ruleName: 'Drug Interaction Check',
      ruleDescription: 'Checks for interactions between prescribed medications'
    }
  });
};

module.exports = mongoose.model('ClinicalAlert', clinicalAlertSchema);
