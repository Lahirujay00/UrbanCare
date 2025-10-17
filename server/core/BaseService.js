/**
 * @fileoverview Base Service class for UrbanCare Application
 * @author UrbanCare Development Team
 * @version 1.0.0
 */

const EventEmitter = require('events');
const Logger = require('../utils/Logger');

/**
 * Base Service class providing common service functionality
 * Implements SOLID principles and Observer pattern
 */
class BaseService extends EventEmitter {
  /**
   * Creates an instance of BaseService
   * @param {Object} repository - Repository instance for data access
   * @param {Object} logger - Logger instance
   */
  constructor(repository = null, logger = null) {
    super();
    
    if (this.constructor === BaseService) {
      throw new Error('BaseService is abstract and cannot be instantiated directly');
    }
    
    this.repository = repository;
    this.logger = logger || Logger.getLogger(this.constructor.name);
  }

  /**
   * Handles service errors and transforms them appropriately
   * @param {Error} error - Original error
   * @returns {Error} Transformed error
   */
  handleServiceError(error) {
    this.logger.error('Service error:', {
      error: error.message,
      stack: error.stack,
      service: this.constructor.name
    });

    // Emit error event for observers
    this.emit('error', error);

    return error;
  }

  /**
   * Validates input data against schema
   * @param {Object} data - Data to validate
   * @param {Object} schema - Validation schema
   * @returns {boolean} True if valid
   * @throws {Error} If validation fails
   */
  validateInput(data, schema) {
    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];
      
      if (rules.required && (value === undefined || value === null || value === '')) {
        throw new Error(`${field} is required`);
      }
      
      if (rules.type && value !== undefined && typeof value !== rules.type) {
        throw new Error(`${field} must be of type ${rules.type}`);
      }
    }
    
    return true;
  }

  /**
   * Logs business events
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  logBusinessEvent(event, data = {}) {
    this.logger.info(`Business event: ${event}`, {
      event,
      service: this.constructor.name,
      ...data
    });

    // Emit business event for observers
    this.emit('businessEvent', { event, data });
  }

  /**
   * Gets resource name (to be implemented by child classes)
   * @returns {string} Resource name
   */
  getResourceName() {
    throw new Error('getResourceName() must be implemented by child class');
  }
}

module.exports = BaseService;
