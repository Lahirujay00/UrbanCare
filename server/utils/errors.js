/**
 * @fileoverview Custom Error Classes for UrbanCare Application
 * @author UrbanCare Development Team
 * @version 1.0.0
 */

/**
 * Base Application Error class
 */
class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation Error class
 */
class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400);
    this.details = details;
  }
}

/**
 * Authentication Error class
 */
class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401);
  }
}

/**
 * Authorization Error class
 */
class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403);
  }
}

/**
 * Not Found Error class
 */
class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

/**
 * Conflict Error class
 */
class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
  }
}

/**
 * Rate Limit Error class
 */
class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded', retryAfter = 60) {
    super(message, 429);
    this.retryAfter = retryAfter;
  }
}

/**
 * Database Error class
 */
class DatabaseError extends AppError {
  constructor(message = 'Database operation failed', originalError = null) {
    super(message, 500);
    this.originalError = originalError;
  }
}

/**
 * External Service Error class
 */
class ExternalServiceError extends AppError {
  constructor(message = 'External service error', service = null) {
    super(message, 502);
    this.service = service;
  }
}

/**
 * Business Logic Error class
 */
class BusinessLogicError extends AppError {
  constructor(message = 'Business logic error', code = null) {
    super(message, 422);
    this.code = code;
  }
}

/**
 * Error Factory for creating appropriate error instances
 */
class ErrorFactory {
  /**
   * Creates an error based on type
   * @param {string} type - Error type
   * @param {string} message - Error message
   * @param {*} details - Additional error details
   * @returns {AppError} Error instance
   */
  static createError(type, message, details = null) {
    switch (type.toLowerCase()) {
      case 'validation':
        return new ValidationError(message, details);
      case 'authentication':
        return new AuthenticationError(message);
      case 'authorization':
        return new AuthorizationError(message);
      case 'notfound':
      case 'not_found':
        return new NotFoundError(message);
      case 'conflict':
        return new ConflictError(message);
      case 'ratelimit':
      case 'rate_limit':
        return new RateLimitError(message, details);
      case 'database':
        return new DatabaseError(message, details);
      case 'external':
      case 'external_service':
        return new ExternalServiceError(message, details);
      case 'business':
      case 'business_logic':
        return new BusinessLogicError(message, details);
      default:
        return new AppError(message, 500);
    }
  }

  /**
   * Creates a validation error with field details
   * @param {Array} fieldErrors - Array of field error objects
   * @returns {ValidationError} Validation error instance
   */
  static createValidationError(fieldErrors) {
    const message = 'Validation failed';
    return new ValidationError(message, fieldErrors);
  }

  /**
   * Creates a not found error for a specific resource
   * @param {string} resource - Resource name
   * @param {string} identifier - Resource identifier
   * @returns {NotFoundError} Not found error instance
   */
  static createNotFoundError(resource, identifier = null) {
    const message = identifier 
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    return new NotFoundError(message);
  }

  /**
   * Creates a conflict error for duplicate resources
   * @param {string} resource - Resource name
   * @param {string} field - Conflicting field
   * @param {string} value - Conflicting value
   * @returns {ConflictError} Conflict error instance
   */
  static createConflictError(resource, field, value) {
    const message = `${resource} with ${field} '${value}' already exists`;
    return new ConflictError(message);
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  ExternalServiceError,
  BusinessLogicError,
  ErrorFactory
};
