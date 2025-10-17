/**
 * @fileoverview Service Factory for frontend dependency injection
 * @author UrbanCare Development Team
 * @version 1.0.0
 */

import ApiService from './ApiService';
import PatientService from './PatientService';

/**
 * ServiceFactory class implementing Factory pattern for frontend services
 * Provides dependency injection and service management
 */
class ServiceFactory {
  static instances = new Map();
  static initialized = false;

  /**
   * Initializes the service factory
   */
  static initialize() {
    if (this.initialized) return;

    // Initialize core services
    this.instances.set('api', ApiService.getInstance());
    this.instances.set('patient', new PatientService());

    this.initialized = true;
  }

  /**
   * Gets a service instance
   * @param {string} serviceName - Name of the service
   * @returns {Object} Service instance
   */
  static getService(serviceName) {
    if (!this.initialized) {
      this.initialize();
    }

    if (!this.instances.has(serviceName)) {
      throw new Error(`Service '${serviceName}' not found. Available services: ${Array.from(this.instances.keys()).join(', ')}`);
    }

    return this.instances.get(serviceName);
  }

  /**
   * Registers a new service
   * @param {string} serviceName - Name of the service
   * @param {Object} serviceInstance - Service instance
   */
  static registerService(serviceName, serviceInstance) {
    this.instances.set(serviceName, serviceInstance);
  }

  /**
   * Gets all available services
   * @returns {Array} Array of service names
   */
  static getAvailableServices() {
    if (!this.initialized) {
      this.initialize();
    }
    return Array.from(this.instances.keys());
  }

  /**
   * Gets health status of all services
   * @returns {Promise<Object>} Health status
   */
  static async getHealthStatus() {
    if (!this.initialized) {
      this.initialize();
    }

    const status = {
      healthy: true,
      services: {},
      timestamp: new Date().toISOString()
    };

    for (const [name, service] of this.instances.entries()) {
      try {
        if (typeof service.getHealthStatus === 'function') {
          status.services[name] = await service.getHealthStatus();
        } else {
          status.services[name] = { status: 'unknown', message: 'Health check not implemented' };
        }
      } catch (error) {
        status.services[name] = { status: 'unhealthy', error: error.message };
        status.healthy = false;
      }
    }

    return status;
  }

  /**
   * Clears all service caches
   */
  static clearAllCaches() {
    for (const service of this.instances.values()) {
      if (typeof service.clearCache === 'function') {
        service.clearCache();
      }
    }
  }

  /**
   * Resets the factory (useful for testing)
   */
  static reset() {
    this.instances.clear();
    this.initialized = false;
  }
}

export default ServiceFactory;
