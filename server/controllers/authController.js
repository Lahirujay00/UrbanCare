const jwt = require("jsonwebtoken");
const Receptionist = require("../models/Receptionist");
const Log = require("../models/Log");

/**
 * Generate JWT token
 * @param {string} id - Receptionist ID
 * @returns {string} JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

/**
 * @desc    Login receptionist
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Find receptionist by email
    const receptionist = await Receptionist.findOne({ email });

    if (!receptionist) {
      // Log failed login attempt
      await Log.create({
        receptionistId: null,
        receptionistName: email,
        patientCardId: "N/A",
        action: "Login failed",
        details: "Invalid email",
        ipAddress: req.ip,
      });

      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if account is active
    if (!receptionist.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated",
      });
    }

    // Verify password
    const isPasswordMatch = await receptionist.matchPassword(password);

    if (!isPasswordMatch) {
      // Log failed login attempt
      await Log.create({
        receptionistId: receptionist._id,
        receptionistName: receptionist.name,
        patientCardId: "N/A",
        action: "Login failed",
        details: "Invalid password",
        ipAddress: req.ip,
      });

      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Log successful login
    await Log.create({
      receptionistId: receptionist._id,
      receptionistName: receptionist.name,
      patientCardId: "N/A",
      action: "Login successful",
      ipAddress: req.ip,
    });

    // Generate token
    const token = generateToken(receptionist._id);

    // Prepare user object (matching regular auth response format)
    const receptionistData = {
      _id: receptionist._id,
      name: receptionist.name,
      email: receptionist.email,
      employeeId: receptionist.employeeId,
      role: "receptionist",
      isActive: receptionist.isActive,
    };

    // Send success response with token (matching regular auth format)
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: receptionistData,
        token: token,
        refreshToken: null, // Receptionists don't use refresh tokens for now
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

/**
 * @desc    Get current logged in receptionist
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  try {
    const receptionist = await Receptionist.findById(
      req.receptionist.id
    ).select("-password");

    res.status(200).json({
      success: true,
      data: receptionist,
    });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  login,
  getMe,
};
