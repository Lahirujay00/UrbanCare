const express = require('express');
const { body, validationResult } = require('express-validator');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const router = express.Router();

// @desc    Get appointments
// @route   GET /api/appointments
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    
    // Filter based on user role
    if (req.user.role === 'patient') {
      query.patient = req.user.id;
    } else if (req.user.role === 'doctor') {
      query.doctor = req.user.id;
    }
    
    // Additional filters
    const { status, date, doctorId, patientId } = req.query;
    
    if (status) {
      const statusArray = status.split(',');
      query.status = { $in: statusArray };
    }
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.appointmentDate = { $gte: startDate, $lt: endDate };
    }
    if (doctorId && ['staff', 'manager', 'admin'].includes(req.user.role)) {
      query.doctor = doctorId;
    }
    if (patientId && ['doctor', 'staff', 'manager', 'admin'].includes(req.user.role)) {
      query.patient = patientId;
    }

    const appointments = await Appointment.find(query)
      .populate('patient', 'firstName lastName email phone digitalHealthCardId')
      .populate('doctor', 'firstName lastName specialization department consultationFee')
      .sort({ appointmentDate: 1, appointmentTime: 1 });

    res.json({
      success: true,
      count: appointments.length,
      data: { appointments }
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Create appointment
// @route   POST /api/appointments
// @access  Private (Patient)
router.post('/', auth, authorize('patient'), [
  body('doctor').isMongoId().withMessage('Valid doctor ID is required'),
  body('appointmentDate').isISO8601().withMessage('Valid appointment date is required'),
  body('appointmentTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time format required (HH:MM)'),
  body('appointmentType').isIn(['consultation', 'follow-up', 'check-up', 'emergency', 'routine']),
  body('chiefComplaint').isLength({ min: 10, max: 500 }).withMessage('Chief complaint must be between 10-500 characters')
], async (req, res) => {
  try {
    console.log('Received appointment request body:', JSON.stringify(req.body, null, 2));
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Validation errors:', JSON.stringify(errors.array(), null, 2));
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { doctor, appointmentDate, appointmentTime, duration = 30, appointmentType, chiefComplaint, symptoms } = req.body;

    // Verify doctor exists
    const doctorUser = await User.findOne({ _id: doctor, role: 'doctor', isActive: true });
    if (!doctorUser) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Check for conflicts
    const hasConflict = await Appointment.hasConflict(doctor, appointmentDate, appointmentTime, duration);
    if (hasConflict) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is not available'
      });
    }

    // Create appointment with pending payment status
    const appointment = await Appointment.create({
      patient: req.user.id,
      doctor,
      appointmentDate,
      appointmentTime,
      duration: duration || 15,
      appointmentType,
      chiefComplaint,
      symptoms: symptoms || [],
      consultationFee: doctorUser.consultationFee || 100,
      status: 'pending-payment',
      paymentStatus: 'pending'
    });

    // Populate the appointment
    await appointment.populate([
      { path: 'patient', select: 'firstName lastName email phone' },
      { path: 'doctor', select: 'firstName lastName specialization department' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data: { appointment }
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get appointment by ID
// @route   GET /api/appointments/:id
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'firstName lastName email phone digitalHealthCardId bloodType allergies')
      .populate('doctor', 'firstName lastName specialization department consultationFee');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check authorization
    const isAuthorized = 
      appointment.patient._id.toString() === req.user.id ||
      appointment.doctor._id.toString() === req.user.id ||
      ['staff', 'manager', 'admin'].includes(req.user.role);

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this appointment'
      });
    }

    res.json({
      success: true,
      data: { appointment }
    });
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Check doctor availability
// @route   GET /api/appointments/availability/:doctorId
// @access  Public
router.get('/availability/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date parameter is required'
      });
    }

    const bookedSlots = await Appointment.findAvailableSlots(doctorId, date);

    res.json({
      success: true,
      data: { 
        date,
        bookedSlots: bookedSlots.map(apt => ({
          time: apt.appointmentTime,
          duration: apt.duration
        }))
      }
    });
  } catch (error) {
    console.error('Check availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Update appointment
// @route   PUT /api/appointments/:id
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    let appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check authorization
    const canEdit =
      appointment.patient.toString() === req.user.id ||
      appointment.doctor.toString() === req.user.id ||
      ['staff', 'manager', 'admin'].includes(req.user.role);

    if (!canEdit) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this appointment'
      });
    }

    // Allowed fields for update based on role
    const allowedUpdates = {
      patient: ['appointmentDate', 'appointmentTime', 'chiefComplaint', 'symptoms', 'notes.patient'],
      doctor: ['status', 'notes.doctor', 'prescription', 'vitalSigns', 'diagnosis', 'labTests', 'referrals', 'followUp'],
      staff: ['status', 'checkIn', 'room', 'notes.staff'],
      manager: ['status', 'room', 'department'],
      admin: ['status', 'room', 'department', 'appointmentDate', 'appointmentTime']
    };

    const userAllowedUpdates = allowedUpdates[req.user.role] || [];

    // If rescheduling, check for conflicts
    if (req.body.appointmentDate || req.body.appointmentTime) {
      const newDate = req.body.appointmentDate || appointment.appointmentDate;
      const newTime = req.body.appointmentTime || appointment.appointmentTime;
      const duration = appointment.duration;

      const hasConflict = await Appointment.hasConflict(
        appointment.doctor,
        newDate,
        newTime,
        duration,
        appointment._id
      );

      if (hasConflict) {
        return res.status(400).json({
          success: false,
          message: 'This time slot is not available'
        });
      }

      appointment.appointmentDate = newDate;
      appointment.appointmentTime = newTime;
    }

    // Update other fields
    Object.keys(req.body).forEach(key => {
      if (userAllowedUpdates.includes(key) && req.body[key] !== undefined) {
        if (key.includes('.')) {
          const [parent, child] = key.split('.');
          if (!appointment[parent]) appointment[parent] = {};
          appointment[parent][child] = req.body[key];
        } else {
          appointment[key] = req.body[key];
        }
      }
    });

    await appointment.save();

    await appointment.populate([
      { path: 'patient', select: 'firstName lastName email phone' },
      { path: 'doctor', select: 'firstName lastName specialization department' }
    ]);

    res.json({
      success: true,
      message: 'Appointment updated successfully',
      data: { appointment }
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Cancel appointment
// @route   DELETE /api/appointments/:id
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check authorization
    const canCancel =
      appointment.patient.toString() === req.user.id ||
      ['staff', 'manager', 'admin'].includes(req.user.role);

    if (!canCancel) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this appointment'
      });
    }

    // Update appointment status to cancelled
    appointment.status = 'cancelled';
    appointment.cancellation = {
      cancelledBy: req.user.id,
      cancelledAt: new Date(),
      reason: req.body.reason || 'No reason provided'
    };

    await appointment.save();

    // Note: Payment status remains 'paid' if payment was made
    // User can request refund separately through refund request flow

    await appointment.populate([
      { path: 'patient', select: 'firstName lastName email phone digitalHealthCardId' },
      { path: 'doctor', select: 'firstName lastName specialization department consultationFee' }
    ]);

    res.json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: { appointment }
    });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Update appointment status
