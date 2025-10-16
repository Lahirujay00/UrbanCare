const jwt = require("jsonwebtoken");
const Receptionist = require("../models/Receptionist");

/**
 * Middleware to protect routes and verify JWT tokens
 * Validates the token and attaches receptionist info to request
 */
const protect = async (req, res, next) => {
  let token;

  // Check if token exists in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Extract token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get receptionist from token and attach to request
      req.receptionist = await Receptionist.findById(decoded.id).select(
        "-password"
      );

      if (!req.receptionist) {
        return res.status(401).json({
          success: false,
          message: "Not authorized, receptionist not found",
        });
      }

      if (!req.receptionist.isActive) {
        return res.status(401).json({
          success: false,
          message: "Account is deactivated",
        });
      }

      next();
    } catch (error) {
      console.error("Token verification error:", error.message);
      return res.status(401).json({
        success: false,
        message: "Not authorized, token failed",
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, no token provided",
    });
  }
};

module.exports = { protect };
