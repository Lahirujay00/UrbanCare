const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  medicalRecord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MedicalRecord'
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  documentType: {
    type: String,
    enum: [
      'lab-report',
      'prescription',
      'x-ray',
      'mri-scan',
      'ct-scan',
      'ultrasound',
      'ecg',
      'blood-test',
      'insurance-card',
      'id-proof',
      'medical-certificate',
      'discharge-summary',
      'vaccination-record',
      'other'
    ],
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  thumbnailUrl: String,
  isPublic: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  metadata: {
    width: Number,
    height: Number,
    pages: Number,
    duration: Number
  },
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
      enum: ['view', 'download', 'share', 'delete']
    },
    ipAddress: String
  }],
  shareSettings: {
    isShared: {
      type: Boolean,
      default: false
    },
    sharedWith: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      permissions: {
        type: String,
        enum: ['view', 'download', 'full'],
        default: 'view'
      },
      sharedAt: {
        type: Date,
        default: Date.now
      }
    }],
    publicLink: String,
    linkExpiry: Date
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active'
  },
  virusScanResult: {
    scanned: {
      type: Boolean,
      default: false
    },
    clean: Boolean,
    scanDate: Date,
    scanEngine: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
documentSchema.index({ patient: 1, createdAt: -1 });
documentSchema.index({ documentType: 1 });
documentSchema.index({ status: 1 });
documentSchema.index({ 'shareSettings.isShared': 1 });

// Log document access
documentSchema.methods.logAccess = function(userId, action, ipAddress) {
  this.accessLog.push({
    accessedBy: userId,
    action,
    ipAddress
  });
  return this.save();
};

// Share document with user
documentSchema.methods.shareWith = function(userId, permissions = 'view') {
  const existingShare = this.shareSettings.sharedWith.find(
    share => share.user.toString() === userId.toString()
  );
  
  if (existingShare) {
    existingShare.permissions = permissions;
    existingShare.sharedAt = new Date();
  } else {
    this.shareSettings.sharedWith.push({
      user: userId,
      permissions,
      sharedAt: new Date()
    });
  }
  
  this.shareSettings.isShared = true;
  return this.save();
};

// Check if user has access to document
documentSchema.methods.hasAccess = function(userId, userRole) {
  // Patient can access their own documents
  if (this.patient.toString() === userId.toString()) {
    return true;
  }
  
  // Staff, doctors, and admins can access all documents
  if (['staff', 'doctor', 'admin', 'manager'].includes(userRole)) {
    return true;
  }
  
  // Check if document is shared with user
  const sharedAccess = this.shareSettings.sharedWith.find(
    share => share.user.toString() === userId.toString()
  );
  
  return !!sharedAccess;
};

// Get file extension
documentSchema.virtual('fileExtension').get(function() {
  return this.fileName.split('.').pop().toLowerCase();
});

// Check if file is image
documentSchema.virtual('isImage').get(function() {
  const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
  return imageTypes.includes(this.fileExtension);
});

// Check if file is PDF
documentSchema.virtual('isPDF').get(function() {
  return this.fileExtension === 'pdf';
});

// Format file size
documentSchema.virtual('formattedSize').get(function() {
  const bytes = this.fileSize;
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

module.exports = mongoose.model('Document', documentSchema);
