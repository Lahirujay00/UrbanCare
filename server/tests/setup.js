
/**
 * Jest Setup File
 * Initializes test environment and global configurations
 */

const TestDatabase = require('./testDatabase');

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.MONGODB_URI = 'mongodb://localhost:27017/urbancare-test';

// Global test timeout
jest.setTimeout(30000);

// Mock console methods in tests to reduce noise
global.console = {
  ...console,
  // Suppress logs during tests
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Set default timeout for all tests
jest.setTimeout(10000);

// Mock timers if needed
// jest.useFakeTimers();

module.exports = {};
