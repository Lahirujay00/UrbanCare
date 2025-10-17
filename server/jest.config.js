
/**
 * @fileoverview Jest Configuration for UrbanCare Backend Testing
 * @author UrbanCare Development Team
 * @version 1.0.0
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Coverage configuration
  collectCoverage: false, // Disable for now to focus on fixing tests
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  
  // Files to collect coverage from
  collectCoverageFrom: [
    'controllers/**/*.js',
    'services/**/*.js',
    'repositories/**/*.js',
    'utils/**/*.js',
    'core/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**',
    '!**/coverage/**',
    '!server.js'
  ],
  
  // Module paths
  moduleDirectories: ['node_modules', '<rootDir>'],
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Verbose output
  verbose: true,
  
  // Test timeout
  testTimeout: 30000,
  
  // Transform files
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // Force exit to prevent hanging
  forceExit: true,
  
  // Detect open handles
  detectOpenHandles: true
};

