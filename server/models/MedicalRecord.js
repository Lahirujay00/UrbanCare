const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  // Patient Information
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Patient is required'],
    index: true
  },
  
  // Record Type
  recordType: {
    type: String,
    enum: ['diagnosis', 'prescription', 'lab-result', 'imaging', 'surgery', 'vaccination', 'consultation', 'treatment-plan', 'other'],
    required: [true, 'Record type is required']
  },
  
  // Related Appointment
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  
  // Healthcare Provider
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Record Details
  title: {
    type: String,
    required: [true, 'Record title is required'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  
  // Diagnosis Information
  diagnosis: {
    primary: String,
    secondary: [String],
    icd10Codes: [String],
    severity: {
      type: String,
      enum: ['low', 'moderate', 'high', 'critical']
    }
  },
  
  // Prescription Information
  prescriptions: [{
    medication: {
      type: String,
      required: true
    },
    dosage: String,
    frequency: String,
    duration: String,
    instructions: String,
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: Date,
    refills: Number
  }],
  
  // Lab Results
  labResults: {
    testName: String,
    testDate: Date,
    results: [{
      parameter: String,
      value: String,
      unit: String,
      normalRange: String,
      status: {
        type: String,
        enum: ['normal', 'abnormal', 'critical']
      }
    }],
    interpretation: String,
    reportUrl: String
  },
  
  // Imaging Results
  imagingResults: {
    type: String,
    scanDate: Date,
    findings: String,
    impression: String,
    imageUrls: [String],
    radiologist: String
  },
  
  // Vital Signs
  vitalSigns: {
    bloodPressure: {
      systolic: Number,
      diastolic: Number
    },
    heartRate: Number,
    temperature: Number,
    weight: Number,
    height: Number,
    respiratoryRate: Number,
    oxygenSaturation: Number,
    bmi: Number,
    recordedAt: Date
  },
  
  // Attachments
  attachments: [{
    fileName: String,
    fileType: String,
    fileUrl: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    size: Number
  }],
  
  // Notes and Observations
  notes: String,
  observations: String,
  
  // Follow-up Information
  followUp: {
    required: {
      type: Boolean,
      default: false
    },
    date: Date,
    instructions: String,
    completed: {
      type: Boolean,
      default: false
    }
  },
  
  // Status and Access
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active'
  },
  isConfidential: {
    type: Boolean,
    default: false
  },
  
  // Access Control
  accessLog: [{
    accessedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    accessedAt: {
      type: Date,
      default: Date.now
    },
    action: {
      type: String,
      enum: ['create', 'view', 'edit', 'delete']
    },
    ipAddress: String
  }],
  
  // Version Control
  version: {
    type: Number,
    default: 1
  },
  previousVersions: [{
    versionNumber: Number,
    modifiedAt: Date,
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changes: String,
    data: mongoose.Schema.Types.Mixed
  }],
  
  // Metadata
  tags: [String],
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
medicalRecordSchema.index({ patient: 1, createdAt: -1 });
medicalRecordSchema.index({ recordType: 1, createdAt: -1 });
medicalRecordSchema.index({ appointment: 1 });
medicalRecordSchema.index({ doctor: 1, createdAt: -1 });
medicalRecordSchema.index({ status: 1 });

// Text index for search
medicalRecordSchema.index({
  title: 'text',
  description: 'text',
  'diagnosis.primary': 'text',
  tags: 'text'
});

// Virtual for record age
medicalRecordSchema.virtual('recordAge').get(function() {
  const now = new Date();
  const created = new Date(this.createdAt);
  const diffTime = Math.abs(now - created);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Method to log access
medicalRecordSchema.methods.logAccess = function(userId, action, ipAddress) {
  this.accessLog.push({
    accessedBy: userId,
    action,
    ipAddress,
    accessedAt: new Date()
  });
  return this.save();
};

// Method to create version
medicalRecordSchema.methods.createVersion = function(userId, changes) {
  this.previousVersions.push({
    versionNumber: this.version,
    modifiedAt: new Date(),
    modifiedBy: userId,
    changes,
    data: this.toObject()
  });
  this.version += 1;
  return this.save();
};

// Static method to get patient summary
medicalRecordSchema.statics.getPatientSummary = async function(patientId) {
  const summary = await this.aggregate([
    { $match: { patient: mongoose.Types.ObjectId(patientId), status: 'active' } },
    {
      $group: {
        _id: '$recordType',
        count: { $sum: 1 },
        latestRecord: { $max: '$createdAt' }
      }
    }
  ]);
  
  return summary;
};

// Pre-save middleware to calculate BMI if height and weight are present
medicalRecordSchema.pre('save', function(next) {
  if (this.vitalSigns && this.vitalSigns.weight && this.vitalSigns.height) {
    const heightInMeters = this.vitalSigns.height / 100;
    this.vitalSigns.bmi = (this.vitalSigns.weight / (heightInMeters * heightInMeters)).toFixed(2);
  }
  next();
});

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
