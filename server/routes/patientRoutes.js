const express = require("express");
const {
  getPatientByCardId,
  updatePatient,
  getAllPatients,
} = require("../controllers/patientController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// All routes are protected - require authentication
router.use(protect);

// @route   GET /api/patients
// @desc    Get all active patients
// @access  Private
router.get("/", getAllPatients);

// @route   GET /api/patients/:cardId
// @desc    Get patient by digital health card ID
// @access  Private
router.get("/:cardId", getPatientByCardId);

// @route   PUT /api/patients/update/:id
// @desc    Update patient non-sensitive details
// @access  Private
router.put("/update/:id", updatePatient);

module.exports = router;
