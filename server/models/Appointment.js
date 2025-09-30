const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  // Patient and Doctor Information
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Patient is required']
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Doctor is required']
  },
  
  // Appointment Details
  appointmentDate: {
    type: Date,
    required: [true, 'Appointment date is required']
  },
  appointmentTime: {
    type: String,
    required: [true, 'Appointment time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide time in HH:MM format']
  },
  duration: {
    type: Number,
    default: 30, // minutes
    min: [15, 'Minimum appointment duration is 15 minutes'],
    max: [120, 'Maximum appointment duration is 120 minutes']
  },
  
  // Status and Type
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled'
  },
  appointmentType: {
    type: String,
    enum: ['consultation', 'follow-up', 'check-up', 'emergency', 'routine'],
    required: [true, 'Appointment type is required']
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  // Medical Information
  chiefComplaint: {
    type: String,
    required: [true, 'Chief complaint is required'],
    maxlength: [500, 'Chief complaint cannot exceed 500 characters']
  },
  symptoms: [String],
  notes: {
    patient: String,
    doctor: String,
    staff: String
  },
  
  // Payment Information
  consultationFee: {
    type: Number,
    required: [true, 'Consultation fee is required'],
    min: [0, 'Consultation fee cannot be negative']
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'cash', 'insurance', 'online'],
    required: function() {
      return this.paymentStatus === 'paid';
    }
  },
  transactionId: String,
  paymentDate: Date,
  
  // Digital Check-in
  checkIn: {
    time: Date,
    method: {
      type: String,
      enum: ['qr-code', 'manual', 'digital-card']
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // Follow-up
  followUp: {
    required: {
      type: Boolean,
      default: false
    },
    suggestedDate: Date,
    notes: String
  },
  
  // Prescription and Treatment
  prescription: [{
    medication: String,
    dosage: String,
    frequency: String,
    duration: String,
    instructions: String
  }],
  
  // Vital Signs (recorded during appointment)
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
    oxygenSaturation: Number
  },
  
  // Diagnosis
  diagnosis: {
    primary: String,
    secondary: [String],
    icd10Codes: [String]
  },
  
  // Lab Tests and Referrals
  labTests: [{
    testName: String,
    ordered: Boolean,
    completed: Boolean,
    results: String,
    resultDate: Date
  }],
  referrals: [{
    specialization: String,
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    urgent: Boolean
  }],
  
  // Cancellation
  cancellation: {
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    cancelledAt: Date,
    reason: String,
    refundAmount: Number
  },
  
  // Notifications
  notifications: {
    reminderSent: {
      type: Boolean,
      default: false
    },
    confirmationSent: {
      type: Boolean,
      default: false
    },
    followUpSent: {
      type: Boolean,
      default: false
    }
  },
  
  // Room/Location
  room: String,
  department: String,
  
  // Rating and Feedback
  rating: {
    patientRating: {
      type: Number,
      min: 1,
      max: 5
    },
    patientFeedback: String,
    doctorRating: {
      type: Number,
      min: 1,
      max: 5
    },
    doctorFeedback: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for appointment end time
appointmentSchema.virtual('endTime').get(function() {
  if (!this.appointmentTime || !this.duration) return null;
  
  const [hours, minutes] = this.appointmentTime.split(':').map(Number);
  const startTime = new Date();
  startTime.setHours(hours, minutes, 0, 0);
  
  const endTime = new Date(startTime.getTime() + this.duration * 60000);
  return endTime.toTimeString().slice(0, 5);
});

// Virtual for full appointment datetime
appointmentSchema.virtual('appointmentDateTime').get(function() {
  if (!this.appointmentDate || !this.appointmentTime) return null;
  
  const date = new Date(this.appointmentDate);
  const [hours, minutes] = this.appointmentTime.split(':').map(Number);
  date.setHours(hours, minutes, 0, 0);
  
  return date;
});

// Index for efficient queries
appointmentSchema.index({ patient: 1, appointmentDate: 1 });
appointmentSchema.index({ doctor: 1, appointmentDate: 1 });
appointmentSchema.index({ status: 1, appointmentDate: 1 });
appointmentSchema.index({ appointmentDate: 1, appointmentTime: 1 });

// Compound index for availability checking
appointmentSchema.index({ 
  doctor: 1, 
  appointmentDate: 1, 
  appointmentTime: 1,
  status: 1 
});

// Pre-save middleware to validate appointment time
appointmentSchema.pre('save', function(next) {
  // Check if appointment is in the future
  const appointmentDateTime = this.appointmentDateTime;
  if (appointmentDateTime && appointmentDateTime <= new Date()) {
    return next(new Error('Appointment must be scheduled for a future date and time'));
  }
  
  // Check if appointment is during doctor's available hours
  // This would typically be implemented with doctor's schedule
  
  next();
});

// Static method to find available slots
appointmentSchema.statics.findAvailableSlots = async function(doctorId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const bookedAppointments = await this.find({
    doctor: doctorId,
    appointmentDate: {
      $gte: startOfDay,
      $lte: endOfDay
    },
    status: { $in: ['scheduled', 'confirmed', 'in-progress'] }
  }).select('appointmentTime duration');
  
  return bookedAppointments;
};

// Static method to check appointment conflicts
appointmentSchema.statics.hasConflict = async function(doctorId, date, time, duration, excludeId = null) {
  const query = {
    doctor: doctorId,
    appointmentDate: date,
    status: { $in: ['scheduled', 'confirmed', 'in-progress'] }
  };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  const existingAppointments = await this.find(query);
  
  const [newHours, newMinutes] = time.split(':').map(Number);
  const newStart = newHours * 60 + newMinutes;
  const newEnd = newStart + duration;
  
  for (const appointment of existingAppointments) {
    const [existingHours, existingMinutes] = appointment.appointmentTime.split(':').map(Number);
    const existingStart = existingHours * 60 + existingMinutes;
    const existingEnd = existingStart + appointment.duration;
    
    // Check for overlap
    if (newStart < existingEnd && newEnd > existingStart) {
      return true;
    }
  }
  
  return false;
};

// Method to send reminder notification
appointmentSchema.methods.sendReminder = function() {
  // Implementation would use notification service
  this.notifications.reminderSent = true;
  return this.save();
};

module.exports = mongoose.model('Appointment', appointmentSchema);