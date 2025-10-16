const express = require("express");
const {
  getLogs,
  getLogsByPatient,
  getMyLogs,
} = require("../controllers/logController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// All routes are protected - require authentication
router.use(protect);

// @route   GET /api/logs
// @desc    Get recent access logs (with filtering and pagination)
// @access  Private
router.get("/", getLogs);

// @route   GET /api/logs/me
// @desc    Get logs for current receptionist
// @access  Private
router.get("/me", getMyLogs);

// @route   GET /api/logs/patient/:cardId
// @desc    Get logs for a specific patient
// @access  Private
router.get("/patient/:cardId", getLogsByPatient);

module.exports = router;
