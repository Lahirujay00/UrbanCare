/**
 * @fileoverview Custom hook for accessing services
 * @author UrbanCare Development Team
 * @version 1.0.0
 */

import { useEffect, useState } from 'react';
import ServiceFactory from '../services/ServiceFactory';

/**
 * Custom hook for accessing services through dependency injection
 * @param {string} serviceName - Name of the service to access
 * @returns {Object} Service instance
 */
export const useService = (serviceName) => {
  const [service, setService] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const serviceInstance = ServiceFactory.getService(serviceName);
      setService(serviceInstance);
      setError(null);
    } catch (err) {
      setError(err.message);
      setService(null);
    }
  }, [serviceName]);

  if (error) {
    throw new Error(`Failed to get service '${serviceName}': ${error}`);
  }

  return service;
};

export default useService;
