/**
 * @fileoverview Test Database Setup and Management
 * @author UrbanCare Development Team
 * @version 1.0.0
 */

const mongoose = require('mongoose');

class TestDatabase {
  static instance = null;
  static isConnected = false;

  static async connect() {
    if (this.isConnected) {
      return;
    }

    try {
      const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/urbancare-test';
      
      await mongoose.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      this.isConnected = true;
      console.log('Test database connected successfully');
    } catch (error) {
      console.error('Test database connection failed:', error.message);
      // Don't throw error - let tests run with mocks if DB unavailable
    }
  }

  static async disconnect() {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.connection.close();
      this.isConnected = false;
      console.log('Test database disconnected');
    } catch (error) {
      console.error('Error disconnecting test database:', error.message);
    }
  }

  static async cleanup() {
    if (!this.isConnected) {
      return;
    }

    try {
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
      }
    } catch (error) {
      console.log('Cleanup error (ignored):', error.message);
    }
  }

  static isAvailable() {
    return this.isConnected && mongoose.connection.readyState === 1;
  }
}

module.exports = TestDatabase;
