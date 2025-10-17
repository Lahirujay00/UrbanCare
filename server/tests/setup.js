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
=======
 * @fileoverview Jest Test Setup Configuration
 * @author UrbanCare Development Team
 * @version 1.0.0
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.MONGODB_URI = 'mongodb://localhost:27017/urbancare-test';

// Global test timeout
jest.setTimeout(10000);

// Mock console methods in tests to reduce noise
global.console = {
  ...console,
  // Uncomment to suppress logs during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Global test utilities
global.testUtils = {
  /**
   * Creates a mock user object
   * @param {Object} overrides - Properties to override
   * @returns {Object} Mock user
   */
  createMockUser: (overrides = {}) => ({
    _id: '507f1f77bcf86cd799439011',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@test.com',
    role: 'patient',
    isActive: true,
    createdAt: new Date(),
    ...overrides
  }),

  /**
   * Creates a mock appointment object
   * @param {Object} overrides - Properties to override
   * @returns {Object} Mock appointment
   */
  createMockAppointment: (overrides = {}) => ({
    _id: '507f1f77bcf86cd799439012',
    patient: '507f1f77bcf86cd799439011',
    doctor: '507f1f77bcf86cd799439013',
    appointmentDate: new Date(Date.now() + 86400000), // Tomorrow
    duration: 30,
    status: 'scheduled',
    reasonForVisit: 'Regular checkup',
    department: 'General Medicine',
    createdAt: new Date(),
    ...overrides
  }),

  /**
   * Creates a mock payment object
   * @param {Object} overrides - Properties to override
   * @returns {Object} Mock payment
   */
  createMockPayment: (overrides = {}) => ({
    _id: '507f1f77bcf86cd799439014',
    appointment: '507f1f77bcf86cd799439012',
    patient: '507f1f77bcf86cd799439011',
    amount: 100,
    paymentMethod: 'card',
    status: 'completed',
    transactionId: 'txn_123456789',
    createdAt: new Date(),
    ...overrides
  }),

  /**
   * Creates a mock Express request object
   * @param {Object} overrides - Properties to override
   * @returns {Object} Mock request
   */
  createMockRequest: (overrides = {}) => ({
    body: {},
    params: {},
    query: {},
    user: null,
    headers: {},
    method: 'GET',
    originalUrl: '/test',
    ip: '127.0.0.1',
    ...overrides
  }),

  /**
   * Creates a mock Express response object
   * @returns {Object} Mock response
   */
  createMockResponse: () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.set = jest.fn().mockReturnValue(res);
    return res;
  },

  /**
   * Creates a mock Express next function
   * @returns {Function} Mock next function
   */
  createMockNext: () => jest.fn(),

  /**
   * Waits for a specified amount of time
   * @param {number} ms - Milliseconds to wait
   * @returns {Promise} Promise that resolves after the specified time
   */
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms))
};

// Setup and teardown hooks
beforeAll(async () => {
  // Global setup before all tests
});

afterAll(async () => {
  // Global cleanup after all tests
});

beforeEach(() => {
  // Reset mocks before each test
  jest.clearAllMocks();
});

afterEach(() => {
  // Cleanup after each test
});

