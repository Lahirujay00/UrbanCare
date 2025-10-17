/**
 * @fileoverview Response Formatter for consistent API responses
 * @author UrbanCare Development Team
 * @version 1.0.0
 */

/**
 * ResponseFormatter class for standardizing API responses
 * Implements consistent response structure across the application
 */
class ResponseFormatter {
  /**
   * Creates a success response
   * @param {*} data - Response data
   * @param {string} message - Success message
   * @param {Object} meta - Additional metadata
   * @returns {Object} Formatted success response
   */
  success(data = null, message = 'Success', meta = {}) {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
      ...meta
    };
  }

  /**
   * Creates an error response
   * @param {string} message - Error message
   * @param {*} errors - Error details
   * @param {Object} meta - Additional metadata
   * @returns {Object} Formatted error response
   */
  error(message = 'An error occurred', errors = null, meta = {}) {
    const response = {
      success: false,
      message,
      timestamp: new Date().toISOString(),
      ...meta
    };

    if (errors) {
      response.errors = errors;
    }

    return response;
  }

  /**
   * Creates a paginated response
   * @param {Array} data - Response data array
   * @param {Object} pagination - Pagination metadata
   * @param {string} message - Success message
   * @returns {Object} Formatted paginated response
   */
  paginated(data, pagination, message = 'Success') {
    return {
      success: true,
      message,
      data,
      pagination: {
        page: pagination.page || 1,
        limit: pagination.limit || 10,
        total: pagination.total || 0,
        totalPages: pagination.totalPages || 0,
        hasNextPage: pagination.hasNextPage || false,
        hasPrevPage: pagination.hasPrevPage || false
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Creates a validation error response
   * @param {Array} validationErrors - Array of validation errors
   * @param {string} message - Error message
   * @returns {Object} Formatted validation error response
   */
  validationError(validationErrors, message = 'Validation failed') {
    return this.error(message, validationErrors, { type: 'validation' });
  }

  /**
   * Creates an authentication error response
   * @param {string} message - Error message
   * @returns {Object} Formatted authentication error response
   */
  authenticationError(message = 'Authentication required') {
    return this.error(message, null, { type: 'authentication' });
  }

  /**
   * Creates an authorization error response
   * @param {string} message - Error message
   * @returns {Object} Formatted authorization error response
   */
  authorizationError(message = 'Access denied') {
    return this.error(message, null, { type: 'authorization' });
  }

  /**
   * Creates a not found error response
   * @param {string} resource - Resource name
   * @param {string} message - Custom error message
   * @returns {Object} Formatted not found error response
   */
  notFound(resource = 'Resource', message = null) {
    const errorMessage = message || `${resource} not found`;
    return this.error(errorMessage, null, { type: 'not_found' });
  }

  /**
   * Creates a conflict error response
   * @param {string} message - Error message
   * @param {*} conflictDetails - Conflict details
   * @returns {Object} Formatted conflict error response
   */
  conflict(message = 'Resource conflict', conflictDetails = null) {
    return this.error(message, conflictDetails, { type: 'conflict' });
  }

  /**
   * Creates a rate limit error response
   * @param {string} message - Error message
   * @param {number} retryAfter - Seconds to wait before retrying
   * @returns {Object} Formatted rate limit error response
   */
  rateLimitError(message = 'Rate limit exceeded', retryAfter = 60) {
    return this.error(message, null, { 
      type: 'rate_limit',
      retryAfter 
    });
  }

  /**
   * Creates a server error response
   * @param {string} message - Error message
   * @param {string} errorId - Unique error identifier for tracking
   * @returns {Object} Formatted server error response
   */
  serverError(message = 'Internal server error', errorId = null) {
    const response = this.error(message, null, { type: 'server_error' });
    
    if (errorId) {
      response.errorId = errorId;
    }

    return response;
  }

  /**
   * Creates a created resource response
   * @param {*} data - Created resource data
   * @param {string} message - Success message
   * @param {string} location - Resource location URL
   * @returns {Object} Formatted created response
   */
  created(data, message = 'Resource created successfully', location = null) {
    const response = this.success(data, message, { type: 'created' });
    
    if (location) {
      response.location = location;
    }

    return response;
  }

  /**
   * Creates an updated resource response
   * @param {*} data - Updated resource data
   * @param {string} message - Success message
   * @returns {Object} Formatted updated response
   */
  updated(data, message = 'Resource updated successfully') {
    return this.success(data, message, { type: 'updated' });
  }

  /**
   * Creates a deleted resource response
   * @param {string} message - Success message
   * @param {*} deletedData - Deleted resource data (optional)
   * @returns {Object} Formatted deleted response
   */
  deleted(message = 'Resource deleted successfully', deletedData = null) {
    return this.success(deletedData, message, { type: 'deleted' });
  }

  /**
   * Creates a no content response
   * @param {string} message - Success message
   * @returns {Object} Formatted no content response
   */
  noContent(message = 'No content') {
    return this.success(null, message, { type: 'no_content' });
  }

  /**
   * Creates a partial content response
   * @param {*} data - Partial data
   * @param {string} message - Success message
   * @param {Object} partialInfo - Information about partial content
   * @returns {Object} Formatted partial content response
   */
  partialContent(data, message = 'Partial content', partialInfo = {}) {
    return this.success(data, message, { 
      type: 'partial_content',
      partial: partialInfo 
    });
  }

  /**
   * Creates a health check response
   * @param {Object} healthData - Health check data
   * @param {string} status - Health status (healthy, degraded, unhealthy)
   * @returns {Object} Formatted health check response
   */
  healthCheck(healthData, status = 'healthy') {
    return {
      status,
      timestamp: new Date().toISOString(),
      checks: healthData
    };
  }

  /**
   * Formats API documentation response
   * @param {Object} apiInfo - API information
   * @param {Array} endpoints - Available endpoints
   * @returns {Object} Formatted API documentation response
   */
  apiDocumentation(apiInfo, endpoints) {
    return this.success({
      api: apiInfo,
      endpoints,
      documentation: {
        version: apiInfo.version,
        baseUrl: apiInfo.baseUrl,
        authentication: apiInfo.authentication
      }
    }, 'API Documentation');
  }

  /**
   * Formats file upload response
   * @param {Object} fileInfo - Uploaded file information
   * @param {string} message - Success message
   * @returns {Object} Formatted file upload response
   */
  fileUploaded(fileInfo, message = 'File uploaded successfully') {
    return this.success({
      file: {
        filename: fileInfo.filename,
        originalName: fileInfo.originalname,
        size: fileInfo.size,
        mimetype: fileInfo.mimetype,
        path: fileInfo.path,
        url: fileInfo.url
      }
    }, message, { type: 'file_upload' });
  }

  /**
   * Formats batch operation response
   * @param {Object} batchResult - Batch operation results
   * @param {string} message - Success message
   * @returns {Object} Formatted batch response
   */
  batchOperation(batchResult, message = 'Batch operation completed') {
    return this.success({
      total: batchResult.total,
      successful: batchResult.successful,
      failed: batchResult.failed,
      results: batchResult.results,
      errors: batchResult.errors
    }, message, { type: 'batch_operation' });
  }
}

module.exports = ResponseFormatter;
