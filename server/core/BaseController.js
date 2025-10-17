/**
 * @fileoverview Base Controller class for UrbanCare Application
 * @author UrbanCare Development Team
 * @version 1.0.0
 */

const ResponseFormatter = require('../utils/ResponseFormatter');
const Logger = require('../utils/Logger');

/**
 * Base Controller class providing common controller functionality
 * Implements SOLID principles for controller architecture
 */
class BaseController {
  /**
   * Creates an instance of BaseController
   * @param {Object} service - Service instance for business logic
   * @param {Object} logger - Logger instance
   */
  constructor(service = null, logger = null) {
    if (this.constructor === BaseController) {
      throw new Error('BaseController is abstract and cannot be instantiated directly');
    }
    
    this.service = service;
    this.logger = logger || Logger.getLogger(this.constructor.name);
    this.responseFormatter = new ResponseFormatter();
  }

  /**
   * Handles async operations with error catching
   * @param {Function} operation - Async operation to execute
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async handleAsync(operation, req, res) {
    try {
      await operation(req, res);
    } catch (error) {
      this.handleError(error, req, res);
    }
  }

  /**
   * Handles controller errors
   * @param {Error} error - Error object
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  handleError(error, req, res) {
    this.logger.error('Controller error:', {
      error: error.message,
      stack: error.stack,
      method: req.method,
      url: req.originalUrl,
      userId: req.user?.id
    });

    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal server error';
    
    res.status(statusCode).json(
      this.responseFormatter.error(message, error.details)
    );
  }

  /**
   * Sends success response
   * @param {Object} res - Express response object
   * @param {*} data - Response data
   * @param {string} message - Success message
   * @param {Object} meta - Additional metadata
   */
  sendSuccess(res, data = null, message = 'Success', meta = {}) {
    res.json(this.responseFormatter.success(data, message, meta));
  }

  /**
   * Sends created response
   * @param {Object} res - Express response object
   * @param {*} data - Created resource data
   * @param {string} message - Success message
   * @param {string} location - Resource location URL
   */
  sendCreated(res, data, message = 'Resource created successfully', location = null) {
    res.status(201).json(this.responseFormatter.created(data, message, location));
  }

  /**
   * Sends no content response
   * @param {Object} res - Express response object
   * @param {string} message - Success message
   */
  sendNoContent(res, message = 'No content') {
    res.status(204).json(this.responseFormatter.noContent(message));
  }

  /**
   * Builds filters from request query parameters
   * @param {Object} req - Express request object
   * @param {Array} allowedFilters - Array of allowed filter keys
   * @returns {Object} Filtered query parameters
   */
  buildFilters(req, allowedFilters = []) {
    const filters = {};
    
    allowedFilters.forEach(key => {
      if (req.query[key] !== undefined && req.query[key] !== '') {
        filters[key] = req.query[key];
      }
    });
    
    return filters;
  }

  /**
   * Builds pagination options from request query
   * @param {Object} req - Express request object
   * @returns {Object} Pagination options
   */
  buildPaginationOptions(req) {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder || 'desc';
    
    return {
      page,
      limit,
      skip: (page - 1) * limit,
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
    };
  }

  /**
   * Validates required fields in request body
   * @param {Object} req - Express request object
   * @param {Array} requiredFields - Array of required field names
   * @throws {Error} If required fields are missing
   */
  validateRequiredFields(req, requiredFields) {
    const missingFields = requiredFields.filter(field => 
      req.body[field] === undefined || req.body[field] === null || req.body[field] === ''
    );
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
  }

  /**
   * Logs controller action
   * @param {string} action - Action name
   * @param {Object} req - Express request object
   * @param {Object} metadata - Additional metadata
   */
  logAction(action, req, metadata = {}) {
    this.logger.info(`Controller action: ${action}`, {
      action,
      method: req.method,
      url: req.originalUrl,
      userId: req.user?.id,
      userRole: req.user?.role,
      ...metadata
    });
  }

  /**
   * Gets resource name (to be implemented by child classes)
   * @returns {string} Resource name
   */
  getResourceName() {
    throw new Error('getResourceName() must be implemented by child class');
  }
}

module.exports = BaseController;
