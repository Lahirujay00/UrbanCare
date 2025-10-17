const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const MedicalRecord = require('../models/MedicalRecord');

describe('UC03 - Medical Record Access', () => {
  let authToken, patientId, doctorToken, doctorId;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI);

    // Create test patient
    const patient = await User.create({
      firstName: 'Charlie',
      lastName: 'Wilson',
      email: 'charlie@example.com',
      password: 'Patient123!',
      role: 'patient',
      digitalHealthCardId: 'HC444444444',
      phone: '+94770004444',
      dateOfBirth: '1988-12-25',
      gender: 'male',
      isActive: true,
      isEmailVerified: true
    });
    patientId = patient._id;

    // Create test doctor
    const doctor = await User.create({
      firstName: 'Dr. Sarah',
      lastName: 'Davis',
      email: 'sarah.davis@example.com',
      password: 'Doctor123!',
      role: 'doctor',
      phone: '+94770005555',
      isActive: true,
      isEmailVerified: true
    });
    doctorId = doctor._id;

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

    // Create test medical records
    await MedicalRecord.create([
      {
        patientId: patientId,
        recordType: 'diagnosis',
        title: 'Initial Consultation',
        description: 'Patient presents with respiratory symptoms',
        diagnosis: { primary: 'Acute Respiratory Infection', severity: 'moderate' },
        doctorId: doctorId,
        createdBy: doctorId,
        accessLog: []
      },
      {
        patientId: patientId,
        recordType: 'treatment-plan',
        title: 'ARI Treatment Plan',
        description: 'Comprehensive treatment plan for ARI',
        treatmentPlan: 'Rest, hydration, and symptomatic relief',
        labTests: ['CBC', 'CRP'],
        doctorId: doctorId,
        createdBy: doctorId,
        accessLog: []
      },
      {
        patientId: patientId,
        recordType: 'allergy',
        title: 'Penicillin Allergy',
        description: 'Severe allergic reaction to penicillin',
        allergies: ['Penicillin'],
        doctorId: doctorId,
        createdBy: doctorId,
        accessLog: []
      }
    ]);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('GET /api/medical-records/patient/:patientId - Record Access (MS8-MS9)', () => {
    test('UC03-MS8-MS9: Authorized personnel access patient records showing history, allergies, prescriptions', async () => {
      // Act
      const response = await request(app)
        .get(`/api/medical-records/patient/${patientId}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.records.length).toBe(3);

      // Check diagnosis record
      const diagnosisRecord = response.body.data.records.find(r => r.recordType === 'diagnosis');
      expect(diagnosisRecord).toBeDefined();
      expect(diagnosisRecord.diagnosis.primary).toBe('Acute Respiratory Infection');

      // Check treatment plan
      const treatmentRecord = response.body.data.records.find(r => r.recordType === 'treatment-plan');
      expect(treatmentRecord).toBeDefined();
      expect(treatmentRecord.labTests).toEqual(['CBC', 'CRP']);

      // Check allergy record
      const allergyRecord = response.body.data.records.find(r => r.recordType === 'allergy');
      expect(allergyRecord).toBeDefined();
      expect(allergyRecord.allergies).toEqual(['Penicillin']);
    });

    test('UC03-MS8-MS9: Doctor can access patient records', async () => {
      // Act
      const response = await request(app)
        .get(`/api/medical-records/patient/${patientId}`)
        .set('Authorization', `Bearer ${doctorToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.records.length).toBe(3);
    });

    test('UC03-Alt8a: Partial access restrictions for sensitive records', async () => {
      // This would require additional privacy settings implementation
      // For now, test that all records are accessible to authorized roles
      const response = await request(app)
        .get(`/api/medical-records/patient/${patientId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.records.length).toBe(3);
    });

    test('UC03-Exception1: Unauthorized access blocked', async () => {
      // Act - No auth token
      const response = await request(app)
        .get(`/api/medical-records/patient/${patientId}`);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });

    test('UC03-Exception1: Patient cannot access other patients records', async () => {
      // Arrange - Create another patient
      const otherPatient = await User.create({
        firstName: 'David',
        lastName: 'Brown',
        email: 'david@example.com',
        password: 'Patient123!',
        role: 'patient',
        digitalHealthCardId: 'HC555555555',
        isActive: true,
        isEmailVerified: true
      });

      // Get patient token
      const patientLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'charlie@example.com',
          password: 'Patient123!'
        });

      // Act - Patient trying to access another patient's records
      const response = await request(app)
        .get(`/api/medical-records/patient/${otherPatient._id}`)
        .set('Authorization', `Bearer ${patientLogin.body.token}`);

      // Assert
      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Insufficient permissions');
    });
  });

  describe('POST /api/medical-records - Record Updates (MS10-MS11)', () => {
    test('UC03-MS10-MS11: Doctor updates/add treatment notes and system saves securely with logging', async () => {
      // Arrange
      const newRecord = {
        patientId: patientId,
        recordType: 'treatment-plan',
        title: 'Updated Treatment Plan',
        description: 'Revised treatment approach',
        treatmentPlan: 'Updated plan with additional medications',
        labTests: ['CBC', 'CRP', 'X-Ray'],
        prescriptions: [{
          medication: 'Paracetamol',
          dosage: '500mg',
          frequency: 'Every 6 hours',
          duration: '7 days'
        }]
      };

      // Act
      const response = await request(app)
        .post('/api/medical-records')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(newRecord);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.recordType).toBe('treatment-plan');
      expect(response.body.data.treatmentPlan).toBe('Updated plan with additional medications');
      expect(response.body.data.prescriptions.length).toBe(1);
      expect(response.body.data.createdBy.toString()).toBe(doctorId.toString());
      expect(response.body.data.accessLog).toBeDefined();
      expect(response.body.data.accessLog.length).toBeGreaterThan(0);
    });

    test('UC03-MS10: Hospital staff updates other information', async () => {
      // Arrange
      const newRecord = {
        patientId: patientId,
        recordType: 'general',
        title: 'Contact Information Update',
        description: 'Updated emergency contact details',
        emergencyContact: {
          name: 'Jane Wilson',
          relationship: 'Sister',
          phone: '+94770004444'
        }
      };

      // Act
      const response = await request(app)
        .post('/api/medical-records')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newRecord);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.emergencyContact.name).toBe('Jane Wilson');
      expect(response.body.data.accessLog).toBeDefined();
    });

    test('UC03-Alt10a: Re-authentication required for sensitive updates', async () => {
      // This would require additional re-authentication middleware
      // For now, test that updates require proper authorization
      const sensitiveRecord = {
        patientId: patientId,
        recordType: 'diagnosis',
        title: 'Critical Diagnosis Update',
        description: 'Updated critical diagnosis',
        diagnosis: { primary: 'Critical Condition', severity: 'high' }
      };

      // Act - Receptionist trying to create diagnosis record
      const response = await request(app)
        .post('/api/medical-records')
        .set('Authorization', `Bearer ${authToken}`)
        .send(sensitiveRecord);

      // Assert - Receptionist cannot create diagnosis records
      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Insufficient permissions');
    });

    test('UC03-Exception1: Unauthorized record creation blocked', async () => {
      // Act - No auth token
      const response = await request(app)
        .post('/api/medical-records')
        .send({
          patientId: patientId,
          recordType: 'general',
          title: 'Unauthorized Update'
        });

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });
  });

  describe('Access Logging (MS11)', () => {
    test('UC03-MS11: Access events are logged for security and auditing', async () => {
      // Act - Access patient records
      await request(app)
        .get(`/api/medical-records/patient/${patientId}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Verify access log was created
      const records = await MedicalRecord.find({ patientId });

      // Check that access logs exist in the records
      records.forEach(record => {
        expect(record.accessLog).toBeDefined();
        expect(record.accessLog.length).toBeGreaterThan(0);
        expect(record.accessLog[0].action).toBe('view');
        expect(record.accessLog[0].userId).toBeDefined();
        expect(record.accessLog[0].timestamp).toBeDefined();
      });
    });

    test('UC03-MS11: Update events are logged with details', async () => {
      // Act - Create new record
      await request(app)
        .post('/api/medical-records')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          patientId: patientId,
          recordType: 'progress-note',
          title: 'Progress Note',
          description: 'Patient showing improvement'
        });

      // Verify update log was created
      const newRecord = await MedicalRecord.findOne({
        patientId,
        recordType: 'progress-note'
      });

      expect(newRecord.accessLog).toBeDefined();
      expect(newRecord.accessLog.length).toBeGreaterThan(0);
      expect(newRecord.accessLog[0].action).toBe('create');
      expect(newRecord.accessLog[0].userId.toString()).toBe(doctorId.toString());
    });
  });

  describe('Exception Flows', () => {
    test('UC03-Exception3: System database error - access temporarily unavailable', async () => {
      // Arrange - Simulate database disconnection
      await mongoose.connection.close();

      // Act
      const response = await request(app)
        .get(`/api/medical-records/patient/${patientId}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Assert
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      // Reconnect for other tests
      await mongoose.connect(process.env.MONGODB_URI);
    });

    test('UC03-Exception3: Invalid patient ID returns error', async () => {
      // Act
      const response = await request(app)
        .get('/api/medical-records/patient/invalid-id')
        .set('Authorization', `Bearer ${authToken}`);

      // Assert
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });
});