// @route   PATCH /api/appointments/:id/status
// @access  Private (Doctor, Staff, Admin)
router.patch('/:id/status', 
  auth, 
  authorize('doctor', 'staff', 'admin'),
  [
    body('status').isIn(['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'])
      .withMessage('Invalid status')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const appointment = await Appointment.findById(req.params.id);

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found'
        });
      }

      appointment.status = req.body.status;
      await appointment.save();

      await appointment.populate([
        { path: 'patient', select: 'firstName lastName email phone' },
        { path: 'doctor', select: 'firstName lastName specialization department' }
      ]);

      // Emit socket event for real-time update
      const io = req.app.get('io');
      if (io) {
        io.to(appointment.patient.toString()).emit('appointment-status-update', {
          appointmentId: appointment._id,
          status: appointment.status,
          message: `Your appointment status has been updated to ${appointment.status}`
        });
      }

      res.json({
        success: true,
        message: 'Appointment status updated successfully',
        data: { appointment }
      });
    } catch (error) {
      console.error('Update appointment status error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  }
);

// @desc    Confirm payment and schedule appointment
// @route   POST /api/appointments/:id/confirm-payment
// @access  Private (Patient)
router.post('/:id/confirm-payment', auth, authorize('patient'), async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check authorization
    if (appointment.patient.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Check if already paid
    if (appointment.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Payment already processed'
      });
    }

    const { paymentMethod, transactionId } = req.body;

    console.log('Processing payment for appointment:', req.params.id);
    console.log('Payment method:', paymentMethod);
    console.log('Transaction ID:', transactionId);

    // Update appointment status
    appointment.status = 'scheduled';
    appointment.paymentStatus = 'paid';
    appointment.paymentMethod = paymentMethod || 'card';
    appointment.transactionId = transactionId || `TXN-${Date.now()}`;
    appointment.paymentDate = new Date();
    appointment.paymentDetails = {
      method: paymentMethod || 'card',
      transactionId: transactionId || `TXN-${Date.now()}`,
      paidAt: new Date(),
      amount: appointment.consultationFee,
      location: 'online'
    };

    console.log('Saving appointment with payment details...');
    await appointment.save();
    console.log('Payment saved successfully!');

    await appointment.populate([
      { path: 'patient', select: 'firstName lastName email phone' },
      { path: 'doctor', select: 'firstName lastName specialization department' }
    ]);

    res.json({
      success: true,
      message: 'Payment confirmed and appointment scheduled',
      data: { appointment }
    });
  } catch (error) {
    console.error('Confirm payment error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', JSON.stringify(error, null, 2));
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @desc    Schedule appointment without payment (Pay Later)
// @route   POST /api/appointments/:id/schedule-pay-later
// @access  Private (Patient)
router.post('/:id/schedule-pay-later', auth, authorize('patient'), async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check authorization
    if (appointment.patient.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Update appointment to scheduled with payment pending
    appointment.status = 'scheduled';
    appointment.paymentStatus = 'pay-at-hospital';
    appointment.paymentDetails = {
      method: 'pay-later',
      note: 'Payment will be processed at hospital',
      dueAt: appointment.appointmentDate
    };

    await appointment.save();

    await appointment.populate([
      { path: 'patient', select: 'firstName lastName email phone' },
      { path: 'doctor', select: 'firstName lastName specialization department' }
    ]);

    res.json({
      success: true,
      message: 'Appointment scheduled. Payment due at hospital.',
      data: { appointment }
    });
  } catch (error) {
    console.error('Schedule pay later error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Process payment at hospital (Staff)
// @route   POST /api/appointments/:id/hospital-payment
// @access  Private (Staff, Admin)
router.post('/:id/hospital-payment', auth, authorize('staff', 'admin'), async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if already paid
    if (appointment.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Payment already processed'
      });
    }

    const { paymentMethod, transactionId, insuranceDetails, governmentFund } = req.body;

    // Update appointment payment status
    appointment.paymentStatus = 'paid';
    appointment.paymentMethod = paymentMethod;
    appointment.transactionId = transactionId || `HSP-${Date.now()}`;
    appointment.paymentDate = new Date();
    appointment.paymentDetails = {
      method: paymentMethod,
      transactionId: transactionId || `HSP-${Date.now()}`,
      paidAt: new Date(),
      amount: appointment.consultationFee,
      processedBy: req.user.id,
      location: 'hospital',
      insuranceDetails: insuranceDetails || null,
      governmentFund: governmentFund || false
    };

    await appointment.save();

    await appointment.populate([
      { path: 'patient', select: 'firstName lastName email phone digitalHealthCardId' },
      { path: 'doctor', select: 'firstName lastName specialization department' },
      { path: 'paymentDetails.processedBy', select: 'firstName lastName' }
    ]);

    res.json({
      success: true,
      message: 'Payment processed successfully',
      data: { appointment }
    });
  } catch (error) {
    console.error('Hospital payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Check-in appointment
// @route   POST /api/appointments/:id/checkin
// @access  Private (Patient, Staff)
router.post('/:id/checkin', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check authorization
    const canCheckIn =
      appointment.patient.toString() === req.user.id ||
      ['staff', 'admin'].includes(req.user.role);

    if (!canCheckIn) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to check-in'
      });
    }

    // Verify payment if required (allow check-in if paying at hospital)
    if (appointment.paymentStatus !== 'paid' && 
        appointment.paymentStatus !== 'pay-at-hospital' && 
        appointment.consultationFee > 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment required before check-in'
      });
    }

    appointment.checkIn = {
      time: new Date(),
      method: req.body.method || 'manual',
      verifiedBy: req.user.role === 'staff' ? req.user.id : null
    };
    appointment.status = 'confirmed';

    await appointment.save();

    await appointment.populate([
      { path: 'patient', select: 'firstName lastName email phone digitalHealthCardId' },
      { path: 'doctor', select: 'firstName lastName specialization department' }
    ]);

    res.json({
      success: true,
      message: 'Check-in successful',
      data: { appointment }
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get patient's appointments
// @route   GET /api/appointments/patient/:patientId
// @access  Private
router.get('/patient/:patientId', auth, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { status, limit = 50 } = req.query;
    
    // Check if user can access this patient's appointments
    if (req.user.role === 'patient' && req.user.id !== patientId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access these appointments'
      });
    }
    
    let query = { patient: patientId };
    
    // Filter by status if provided
    if (status) {
      const statusArray = status.split(',');
      query.status = { $in: statusArray };
    }
    
    const appointments = await Appointment.find(query)
      .populate('doctor', 'firstName lastName specialization email phone')
      .populate('patient', 'firstName lastName email phone')
      .sort({ appointmentDate: -1 })
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      data: {
        appointments,
        count: appointments.length
      }
    });
  } catch (error) {
    console.error('Get patient appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get doctor's appointments
// @route   GET /api/appointments/doctor/:doctorId
// @access  Private
router.get('/doctor/:doctorId', auth, async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { status, date, limit = 50 } = req.query;
    
    // Check if user can access this doctor's appointments
    if (req.user.role === 'doctor' && req.user.id !== doctorId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access these appointments'
      });
    }
    
    let query = { doctor: doctorId };
    
    // Filter by status if provided
    if (status) {
      const statusArray = status.split(',');
      query.status = { $in: statusArray };
    }
    
    // Filter by date if provided
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.appointmentDate = { $gte: startDate, $lt: endDate };
    }
    
    const appointments = await Appointment.find(query)
      .populate('doctor', 'firstName lastName specialization email phone')
      .populate('patient', 'firstName lastName email phone dateOfBirth')
      .sort({ appointmentDate: 1 })
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      data: {
        appointments,
        count: appointments.length
      }
    });
  } catch (error) {
    console.error('Get doctor appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;