/**
 * @fileoverview Validation Helper utilities for UrbanCare Application
 * @author UrbanCare Development Team
 * @version 1.0.0
 */

const { body, param, query, validationResult } = require('express-validator');
const { ValidationError } = require('./errors');

/**
 * ValidationHelper class providing common validation rules and utilities
 */
class ValidationHelper {
  /**
   * Common validation rules for user-related fields
   */
  static get userValidations() {
    return {
      email: body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
      
      password: body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
      
      firstName: body('firstName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('First name can only contain letters and spaces'),
      
      lastName: body('lastName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('Last name can only contain letters and spaces'),
      
      phone: body('phone')
        .isMobilePhone()
        .withMessage('Please provide a valid phone number'),
      
      dateOfBirth: body('dateOfBirth')
        .isISO8601()
        .toDate()
        .withMessage('Please provide a valid date of birth')
        .custom((value) => {
          const age = new Date().getFullYear() - new Date(value).getFullYear();
          if (age < 0 || age > 150) {
            throw new Error('Invalid date of birth');
          }
          return true;
        }),
      
      role: body('role')
        .isIn(['patient', 'doctor', 'staff', 'manager', 'admin'])
        .withMessage('Invalid user role')
    };
  }

  /**
   * Common validation rules for appointment-related fields
   */
  static get appointmentValidations() {
    return {
      appointmentDate: body('appointmentDate')
        .isISO8601()
        .toDate()
        .withMessage('Please provide a valid appointment date')
        .custom((value) => {
          if (new Date(value) < new Date()) {
            throw new Error('Appointment date cannot be in the past');
          }
          return true;
        }),
      
      duration: body('duration')
        .isInt({ min: 15, max: 480 })
        .withMessage('Duration must be between 15 and 480 minutes'),
      
      status: body('status')
        .isIn(['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'])
        .withMessage('Invalid appointment status'),
      
      reasonForVisit: body('reasonForVisit')
        .trim()
        .isLength({ min: 5, max: 500 })
        .withMessage('Reason for visit must be between 5 and 500 characters'),
      
      department: body('department')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Department must be between 2 and 100 characters')
    };
  }

  /**
   * Common validation rules for medical record fields
   */
  static get medicalRecordValidations() {
    return {
      diagnosis: body('diagnosis')
        .trim()
        .isLength({ min: 5, max: 1000 })
        .withMessage('Diagnosis must be between 5 and 1000 characters'),
      
      treatment: body('treatment')
        .trim()
        .isLength({ min: 5, max: 2000 })
        .withMessage('Treatment must be between 5 and 2000 characters'),
      
      medications: body('medications')
        .optional()
        .isArray()
        .withMessage('Medications must be an array'),
      
      allergies: body('allergies')
        .optional()
        .isArray()
        .withMessage('Allergies must be an array'),
      
      vitalSigns: body('vitalSigns')
        .optional()
        .isObject()
        .withMessage('Vital signs must be an object'),
      
      recordType: body('recordType')
        .isIn(['Consultation', 'Treatment Plan', 'Lab Result', 'Prescription', 'Follow-up'])
        .withMessage('Invalid record type')
    };
  }

  /**
   * Common validation rules for payment fields
   */
  static get paymentValidations() {
    return {
      amount: body('amount')
        .isFloat({ min: 0.01 })
        .withMessage('Amount must be a positive number'),
      
      paymentMethod: body('paymentMethod')
        .isIn(['cash', 'card', 'insurance', 'bank_transfer', 'digital_wallet'])
        .withMessage('Invalid payment method'),
      
      status: body('status')
        .isIn(['pending', 'completed', 'failed', 'refunded'])
        .withMessage('Invalid payment status'),
      
      currency: body('currency')
        .isIn(['USD', 'EUR', 'GBP', 'LKR'])
        .withMessage('Invalid currency code')
    };
  }

  /**
   * Common parameter validations
   */
  static get paramValidations() {
    return {
      id: param('id')
        .isMongoId()
        .withMessage('Invalid ID format'),
      
      userId: param('userId')
        .isMongoId()
        .withMessage('Invalid user ID format'),
      
      appointmentId: param('appointmentId')
        .isMongoId()
        .withMessage('Invalid appointment ID format')
    };
  }

  /**
   * Common query parameter validations
   */
  static get queryValidations() {
    return {
      page: query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
      
      limit: query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
      
      sortBy: query('sortBy')
        .optional()
        .isString()
        .withMessage('Sort by must be a string'),
      
      sortOrder: query('sortOrder')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('Sort order must be asc or desc'),
      
      startDate: query('startDate')
        .optional()
        .isISO8601()
        .toDate()
        .withMessage('Start date must be a valid date'),
      
      endDate: query('endDate')
        .optional()
        .isISO8601()
        .toDate()
        .withMessage('End date must be a valid date')
        .custom((value, { req }) => {
          if (req.query.startDate && new Date(value) < new Date(req.query.startDate)) {
            throw new Error('End date must be after start date');
          }
          return true;
        })
    };
  }

  /**
   * Creates validation middleware for user registration
   * @returns {Array} Array of validation middleware
   */
  static validateUserRegistration() {
    return [
      this.userValidations.email,
      this.userValidations.password,
      this.userValidations.firstName,
      this.userValidations.lastName,
      this.userValidations.phone,
      this.userValidations.dateOfBirth,
      body('role').optional().isIn(['patient', 'doctor']).withMessage('Invalid role for registration'),
      this.handleValidationErrors
    ];
  }

  /**
   * Creates validation middleware for user login
   * @returns {Array} Array of validation middleware
   */
  static validateUserLogin() {
    return [
      body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
      body('password').notEmpty().withMessage('Password is required'),
      this.handleValidationErrors
    ];
  }

  /**
   * Creates validation middleware for appointment creation
   * @returns {Array} Array of validation middleware
   */
  static validateAppointmentCreation() {
    return [
      body('doctorId').isMongoId().withMessage('Invalid doctor ID'),
      this.appointmentValidations.appointmentDate,
      this.appointmentValidations.duration,
      this.appointmentValidations.reasonForVisit,
      this.appointmentValidations.department,
      this.handleValidationErrors
    ];
  }

  /**
   * Creates validation middleware for medical record creation
   * @returns {Array} Array of validation middleware
   */
  static validateMedicalRecordCreation() {
    return [
      body('patientId').isMongoId().withMessage('Invalid patient ID'),
      body('doctorId').isMongoId().withMessage('Invalid doctor ID'),
      this.medicalRecordValidations.diagnosis,
      this.medicalRecordValidations.treatment,
      this.medicalRecordValidations.recordType,
      this.medicalRecordValidations.medications,
      this.medicalRecordValidations.allergies,
      this.handleValidationErrors
    ];
  }

  /**
   * Creates validation middleware for payment processing
   * @returns {Array} Array of validation middleware
   */
  static validatePaymentCreation() {
    return [
      body('appointmentId').isMongoId().withMessage('Invalid appointment ID'),
      this.paymentValidations.amount,
      this.paymentValidations.paymentMethod,
      this.paymentValidations.currency,
      this.handleValidationErrors
    ];
  }

  /**
   * Creates validation middleware for pagination and filtering
   * @returns {Array} Array of validation middleware
   */
  static validatePagination() {
    return [
      this.queryValidations.page,
      this.queryValidations.limit,
      this.queryValidations.sortBy,
      this.queryValidations.sortOrder,
      this.handleValidationErrors
    ];
  }

  /**
   * Creates validation middleware for date range queries
   * @returns {Array} Array of validation middleware
   */
  static validateDateRange() {
    return [
      this.queryValidations.startDate,
      this.queryValidations.endDate,
      this.handleValidationErrors
    ];
  }

  /**
   * Creates validation middleware for ID parameters
   * @returns {Array} Array of validation middleware
   */
  static validateIdParam() {
    return [
      this.paramValidations.id,
      this.handleValidationErrors
    ];
  }

  /**
   * Middleware to handle validation errors
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const validationErrors = errors.array().map(error => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value
      }));
      
      throw new ValidationError('Validation failed', validationErrors);
    }
    next();
  }

  /**
   * Custom validator for file uploads
   * @param {Object} options - Validation options
   * @returns {Function} Validation middleware
   */
  static validateFileUpload(options = {}) {
    const {
      allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'],
      maxSize = 5 * 1024 * 1024, // 5MB
      required = false
    } = options;

    return (req, res, next) => {
      if (!req.file && required) {
        throw new ValidationError('File is required');
      }

      if (req.file) {
        if (!allowedTypes.includes(req.file.mimetype)) {
          throw new ValidationError(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
        }

        if (req.file.size > maxSize) {
          throw new ValidationError(`File size too large. Maximum size: ${maxSize / (1024 * 1024)}MB`);
        }
      }

      next();
    };
  }

  /**
   * Sanitizes input data by removing potentially harmful content
   * @param {Object} data - Data to sanitize
   * @returns {Object} Sanitized data
   */
  static sanitizeInput(data) {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        // Remove HTML tags and trim whitespace
        sanitized[key] = value.replace(/<[^>]*>/g, '').trim();
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item => this.sanitizeInput(item));
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeInput(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Validates business rules for appointments
   * @param {Object} appointmentData - Appointment data to validate
   * @returns {Array} Array of validation errors
   */
  static validateAppointmentBusinessRules(appointmentData) {
    const errors = [];
    const appointmentDate = new Date(appointmentData.appointmentDate);
    const now = new Date();

    // Check if appointment is in business hours (9 AM - 5 PM)
    const hour = appointmentDate.getHours();
    if (hour < 9 || hour >= 17) {
      errors.push({
        field: 'appointmentDate',
        message: 'Appointments must be scheduled between 9 AM and 5 PM'
      });
    }

    // Check if appointment is on a weekday
    const dayOfWeek = appointmentDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      errors.push({
        field: 'appointmentDate',
        message: 'Appointments can only be scheduled on weekdays'
      });
    }

    // Check if appointment is at least 24 hours in advance
    const hoursInAdvance = (appointmentDate - now) / (1000 * 60 * 60);
    if (hoursInAdvance < 24) {
      errors.push({
        field: 'appointmentDate',
        message: 'Appointments must be scheduled at least 24 hours in advance'
      });
    }

    return errors;
  }
}

module.exports = ValidationHelper;
