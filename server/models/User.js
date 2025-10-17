const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  
  // Role and Status
  role: {
    type: String,
    enum: ['patient', 'doctor', 'staff', 'manager'],
    default: 'patient'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  
  // Contact Information
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^\+?[\d\s-()]+$/, 'Please provide a valid phone number']
  },
  dateOfBirth: {
    type: Date,
    required: function() {
      return this.role === 'patient';
    }
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer-not-to-say'],
    required: function() {
      return this.role === 'patient';
    }
  },
  
  // Address
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: {
      type: String,
      default: 'USA'
    }
  },
  
  // Digital Health Card
  digitalHealthCardId: {
    type: String,
    unique: true,
    sparse: true
  },
  
  // Emergency Contact (for patients)
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String,
    email: String
  },
  
  // Medical Information (for patients)
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: false // Allow patients to add this information later
  },
  allergies: [{
    allergen: String,
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe']
    },
    notes: String
  }],
  chronicConditions: [String],
  currentMedications: [{
    medication: String,
    dosage: String,
    frequency: String,
    prescribedBy: String,
    startDate: Date
  }],
  
  // Professional Information (for healthcare staff)
  licenseNumber: {
    type: String,
    required: false // Allow completion during profile setup
  },
  specialization: {
    type: String,
    required: false // Allow completion during profile setup
  },
  department: {
    type: String,
    required: false // Allow completion during profile setup
  },
  yearsOfExperience: {
    type: Number,
    required: false // Allow completion during profile setup
  },
  qualification: {
    type: String,
    required: false
  },
  consultationFee: {
    type: Number,
    required: false // Allow completion during profile setup
  },
  // Doctor Schedule
  schedule: {
    monday: { start: String, end: String, available: Boolean },
    tuesday: { start: String, end: String, available: Boolean },
    wednesday: { start: String, end: String, available: Boolean },
    thursday: { start: String, end: String, available: Boolean },
    friday: { start: String, end: String, available: Boolean },
    saturday: { start: String, end: String, available: Boolean },
    sunday: { start: String, end: String, available: Boolean }
  },
  
  // Doctor Availability (Weekly schedule)
  availability: {
    monday: {
      enabled: { type: Boolean, default: false },
      startTime: { type: String, default: '09:00' },
      endTime: { type: String, default: '17:00' }
    },
    tuesday: {
      enabled: { type: Boolean, default: false },
      startTime: { type: String, default: '09:00' },
      endTime: { type: String, default: '17:00' }
    },
    wednesday: {
      enabled: { type: Boolean, default: false },
      startTime: { type: String, default: '09:00' },
      endTime: { type: String, default: '17:00' }
    },
    thursday: {
      enabled: { type: Boolean, default: false },
      startTime: { type: String, default: '09:00' },
      endTime: { type: String, default: '17:00' }
    },
    friday: {
      enabled: { type: Boolean, default: false },
      startTime: { type: String, default: '09:00' },
      endTime: { type: String, default: '17:00' }
    },
    saturday: {
      enabled: { type: Boolean, default: false },
      startTime: { type: String, default: '09:00' },
      endTime: { type: String, default: '13:00' }
    },
    sunday: {
      enabled: { type: Boolean, default: false },
      startTime: { type: String, default: '09:00' },
      endTime: { type: String, default: '13:00' }
    }
  },
  
  // Date-specific slot bookings
  dateSlots: {
    type: Map,
    of: [String],
    default: new Map()
  },
  qualifications: [String],
  languages: [String],
  experience: String,
  workingDays: [String],
  workingHours: {
    start: String,
    end: String
  },
  
  // Patient medical information fields
  medicalInfo: {
    bloodType: String,
    allergies: [String],
    chronicConditions: [String],
    currentMedications: [String],
    emergencyContact: {
      name: String,
      relationship: String,
      phoneNumber: String
    },
    insuranceProvider: String,
    insurancePolicyNumber: String,
    height: Number,
    weight: Number
  },
  phoneNumber: String,
  
  // Identity Verification (for patients)
  identityVerificationStatus: {
    type: String,
    enum: ['unverified', 'pending', 'verified', 'rejected'],
    default: 'unverified'
  },
  verificationNote: {
    type: String,
    default: ''
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: {
    type: Date
  },
  nicDocument: {
    filename: String,
    path: String,
    uploadedAt: Date,
    mimetype: String
  },
  nicNumber: {
    type: String,
    sparse: true
  },
  healthCardNumber: {
    type: String
  },
  healthCardVersion: {
    type: String
  },
  
  // Security
  passwordResetToken: String,
  passwordResetExpires: Date,
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  
  // Enhanced Security
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockoutUntil: Date,
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String,
    select: false
  },
  trustedDevices: [{
    fingerprint: String,
    lastUsed: Date,
    trusted: {
      type: Boolean,
      default: false
    },
    userAgent: String,
    platform: String
  }],
  sessionTokens: [{
    token: String,
    device: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: Date
  }],
  
  // Preferences
  notifications: {
    email: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: true
    },
    push: {
      type: Boolean,
      default: true
    }
  },
  
  // Timestamps
  lastLogin: Date,
  lastPasswordChange: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for age
userSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Index for search functionality
userSchema.index({
  firstName: 'text',
  lastName: 'text',
  email: 'text',
  specialization: 'text',
  department: 'text'
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  // Hash password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Pre-save middleware to generate digital health card ID for patients
userSchema.pre('save', function(next) {
  if (this.role === 'patient' && !this.digitalHealthCardId) {
    // Generate unique digital health card ID
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    this.digitalHealthCardId = `HC-${timestamp}-${randomStr}`.toUpperCase();
  }
  next();
});

// Instance method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to generate JWT token
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { 
      id: this._id,
      email: this.email,
      role: this.role
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Instance method to generate refresh token
userSchema.methods.generateRefreshToken = function() {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE }
  );
};

// Static method to find doctors by specialization
userSchema.statics.findDoctorsBySpecialization = function(specialization) {
  return this.find({
    role: 'doctor',
    specialization: new RegExp(specialization, 'i'),
    isActive: true
  }).select('-password');
};

module.exports = mongoose.model('User', userSchema);