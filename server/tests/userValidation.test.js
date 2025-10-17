const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');

describe('UC03 - Patient Identification and Validation', () => {
  let authToken;
  let doctorToken;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI);

    // Create test users
    await User.create([
      {
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice@example.com',
        password: 'Patient123!',
        role: 'patient',
        digitalHealthCardId: 'HC111111111',
        phone: '+94770001111',
        dateOfBirth: '1990-01-01',
        gender: 'female',
        isActive: true,
        isEmailVerified: true
      },
      {
        firstName: 'Bob',
        lastName: 'Smith',
        email: 'bob@example.com',
        password: 'Patient123!',
        role: 'patient',
        digitalHealthCardId: 'HC222222222',
        phone: '+94770002222',
        dateOfBirth: '1985-05-15',
        gender: 'male',
        isActive: true,
        isEmailVerified: true
      },
      {
        firstName: 'Dr. Sarah',
        lastName: 'Davis',
        email: 'sarah.davis@example.com',
        password: 'Doctor123!',
        role: 'doctor',
        phone: '+94770003333',
        isActive: true,
        isEmailVerified: true
      }
    ]);

    // Get auth tokens
    const receptionistLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'receptionist@urbancare.com',
        password: 'Receptionist123!'
      });
    authToken = receptionistLogin.body.token;

    const doctorLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'sarah.davis@example.com',
        password: 'Doctor123!'
      });
    doctorToken = doctorLogin.body.token;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('GET /api/users/search - Patient Search (MS5)', () => {
    test('UC03-MS5-MS6: Valid card ID matches patient and validates identity', async () => {
      // Act
      const response = await request(app)
        .get('/api/users/search?q=HC111111111')
        .set('Authorization', `Bearer ${authToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].digitalHealthCardId).toBe('HC111111111');
      expect(response.body.data[0].firstName).toBe('Alice');
      expect(response.body.data[0].phone).toBe('+94770001111');
    });

    test('UC03-MS5: Search by patient name', async () => {
      // Act
      const response = await request(app)
        .get('/api/users/search?q=Alice')
        .set('Authorization', `Bearer ${authToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].firstName).toBe('Alice');
    });

    test('UC03-Alt5a: Multiple matches found - prompts for additional confirmation', async () => {
      // Arrange - Create patients with similar names
      await User.create({
        firstName: 'Alice',
        lastName: 'Brown',
        email: 'alice.brown@example.com',
        password: 'Patient123!',
        role: 'patient',
        digitalHealthCardId: 'HC333333333',
        phone: '+94770003333',
        dateOfBirth: '1992-03-20',
        gender: 'female',
        isActive: true,
        isEmailVerified: true
      });

      // Act - Search by first name
      const response = await request(app)
        .get('/api/users/search?q=Alice')
        .set('Authorization', `Bearer ${authToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data.every(patient => patient.firstName === 'Alice')).toBe(true);
      // System should return multiple results requiring staff confirmation
      expect(response.body.data[0].phone).toBeDefined();
      expect(response.body.data[0].dateOfBirth).toBeDefined();
    });

    test('UC03-Alt6a: Card ID not recognized - no matches found', async () => {
      // Act
      const response = await request(app)
        .get('/api/users/search?q=HC999999999')
        .set('Authorization', `Bearer ${authToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(0);
    });

    test('UC03-Exception1: Unauthorized access attempt - no auth token', async () => {
      // Act - No auth token
      const response = await request(app)
        .get('/api/users/search?q=HC111111111');

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });

    test('UC03-Exception1: Unauthorized access attempt - patient role cannot search', async () => {
      // Arrange - Get patient token
      const patientLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alice@example.com',
          password: 'Patient123!'
        });

      // Act - Patient trying to search other patients
      const response = await request(app)
        .get('/api/users/search?q=Bob')
        .set('Authorization', `Bearer ${patientLogin.body.token}`);

      // Assert
      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Insufficient permissions');
    });
  });

  describe('GET /api/users/verify-health-card/:healthCardId - Identity Verification (MS6-MS7)', () => {
    test('UC03-MS6-MS7: System validates identity and provides visual confirmation', async () => {
      // Act
      const response = await request(app)
        .get('/api/users/verify-health-card/HC111111111')
        .set('Authorization', `Bearer ${authToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.patient.digitalHealthCardId).toBe('HC111111111');
      expect(response.body.patient.firstName).toBe('Alice');
      expect(response.body.patient.lastName).toBe('Johnson');
      expect(response.body.patient.phone).toBe('+94770001111');
      // Visual confirmation would be handled by frontend
    });

    test('UC03-Alt6a-Alt7a: Invalid card ID validation fails with error feedback', async () => {
      // Act
      const response = await request(app)
        .get('/api/users/verify-health-card/HC999999999')
        .set('Authorization', `Bearer ${authToken}`);

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Patient not found');
    });

    test('UC03-Exception1: Unauthorized verification attempt', async () => {
      // Act - No auth token
      const response = await request(app)
        .get('/api/users/verify-health-card/HC111111111');

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });
  });

  describe('Edge Cases', () => {
    test('UC03-Edge: Empty search query returns no results', async () => {
      // Act
      const response = await request(app)
        .get('/api/users/search?q=')
        .set('Authorization', `Bearer ${authToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(0);
    });

    test('UC03-Edge: Case insensitive search', async () => {
      // Act
      const response = await request(app)
        .get('/api/users/search?q=ALICE')
        .set('Authorization', `Bearer ${authToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].firstName).toBe('Alice');
    });

    test('UC03-Edge: Partial name search', async () => {
      // Act
      const response = await request(app)
        .get('/api/users/search?q=Ali')
        .set('Authorization', `Bearer ${authToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].firstName).toBe('Alice');
    });
  });
});