/**
 * Jest Setup File
 * Initializes test environment and global configurations
 */

// Set test environment variable
process.env.NODE_ENV = 'test';
process.env.MONGODB_TEST_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/urbancare_test';

// Suppress console output during tests (optional - remove for debugging)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };

// Set default timeout for all tests
jest.setTimeout(10000);

// Mock timers if needed
// jest.useFakeTimers();

module.exports = {};
