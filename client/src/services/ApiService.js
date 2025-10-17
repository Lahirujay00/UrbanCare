/**
 * @fileoverview Centralized API Service for HTTP communications
 * @author UrbanCare Development Team
 * @version 1.0.0
 */

import axios from 'axios';

/**
 * ApiService class handling all HTTP communications
 * Implements Singleton pattern and provides centralized API management
 */
class ApiService {
  static instance = null;

  /**
   * Creates an instance of ApiService
   */
  constructor() {
    if (ApiService.instance) {
      return ApiService.instance;
    }

    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    this.timeout = 30000; // 30 seconds
    
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.setupInterceptors();
    ApiService.instance = this;
  }

  /**
   * Gets singleton instance
   * @returns {ApiService} ApiService instance
   */
  static getInstance() {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  /**
   * Sets up request and response interceptors
   */
  setupInterceptors() {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add request timestamp for performance monitoring
        config.metadata = { startTime: new Date() };

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => {
        // Calculate request duration
        const duration = new Date() - response.config.metadata.startTime;
        
        // Log performance in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`API Call: ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`);
        }

        return response;
      },
      (error) => {
        // Handle common error scenarios
        if (error.response?.status === 401) {
          // Unauthorized - redirect to login
          localStorage.removeItem('token');
          window.location.href = '/login';
        } else if (error.response?.status === 403) {
          // Forbidden - show access denied message
          console.error('Access denied');
        } else if (error.response?.status >= 500) {
          // Server error - show generic error message
          console.error('Server error occurred');
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Generic GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Query parameters
   * @param {Object} config - Axios config
   * @returns {Promise<*>} Response data
   */
  async get(endpoint, params = {}, config = {}) {
    try {
      const response = await this.axiosInstance.get(endpoint, {
        params,
        ...config
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Generic POST request
   * @param {string} endpoint - API endpoint
   * @param {*} data - Request body data
   * @param {Object} config - Axios config
   * @returns {Promise<*>} Response data
   */
  async post(endpoint, data = {}, config = {}) {
    try {
      const response = await this.axiosInstance.post(endpoint, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Generic PUT request
   * @param {string} endpoint - API endpoint
   * @param {*} data - Request body data
   * @param {Object} config - Axios config
   * @returns {Promise<*>} Response data
   */
  async put(endpoint, data = {}, config = {}) {
    try {
      const response = await this.axiosInstance.put(endpoint, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Generic DELETE request
   * @param {string} endpoint - API endpoint
   * @param {Object} config - Axios config
   * @returns {Promise<*>} Response data
   */
  async delete(endpoint, config = {}) {
    try {
      const response = await this.axiosInstance.delete(endpoint, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * File upload request
   * @param {string} endpoint - API endpoint
   * @param {FormData} formData - Form data with file
   * @param {Function} onUploadProgress - Upload progress callback
   * @returns {Promise<*>} Response data
   */
  async uploadFile(endpoint, formData, onUploadProgress = null) {
    try {
      const response = await this.axiosInstance.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Download file request
   * @param {string} endpoint - API endpoint
   * @param {string} filename - Filename for download
   * @returns {Promise<void>}
   */
  async downloadFile(endpoint, filename) {
    try {
      const response = await this.axiosInstance.get(endpoint, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Handles API errors and transforms them
   * @param {Error} error - Axios error
   * @returns {Error} Transformed error
   */
  handleError(error) {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      const message = data?.message || data?.error || `HTTP ${status} Error`;
      
      const apiError = new Error(message);
      apiError.status = status;
      apiError.data = data;
      apiError.type = 'API_ERROR';
      
      return apiError;
    } else if (error.request) {
      // Request was made but no response received
      const networkError = new Error('Network error - please check your connection');
      networkError.type = 'NETWORK_ERROR';
      return networkError;
    } else {
      // Something else happened
      const genericError = new Error(error.message || 'Unknown error occurred');
      genericError.type = 'GENERIC_ERROR';
      return genericError;
    }
  }

  /**
   * Sets authentication token
   * @param {string} token - JWT token
   */
  setAuthToken(token) {
    if (token) {
      localStorage.setItem('token', token);
      this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('token');
      delete this.axiosInstance.defaults.headers.common['Authorization'];
    }
  }

  /**
   * Gets current authentication token
   * @returns {string|null} Current token
   */
  getAuthToken() {
    return localStorage.getItem('token');
  }

  /**
   * Clears authentication token
   */
  clearAuthToken() {
    this.setAuthToken(null);
  }

  /**
   * Checks if user is authenticated
   * @returns {boolean} True if authenticated
   */
  isAuthenticated() {
    return !!this.getAuthToken();
  }

  /**
   * Gets API health status
   * @returns {Promise<Object>} Health status
   */
  async getHealthStatus() {
    try {
      const response = await this.get('/health');
      return {
        api: 'healthy',
        baseURL: this.baseURL,
        authenticated: this.isAuthenticated(),
        ...response
      };
    } catch (error) {
      return {
        api: 'unhealthy',
        baseURL: this.baseURL,
        authenticated: this.isAuthenticated(),
        error: error.message
      };
    }
  }
}

export default ApiService;
