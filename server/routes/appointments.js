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
    
    if (status) query.status = status;
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
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

    // Create appointment
    const appointment = await Appointment.create({
      patient: req.user.id,
      doctor,
      appointmentDate,
      appointmentTime,
      duration,
      appointmentType,
      chiefComplaint,
      symptoms,
      consultationFee: doctorUser.consultationFee,
      status: 'scheduled'
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
      message: 'Server error'
    });
  }
});

module.exports = router;