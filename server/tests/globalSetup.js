// Global setup for Jest tests
module.exports = async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.PORT = '5001'; // Use different port for tests

  console.log('Global test setup completed');
};