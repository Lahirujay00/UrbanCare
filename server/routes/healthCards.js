const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const HealthCard = require('../models/HealthCard');
const User = require('../models/User');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// @desc    Create health card for patient
// @route   POST /api/health-cards
// @access  Private (Staff, Admin)
router.post('/', auth, authorize('staff', 'admin'), async (req, res) => {
  try {
    const { 
      patientId, 
      bloodGroup, 
      emergencyContact, 
      allergies, 
      chronicConditions,
      insuranceInfo 
    } = req.body;

    // Check if patient exists
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Check if card already exists
    const existingCard = await HealthCard.findOne({ patient: patientId });
    if (existingCard) {
      return res.status(400).json({
        success: false,
        message: 'Health card already exists for this patient'
      });
    }

    // Generate card number
    const cardNumber = await HealthCard.generateCardNumber();

    // Create QR code data
    const qrData = {
      cardNumber,
      patientId,
      name: `${patient.firstName} ${patient.lastName}`,
      bloodGroup,
      emergencyContact: emergencyContact?.phone
    };

    // Generate QR code
    const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));

    // Set expiry date (5 years from now)
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 5);

    // Create health card
    const healthCard = new HealthCard({
      patient: patientId,
      cardNumber,
      qrCode,
      expiryDate,
      bloodGroup,
      emergencyContact,
      allergies: allergies || [],
      chronicConditions: chronicConditions || [],
      insuranceInfo
    });

    await healthCard.save();

    // Update user with health card ID
    await User.findByIdAndUpdate(patientId, {
      digitalHealthCardId: cardNumber
    });

    await healthCard.populate('patient', 'firstName lastName email phone');

    res.status(201).json({
      success: true,
      message: 'Health card created successfully',
      data: { healthCard }
    });

  } catch (error) {
    console.error('Create health card error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get health card by patient ID
// @route   GET /api/health-cards/patient/:patientId
// @access  Private (Patient own card, Staff, Doctor, Admin)
router.get('/patient/:patientId', auth, async (req, res) => {
  try {
    const { patientId } = req.params;

    // Check authorization
    if (req.user.role === 'patient' && req.user.id !== patientId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this health card'
      });
    }

    let healthCard = await HealthCard.findOne({ patient: patientId })
      .populate('patient', 'firstName lastName email phone dateOfBirth gender');

    if (!healthCard) {
      // Auto-create health card for patient if it doesn't exist
      const patient = await User.findById(patientId);
      if (!patient || patient.role !== 'patient') {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }

      // Generate card number
      const cardNumber = await HealthCard.generateCardNumber();

      // Create QR code data
      const qrData = {
        cardNumber,
        patientId,
        name: `${patient.firstName} ${patient.lastName}`,
        emergencyContact: patient.phone || 'Not provided'
      };

      // Generate QR code
      const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));

      // Create new health card
      healthCard = new HealthCard({
        patient: patientId,
        cardNumber,
        qrCode,
        bloodGroup: 'Not specified',
        emergencyContact: {
          name: 'Emergency Contact',
          phone: patient.phone || 'Not provided',
          relationship: 'Not specified'
        },
        allergies: [],
        chronicConditions: [],
        insuranceInfo: {
          provider: 'Not specified',
          policyNumber: 'Not provided'
        },
        isActive: true,
        createdBy: patientId // Auto-created
      });

      await healthCard.save();
      
      // Populate the patient data
      await healthCard.populate('patient', 'firstName lastName email phone dateOfBirth gender');
    }

    // Log access
    await healthCard.logAccess(
      req.user.id, 
      'manual', 
      req.ip, 
      'Card details viewed'
    );

    res.json({
      success: true,
      data: { healthCard }
    });

  } catch (error) {
    console.error('Get health card error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Validate health card by card number or QR scan
// @route   POST /api/health-cards/validate
// @access  Private (Staff, Doctor, Admin)
router.post('/validate', auth, authorize('staff', 'doctor', 'admin'), async (req, res) => {
  try {
    const { cardNumber, qrData } = req.body;

    let searchCriteria = {};
    
    if (cardNumber) {
      searchCriteria.cardNumber = cardNumber.toUpperCase();
    } else if (qrData) {
      try {
        const parsedData = JSON.parse(qrData);
        searchCriteria.cardNumber = parsedData.cardNumber;
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: 'Invalid QR code data'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Card number or QR data required'
      });
    }

    const healthCard = await HealthCard.findOne(searchCriteria)
      .populate('patient', 'firstName lastName email phone dateOfBirth gender');

    if (!healthCard) {
      return res.status(404).json({
        success: false,
        message: 'Health card not found'
      });
    }

    // Validate card
    const validation = healthCard.validateCard();
    
    // Log validation attempt
    healthCard.validationAttempts.push({
      timestamp: new Date(),
      success: validation.valid,
      validatedBy: req.user.id,
      location: req.ip
    });

    // Log access
    await healthCard.logAccess(
      req.user.id, 
      qrData ? 'scan' : 'verification', 
      req.ip, 
      'Card validation'
    );

    await healthCard.save();

    res.json({
      success: true,
      data: { 
        healthCard: validation.valid ? healthCard : null,
        validation 
      }
    });

  } catch (error) {
    console.error('Validate health card error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Update health card information
// @route   PUT /api/health-cards/:id
// @access  Private (Staff, Admin)
router.put('/:id', auth, authorize('staff', 'admin'), async (req, res) => {
  try {
    const { 
      bloodGroup, 
      emergencyContact, 
      allergies, 
      chronicConditions,
      insuranceInfo,
      status 
    } = req.body;

    const healthCard = await HealthCard.findById(req.params.id);
    
    if (!healthCard) {
      return res.status(404).json({
        success: false,
        message: 'Health card not found'
      });
    }

    // Update fields
    if (bloodGroup) healthCard.bloodGroup = bloodGroup;
    if (emergencyContact) healthCard.emergencyContact = emergencyContact;
    if (allergies) healthCard.allergies = allergies;
    if (chronicConditions) healthCard.chronicConditions = chronicConditions;
    if (insuranceInfo) healthCard.insuranceInfo = insuranceInfo;
    if (status) healthCard.status = status;

    // Log access
    await healthCard.logAccess(
      req.user.id, 
      'update', 
      req.ip, 
      'Card information updated'
    );

    await healthCard.save();
    await healthCard.populate('patient', 'firstName lastName email phone');

    res.json({
      success: true,
      message: 'Health card updated successfully',
      data: { healthCard }
    });

  } catch (error) {
    console.error('Update health card error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get health card access log
// @route   GET /api/health-cards/:id/access-log
// @access  Private (Staff, Admin)
router.get('/:id/access-log', auth, authorize('staff', 'admin'), async (req, res) => {
  try {
    const healthCard = await HealthCard.findById(req.params.id)
      .populate('accessLog.accessedBy', 'firstName lastName role')
      .populate('validationAttempts.validatedBy', 'firstName lastName role');

    if (!healthCard) {
      return res.status(404).json({
        success: false,
        message: 'Health card not found'
      });
    }

    res.json({
      success: true,
      data: { 
        accessLog: healthCard.accessLog,
        validationAttempts: healthCard.validationAttempts
      }
    });

  } catch (error) {
    console.error('Get access log error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Update health card information
// @route   PUT /api/health-cards/patient/:patientId
// @access  Private (Patient own card, Staff, Admin)
router.put('/patient/:patientId', auth, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { 
      bloodGroup, 
      emergencyContact, 
      allergies, 
      chronicConditions,
      insuranceInfo 
    } = req.body;

    // Check authorization
    if (req.user.role === 'patient' && req.user.id !== patientId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this health card'
      });
    }

    const healthCard = await HealthCard.findOne({ patient: patientId });
    if (!healthCard) {
      return res.status(404).json({
        success: false,
        message: 'Health card not found'
      });
    }

    // Update fields if provided
    if (bloodGroup) healthCard.bloodGroup = bloodGroup;
    if (emergencyContact) healthCard.emergencyContact = emergencyContact;
    if (allergies) healthCard.allergies = allergies;
    if (chronicConditions) healthCard.chronicConditions = chronicConditions;
    if (insuranceInfo) healthCard.insuranceInfo = insuranceInfo;

    healthCard.updatedAt = new Date();
    await healthCard.save();

    // Populate patient data
    await healthCard.populate('patient', 'firstName lastName email phone dateOfBirth gender');

    res.json({
      success: true,
      data: { healthCard },
      message: 'Health card updated successfully'
    });

  } catch (error) {
    console.error('Update health card error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get all health cards (Admin/Staff)
// @route   GET /api/health-cards
// @access  Private (Staff, Admin)
router.get('/', auth, authorize('staff', 'admin'), async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;

    let query = {};
    
    if (status) {
      query.status = status;
    }

    const healthCards = await HealthCard.find(query)
      .populate('patient', 'firstName lastName email phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await HealthCard.countDocuments(query);

    res.json({
      success: true,
      data: { 
        healthCards,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get health cards error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
