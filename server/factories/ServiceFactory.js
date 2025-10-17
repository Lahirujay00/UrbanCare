/**
 * @fileoverview Service Factory implementing Factory pattern for service creation
 * @author UrbanCare Development Team
 * @version 1.0.0
 */

const ManagerService = require('../services/ManagerService');
const UserRepository = require('../repositories/UserRepository');
const AppointmentRepository = require('../repositories/AppointmentRepository');
const PaymentRepository = require('../repositories/PaymentRepository');
const Logger = require('../utils/Logger');

/**
 * ServiceFactory class implementing Factory pattern
 * Creates appropriate service instances with their dependencies
 */
class ServiceFactory {
  static instances = new Map();
  static repositories = new Map();

  /**
   * Gets or creates a repository instance
   * @param {string} repositoryType - Type of repository
   * @returns {Object} Repository instance
   */
  static getRepository(repositoryType) {
    if (this.repositories.has(repositoryType)) {
      return this.repositories.get(repositoryType);
    }

    let repository;
    switch (repositoryType.toLowerCase()) {
      case 'user':
        repository = new UserRepository();
        break;
      case 'appointment':
        repository = new AppointmentRepository();
        break;
      case 'payment':
        repository = new PaymentRepository();
        break;
      default:
        throw new Error(`Unknown repository type: ${repositoryType}`);
    }

    this.repositories.set(repositoryType, repository);
    return repository;
  }

  /**
   * Gets or creates a service instance
   * @param {string} serviceType - Type of service
   * @returns {Object} Service instance
   */
  static getService(serviceType) {
    if (this.instances.has(serviceType)) {
      return this.instances.get(serviceType);
    }

    let service;
    switch (serviceType.toLowerCase()) {
      case 'manager':
        service = this.createManagerService();
        break;
      case 'user':
        service = this.createUserService();
        break;
      case 'appointment':
        service = this.createAppointmentService();
        break;
      case 'payment':
        service = this.createPaymentService();
        break;
      default:
        throw new Error(`Unknown service type: ${serviceType}`);
    }

    this.instances.set(serviceType, service);
    return service;
  }

  /**
   * Creates a ManagerService with its dependencies
   * @returns {ManagerService} Manager service instance
   * @private
   */
  static createManagerService() {
    const userRepository = this.getRepository('user');
    const appointmentRepository = this.getRepository('appointment');
    const paymentRepository = this.getRepository('payment');

    return new ManagerService(
      userRepository,
      appointmentRepository,
      paymentRepository
    );
  }

  /**
   * Creates a UserService with its dependencies
   * @returns {Object} User service instance
   * @private
   */
  static createUserService() {
    // Placeholder for UserService implementation
    const userRepository = this.getRepository('user');
    
    // When UserService is implemented, it would be:
    // return new UserService(userRepository);
    
    // For now, return the repository directly
    return userRepository;
  }

  /**
   * Creates an AppointmentService with its dependencies
   * @returns {Object} Appointment service instance
   * @private
   */
  static createAppointmentService() {
    // Placeholder for AppointmentService implementation
    const appointmentRepository = this.getRepository('appointment');
    const userRepository = this.getRepository('user');
    
    // When AppointmentService is implemented, it would be:
    // return new AppointmentService(appointmentRepository, userRepository);
    
    // For now, return the repository directly
    return appointmentRepository;
  }

  /**
   * Creates a PaymentService with its dependencies
   * @returns {Object} Payment service instance
   * @private
   */
  static createPaymentService() {
    // Placeholder for PaymentService implementation
    const paymentRepository = this.getRepository('payment');
    const appointmentRepository = this.getRepository('appointment');
    
    // When PaymentService is implemented, it would be:
    // return new PaymentService(paymentRepository, appointmentRepository);
    
    // For now, return the repository directly
    return paymentRepository;
  }

  /**
   * Clears all cached instances (useful for testing)
   */
  static clearCache() {
    this.instances.clear();
    this.repositories.clear();
  }

  /**
   * Gets all available service types
   * @returns {Array} Array of available service types
   */
  static getAvailableServices() {
    return ['manager', 'user', 'appointment', 'payment'];
  }

  /**
   * Gets all available repository types
   * @returns {Array} Array of available repository types
   */
  static getAvailableRepositories() {
    return ['user', 'appointment', 'payment'];
  }

  /**
   * Validates service dependencies
   * @param {string} serviceType - Service type to validate
   * @returns {boolean} True if dependencies are satisfied
   */
  static validateServiceDependencies(serviceType) {
    try {
      const service = this.getService(serviceType);
      return !!service;
    } catch (error) {
      Logger.getLogger('ServiceFactory').error(
        `Failed to validate dependencies for ${serviceType}:`, 
        error
      );
      return false;
    }
  }

  /**
   * Creates a service with custom dependencies (for testing)
   * @param {string} serviceType - Service type
   * @param {Object} dependencies - Custom dependencies
   * @returns {Object} Service instance
   */
  static createServiceWithDependencies(serviceType, dependencies) {
    switch (serviceType.toLowerCase()) {
      case 'manager':
        return new ManagerService(
          dependencies.userRepository,
          dependencies.appointmentRepository,
          dependencies.paymentRepository
        );
      default:
        throw new Error(`Custom dependency injection not supported for ${serviceType}`);
    }
  }

  /**
   * Gets service health status
   * @returns {Object} Health status of all services
   */
  static getHealthStatus() {
    const status = {
      healthy: true,
      services: {},
      repositories: {},
      timestamp: new Date().toISOString()
    };

    // Check repositories
    for (const repoType of this.getAvailableRepositories()) {
      try {
        const repo = this.getRepository(repoType);
        status.repositories[repoType] = {
          status: 'healthy',
          modelName: repo.modelName || 'unknown'
        };
      } catch (error) {
        status.repositories[repoType] = {
          status: 'unhealthy',
          error: error.message
        };
        status.healthy = false;
      }
    }

    // Check services
    for (const serviceType of this.getAvailableServices()) {
      try {
        const service = this.getService(serviceType);
        status.services[serviceType] = {
          status: 'healthy',
          resourceName: service.getResourceName ? service.getResourceName() : 'unknown'
        };
      } catch (error) {
        status.services[serviceType] = {
          status: 'unhealthy',
          error: error.message
        };
        status.healthy = false;
      }
    }

    return status;
  }
}

module.exports = ServiceFactory;
