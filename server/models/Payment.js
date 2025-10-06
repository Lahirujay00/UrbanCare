const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  // Transaction Details
  transactionId: {
    type: String,
    required: [true, 'Transaction ID is required'],
    unique: true,
    index: true
  },
  
  // Related Entities
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: [true, 'Appointment reference is required']
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Patient reference is required'],
    index: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Doctor reference is required']
  },
  
  // Payment Amount
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  
  // Breakdown
  breakdown: {
    consultationFee: {
      type: Number,
      default: 0
    },
    labTestsFee: {
      type: Number,
      default: 0
    },
    medicationFee: {
      type: Number,
      default: 0
    },
    facilityFee: {
      type: Number,
      default: 0
    },
    tax: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    }
  },
  
  // Payment Method
  paymentMethod: {
    type: String,
    enum: ['card', 'cash', 'insurance', 'online', 'bank-transfer', 'upi', 'wallet'],
    required: [true, 'Payment method is required']
  },
  paymentGateway: {
    type: String,
    enum: ['stripe', 'paypal', 'razorpay', 'square', 'manual'],
    default: 'stripe'
  },
  
  // Card Details (encrypted/tokenized)
  cardDetails: {
    last4: String,
    brand: String,
    expiryMonth: Number,
    expiryYear: Number,
    cardholderName: String
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'partially-refunded', 'cancelled'],
    default: 'pending',
    index: true
  },
  
  // Gateway Response
  gatewayResponse: {
    paymentIntentId: String,
    chargeId: String,
    receiptUrl: String,
    responseCode: String,
    responseMessage: String,
    rawResponse: mongoose.Schema.Types.Mixed
  },
  
  // Refund Information
  refund: {
    refundAmount: Number,
    refundDate: Date,
    refundReason: String,
    refundTransactionId: String,
    refundedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    refundStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed']
    }
  },
  
  // Insurance Information
  insurance: {
    provider: String,
    policyNumber: String,
    claimNumber: String,
    coverageAmount: Number,
    copayAmount: Number,
    deductibleAmount: Number,
    claimStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'partially-approved']
    },
    approvalDate: Date,
    rejectionReason: String
  },
  
  // Receipt and Invoice
  receiptNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  invoiceNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  receiptUrl: String,
  invoiceUrl: String,
  
  // Dates
  paymentDate: {
    type: Date,
    default: Date.now
  },
  dueDate: Date,
  
  // Billing Information
  billingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  
  // Notes and Metadata
  notes: String,
  internalNotes: String,
  
  // Verification
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date,
  
  // Retry Information (for failed payments)
  retryCount: {
    type: Number,
    default: 0
  },
  lastRetryAt: Date,
  nextRetryAt: Date,
  
  // Audit Trail
  auditLog: [{
    action: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    performedAt: {
      type: Date,
      default: Date.now
    },
    details: String,
    ipAddress: String
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
paymentSchema.index({ patient: 1, createdAt: -1 });
paymentSchema.index({ doctor: 1, createdAt: -1 });
paymentSchema.index({ appointment: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ paymentDate: 1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ receiptNumber: 1 });

// Virtual for net amount (after discount)
paymentSchema.virtual('netAmount').get(function() {
  return this.amount - (this.breakdown.discount || 0);
});

// Virtual for payment status display
paymentSchema.virtual('statusDisplay').get(function() {
  const statusMap = {
    'pending': 'Pending',
    'processing': 'Processing',
    'completed': 'Completed',
    'failed': 'Failed',
    'refunded': 'Refunded',
    'partially-refunded': 'Partially Refunded',
    'cancelled': 'Cancelled'
  };
  return statusMap[this.status] || this.status;
});

// Pre-save middleware to generate receipt/invoice numbers
paymentSchema.pre('save', function(next) {
  if (this.isNew) {
    // Generate receipt number
    if (!this.receiptNumber && this.status === 'completed') {
      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      this.receiptNumber = `RCP-${timestamp}-${random}`;
    }
    
    // Generate invoice number
    if (!this.invoiceNumber) {
      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      this.invoiceNumber = `INV-${timestamp}-${random}`;
    }
  }
  next();
});

// Method to add audit log entry
paymentSchema.methods.addAuditLog = function(action, userId, details, ipAddress) {
  this.auditLog.push({
    action,
    performedBy: userId,
    details,
    ipAddress,
    performedAt: new Date()
  });
  return this.save();
};

// Method to process refund
paymentSchema.methods.processRefund = async function(refundAmount, reason, userId) {
  if (this.status !== 'completed') {
    throw new Error('Only completed payments can be refunded');
  }
  
  if (refundAmount > this.amount) {
    throw new Error('Refund amount cannot exceed payment amount');
  }
  
  this.refund = {
    refundAmount,
    refundDate: new Date(),
    refundReason: reason,
    refundedBy: userId,
    refundStatus: 'pending'
  };
  
  if (refundAmount === this.amount) {
    this.status = 'refunded';
  } else {
    this.status = 'partially-refunded';
  }
  
  await this.addAuditLog('refund_initiated', userId, `Refund of ${refundAmount} initiated`);
  return this.save();
};

// Static method to get payment statistics
paymentSchema.statics.getStatistics = async function(startDate, endDate, filters = {}) {
  const matchStage = {
    paymentDate: { $gte: startDate, $lte: endDate },
    status: 'completed',
    ...filters
  };
  
  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$amount' },
        totalTransactions: { $sum: 1 },
        averageTransaction: { $avg: '$amount' },
        paymentMethods: { $push: '$paymentMethod' }
      }
    }
  ]);
  
  return stats[0] || {
    totalRevenue: 0,
    totalTransactions: 0,
    averageTransaction: 0,
    paymentMethods: []
  };
};

// Static method to get daily revenue
paymentSchema.statics.getDailyRevenue = async function(startDate, endDate) {
  return await this.aggregate([
    {
      $match: {
        paymentDate: { $gte: startDate, $lte: endDate },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$paymentDate' } },
        revenue: { $sum: '$amount' },
        transactions: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

module.exports = mongoose.model('Payment', paymentSchema);
