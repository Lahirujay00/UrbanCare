const mongoose = require('mongoose');

const healthCardSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  cardNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  qrCode: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'suspended', 'revoked'],
    default: 'active'
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    required: true
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  emergencyContact: {
    name: String,
    relation: String,
    phone: String
  },
  allergies: [{
    type: String
  }],
  chronicConditions: [{
    condition: String,
    diagnosedDate: Date
  }],
  insuranceInfo: {
    provider: String,
    policyNumber: String,
    validUntil: Date
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
    accessType: {
      type: String,
      enum: ['scan', 'manual', 'verification', 'update']
    },
    location: String,
    purpose: String
  }],
  validationAttempts: [{
    timestamp: Date,
    success: Boolean,
    validatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    location: String
  }]
}, {
  timestamps: true
});

// Generate unique card number
healthCardSchema.statics.generateCardNumber = async function() {
  const prefix = 'HC';
  const year = new Date().getFullYear().toString().slice(-2);
  
  // Find the last card number for this year
  const lastCard = await this.findOne({
    cardNumber: new RegExp(`^${prefix}${year}`)
  }).sort({ cardNumber: -1 });
  
  let sequence = 1;
  if (lastCard) {
    const lastSequence = parseInt(lastCard.cardNumber.slice(-6));
    sequence = lastSequence + 1;
  }
  
  const cardNumber = `${prefix}${year}${sequence.toString().padStart(6, '0')}`;
  return cardNumber;
};

// Validate card
healthCardSchema.methods.validateCard = function() {
  if (this.status !== 'active') {
    return { valid: false, reason: 'Card is not active' };
  }
  
  if (new Date() > this.expiryDate) {
    this.status = 'expired';
    this.save();
    return { valid: false, reason: 'Card has expired' };
  }
  
  return { valid: true };
};

// Log access
healthCardSchema.methods.logAccess = function(accessedBy, accessType, location, purpose) {
  this.accessLog.push({
    accessedBy,
    accessType,
    location,
    purpose
  });
  return this.save();
};

module.exports = mongoose.model('HealthCard', healthCardSchema);
