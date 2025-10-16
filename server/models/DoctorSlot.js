const mongoose = require('mongoose');

/**
 * Doctor Slot Management Model
 * Allows doctors to manage their availability, block specific slots, and set temporary unavailability
 */
const doctorSlotSchema = new mongoose.Schema({
  // Doctor Information
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Doctor is required'],
    index: true
  },
  
  // Date and Time Information
  date: {
    type: Date,
    required: [true, 'Date is required'],
    index: true
  },
  
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format']
  },
  
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format']
  },
  
  duration: {
    type: Number,
    required: [true, 'Duration in minutes is required'],
    min: [5, 'Minimum slot duration is 5 minutes'],
    max: [480, 'Maximum slot duration is 8 hours']
  },
  
  // Slot Status
  status: {
    type: String,
    enum: ['AVAILABLE', 'BLOCKED', 'BOOKED', 'COMPLETED', 'CANCELLED'],
    default: 'AVAILABLE',
    index: true
  },
  
  // Availability Type
  slotType: {
    type: String,
    enum: ['REGULAR', 'EMERGENCY', 'CONSULTATION', 'FOLLOW_UP', 'BLOCKED'],
    default: 'REGULAR'
  },
  
  // Blocking Information (when doctor blocks a slot)
  blockingInfo: {
    reason: {
      type: String,
      enum: [
        'PERSONAL_TIME',
        'MEETING', 
        'SURGERY',
        'EMERGENCY',
        'TRAINING',
        'VACATION',
        'SICK_LEAVE',
        'ADMINISTRATIVE',
        'OTHER'
      ]
    },
    description: {
      type: String,
      maxlength: [200, 'Description cannot exceed 200 characters']
    },
    blockedAt: {
      type: Date,
      default: Date.now
    },
    blockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // Appointment Information (when slot is booked)
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  
  // Recurring Slot Information
  isRecurring: {
    type: Boolean,
    default: false
  },
  
  recurringPattern: {
    frequency: {
      type: String,
      enum: ['DAILY', 'WEEKLY', 'MONTHLY']
    },
    interval: Number, // Every X days/weeks/months
    daysOfWeek: [Number], // 0-6 (Sunday-Saturday)
    endDate: Date,
    exceptions: [Date] // Dates to skip
  },
  
  // Special Instructions
  instructions: {
    type: String,
    maxlength: [300, 'Instructions cannot exceed 300 characters']
  },
  
  // Location/Room Information
  location: {
    room: String,
    building: String,
    floor: String,
    department: String
  },
  
  // Capacity (for group appointments)
  maxPatients: {
    type: Number,
    default: 1,
    min: 1
  },
  
  currentBookings: {
    type: Number,
    default: 0
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for efficient querying
doctorSlotSchema.index({ doctor: 1, date: 1, startTime: 1 });
doctorSlotSchema.index({ doctor: 1, status: 1, date: 1 });
doctorSlotSchema.index({ date: 1, status: 1 });
doctorSlotSchema.index({ doctor: 1, isRecurring: 1 });

// Unique constraint to prevent overlapping slots
doctorSlotSchema.index(
  { doctor: 1, date: 1, startTime: 1, endTime: 1 }, 
  { unique: true }
);

// Virtual for full datetime
doctorSlotSchema.virtual('fullDateTime').get(function() {
  const dateStr = this.date.toISOString().split('T')[0];
  return `${dateStr}T${this.startTime}:00`;
});

// Virtual for slot duration in hours
doctorSlotSchema.virtual('durationHours').get(function() {
  return this.duration / 60;
});

// Virtual to check if slot is in the past
doctorSlotSchema.virtual('isPast').get(function() {
  const now = new Date();
  const slotDateTime = new Date(`${this.date.toISOString().split('T')[0]}T${this.startTime}:00`);
  return slotDateTime < now;
});

// Virtual to check if slot is today
doctorSlotSchema.virtual('isToday').get(function() {
  const today = new Date();
  const slotDate = new Date(this.date);
  return slotDate.toDateString() === today.toDateString();
});

// Pre-save validation
doctorSlotSchema.pre('save', function(next) {
  // Validate that end time is after start time
  const start = new Date(`2000-01-01T${this.startTime}:00`);
  const end = new Date(`2000-01-01T${this.endTime}:00`);
  
  if (end <= start) {
    return next(new Error('End time must be after start time'));
  }
  
  // Calculate duration if not provided
  if (!this.duration) {
    this.duration = (end - start) / (1000 * 60); // Convert to minutes
  }
  
  // Validate that slot is not in the past (for new slots)
  if (this.isNew) {
    const now = new Date();
    const slotDateTime = new Date(`${this.date.toISOString().split('T')[0]}T${this.startTime}:00`);
    
    if (slotDateTime < now) {
      return next(new Error('Cannot create slots in the past'));
    }
  }
  
  next();
});

// Method to block a slot
doctorSlotSchema.methods.blockSlot = function(reason, description, userId) {
  if (this.status === 'BOOKED') {
    throw new Error('Cannot block a slot that is already booked');
  }
  
  this.status = 'BLOCKED';
  this.slotType = 'BLOCKED';
  this.blockingInfo = {
    reason,
    description,
    blockedAt: new Date(),
    blockedBy: userId
  };
  
  return this.save();
};

// Method to unblock a slot
doctorSlotSchema.methods.unblockSlot = function() {
  if (this.status !== 'BLOCKED') {
    throw new Error('Slot is not currently blocked');
  }
  
  this.status = 'AVAILABLE';
  this.slotType = 'REGULAR';
  this.blockingInfo = undefined;
  
  return this.save();
};

// Method to book a slot
doctorSlotSchema.methods.bookSlot = function(appointmentId) {
  if (this.status !== 'AVAILABLE') {
    throw new Error('Slot is not available for booking');
  }
  
  if (this.currentBookings >= this.maxPatients) {
    throw new Error('Slot is at maximum capacity');
  }
  
  this.status = 'BOOKED';
  this.appointment = appointmentId;
  this.currentBookings += 1;
  
  return this.save();
};

// Static method to get doctor's availability for a date range
doctorSlotSchema.statics.getDoctorAvailability = function(doctorId, startDate, endDate) {
  return this.find({
    doctor: doctorId,
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  })
  .sort({ date: 1, startTime: 1 });
};

// Static method to get available slots for booking
doctorSlotSchema.statics.getAvailableSlots = function(doctorId, date) {
  const queryDate = new Date(date);
  const now = new Date();
  
  return this.find({
    doctor: doctorId,
    date: queryDate,
    status: 'AVAILABLE',
    $expr: {
      $gt: [
        {
          $dateFromString: {
            dateString: {
              $concat: [
                { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                "T",
                "$startTime",
                ":00"
              ]
            }
          }
        },
        now
      ]
    }
  })
  .sort({ startTime: 1 });
};

// Static method to create recurring slots
doctorSlotSchema.statics.createRecurringSlots = async function(doctorId, slotData, recurringPattern) {
  const slots = [];
  const startDate = new Date(slotData.startDate);
  const endDate = new Date(recurringPattern.endDate);
  
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    // Check if this date should be included based on pattern
    if (recurringPattern.frequency === 'WEEKLY') {
      const dayOfWeek = currentDate.getDay();
      if (!recurringPattern.daysOfWeek.includes(dayOfWeek)) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }
    }
    
    // Check if this date is in exceptions
    const isException = recurringPattern.exceptions?.some(exceptionDate => 
      new Date(exceptionDate).toDateString() === currentDate.toDateString()
    );
    
    if (!isException) {
      const slot = new this({
        doctor: doctorId,
        date: new Date(currentDate),
        startTime: slotData.startTime,
        endTime: slotData.endTime,
        duration: slotData.duration,
        slotType: slotData.slotType || 'REGULAR',
        isRecurring: true,
        recurringPattern,
        instructions: slotData.instructions,
        location: slotData.location,
        maxPatients: slotData.maxPatients || 1,
        createdBy: doctorId
      });
      
      slots.push(slot);
    }
    
    // Move to next date based on frequency
    switch (recurringPattern.frequency) {
      case 'DAILY':
        currentDate.setDate(currentDate.getDate() + (recurringPattern.interval || 1));
        break;
      case 'WEEKLY':
        currentDate.setDate(currentDate.getDate() + 1);
        break;
      case 'MONTHLY':
        currentDate.setMonth(currentDate.getMonth() + (recurringPattern.interval || 1));
        break;
    }
  }
  
  return await this.insertMany(slots);
};

// Static method to get today's blocked slots for doctor
doctorSlotSchema.statics.getTodayBlockedSlots = function(doctorId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return this.find({
    doctor: doctorId,
    date: {
      $gte: today,
      $lt: tomorrow
    },
    status: 'BLOCKED'
  })
  .sort({ startTime: 1 });
};

// Static method to check for slot conflicts
doctorSlotSchema.statics.checkConflicts = function(doctorId, date, startTime, endTime, excludeId = null) {
  const query = {
    doctor: doctorId,
    date: new Date(date),
    $or: [
      // New slot starts during existing slot
      {
        $and: [
          { startTime: { $lte: startTime } },
          { endTime: { $gt: startTime } }
        ]
      },
      // New slot ends during existing slot
      {
        $and: [
          { startTime: { $lt: endTime } },
          { endTime: { $gte: endTime } }
        ]
      },
      // New slot completely contains existing slot
      {
        $and: [
          { startTime: { $gte: startTime } },
          { endTime: { $lte: endTime } }
        ]
      }
    ]
  };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  return this.find(query);
};

module.exports = mongoose.model('DoctorSlot', doctorSlotSchema);
