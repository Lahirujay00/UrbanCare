const mongoose = require('mongoose');

/**
 * Prescription Model - Electronic Prescription Management
 * Handles drug prescriptions, interactions, and safety checks
 */
const prescriptionSchema = new mongoose.Schema({
  // Patient and Doctor Information
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Patient is required'],
    index: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Doctor is required'],
    index: true
  },
  
  // Related Medical Record
  medicalRecord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MedicalRecord'
  },
  
  // Prescription Details
  prescriptionNumber: {
    type: String,
    unique: true,
    required: true
  },
  
  // Medications
  medications: [{
    drugName: {
      type: String,
      required: [true, 'Drug name is required'],
      trim: true
    },
    genericName: {
      type: String,
      trim: true
    },
    strength: {
      type: String,
      required: [true, 'Drug strength is required']
    },
    dosageForm: {
      type: String,
      enum: ['tablet', 'capsule', 'syrup', 'injection', 'cream', 'drops', 'inhaler', 'patch'],
      required: [true, 'Dosage form is required']
    },
    dosage: {
      type: String,
      required: [true, 'Dosage is required']
    },
    frequency: {
      type: String,
      required: [true, 'Frequency is required']
    },
    duration: {
      type: String,
      required: [true, 'Duration is required']
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: 1
    },
    instructions: {
      type: String,
      maxlength: [500, 'Instructions cannot exceed 500 characters']
    },
    
    // Safety Information
    drugCode: String, // NDC or other drug identification code
    allergyChecked: {
      type: Boolean,
      default: false
    },
    interactionChecked: {
      type: Boolean,
      default: false
    },
    
    // Refill Information
    refills: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    refillsUsed: {
      type: Number,
      default: 0
    }
  }],
  
  // Clinical Information
  diagnosis: {
    type: String,
    required: [true, 'Diagnosis is required']
  },
  indication: {
    type: String,
    required: [true, 'Indication for prescription is required']
  },
  
  // Safety Checks
  safetyChecks: {
    allergyCheck: {
      performed: { type: Boolean, default: false },
      result: { type: String, enum: ['safe', 'warning', 'contraindicated'] },
      details: String
    },
    interactionCheck: {
      performed: { type: Boolean, default: false },
      result: { type: String, enum: ['safe', 'minor', 'moderate', 'major'] },
      interactions: [String]
    },
    dosageCheck: {
      performed: { type: Boolean, default: false },
      result: { type: String, enum: ['appropriate', 'high', 'low'] },
      recommendation: String
    }
  },
  
  // Prescription Status
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'cancelled', 'expired'],
    default: 'draft',
    index: true
  },
  
  // Pharmacy Information
  pharmacy: {
    name: String,
    address: String,
    phone: String,
    faxNumber: String
  },
  
  // Electronic Signature
  electronicSignature: {
    signed: { type: Boolean, default: false },
    signedAt: Date,
    signatureMethod: {
      type: String,
      enum: ['password', 'biometric', 'token']
    }
  },
  
  // Controlled Substance Information
  controlledSubstance: {
    isControlled: { type: Boolean, default: false },
    schedule: {
      type: String,
      enum: ['I', 'II', 'III', 'IV', 'V']
    },
    deaNumber: String
  },
  
  // Dates
  prescribedDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    required: true
  },
  
  // Notes
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  
  // Audit Trail
  auditTrail: [{
    action: {
      type: String,
      enum: ['created', 'modified', 'signed', 'transmitted', 'filled', 'cancelled']
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: String
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient querying
prescriptionSchema.index({ patient: 1, createdAt: -1 });
prescriptionSchema.index({ doctor: 1, createdAt: -1 });
prescriptionSchema.index({ status: 1, expiryDate: 1 });
prescriptionSchema.index({ prescriptionNumber: 1 });

// Virtual for prescription age
prescriptionSchema.virtual('prescriptionAge').get(function() {
  const now = new Date();
  const created = new Date(this.createdAt);
  const diffTime = Math.abs(now - created);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for days until expiry
prescriptionSchema.virtual('daysUntilExpiry').get(function() {
  const now = new Date();
  const expiry = new Date(this.expiryDate);
  const diffTime = expiry - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Pre-save middleware to generate prescription number
prescriptionSchema.pre('save', function(next) {
  if (!this.prescriptionNumber) {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    this.prescriptionNumber = `RX-${timestamp}-${randomStr}`.toUpperCase();
  }
  
  // Set expiry date if not provided (default 1 year)
  if (!this.expiryDate) {
    this.expiryDate = new Date();
    this.expiryDate.setFullYear(this.expiryDate.getFullYear() + 1);
  }
  
  next();
});

// Method to check drug allergies
prescriptionSchema.methods.checkAllergies = async function(patientAllergies) {
  const allergicDrugs = [];
  
  this.medications.forEach(med => {
    patientAllergies.forEach(allergy => {
      if (med.drugName.toLowerCase().includes(allergy.allergen.toLowerCase()) ||
          med.genericName?.toLowerCase().includes(allergy.allergen.toLowerCase())) {
        allergicDrugs.push({
          drug: med.drugName,
          allergen: allergy.allergen,
          severity: allergy.severity
        });
      }
    });
  });
  
  return allergicDrugs;
};

// Method to add audit trail entry
prescriptionSchema.methods.addAuditEntry = function(action, userId, details) {
  this.auditTrail.push({
    action,
    performedBy: userId,
    details,
    timestamp: new Date()
  });
  return this.save();
};

// Static method to get active prescriptions for patient
prescriptionSchema.statics.getActiveForPatient = function(patientId) {
  return this.find({
    patient: patientId,
    status: 'active',
    expiryDate: { $gt: new Date() }
  })
  .populate('doctor', 'firstName lastName specialization')
  .sort({ createdAt: -1 });
};

// Static method to check for drug interactions
prescriptionSchema.statics.checkInteractions = function(medications) {
  // This would integrate with a drug interaction database
  // For now, return a simple check
  const interactions = [];
  
  // Example interaction check (would be replaced with real drug database)
  const knownInteractions = {
    'warfarin': ['aspirin', 'ibuprofen'],
    'metformin': ['alcohol'],
    'lisinopril': ['potassium supplements']
  };
  
  medications.forEach((med1, index) => {
    medications.slice(index + 1).forEach(med2 => {
      const drug1 = med1.drugName.toLowerCase();
      const drug2 = med2.drugName.toLowerCase();
      
      if (knownInteractions[drug1]?.includes(drug2) || 
          knownInteractions[drug2]?.includes(drug1)) {
        interactions.push({
          drug1: med1.drugName,
          drug2: med2.drugName,
          severity: 'moderate',
          description: 'Potential drug interaction detected'
        });
      }
    });
  });
  
  return interactions;
};

module.exports = mongoose.model('Prescription', prescriptionSchema);
