const express = require('express');
const { body, validationResult } = require('express-validator');
const MedicalRecord = require('../models/MedicalRecord');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const router = express.Router();

// @desc    Get medical records
// @route   GET /api/medical-records
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let query = { status: 'active' };
    
    // Filter based on user role
    if (req.user.role === 'patient') {
      query.patient = req.user.id;
    } else if (req.user.role === 'doctor') {
      // Doctors can see records they created
      query.$or = [
        { doctor: req.user.id },
        { createdBy: req.user.id }
      ];
    }
    
    // Additional filters from query params
    const { patientId, recordType, startDate, endDate, search } = req.query;
    
    // Only admin, manager, and staff can filter by patient
    if (patientId && ['admin', 'manager', 'staff'].includes(req.user.role)) {
      query.patient = patientId;
    }
    
    if (recordType) {
      query.recordType = recordType;
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    if (search) {
      query.$text = { $search: search };
    }
    
    const records = await MedicalRecord.find(query)
      .populate('patient', 'firstName lastName email digitalHealthCardId')
      .populate('doctor', 'firstName lastName specialization')
      .populate('createdBy', 'firstName lastName role')
      .populate('appointment')
      .sort({ createdAt: -1 })
      .limit(parseInt(req.query.limit) || 50);
    
    // Log access for each record
    const clientIp = req.ip || req.connection.remoteAddress;
    for (const record of records) {
      await record.logAccess(req.user.id, 'view', clientIp);
    }
    
    res.json({
      success: true,
      count: records.length,
      data: { records }
    });
  } catch (error) {
    console.error('Get medical records error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get single medical record
// @route   GET /api/medical-records/:id
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id)
      .populate('patient', 'firstName lastName email phone digitalHealthCardId bloodType allergies')
      .populate('doctor', 'firstName lastName specialization department')
      .populate('createdBy', 'firstName lastName role')
      .populate('appointment');
    
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }
    
    // Check authorization
    const isAuthorized = 
      record.patient._id.toString() === req.user.id ||
      record.doctor?._id.toString() === req.user.id ||
      record.createdBy._id.toString() === req.user.id ||
      ['staff', 'manager', 'admin'].includes(req.user.role);
    
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this record'
      });
    }
    
    // Log access
    const clientIp = req.ip || req.connection.remoteAddress;
    await record.logAccess(req.user.id, 'view', clientIp);
    
    res.json({
      success: true,
      data: { record }
    });
  } catch (error) {
    console.error('Get medical record error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Create medical record
// @route   POST /api/medical-records
// @access  Private (Doctor, Staff, Admin)
router.post('/', 
  auth, 
  authorize('doctor', 'staff', 'admin'),
  [
    body('patient').isMongoId().withMessage('Valid patient ID is required'),
    body('recordType').isIn(['diagnosis', 'prescription', 'lab-result', 'imaging', 'surgery', 'vaccination', 'consultation', 'other']),
    body('title').isLength({ min: 5, max: 200 }).withMessage('Title must be between 5-200 characters'),
    body('description').isLength({ min: 10, max: 2000 }).withMessage('Description must be between 10-2000 characters')
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
      
      const { patient, recordType, title, description, appointment, doctor, ...otherFields } = req.body;
      
      // Verify patient exists
      const patientUser = await User.findOne({ _id: patient, role: 'patient', isActive: true });
      if (!patientUser) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }
      
      // Verify doctor if provided
      if (doctor) {
        const doctorUser = await User.findOne({ _id: doctor, role: 'doctor', isActive: true });
        if (!doctorUser) {
          return res.status(404).json({
            success: false,
            message: 'Doctor not found'
          });
        }
      }
      
      // Create record
      const record = await MedicalRecord.create({
        patient,
        recordType,
        title,
        description,
        appointment,
        doctor: doctor || (req.user.role === 'doctor' ? req.user.id : null),
        createdBy: req.user.id,
        ...otherFields
      });
      
      // Populate the record
      await record.populate([
        { path: 'patient', select: 'firstName lastName email' },
        { path: 'doctor', select: 'firstName lastName specialization' },
        { path: 'createdBy', select: 'firstName lastName role' }
      ]);
      
      // Log creation
      const clientIp = req.ip || req.connection.remoteAddress;
      await record.logAccess(req.user.id, 'create', clientIp);
      
      res.status(201).json({
        success: true,
        message: 'Medical record created successfully',
        data: { record }
      });
    } catch (error) {
      console.error('Create medical record error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  }
);

// @desc    Update medical record
// @route   PUT /api/medical-records/:id
// @access  Private (Doctor, Admin)
router.put('/:id', auth, authorize('doctor', 'admin'), async (req, res) => {
  try {
    let record = await MedicalRecord.findById(req.params.id);
    
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }
    
    // Check authorization
    const canEdit = 
      record.createdBy.toString() === req.user.id ||
      record.doctor?.toString() === req.user.id ||
      req.user.role === 'admin';
    
    if (!canEdit) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this record'
      });
    }
    
    // Create version before updating
    await record.createVersion(req.user.id, 'Record updated');
    
    // Update fields
    const allowedUpdates = [
      'title', 'description', 'diagnosis', 'prescriptions', 
      'labResults', 'imagingResults', 'vitalSigns', 'attachments',
      'notes', 'observations', 'followUp', 'tags', 'priority'
    ];
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        record[field] = req.body[field];
      }
    });
    
    await record.save();
    
    // Log update
    const clientIp = req.ip || req.connection.remoteAddress;
    await record.logAccess(req.user.id, 'edit', clientIp);
    
    await record.populate([
      { path: 'patient', select: 'firstName lastName email' },
      { path: 'doctor', select: 'firstName lastName specialization' },
      { path: 'createdBy', select: 'firstName lastName role' }
    ]);
    
    res.json({
      success: true,
      message: 'Medical record updated successfully',
      data: { record }
    });
  } catch (error) {
    console.error('Update medical record error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Delete/Archive medical record
// @route   DELETE /api/medical-records/:id
// @access  Private (Admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);
    
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }
    
    // Soft delete (archive)
    record.status = 'deleted';
    await record.save();
    
    // Log deletion
    const clientIp = req.ip || req.connection.remoteAddress;
    await record.logAccess(req.user.id, 'delete', clientIp);
    
    res.json({
      success: true,
      message: 'Medical record archived successfully'
    });
  } catch (error) {
    console.error('Delete medical record error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get patient medical summary
// @route   GET /api/medical-records/patient/:patientId/summary
// @access  Private
router.get('/patient/:patientId/summary', auth, async (req, res) => {
  try {
    const { patientId } = req.params;
    
    // Check authorization
    const isAuthorized = 
      patientId === req.user.id ||
      ['doctor', 'staff', 'manager', 'admin'].includes(req.user.role);
    
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this summary'
      });
    }
    
    const summary = await MedicalRecord.getPatientSummary(patientId);
    
    // Get latest records by type
    const latestRecords = await MedicalRecord.find({
      patient: patientId,
      status: 'active'
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('doctor', 'firstName lastName specialization')
    .select('recordType title createdAt priority');
    
    res.json({
      success: true,
      data: { 
        summary,
        latestRecords
      }
    });
  } catch (error) {
    console.error('Get patient summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
