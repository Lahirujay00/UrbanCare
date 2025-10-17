const mongoose = require('mongoose');
require('dotenv').config();

// Set test environment
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:1234@cluster0.di9quiu.mongodb.net/urbancare_test?retryWrites=true&w=majority&appName=Cluster0';

// Increase timeout for database operations
jest.setTimeout(60000);

// Setup before all tests
beforeAll(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    console.log('Test database connected');
  } catch (error) {
    console.error('Test database connection failed:', error);
    throw error;
  }
});

// Cleanup after each test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Cleanup after all tests
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  console.log('Test database disconnected');
}, 60000);

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};