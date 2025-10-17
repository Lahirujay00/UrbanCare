const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const router = express.Router();

// Configure multer for NIC uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/nic-documents');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, 'nic-' + req.user.id + '-' + uniqueSuffix + extension);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, and PDF are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', auth, [
  body('firstName').optional().trim().isLength({ min: 2, max: 50 }),
  body('lastName').optional().trim().isLength({ min: 2, max: 50 }),
  body('phone').optional().matches(/^\+?[\d\s-()]+$/),
  body('dateOfBirth').optional().isISO8601(),
  body('gender').optional().isIn(['male', 'female', 'other', 'prefer-not-to-say'])
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

    const user = await User.findByIdAndUpdate(
      req.user.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Upload NIC document for identity verification
// @route   POST /api/users/upload-nic
// @access  Private (Patient)
router.post('/upload-nic', auth, upload.single('nicDocument'), async (req, res) => {
  try {
    console.log('NIC upload request from user:', req.user?.id, 'role:', req.user?.role);
    console.log('File received:', req.file?.filename);
    console.log('NIC Number:', req.body?.nicNumber);
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { nicNumber } = req.body;

    if (!nicNumber) {
      // Delete uploaded file if NIC number is missing
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: 'NIC number is required'
      });
    }

    // Delete old NIC document if exists
    const oldUser = await User.findById(req.user.id);
    if (oldUser.nicDocument && oldUser.nicDocument.path) {
      const oldPath = path.join(__dirname, '..', oldUser.nicDocument.path);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Update user with NIC document info
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        nicDocument: {
          filename: req.file.filename,
          path: req.file.path,
          uploadedAt: new Date(),
          mimetype: req.file.mimetype
        },
        nicNumber: nicNumber,
        identityVerificationStatus: 'pending',
        verificationNote: ''
      },
      { new: true, runValidators: true }
    );

    console.log('NIC uploaded successfully for user:', user._id);

    res.json({
      success: true,
      message: 'NIC document uploaded successfully. Awaiting verification.',
      data: { 
        user,
        verificationStatus: 'pending'
      }
    });
  } catch (error) {
    console.error('Upload NIC error:', error);
    
    // Delete uploaded file on error
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get NIC verification status
// @route   GET /api/users/nic-status
// @access  Private (Patient)
router.get('/nic-status', auth, async (req, res) => {
  try {
    console.log('NIC status request from user:', req.user?.id, 'role:', req.user?.role);
    
    const user = await User.findById(req.user.id).select('identityVerificationStatus verificationNote nicNumber nicDocument');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        status: user.identityVerificationStatus || 'unverified',
        note: user.verificationNote || '',
        nicNumber: user.nicNumber || '',
        hasDocument: !!user.nicDocument
      }
    });
  } catch (error) {
    console.error('Get NIC status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get NIC document image
// @route   GET /api/users/nic-document/:patientId
// @access  Private (Manager, Staff, Receptionist)
router.get('/nic-document/:patientId', auth, authorize('manager', 'staff', 'receptionist'), async (req, res) => {
  try {
    console.log('Fetching NIC document for patient:', req.params.patientId);
    
    const patient = await User.findById(req.params.patientId);
    
    if (!patient) {
      console.log('Patient not found');
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    if (!patient.nicDocument || !patient.nicDocument.path) {
      console.log('NIC document not found for patient');
      return res.status(404).json({
        success: false,
        message: 'NIC document not found'
      });
    }

    console.log('Serving NIC document:', patient.nicDocument.path);
    
    // Check if file exists
    if (!fs.existsSync(patient.nicDocument.path)) {
      console.log('File does not exist at path:', patient.nicDocument.path);
      return res.status(404).json({
        success: false,
        message: 'NIC document file not found'
      });
    }

    // Set appropriate content type
    res.setHeader('Content-Type', patient.nicDocument.mimetype || 'image/jpeg');
    
    // Send the file using absolute path
    res.sendFile(path.resolve(patient.nicDocument.path));
  } catch (error) {
    console.error('Get NIC document error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get all doctors
// @route   GET /api/users/doctors
// @access  Public
router.get('/doctors', async (req, res) => {
  try {
    const { specialization, department, search } = req.query;
    
    let query = { role: 'doctor', isActive: true };
    
    if (specialization) {
      query.specialization = new RegExp(specialization, 'i');
    }
    
    if (department) {
      query.department = new RegExp(department, 'i');
    }
    
    if (search) {
      query.$or = [
        { firstName: new RegExp(search, 'i') },
        { lastName: new RegExp(search, 'i') },
        { specialization: new RegExp(search, 'i') }
      ];
    }

    const doctors = await User.find(query)
      .select('-password')
      .sort({ firstName: 1 });

    res.json({
      success: true,
      count: doctors.length,
      data: { doctors }
    });
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get doctor by ID
// @route   GET /api/users/doctors/:id
// @access  Public
router.get('/doctors/:id', async (req, res) => {
  try {
    const doctor = await User.findOne({
      _id: req.params.id,
      role: 'doctor',
      isActive: true
    }).select('-password');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.json({
      success: true,
      data: { doctor }
    });
  } catch (error) {
    console.error('Get doctor error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get user profile by ID
// @route   GET /api/users/:id/profile
// @access  Private
router.get('/:id/profile', auth, async (req, res) => {
  try {
    // Check if user is accessing their own profile or is admin/manager
    if (req.user.id !== req.params.id && !['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update user profile by ID
// @route   PUT /api/users/:id/profile
// @access  Private
router.put('/:id/profile', auth, [
  body('firstName').optional().trim().isLength({ min: 2, max: 50 }),
  body('lastName').optional().trim().isLength({ min: 2, max: 50 }),
  body('phone').optional().matches(/^\+?[\d\s-()]+$/),
  body('dateOfBirth').optional().isISO8601(),
  body('gender').optional().isIn(['male', 'female', 'other', 'prefer-not-to-say']),
  body('availability').optional().isObject()
], async (req, res) => {
  try {
    // Check if user is updating their own profile or is admin/manager
    if (req.user.id !== req.params.id && !['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    console.log('Updating user profile with data:', JSON.stringify(req.body, null, 2));

    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Search users (Admin/Manager/Receptionist)
// @route   GET /api/users/search
// @access  Private (Admin/Manager/Staff/Receptionist)
router.get('/search', auth, authorize('admin', 'manager', 'staff', 'receptionist'), async (req, res) => {
  try {
    // Support both 'q' and 'query' parameters for backwards compatibility
    const searchQuery = req.query.q || req.query.query;
    const { role, isActive } = req.query;
    
    if (!searchQuery) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    // Build search filter with more fields
    const searchFilter = {
      $or: [
        { firstName: { $regex: searchQuery, $options: 'i' } },
        { lastName: { $regex: searchQuery, $options: 'i' } },
        { email: { $regex: searchQuery, $options: 'i' } },
        { phone: { $regex: searchQuery, $options: 'i' } },
        { digitalHealthCardId: { $regex: searchQuery, $options: 'i' } },
        { nicNumber: { $regex: searchQuery, $options: 'i' } }
      ]
    };
    
    if (role) {
      searchFilter.role = role;
    }
    
    if (isActive !== undefined) {
      searchFilter.isActive = isActive === 'true';
    }

    const users = await User.find(searchFilter)
      .select('-password -resetPasswordToken -resetPasswordExpire')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      count: users.length,
      data: { users }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get patients for identity verification
// @route   GET /api/users/patients/verification
// @access  Private (Manager, Staff, Receptionist)
router.get('/patients/verification', auth, authorize('manager', 'staff', 'receptionist'), async (req, res) => {
  try {
    const { status } = req.query;
    
    const filters = { role: 'patient', isActive: true };
    if (status) {
      filters.identityVerificationStatus = status;
    }

    const patients = await User.find(filters)
      .select('firstName lastName email phone dateOfBirth nicNumber nicDocument identityVerificationStatus verificationNote verifiedBy verifiedAt')
      .sort({ createdAt: -1 });

    console.log(`Found ${patients.length} patients for verification`);
    
    res.json({
      success: true,
      count: patients.length,
      data: patients
    });
  } catch (error) {
    console.error('Get patients for verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Verify patient identity
// @route   PUT /api/users/patients/:id/verify-identity
// @access  Private (Manager, Staff, Receptionist)
router.put('/patients/:id/verify-identity', auth, authorize('manager', 'staff', 'receptionist'), async (req, res) => {
  try {
    const { verificationStatus, verificationNote } = req.body;

    if (!['verified', 'rejected', 'pending'].includes(verificationStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification status'
      });
    }

    const patient = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'patient' },
      {
        identityVerificationStatus: verificationStatus,
        verificationNote: verificationNote || '',
        verifiedBy: req.user.id,
        verifiedAt: new Date()
      },
      { new: true, runValidators: true }
    ).select('firstName lastName email identityVerificationStatus verificationNote');

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.json({
      success: true,
      message: `Patient identity ${verificationStatus} successfully`,
      data: patient
    });
  } catch (error) {
    console.error('Verify patient identity error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Verify patient by Health Card ID
// @route   GET /api/users/verify-health-card/:healthCardId
// @access  Private (Staff, Manager, Receptionist)
router.get('/verify-health-card/:healthCardId', auth, authorize('staff', 'manager', 'receptionist'), async (req, res) => {
  try {
    const { healthCardId } = req.params;

    if (!healthCardId) {
      return res.status(400).json({
        success: false,
        message: 'Health Card ID is required'
      });
    }

    const patient = await User.findOne({
      digitalHealthCardId: healthCardId,
      role: 'patient'
    }).select('-password -resetPasswordToken -resetPasswordExpire');

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found with this Health Card ID'
      });
    }

    // Check identity verification status
    const verificationStatus = {
      isVerified: patient.identityVerificationStatus === 'verified',
      status: patient.identityVerificationStatus,
      hasNicDocument: !!patient.nicDocument,
      nicNumber: patient.nicNumber
    };

    res.json({
      success: true,
      data: {
        patient,
        verification: verificationStatus
      }
    });
  } catch (error) {
    console.error('Verify health card error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;