const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Document = require('../models/Document');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/documents');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

// @desc    Upload document
// @route   POST /api/documents/upload
// @access  Private (All authenticated users)
router.post('/upload', auth, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const {
      patientId,
      title,
      description,
      documentType,
      appointmentId,
      medicalRecordId,
      tags
    } = req.body;

    // If user is patient, they can only upload for themselves
    const targetPatientId = req.user.role === 'patient' ? req.user.id : patientId;

    if (!targetPatientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID is required'
      });
    }

    // Create file URL
    const fileUrl = `/uploads/documents/${req.file.filename}`;

    // Create document record
    const document = new Document({
      patient: targetPatientId,
      uploadedBy: req.user.id,
      appointment: appointmentId || null,
      medicalRecord: medicalRecordId || null,
      title: title || req.file.originalname,
      description: description || '',
      documentType: documentType || 'other',
      fileName: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      fileUrl: fileUrl,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : []
    });

    await document.save();

    // Populate references
    await document.populate([
      { path: 'patient', select: 'firstName lastName email' },
      { path: 'uploadedBy', select: 'firstName lastName role' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: { document }
    });

  } catch (error) {
    console.error('Upload document error:', error);
    
    // Delete uploaded file if database save failed
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
      error: error.message
    });
  }
});

// @desc    Get documents for a patient
// @route   GET /api/documents/patient/:patientId
// @access  Private (Patient own docs, Staff, Doctor, Admin)
router.get('/patient/:patientId', auth, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { documentType, page = 1, limit = 10 } = req.query;

    // Check authorization
    if (req.user.role === 'patient' && req.user.id !== patientId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these documents'
      });
    }

    let query = { 
      patient: patientId,
      status: 'active'
    };

    if (documentType) {
      query.documentType = documentType;
    }

    const documents = await Document.find(query)
      .populate('uploadedBy', 'firstName lastName role')
      .populate('appointment', 'appointmentDate appointmentTime')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Document.countDocuments(query);

    res.json({
      success: true,
      data: {
        documents,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get single document
// @route   GET /api/documents/:id
// @access  Private (Authorized users only)
router.get('/:id', auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('patient', 'firstName lastName email')
      .populate('uploadedBy', 'firstName lastName role')
      .populate('appointment', 'appointmentDate appointmentTime')
      .populate('medicalRecord', 'diagnosis');

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check access permission
    if (!document.hasAccess(req.user.id, req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this document'
      });
    }

    // Log access
    await document.logAccess(req.user.id, 'view', req.ip);

    res.json({
      success: true,
      data: { document }
    });

  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Download document
// @route   GET /api/documents/:id/download
// @access  Private (Authorized users only)
router.get('/:id/download', auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check access permission
    if (!document.hasAccess(req.user.id, req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to download this document'
      });
    }

    // Check if file exists
    if (!fs.existsSync(document.filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    // Log access
    await document.logAccess(req.user.id, 'download', req.ip);

    // Set headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
    res.setHeader('Content-Type', document.mimeType);

    // Send file
    res.sendFile(path.resolve(document.filePath));

  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Share document with user
// @route   POST /api/documents/:id/share
// @access  Private (Patient own docs, Staff, Admin)
router.post('/:id/share', auth, async (req, res) => {
  try {
    const { userId, permissions = 'view' } = req.body;

    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if user can share this document
    const canShare = document.patient.toString() === req.user.id || 
                    ['staff', 'admin'].includes(req.user.role);

    if (!canShare) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to share this document'
      });
    }

    await document.shareWith(userId, permissions);

    res.json({
      success: true,
      message: 'Document shared successfully'
    });

  } catch (error) {
    console.error('Share document error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Private (Patient own docs, Staff, Admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if user can delete this document
    const canDelete = document.patient.toString() === req.user.id || 
                     document.uploadedBy.toString() === req.user.id ||
                     ['staff', 'admin'].includes(req.user.role);

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this document'
      });
    }

    // Soft delete - mark as deleted
    document.status = 'deleted';
    await document.save();

    // Log access
    await document.logAccess(req.user.id, 'delete', req.ip);

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get document types
// @route   GET /api/documents/types
// @access  Private
router.get('/meta/types', auth, (req, res) => {
  const documentTypes = [
    { value: 'lab-report', label: 'Lab Report' },
    { value: 'prescription', label: 'Prescription' },
    { value: 'x-ray', label: 'X-Ray' },
    { value: 'mri-scan', label: 'MRI Scan' },
    { value: 'ct-scan', label: 'CT Scan' },
    { value: 'ultrasound', label: 'Ultrasound' },
    { value: 'ecg', label: 'ECG' },
    { value: 'blood-test', label: 'Blood Test' },
    { value: 'insurance-card', label: 'Insurance Card' },
    { value: 'id-proof', label: 'ID Proof' },
    { value: 'medical-certificate', label: 'Medical Certificate' },
    { value: 'discharge-summary', label: 'Discharge Summary' },
    { value: 'vaccination-record', label: 'Vaccination Record' },
    { value: 'other', label: 'Other' }
  ];

  res.json({
    success: true,
    data: { documentTypes }
  });
});

module.exports = router;
