const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const MedicalRecord = require('../models/MedicalRecord');
const AuditLog = require('../models/AuditLog');

/**
 * Doctor Portal API Test Suite
 * Tests all user stories with comprehensive coverage
 * Follows AAA pattern (Arrange, Act, Assert)
 */

describe('Doctor Portal API', () => {
  let doctorToken;
  let doctorId;
  let patientId;
  let recordId;

  // Test database setup
  beforeAll(async () => {
    // Connect to test database
    const MONGODB_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/urbancare_test';
    await mongoose.connect(MONGODB_URI);
    
    // Clean up test data
    await User.deleteMany({});
    await MedicalRecord.deleteMany({});
    await AuditLog.deleteMany({});
  });

  afterAll(async () => {
    // Clean up and close connection
    await User.deleteMany({});
    await MedicalRecord.deleteMany({});
    await AuditLog.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Create test doctor
    const doctor = new User({
      firstName: 'Dr. Test',
      lastName: 'Doctor',
      email: 'doctor@test.com',
      password: 'TestPass123!',
      phone: '+1-555-0100',
      role: 'doctor',
      specialization: 'Internal Medicine',
      licenseNumber: 'MD123456',
      isActive: true,
      isEmailVerified: true
    });
    await doctor.save();
    doctorId = doctor._id;
    doctorToken = doctor.generateAuthToken();

    // Create test patient
    const patient = new User({
      firstName: 'Test',
      lastName: 'Patient',
      email: 'patient@test.com',
      password: 'TestPass123!',
      phone: '+1-555-0200',
      role: 'patient',
      dateOfBirth: new Date('1990-01-01'),
      gender: 'male',
      digitalHealthCardId: 'HC-TEST123',
      isActive: true
    });
    await patient.save();
    patientId = patient._id;

    // Create test medical record
    const record = new MedicalRecord({
      patient: patientId,
      recordType: 'consultation',
      createdBy: doctorId,
      doctor: doctorId,
      title: 'Test Consultation',
      description: 'Test consultation description'
    });
    await record.save();
    recordId = record._id;
  });

  afterEach(async () => {
    // Clean up after each test
    await User.deleteMany({});
    await MedicalRecord.deleteMany({});
    await AuditLog.deleteMany({});
  });

  describe('Authentication & Authorization', () => {
    test('should reject requests without token', async () => {
      const response = await request(app)
        .get('/api/doctor/dashboard');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should reject non-doctor users', async () => {
      // Create non-doctor user
      const patient = new User({
        firstName: 'Test',
        lastName: 'Patient',
        email: 'patient2@test.com',
        password: 'TestPass123!',
        phone: '+1-555-0300',
        role: 'patient',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'male'
      });
      await patient.save();
      const patientToken = patient.generateAuthToken();

      const response = await request(app)
        .get('/api/doctor/dashboard')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Doctor role required');
    });
  });

  describe('Patient Search', () => {
    test('should search patients by digital health card ID', async () => {
      const response = await request(app)
        .get('/api/doctor/patients/search?q=HC-TEST123')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].digitalHealthCardId).toBe('HC-TEST123');
    });

    test('should search patients by name', async () => {
      const response = await request(app)
        .get('/api/doctor/patients/search?q=Test Patient')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].firstName).toBe('Test');
    });

    test('should validate search query', async () => {
      const response = await request(app)
        .get('/api/doctor/patients/search?q=a')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should log search activity', async () => {
      await request(app)
        .get('/api/doctor/patients/search?q=HC-TEST123')
        .set('Authorization', `Bearer ${doctorToken}`);

      const auditLog = await AuditLog.findOne({
        userId: doctorId,
        action: 'SEARCH_PATIENT'
      });

      expect(auditLog).toBeTruthy();
      expect(auditLog.status).toBe('SUCCESS');
    });
  });

  describe('Patient Medical History - User Story 3', () => {
    test('should retrieve patient medical history', async () => {
      const response = await request(app)
        .get(`/api/doctor/patients/${patientId}/medical-history`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.patient).toBeTruthy();
      expect(response.body.data.medicalRecords).toBeTruthy();
      expect(response.body.data.summary).toBeTruthy();
    });

    test('should return 404 for non-existent patient', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/doctor/patients/${fakeId}/medical-history`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('should log patient record access', async () => {
      await request(app)
        .get(`/api/doctor/patients/${patientId}/medical-history`)
        .set('Authorization', `Bearer ${doctorToken}`);

      const auditLog = await AuditLog.findOne({
        userId: doctorId,
        action: 'VIEW_PATIENT_RECORD',
        patientId: patientId
      });

      expect(auditLog).toBeTruthy();
      expect(auditLog.status).toBe('SUCCESS');
    });
  });

  describe('Treatment Notes - User Story 4', () => {
    test('should add new treatment note', async () => {
      const treatmentData = {
        title: 'New Treatment Note',
        description: 'Detailed treatment description for testing',
        diagnosis: {
          primary: 'Test Diagnosis',
          severity: 'moderate'
        },
        prescriptions: [{
          medication: 'Test Medicine',
          dosage: '10mg',
          frequency: 'Twice daily'
        }],
        vitalSigns: {
          bloodPressure: {
            systolic: 120,
            diastolic: 80
          },
          heartRate: 70
        },
        notes: 'Additional notes for testing'
      };

      const response = await request(app)
        .post(`/api/doctor/patients/${patientId}/treatment-notes`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(treatmentData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(treatmentData.title);
    });

    test('should validate required fields', async () => {
      const invalidData = {
        title: 'Too short'
      };

      const response = await request(app)
        .post(`/api/doctor/patients/${patientId}/treatment-notes`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeTruthy();
    });

    test('should log treatment note creation', async () => {
      const treatmentData = {
        title: 'Logged Treatment Note',
        description: 'This treatment note should be logged in audit trail'
      };

      await request(app)
        .post(`/api/doctor/patients/${patientId}/treatment-notes`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(treatmentData);

      const auditLog = await AuditLog.findOne({
        userId: doctorId,
        action: 'CREATE_TREATMENT_NOTE',
        patientId: patientId
      });

      expect(auditLog).toBeTruthy();
      expect(auditLog.status).toBe('SUCCESS');
      expect(auditLog.changes.after).toBeTruthy();
    });
  });

  describe('Treatment Note Updates - User Story 5', () => {
    test('should update existing treatment note', async () => {
      const updateData = {
        title: 'Updated Treatment Note',
        description: 'Updated description with new information'
      };

      const response = await request(app)
        .put(`/api/doctor/treatment-notes/${recordId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updateData.title);
    });

    test('should prevent unauthorized updates', async () => {
      // Create another doctor
      const otherDoctor = new User({
        firstName: 'Other',
        lastName: 'Doctor',
        email: 'other@test.com',
        password: 'TestPass123!',
        phone: '+1-555-0400',
        role: 'doctor',
        specialization: 'Cardiology'
      });
      await otherDoctor.save();
      const otherToken = otherDoctor.generateAuthToken();

      const updateData = {
        title: 'Unauthorized Update'
      };

      const response = await request(app)
        .put(`/api/doctor/treatment-notes/${recordId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Unauthorized');
    });

    test('should log treatment note updates with change tracking', async () => {
      const updateData = {
        title: 'Audit Logged Update',
        notes: 'This update should be fully logged'
      };

      await request(app)
        .put(`/api/doctor/treatment-notes/${recordId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(updateData);

      const auditLog = await AuditLog.findOne({
        userId: doctorId,
        action: 'UPDATE_TREATMENT_NOTE',
        resourceId: recordId
      });

      expect(auditLog).toBeTruthy();
      expect(auditLog.status).toBe('SUCCESS');
      expect(auditLog.changes.before).toBeTruthy();
      expect(auditLog.changes.after).toBeTruthy();
      expect(auditLog.changes.fieldsChanged).toContain('title');
    });
  });

  describe('Schedule Management - User Stories 6 & 7', () => {
    test('should retrieve doctor schedule', async () => {
      const response = await request(app)
        .get('/api/doctor/schedule')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.doctor).toBeTruthy();
      expect(response.body.data.upcomingAppointments).toBeTruthy();
    });

    test('should update doctor availability', async () => {
      const availabilityData = {
        monday: {
          enabled: true,
          startTime: '08:00',
          endTime: '16:00'
        },
        tuesday: {
          enabled: false
        }
      };

      const response = await request(app)
        .put('/api/doctor/availability')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(availabilityData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.availability.monday.enabled).toBe(true);
    });

    test('should validate time format', async () => {
      const invalidData = {
        monday: {
          enabled: true,
          startTime: '25:00', // Invalid time
          endTime: '16:00'
        }
      };

      const response = await request(app)
        .put('/api/doctor/availability')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should log schedule updates', async () => {
      const availabilityData = {
        wednesday: {
          enabled: true,
          startTime: '09:00',
          endTime: '17:00'
        }
      };

      await request(app)
        .put('/api/doctor/availability')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(availabilityData);

      const auditLog = await AuditLog.findOne({
        userId: doctorId,
        action: 'UPDATE_SCHEDULE'
      });

      expect(auditLog).toBeTruthy();
      expect(auditLog.status).toBe('SUCCESS');
    });
  });

  describe('Dashboard', () => {
    test('should retrieve dashboard data', async () => {
      const response = await request(app)
        .get('/api/doctor/dashboard')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.summary).toBeTruthy();
      expect(response.body.data.summary.todaysAppointments).toBeDefined();
      expect(response.body.data.summary.totalUpcoming).toBeDefined();
    });
  });

  describe('Input Validation & Security', () => {
    test('should sanitize malicious input', async () => {
      const maliciousData = {
        title: '<script>alert("xss")</script>Malicious Title',
        description: 'Normal description',
        __proto__: { malicious: 'property' }
      };

      const response = await request(app)
        .post(`/api/doctor/patients/${patientId}/treatment-notes`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(maliciousData);

      expect(response.status).toBe(201);
      expect(response.body.data.title).not.toContain('<script>');
    });

    test('should validate MongoDB ObjectIds', async () => {
      const response = await request(app)
        .get('/api/doctor/patients/invalid-id/medical-history')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid patient ID format');
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors gracefully', async () => {
      // Close database connection to simulate error
      await mongoose.connection.close();

      const response = await request(app)
        .get('/api/doctor/dashboard')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      // Reconnect for cleanup
      await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/urbancare_test');
    });
  });
});
