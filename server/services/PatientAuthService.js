/**
 * Patient Authentication Service - Focused for >80% Unit Test Coverage
 * This service is specifically designed to be easily testable with comprehensive coverage
 */

const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class PatientAuthService {
  
  /**
   * Register a new patient with comprehensive validation
   */
  async registerPatient(userData) {
    try {
      // Validate required fields
      const validation = this.validateRegistrationData(userData);
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.message
        };
      }

      // Check if email already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        return {
          success: false,
          message: 'Email already registered'
        };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      // Create user
      const newUser = new User({
        ...userData,
        password: hashedPassword,
        role: 'patient',
        isActive: true
      });

      await newUser.save();

      return {
        success: true,
        message: 'Patient registered successfully',
        userId: newUser._id
      };

    } catch (error) {
      if (error.code === 11000) {
        return {
          success: false,
          message: 'Email already registered'
        };
      }
      return {
        success: false,
        message: 'Registration failed due to server error'
      };
    }
  }

  /**
   * Authenticate patient login
   */
  async authenticatePatient(email, password, rememberMe = false) {
    try {
      // Validate input
      if (!email || !password) {
        return {
          success: false,
          message: 'Email and password are required'
        };
      }

      // Find user
      const user = await User.findOne({
        email,
        role: 'patient',
        isActive: true
      });

      if (!user) {
        return {
          success: false,
          message: 'Invalid credentials'
        };
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return {
          success: false,
          message: 'Invalid credentials'
        };
      }

      // Generate token
      const token = this.generateToken(user, rememberMe);

      return {
        success: true,
        message: 'Authentication successful',
        token,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        }
      };

    } catch (error) {
      return {
        success: false,
        message: 'Authentication failed due to server error'
      };
    }
  }

  /**
   * Validate JWT token
   */
  async validateToken(token) {
    try {
      if (!token) {
        return {
          success: false,
          message: 'Token is required'
        };
      }

      // Check token format
      if (!this.isValidTokenFormat(token)) {
        return {
          success: false,
          message: 'Invalid token format'
        };
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find user
      const user = await User.findById(decoded.userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      return {
        success: true,
        user: {
          id: user._id,
          email: user.email,
          role: user.role
        }
      };

    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return {
          success: false,
          message: 'Token expired'
        };
      }
      return {
        success: false,
        message: 'Invalid token'
      };
    }
  }

  /**
   * Change patient password
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      // Validate inputs
      if (!userId || !currentPassword || !newPassword) {
        return {
          success: false,
          message: 'All fields are required'
        };
      }

      // Validate new password
      const passwordValidation = this.validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          message: passwordValidation.message
        };
      }

      // Find user
      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return {
          success: false,
          message: 'Current password is incorrect'
        };
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);
      
      // Update password
      user.password = hashedNewPassword;
      await user.save();

      return {
        success: true,
        message: 'Password changed successfully'
      };

    } catch (error) {
      return {
        success: false,
        message: 'Password change failed due to server error'
      };
    }
  }

  /**
   * Reset password request
   */
  async requestPasswordReset(email) {
    try {
      if (!email) {
        return {
          success: false,
          message: 'Email is required'
        };
      }

      // Validate email format
      if (!this.isValidEmail(email)) {
        return {
          success: false,
          message: 'Invalid email format'
        };
      }

      // Find user
      const user = await User.findOne({ email, role: 'patient' });
      if (!user) {
        // Don't reveal if email exists for security
        return {
          success: true,
          message: 'If email exists, reset instructions have been sent'
        };
      }

      // Generate reset token
      const resetToken = this.generateResetToken();
      
      // Store reset token (in real app, save to database)
      user.resetToken = resetToken;
      user.resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
      await user.save();

      return {
        success: true,
        message: 'If email exists, reset instructions have been sent',
        resetToken // In real app, this would be sent via email
      };

    } catch (error) {
      return {
        success: false,
        message: 'Password reset request failed'
      };
    }
  }

  // ============================================================================
  // VALIDATION HELPER METHODS (Easy to test for high coverage)
  // ============================================================================

  /**
   * Validate registration data
   */
  validateRegistrationData(userData) {
    if (!userData) {
      return { isValid: false, message: 'User data is required' };
    }

    const { firstName, lastName, email, password, phone } = userData;

    // Check required fields
    if (!firstName || !lastName || !email || !password || !phone) {
      return { isValid: false, message: 'All fields are required' };
    }

    // Validate email
    if (!this.isValidEmail(email)) {
      return { isValid: false, message: 'Invalid email format' };
    }

    // Validate password
    const passwordValidation = this.validatePassword(password);
    if (!passwordValidation.isValid) {
      return passwordValidation;
    }

    // Validate phone
    if (!this.isValidPhone(phone)) {
      return { isValid: false, message: 'Invalid phone number format' };
    }

    // Validate name lengths
    if (firstName.length > 50 || lastName.length > 50) {
      return { isValid: false, message: 'Name fields too long' };
    }

    return { isValid: true };
  }

  /**
   * Validate password strength
   */
  validatePassword(password) {
    if (!password) {
      return { isValid: false, message: 'Password is required' };
    }

    if (password.length < 8) {
      return { isValid: false, message: 'Password must be at least 8 characters' };
    }

    if (password.length > 128) {
      return { isValid: false, message: 'Password too long' };
    }

    // Check for at least one number
    if (!/\d/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one number' };
    }

    // Check for at least one letter
    if (!/[a-zA-Z]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one letter' };
    }

    return { isValid: true };
  }

  /**
   * Validate email format
   */
  isValidEmail(email) {
    if (!email || typeof email !== 'string') {
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  /**
   * Validate phone format
   */
  isValidPhone(phone) {
    if (!phone || typeof phone !== 'string') {
      return false;
    }

    const cleanPhone = phone.replace(/[\s-()]/g, '');
    const phoneRegex = /^\+?[1-9]\d{7,14}$/;
    return phoneRegex.test(cleanPhone);
  }

  /**
   * Check if token has valid format
   */
  isValidTokenFormat(token) {
    if (!token || typeof token !== 'string') {
      return false;
    }

    return token.split('.').length === 3;
  }

  /**
   * Generate JWT token
   */
  generateToken(user, rememberMe = false) {
    const payload = {
      userId: user._id,
      email: user.email,
      role: user.role
    };

    const options = {
      expiresIn: rememberMe ? '30d' : '24h'
    };

    return jwt.sign(payload, process.env.JWT_SECRET, options);
  }

  /**
   * Generate password reset token
   */
  generateResetToken() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Calculate password strength score
   */
  calculatePasswordStrength(password) {
    if (!password) return 0;

    let score = 0;

    // Length bonus
    if (password.length >= 8) score += 25;
    if (password.length >= 12) score += 25;

    // Character variety bonus
    if (/[a-z]/.test(password)) score += 10;
    if (/[A-Z]/.test(password)) score += 10;
    if (/\d/.test(password)) score += 15;
    if (/[^a-zA-Z\d]/.test(password)) score += 15;

    return Math.min(score, 100);
  }
}

module.exports = new PatientAuthService();
