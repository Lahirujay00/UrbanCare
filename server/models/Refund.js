const mongoose = require('mongoose');

const refundSchema = new mongoose.Schema({
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  originalPayment: {
    transactionId: String,
    amount: {
      type: Number,
      required: true
    },
    paymentMethod: String,
    paymentDate: Date
  },
  refundAmount: {
    type: Number,
    required: true,
    min: 0
  },
  refundReason: {
    type: String,
    enum: [
      'appointment-cancelled',
      'doctor-unavailable',
      'technical-issue',
      'patient-request',
      'medical-emergency',
      'system-error',
      'duplicate-payment',
      'other'
    ],
    required: true
  },
  refundDescription: {
    type: String,
    required: true,
    trim: true
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'processed', 'failed', 'cancelled'],
    default: 'pending'
  },
  approvalWorkflow: {
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    reviewComments: String,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date,
    approvalComments: String
  },
  refundDetails: {
    refundTransactionId: String,
    refundMethod: {
      type: String,
      enum: ['original-payment-method', 'bank-transfer', 'cash', 'credit-note']
    },
    refundDate: Date,
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    bankDetails: {
      accountNumber: String,
      routingNumber: String,
      accountHolderName: String,
      bankName: String
    },
    gatewayResponse: {
      success: Boolean,
      message: String,
      gatewayTransactionId: String,
      errorCode: String
    }
  },
  attachments: [{
    fileName: String,
    filePath: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  timeline: [{
    action: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    performedAt: {
      type: Date,
      default: Date.now
    },
    comments: String,
    previousStatus: String,
    newStatus: String
  }],
  notifications: {
    patientNotified: {
      type: Boolean,
      default: false
    },
    adminNotified: {
      type: Boolean,
      default: false
    },
    emailSent: {
      type: Boolean,
      default: false
    },
    smsSent: {
      type: Boolean,
      default: false
    }
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  expectedProcessingTime: {
    type: Number, // in hours
    default: 72
  },
  actualProcessingTime: Number,
  refundPolicy: {
    policyVersion: String,
    cancellationFee: {
      type: Number,
      default: 0
    },
    refundPercentage: {
      type: Number,
      default: 100,
      min: 0,
      max: 100
    }
  }
}, {
  timestamps: true
});

// Index for efficient queries
refundSchema.index({ patient: 1, createdAt: -1 });
refundSchema.index({ status: 1 });
refundSchema.index({ appointment: 1 });
refundSchema.index({ 'refundDetails.refundDate': 1 });

// Add timeline entry
refundSchema.methods.addTimelineEntry = function(action, performedBy, comments, previousStatus, newStatus) {
  this.timeline.push({
    action,
    performedBy,
    comments,
    previousStatus,
    newStatus
  });
  return this.save();
};

// Calculate refund amount based on policy
refundSchema.methods.calculateRefundAmount = function() {
  const originalAmount = this.originalPayment.amount;
  const refundPercentage = this.refundPolicy.refundPercentage || 100;
  const cancellationFee = this.refundPolicy.cancellationFee || 0;
  
  const refundAmount = (originalAmount * refundPercentage / 100) - cancellationFee;
  return Math.max(0, refundAmount);
};

// Update status with timeline
refundSchema.methods.updateStatus = function(newStatus, performedBy, comments) {
  const previousStatus = this.status;
  this.status = newStatus;
  
  this.addTimelineEntry(
    `Status changed to ${newStatus}`,
    performedBy,
    comments,
    previousStatus,
    newStatus
  );
  
  return this.save();
};

// Check if refund is eligible
refundSchema.statics.checkEligibility = function(appointment) {
  const now = new Date();
  const appointmentDate = new Date(appointment.appointmentDate);
  
  // Can't refund past appointments
  if (appointmentDate < now) {
    return {
      eligible: false,
      reason: 'Cannot refund past appointments'
    };
  }
  
  // Check if already refunded
  if (appointment.paymentStatus === 'refunded') {
    return {
      eligible: false,
      reason: 'Appointment already refunded'
    };
  }
  
  // Check if payment was made
  if (appointment.paymentStatus !== 'paid') {
    return {
      eligible: false,
      reason: 'No payment found for this appointment'
    };
  }
  
  return {
    eligible: true,
    reason: 'Eligible for refund'
  };
};

// Calculate processing time
refundSchema.pre('save', function(next) {
  if (this.status === 'processed' && !this.actualProcessingTime) {
    const processingTime = (new Date() - this.createdAt) / (1000 * 60 * 60); // in hours
    this.actualProcessingTime = Math.round(processingTime * 100) / 100;
  }
  next();
});

module.exports = mongoose.model('Refund', refundSchema);
