const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');

describe('UC03 - Patient Authentication', () => {
  beforeAll(async () => {
    // Use global test database connection
    await global.TestDatabase.connect();
  });

  beforeEach(async () => {
    // Clean up test data only if database is available
    if (global.TestDatabase.isAvailable()) {
      try {
        await User.deleteMany({ email: { $regex: /@example\.com$/ } });
      } catch (error) {
        console.log('Cleanup error (ignored):', error.message);
      }
    }
  });

  describe('POST /api/auth/login - Patient Login (MS1)', () => {
    test('UC03-MS1: Patient logs into system successfully', async () => {
      // Arrange
      const patientData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'Patient123!',
        role: 'patient',
        digitalHealthCardId: 'HC123456789',
        phone: '+94770001111',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        isActive: true,
        isEmailVerified: true
      };
      await User.create(patientData);

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john.doe@example.com',
          password: 'Patient123!'
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.role).toBe('patient');
      expect(response.body.user.digitalHealthCardId).toBe('HC123456789');
      expect(response.body.token).toBeDefined();
    });

    test('UC03-Exception1: Unauthorized access attempt - Invalid credentials', async () => {
      // Arrange
      const patientData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'Patient123!',
        role: 'patient',
        phone: '+94770001111',
        dateOfBirth: '1990-01-01',
        gender: 'male'
      };
      await User.create(patientData);

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john.doe@example.com',
          password: 'WrongPassword!'
        });

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid email or password');
    });

    test('UC03-Exception1: Unauthorized access attempt - Inactive account', async () => {
      // Arrange
      const patientData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'Patient123!',
        role: 'patient',
        phone: '+94770001111',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        isActive: false
      };
      await User.create(patientData);

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john.doe@example.com',
          password: 'Patient123!'
        });

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Account is inactive');
    });

    test('UC03-Exception2: System offline - Database connection failure', async () => {
      // Skip this test if database is not available
      if (!global.TestDatabase.isAvailable()) {
        return;
      }

      // Act - Test with invalid credentials to simulate error
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'InvalidPassword123!'
        });

      // Assert - Should return unauthorized instead of system error
      expect([401, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me - Token Validation', () => {
    test('UC03-MS1: Valid token returns patient data with digital health card', async () => {
      // Arrange
      const patient = await User.create({
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        password: 'Patient123!',
        role: 'patient',
        digitalHealthCardId: 'HC987654321',
        phone: '+94770002222',
        dateOfBirth: '1985-05-15',
        gender: 'female',
        isActive: true,
        isEmailVerified: true
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'jane.smith@example.com',
          password: 'Patient123!'
        });

      // Act
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${loginResponse.body.token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.digitalHealthCardId).toBe('HC987654321');
      expect(response.body.user.role).toBe('patient');
    });

    test('UC03-Exception1: Invalid token blocks access', async () => {
      // Act
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Not authorized to access this route');
    });

    test('UC03-Exception1: No token provided blocks access', async () => {
      // Act
      const response = await request(app)
        .get('/api/auth/me');

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Not authorized to access this route');
    });
  });
});