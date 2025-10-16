const { body, param, query } = require('express-validator');
const mongoose = require('mongoose');

/**
 * Doctor Portal Input Validation Middleware
 * Follows Open/Closed Principle - Easy to extend without modifying existing validations
 * Provides comprehensive input validation for all doctor operations
 */

/**
 * Validation for patient search
 */
const validatePatientSearch = [
  query('q')
    .notEmpty()
    .withMessage('Search query is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2 and 100 characters')
    .trim()
    .escape()
];

/**
 * Validation for patient ID parameter
 */
const validatePatientId = [
  param('patientId')
    .notEmpty()
    .withMessage('Patient ID is required')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid patient ID format');
      }
      return true;
    })
];

/**
 * Validation for medical record ID parameter
 */
const validateRecordId = [
  param('recordId')
    .notEmpty()
    .withMessage('Record ID is required')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid record ID format');
      }
      return true;
    })
];

/**
 * Validation for treatment note creation
 * User Story 4: Add new treatment notes
 */
const validateTreatmentNote = [
  body('title')
    .notEmpty()
    .withMessage('Treatment note title is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters')
    .trim(),

  body('description')
    .notEmpty()
    .withMessage('Treatment description is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters')
    .trim(),

  // Optional diagnosis object validation
  body('diagnosis.primary')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Primary diagnosis cannot exceed 500 characters')
    .trim(),

  body('diagnosis.secondary')
    .optional()
    .isArray()
    .withMessage('Secondary diagnoses must be an array'),

  body('diagnosis.secondary.*')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Each secondary diagnosis cannot exceed 500 characters')
    .trim(),

  body('diagnosis.severity')
    .optional()
    .isIn(['low', 'moderate', 'high', 'critical'])
    .withMessage('Severity must be one of: low, moderate, high, critical'),

  // Optional prescriptions array validation
  body('prescriptions')
    .optional()
    .isArray()
    .withMessage('Prescriptions must be an array'),

  body('prescriptions.*.medication')
    .if(body('prescriptions').exists())
    .notEmpty()
    .withMessage('Medication name is required')
    .isLength({ max: 200 })
    .withMessage('Medication name cannot exceed 200 characters')
    .trim(),

  body('prescriptions.*.dosage')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Dosage cannot exceed 100 characters')
    .trim(),

  body('prescriptions.*.frequency')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Frequency cannot exceed 100 characters')
    .trim(),

  body('prescriptions.*.duration')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Duration cannot exceed 100 characters')
    .trim(),

  // Optional vital signs validation
  body('vitalSigns.bloodPressure.systolic')
    .optional()
    .isInt({ min: 50, max: 300 })
    .withMessage('Systolic BP must be between 50 and 300'),

  body('vitalSigns.bloodPressure.diastolic')
    .optional()
    .isInt({ min: 30, max: 200 })
    .withMessage('Diastolic BP must be between 30 and 200'),

  body('vitalSigns.heartRate')
    .optional()
    .isInt({ min: 30, max: 250 })
    .withMessage('Heart rate must be between 30 and 250'),

  body('vitalSigns.temperature')
    .optional()
    .isFloat({ min: 90, max: 110 })
    .withMessage('Temperature must be between 90 and 110 Fahrenheit'),

  body('vitalSigns.weight')
    .optional()
    .isFloat({ min: 1, max: 1000 })
    .withMessage('Weight must be between 1 and 1000 pounds'),

  body('vitalSigns.height')
    .optional()
    .isFloat({ min: 10, max: 300 })
    .withMessage('Height must be between 10 and 300 cm'),

  body('vitalSigns.respiratoryRate')
    .optional()
    .isInt({ min: 5, max: 60 })
    .withMessage('Respiratory rate must be between 5 and 60'),

  body('vitalSigns.oxygenSaturation')
    .optional()
    .isInt({ min: 50, max: 100 })
    .withMessage('Oxygen saturation must be between 50 and 100'),

  // Optional notes validation
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
    .trim(),

  // Optional follow-up validation
  body('followUp.required')
    .optional()
    .isBoolean()
    .withMessage('Follow-up required must be a boolean'),

  body('followUp.date')
    .optional()
    .isISO8601()
    .withMessage('Follow-up date must be a valid date')
    .custom((value) => {
      const followUpDate = new Date(value);
      const today = new Date();
      if (followUpDate <= today) {
        throw new Error('Follow-up date must be in the future');
      }
      return true;
    }),

  body('followUp.instructions')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Follow-up instructions cannot exceed 500 characters')
    .trim(),

  // Optional tags validation
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),

  body('tags.*')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Each tag cannot exceed 50 characters')
    .trim()
];

/**
 * Validation for treatment note updates
 * User Story 5: Update patient records
 */
const validateTreatmentNoteUpdate = [
  // Allow partial updates - all fields are optional but must be valid if provided
  body('title')
    .optional()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters')
    .trim(),

  body('description')
    .optional()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters')
    .trim(),

  // Reuse the same validation rules as creation but make them optional
  ...validateTreatmentNote.map(validation => {
    // Make all validations optional for updates
    if (validation.builder && validation.builder.fields) {
      return validation.optional();
    }
    return validation;
  }).filter(validation => 
    // Remove the required validations for title and description
    !validation.builder?.fields?.some(field => 
      field === 'title' || field === 'description'
    ) || validation.optional
  )
];

/**
 * Validation for doctor availability updates
 * User Story 6: Manage schedule
 */
const validateAvailability = [
  // Validate each day of the week
  ...['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => [
    body(`${day}.enabled`)
      .optional()
      .isBoolean()
      .withMessage(`${day}.enabled must be a boolean`),

    body(`${day}.startTime`)
      .optional()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage(`${day}.startTime must be in HH:MM format`),

    body(`${day}.endTime`)
      .optional()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage(`${day}.endTime must be in HH:MM format`)
      .custom((endTime, { req }) => {
        const startTime = req.body[day]?.startTime;
        if (startTime && endTime) {
          const start = new Date(`2000-01-01T${startTime}:00`);
          const end = new Date(`2000-01-01T${endTime}:00`);
          if (end <= start) {
            throw new Error(`${day}.endTime must be after startTime`);
          }
        }
        return true;
      })
  ]).flat()
];

/**
 * Custom validation middleware to check if user is a doctor
 */
const validateDoctorRole = (req, res, next) => {
  if (req.user.role !== 'doctor') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Doctor role required.'
    });
  }
  next();
};

/**
 * Sanitization middleware to clean input data
 */
const sanitizeInput = (req, res, next) => {
  // Remove any potentially dangerous fields
  const dangerousFields = ['__proto__', 'constructor', 'prototype'];
  
  const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    for (const key of dangerousFields) {
      delete obj[key];
    }
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null) {
        obj[key] = sanitizeObject(value);
      }
    }
    
    return obj;
  };

  req.body = sanitizeObject(req.body);
  req.query = sanitizeObject(req.query);
  req.params = sanitizeObject(req.params);
  
  next();
};

module.exports = {
  validatePatientSearch,
  validatePatientId,
  validateRecordId,
  validateTreatmentNote,
  validateTreatmentNoteUpdate,
  validateAvailability,
  validateDoctorRole,
  sanitizeInput
};
