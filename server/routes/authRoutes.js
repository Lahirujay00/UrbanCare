const express = require("express");
const { login, getMe } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// @route   POST /api/auth/login
// @desc    Login receptionist
// @access  Public
router.post("/login", login);

// @route   GET /api/auth/me
// @desc    Get current logged in receptionist
// @access  Private
router.get("/me", protect, getMe);

module.exports = router;
