/**
 * @fileoverview Centralized Logging System for UrbanCare Application
 * @author UrbanCare Development Team
 * @version 1.0.0
 */

const winston = require('winston');
const path = require('path');

/**
 * Logger Configuration and Factory
 * Implements Singleton pattern for consistent logging across the application
 */
class Logger {
  static instance = null;
  static loggers = new Map();

  /**
   * Gets or creates a logger instance for a specific module
   * @param {string} module - Module name for the logger
   * @returns {winston.Logger} Winston logger instance
   */
  static getLogger(module = 'app') {
    if (this.loggers.has(module)) {
      return this.loggers.get(module);
    }

    const logger = this.createLogger(module);
    this.loggers.set(module, logger);
    return logger;
  }

  /**
   * Creates a new Winston logger instance
   * @param {string} module - Module name
   * @returns {winston.Logger} Configured logger instance
   */
  static createLogger(module) {
    const logLevel = process.env.LOG_LEVEL || 'info';
    const logDir = process.env.LOG_DIR || 'logs';

    // Ensure logs directory exists
    const fs = require('fs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // Custom format for logs
    const logFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf(({ timestamp, level, message, module: logModule, ...meta }) => {
        const metaString = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
        return `${timestamp} [${level.toUpperCase()}] [${logModule || module}]: ${message} ${metaString}`;
      })
    );

    // Console format for development
    const consoleFormat = winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: 'HH:mm:ss' }),
      winston.format.printf(({ timestamp, level, message, module: logModule }) => {
        return `${timestamp} [${level}] [${logModule || module}]: ${message}`;
      })
    );

    const transports = [];

    // Console transport for development
    if (process.env.NODE_ENV !== 'production') {
      transports.push(
        new winston.transports.Console({
          format: consoleFormat,
          level: logLevel
        })
      );
    }

    // File transports
    transports.push(
      // Error logs
      new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
        format: logFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5
      }),
      // Combined logs
      new winston.transports.File({
        filename: path.join(logDir, 'combined.log'),
        format: logFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5
      })
    );

    // Module-specific log file
    if (module !== 'app') {
      transports.push(
        new winston.transports.File({
          filename: path.join(logDir, `${module.toLowerCase()}.log`),
          format: logFormat,
          maxsize: 5242880, // 5MB
          maxFiles: 3
        })
      );
    }

    return winston.createLogger({
      level: logLevel,
      format: logFormat,
      defaultMeta: { module },
      transports,
      // Handle uncaught exceptions
      exceptionHandlers: [
        new winston.transports.File({
          filename: path.join(logDir, 'exceptions.log'),
          format: logFormat
        })
      ],
      // Handle unhandled promise rejections
      rejectionHandlers: [
        new winston.transports.File({
          filename: path.join(logDir, 'rejections.log'),
          format: logFormat
        })
      ]
    });
  }

  /**
   * Creates a child logger with additional metadata
   * @param {string} module - Parent module name
   * @param {Object} meta - Additional metadata
   * @returns {winston.Logger} Child logger instance
   */
  static createChildLogger(module, meta = {}) {
    const parentLogger = this.getLogger(module);
    return parentLogger.child(meta);
  }

  /**
   * Logs HTTP request information
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {number} duration - Request duration in milliseconds
   */
  static logHttpRequest(req, res, duration) {
    const logger = this.getLogger('http');
    const logData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      userId: req.user?.id,
      userRole: req.user?.role
    };

    if (res.statusCode >= 400) {
      logger.warn('HTTP Request', logData);
    } else {
      logger.info('HTTP Request', logData);
    }
  }

  /**
   * Logs database operations
   * @param {string} operation - Database operation type
   * @param {string} collection - Collection/table name
   * @param {Object} query - Query parameters
   * @param {number} duration - Operation duration in milliseconds
   * @param {Object} result - Operation result
   */
  static logDatabaseOperation(operation, collection, query, duration, result) {
    const logger = this.getLogger('database');
    logger.debug('Database Operation', {
      operation,
      collection,
      query: this.sanitizeQuery(query),
      duration: `${duration}ms`,
      resultCount: Array.isArray(result) ? result.length : result ? 1 : 0
    });
  }

  /**
   * Logs security events
   * @param {string} event - Security event type
   * @param {Object} details - Event details
   * @param {string} severity - Event severity (low, medium, high, critical)
   */
  static logSecurityEvent(event, details, severity = 'medium') {
    const logger = this.getLogger('security');
    const logMethod = severity === 'critical' ? 'error' : 
                     severity === 'high' ? 'warn' : 'info';
    
    logger[logMethod]('Security Event', {
      event,
      severity,
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  /**
   * Logs business events for audit purposes
   * @param {string} event - Business event type
   * @param {Object} details - Event details
   * @param {string} userId - User ID who triggered the event
   */
  static logBusinessEvent(event, details, userId) {
    const logger = this.getLogger('business');
    logger.info('Business Event', {
      event,
      userId,
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  /**
   * Sanitizes query parameters for logging (removes sensitive data)
   * @param {Object} query - Query object to sanitize
   * @returns {Object} Sanitized query object
   */
  static sanitizeQuery(query) {
    if (!query || typeof query !== 'object') {
      return query;
    }

    const sensitiveFields = ['password', 'token', 'secret', 'key', 'pin', 'ssn', 'creditCard'];
    const sanitized = { ...query };

    const sanitizeRecursive = (obj) => {
      for (const [key, value] of Object.entries(obj)) {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          obj[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
          sanitizeRecursive(value);
        }
      }
    };

    sanitizeRecursive(sanitized);
    return sanitized;
  }

  /**
   * Creates middleware for HTTP request logging
   * @returns {Function} Express middleware function
   */
  static createHttpLoggerMiddleware() {
    return (req, res, next) => {
      const startTime = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        this.logHttpRequest(req, res, duration);
      });
      
      next();
    };
  }

  /**
   * Gracefully closes all loggers
   */
  static async close() {
    const closePromises = Array.from(this.loggers.values()).map(logger => {
      return new Promise((resolve) => {
        logger.on('finish', resolve);
        logger.end();
      });
    });

    await Promise.all(closePromises);
    this.loggers.clear();
  }
}

module.exports = Logger;
