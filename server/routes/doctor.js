const express = require('express');
const router = express.Router();

// Import middleware
const auth = require('../middleware/auth');
const {
  validatePatientSearch,
  validatePatientId,
  validateRecordId,
  validateTreatmentNote,
  validateTreatmentNoteUpdate,
  validateAvailability,
  validateDoctorRole,
  sanitizeInput
} = require('../middleware/doctorValidation');

// Import controller
const DoctorController = require('../controllers/DoctorController');

/**
 * Doctor Portal API Routes
 * All routes require authentication and doctor role
 * Follows RESTful conventions and clean URL structure
 */

// Apply common middleware to all routes
router.use(auth); // Ensure user is authenticated
router.use(validateDoctorRole); // Ensure user has doctor role
router.use(sanitizeInput); // Sanitize all input data

/**
 * Patient Search and Access Routes
 */

// Enhanced patient search with filters
// GET /api/doctor/patients/search?q=searchQuery&gender=male&bloodType=O+&page=1&limit=20
// User Story: Search for patients with advanced filters
router.get('/patients/search', 
  validatePatientSearch,
  DoctorController.searchPatients
);

// Get recent patients for quick access
// GET /api/doctor/patients/recent?limit=10
router.get('/patients/recent',
  DoctorController.getRecentPatients
);

// Get patient management dashboard
// GET /api/doctor/patients/dashboard
router.get('/patients/dashboard',
  DoctorController.getPatientDashboard
);

// Get patient list with enhanced filtering
// GET /api/doctor/patients/list?searchQuery=John&gender=male&page=1&limit=25
router.get('/patients/list',
  DoctorController.getPatientList
);

// Get comprehensive patient profile (replaces medical records tab)
// GET /api/doctor/patients/:patientId/profile
router.get('/patients/:patientId/profile',
  validatePatientId,
  DoctorController.getPatientProfile
);

// Get patient's complete medical history (legacy endpoint)
// GET /api/doctor/patients/:patientId/medical-history
// User Story 3: View patient's complete medical history
router.get('/patients/:patientId/medical-history',
  validatePatientId,
  DoctorController.getPatientMedicalHistory
);

/**
 * Treatment Notes Management Routes
 */

// Add new treatment note to patient record
// POST /api/doctor/patients/:patientId/treatment-notes
// User Story 4: Add new treatment notes during/after consultation
router.post('/patients/:patientId/treatment-notes',
  validatePatientId,
  validateTreatmentNote,
  DoctorController.addTreatmentNote
);

// Update existing treatment note
// PUT /api/doctor/treatment-notes/:recordId
// User Story 5: Update patient records with secure logging
router.put('/treatment-notes/:recordId',
  validateRecordId,
  validateTreatmentNoteUpdate,
  DoctorController.updateTreatmentNote
);

/**
 * Schedule Management Routes
 */

// Get doctor's schedule and upcoming appointments
// GET /api/doctor/schedule
// User Story 6 & 7: View schedule and available slots
router.get('/schedule',
  DoctorController.getSchedule
);

// Update doctor's availability
// PUT /api/doctor/availability
// User Story 6: Manage schedule and block specific times
router.put('/availability',
  validateAvailability,
  DoctorController.updateAvailability
);

/**
 * Slot Management Routes
 */

// Get doctor's slots for specific date(s)
// GET /api/doctor/slots?startDate=2024-01-15&endDate=2024-01-15
router.get('/slots',
  DoctorController.getSlots
);

// Create new time slots
// POST /api/doctor/slots
router.post('/slots',
  DoctorController.createSlots
);

// Block specific slots (make unavailable)
// POST /api/doctor/slots/block
router.post('/slots/block',
  DoctorController.blockSlots
);

// Unblock previously blocked slots
// POST /api/doctor/slots/unblock
router.post('/slots/unblock',
  DoctorController.unblockSlots
);

// Quick block slots for time range (emergency)
// POST /api/doctor/slots/quick-block
router.post('/slots/quick-block',
  DoctorController.quickBlockSlots
);

// Get today's schedule with slot details
// GET /api/doctor/slots/today
router.get('/slots/today',
  DoctorController.getTodaySchedule
);

// Get available slots for patient booking (public)
// GET /api/doctor/slots/available?doctorId=123&date=2024-01-15
router.get('/slots/available',
  DoctorController.getAvailableSlots
);

/**
 * Dashboard Route
 */

// Get doctor's dashboard summary
// GET /api/doctor/dashboard
router.get('/dashboard',
  DoctorController.getDashboard
);

/**
 * Error handling middleware for this router
 */
router.use((error, req, res, next) => {
  console.error('Doctor router error:', error);
  
  // Handle specific error types
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: Object.values(error.errors).map(err => err.message)
    });
  }
  
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }
  
  // Default error response
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

module.exports = router;
