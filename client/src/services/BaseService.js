/**
 * @fileoverview Base Service class for frontend services
 * @author UrbanCare Development Team
 * @version 1.0.0
 */

/**
 * Base Service class implementing common service functionality for frontend
 * Following SOLID principles for frontend architecture
 */
class BaseService {
  /**
   * Creates an instance of BaseService
   * @param {Object} apiService - API service instance for HTTP calls
   */
  constructor(apiService) {
    if (this.constructor === BaseService) {
      throw new Error('BaseService is abstract and cannot be instantiated directly');
    }
    
    this.api = apiService;
    this.cache = new Map();
    this.subscribers = new Set();
  }

  /**
   * Handles API calls with error handling and caching
   * @param {Function} apiCall - API call function
   * @param {string} cacheKey - Cache key for the result
   * @param {Object} options - Options for caching and error handling
   * @returns {Promise<*>} API response data
   */
  async handleApiCall(apiCall, cacheKey = null, options = {}) {
    const { useCache = false, cacheTTL = 300000 } = options; // 5 minutes default TTL

    // Check cache first
    if (useCache && cacheKey && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < cacheTTL) {
        return cached.data;
      }
    }

    try {
      const response = await apiCall();
      const data = response?.data || response;

      // Cache the result
      if (useCache && cacheKey) {
        this.cache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });
      }

      // Notify subscribers
      this.notifySubscribers('data_updated', { cacheKey, data });

      return data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Handles service errors
   * @param {Error} error - Error object
   */
  handleError(error) {
    console.error(`${this.constructor.name} Error:`, error);
    
    // Notify subscribers about error
    this.notifySubscribers('error', { error });
    
    // You could integrate with error reporting service here
    // ErrorReportingService.reportError(error);
  }

  /**
   * Subscribes to service events
   * @param {Function} callback - Callback function
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Notifies all subscribers
   * @param {string} event - Event type
   * @param {*} data - Event data
   */
  notifySubscribers(event, data) {
    this.subscribers.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Subscriber callback error:', error);
      }
    });
  }

  /**
   * Clears cache
   * @param {string} key - Specific key to clear, or null to clear all
   */
  clearCache(key = null) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Gets cached data
   * @param {string} key - Cache key
   * @returns {*} Cached data or null
   */
  getCachedData(key) {
    const cached = this.cache.get(key);
    return cached ? cached.data : null;
  }

  /**
   * Validates input data
   * @param {*} data - Data to validate
   * @param {Object} schema - Validation schema
   * @returns {boolean} True if valid
   */
  validateData(data, schema) {
    // Basic validation - can be enhanced with a validation library
    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];
      
      if (rules.required && (value === undefined || value === null || value === '')) {
        throw new Error(`${field} is required`);
      }
      
      if (rules.type && value !== undefined && typeof value !== rules.type) {
        throw new Error(`${field} must be of type ${rules.type}`);
      }
      
      if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
        throw new Error(`${field} must be at least ${rules.minLength} characters`);
      }
      
      if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
        throw new Error(`${field} must be no more than ${rules.maxLength} characters`);
      }
    }
    
    return true;
  }

  /**
   * Transforms data for API consumption
   * @param {*} data - Data to transform
   * @returns {*} Transformed data
   */
  transformForApi(data) {
    // Override in child classes for specific transformations
    return data;
  }

  /**
   * Transforms data from API response
   * @param {*} data - API response data
   * @returns {*} Transformed data
   */
  transformFromApi(data) {
    // Override in child classes for specific transformations
    return data;
  }

  /**
   * Gets service name (to be implemented by child classes)
   * @returns {string} Service name
   */
  getServiceName() {
    throw new Error('getServiceName() must be implemented by child class');
  }

  /**
   * Gets service health status
   * @returns {Object} Health status
   */
  getHealthStatus() {
    return {
      serviceName: this.getServiceName(),
      healthy: true,
      cacheSize: this.cache.size,
      subscriberCount: this.subscribers.size,
      timestamp: new Date().toISOString()
    };
  }
}

export default BaseService;
