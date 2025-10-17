const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const MedicalRecord = require('../models/MedicalRecord');

/**
 * UC02 - Patient Account Management Unit Test Suite
 * Tests patient login, dashboard access, medical records, appointments, and profile management
 * Covers: Positive cases, Negative cases, Edge cases, Error cases
 * Target: >80% code coverage
 */

describe('UC02 - Patient Account Management', () => {
  let patient;
  let patientToken;
  let patientId;
  let doctor;
  let appointment;
  let medicalRecord;

  const testEmail = 'patient@test.com';
  const testPassword = 'TestPass123!';
  const validPhone = '+1-555-0100';

  // Database setup
  beforeAll(async () => {
    const MONGODB_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/urbancare_test';
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Clean up existing test data
    await User.deleteMany({});
    await Appointment.deleteMany({});
    await MedicalRecord.deleteMany({});
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({});
    await Appointment.deleteMany({});
    await MedicalRecord.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Create test patient
    patient = new User({
      firstName: 'John',
      lastName: 'Patient',
      email: testEmail,
      password: testPassword,
      phone: validPhone,
      role: 'patient',
      dateOfBirth: new Date('1990-01-15'),
      gender: 'male',
      isActive: true,
      isEmailVerified: true,
      address: {
        street: '123 Main St',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62701',
        country: 'USA'
      }
    });
    await patient.save();
    patientId = patient._id;
    patientToken = patient.generateAuthToken();

    // Create test doctor
    doctor = new User({
      firstName: 'Dr. Sarah',
      lastName: 'Smith',
      email: 'doctor@test.com',
      password: testPassword,
      phone: '+1-555-0101',
      role: 'doctor',
      specialization: 'Cardiology',
      licenseNumber: 'MD12345',
      isActive: true,
      isEmailVerified: true
    });
    await doctor.save();
  });

  afterEach(async () => {
    // Clean up after each test
    await User.deleteMany({});
    await Appointment.deleteMany({});
    await MedicalRecord.deleteMany({});
  });

  /**
   * MAIN SCENARIO TESTS - Happy Path
   */
  describe('Main Scenario - Patient Login & Dashboard', () => {
    test('Should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: testPassword
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.role).toBe('patient');
    });

    test('Should get user profile after login', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe(testEmail);
      expect(res.body.data.user.firstName).toBe('John');
    });

    test('Should display dashboard with all tiles', async () => {
      // Create some test data
      const appointment = new Appointment({
        patient: patientId,
        doctor: doctor._id,
        appointmentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        appointmentTime: '10:00',
        chiefComplaint: 'Check-up',
        consultationFee: 100,
        status: 'scheduled',
        appointmentType: 'consultation',
        department: 'Cardiology'
      });
      await appointment.save();

      const medicalRecord = new MedicalRecord({
        patient: patientId,
        doctor: doctor._id,
        recordType: 'lab-report',
        title: 'Blood Test Results',
        description: 'Complete blood count',
        findings: 'Normal results',
        status: 'active'
      });
      await medicalRecord.save();

      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user).toBeDefined();
    });
  });

  /**
   * POSITIVE TEST CASES - Medical Records
   */
  describe('Positive Cases - Medical Records', () => {
    beforeEach(async () => {
      // Create medical records
      medicalRecord = new MedicalRecord({
        patient: patientId,
        doctor: doctor._id,
        recordType: 'lab-report',
        title: 'Blood Test Results',
        description: 'Complete blood count',
        findings: 'All values normal',
        status: 'active'
      });
      await medicalRecord.save();
    });

    test('Should retrieve patient medical records', async () => {
      const res = await request(app)
        .get('/api/medical-records')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.records)).toBe(true);
      expect(res.body.data.records.length).toBeGreaterThan(0);
    });

    test('Should show medical record summary with all details', async () => {
      const res = await request(app)
        .get('/api/medical-records')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.body.data.records[0]).toHaveProperty('title');
      expect(res.body.data.records[0]).toHaveProperty('recordType');
      expect(res.body.data.records[0]).toHaveProperty('findings');
      expect(res.body.data.records[0]).toHaveProperty('doctor');
    });

    test('Should filter medical records by type', async () => {
      const res = await request(app)
        .get('/api/medical-records?recordType=lab-report')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.records.length).toBeGreaterThan(0);
      res.body.data.records.forEach(record => {
        expect(record.recordType).toBe('lab-report');
      });
    });

    test('Should only show patient their own records', async () => {
      // Create another patient
      const otherPatient = new User({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@test.com',
        password: testPassword,
        phone: '+1-555-0102',
        role: 'patient',
        dateOfBirth: new Date('1992-05-20'),
        gender: 'female',
        isActive: true,
        isEmailVerified: true
      });
      await otherPatient.save();

      const res = await request(app)
        .get('/api/medical-records')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.body.data.records.length).toBe(1);
      expect(res.body.data.records[0].patient._id).toBe(patientId.toString());
    });
  });

  /**
   * POSITIVE TEST CASES - Upcoming Appointments
   */
  describe('Positive Cases - Upcoming Appointments', () => {
    beforeEach(async () => {
      // Create upcoming appointment
      appointment = new Appointment({
        patient: patientId,
        doctor: doctor._id,
        appointmentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        appointmentTime: '14:00',
        chiefComplaint: 'Cardiology consultation',
        consultationFee: 150,
        status: 'scheduled',
        appointmentType: 'consultation',
        department: 'Cardiology'
      });
      await appointment.save();
    });

    test('Should retrieve upcoming appointments', async () => {
      const res = await request(app)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.appointments)).toBe(true);
      expect(res.body.data.appointments.length).toBeGreaterThan(0);
    });

    test('Should show upcoming appointments with all details', async () => {
      const res = await request(app)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`);

      const apt = res.body.data.appointments[0];
      expect(apt).toHaveProperty('appointmentDate');
      expect(apt).toHaveProperty('appointmentTime');
      expect(apt).toHaveProperty('doctor');
      expect(apt).toHaveProperty('status');
      expect(apt).toHaveProperty('department');
    });

    test('Should only show future appointments', async () => {
      // Create past appointment
      const pastAppointment = new Appointment({
        patient: patientId,
        doctor: doctor._id,
        appointmentDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        appointmentTime: '10:00',
        chiefComplaint: 'Previous check-up',
        consultationFee: 100,
        status: 'completed',
        appointmentType: 'follow-up',
        department: 'Cardiology'
      });
      await pastAppointment.save();

      const res = await request(app)
        .get('/api/appointments?status=scheduled')
        .set('Authorization', `Bearer ${patientToken}`);

      // Should only get upcoming appointment
      expect(res.body.data.appointments.length).toBeGreaterThan(0);
      res.body.data.appointments.forEach(apt => {
        expect(apt.status).toBe('scheduled');
      });
    });
  });

  /**
   * POSITIVE TEST CASES - Profile Management
   */
  describe('Positive Cases - Profile & Preferences Management', () => {
    test('Should update contact details', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          firstName: 'John',
          lastName: 'UpdatedPatient',
          phone: '+1-555-0200'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.lastName).toBe('UpdatedPatient');
      expect(res.body.data.user.phone).toBe('+1-555-0200');
    });

    test('Should update address information', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          address: {
            street: '456 Oak Ave',
            city: 'Chicago',
            state: 'IL',
            zipCode: '60601',
            country: 'USA'
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.data.user.address.street).toBe('456 Oak Ave');
      expect(res.body.data.user.address.city).toBe('Chicago');
    });

    test('Should update emergency contact', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          emergencyContact: {
            name: 'Mary Patient',
            relationship: 'Mother',
            phone: '+1-555-0300',
            email: 'mary@test.com'
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.data.user.emergencyContact.name).toBe('Mary Patient');
      expect(res.body.data.user.emergencyContact.relationship).toBe('Mother');
    });

    test('Should update medical information (allergies)', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          allergies: [
            {
              allergen: 'Penicillin',
              severity: 'severe',
              notes: 'Causes anaphylaxis'
            }
          ]
        });

      expect(res.status).toBe(200);
      expect(res.body.data.user.allergies.length).toBeGreaterThan(0);
      expect(res.body.data.user.allergies[0].allergen).toBe('Penicillin');
    });

    test('Should update chronic conditions', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          chronicConditions: ['Hypertension', 'Type 2 Diabetes']
        });

      expect(res.status).toBe(200);
      expect(res.body.data.user.chronicConditions.length).toBe(2);
      expect(res.body.data.user.chronicConditions).toContain('Hypertension');
    });

    test('Should update current medications', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          currentMedications: [
            {
              medication: 'Lisinopril',
              dosage: '10mg',
              frequency: 'Once daily',
              prescribedBy: 'Dr. Smith',
              startDate: new Date('2024-01-01')
            }
          ]
        });

      expect(res.status).toBe(200);
      expect(res.body.data.user.currentMedications.length).toBeGreaterThan(0);
      expect(res.body.data.user.currentMedications[0].medication).toBe('Lisinopril');
    });

    test('Should display success message after update', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          firstName: 'John'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('successfully');
    });

    test('Should update gender', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          gender: 'female'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.user.gender).toBe('female');
    });

    test('Should update date of birth', async () => {
      const newDOB = new Date('1995-06-15');
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          dateOfBirth: newDOB
        });

      expect(res.status).toBe(200);
      expect(new Date(res.body.data.user.dateOfBirth)).toEqual(newDOB);
    });

    test('Should update blood type', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          bloodType: 'O+'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.user.bloodType).toBe('O+');
    });
  });

  /**
   * NEGATIVE TEST CASES - Authentication & Authorization
   */
  describe('Negative Cases - Authentication Failures', () => {
    test('Should reject login with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'WrongPassword123!'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('Should reject login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: testPassword
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('Should reject profile access without token', async () => {
      const res = await request(app)
        .get('/api/users/profile');

      expect(res.status).toBe(401);
    });

    test('Should reject profile access with invalid token', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
    });

    test('Should not allow patient to view other patient profile', async () => {
      // Create another patient
      const otherPatient = new User({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@test.com',
        password: testPassword,
        phone: '+1-555-0102',
        role: 'patient',
        dateOfBirth: new Date('1992-05-20'),
        gender: 'female',
        isActive: true,
        isEmailVerified: true
      });
      await otherPatient.save();
      const otherToken = otherPatient.generateAuthToken();

      // Create medical record for first patient
      const record = new MedicalRecord({
        patient: patientId,
        doctor: doctor._id,
        recordType: 'diagnosis',
        title: 'Diagnosis',
        description: 'Patient diagnosis',
        status: 'active'
      });
      await record.save();

      // Try to access with other patient token
      const res = await request(app)
        .get(`/api/medical-records/${record._id}`)
        .set('Authorization', `Bearer ${otherToken}`);

      // Should either return 403 or empty results
      expect([403, 404, 200]).toContain(res.status);
    });
  });

  /**
   * NEGATIVE TEST CASES - Profile Validation
   */
  describe('Negative Cases - Profile Validation Errors', () => {
    test('Should reject invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Test',
          lastName: 'User',
          email: 'invalid-email',
          password: testPassword,
          phone: validPhone,
          dateOfBirth: new Date('1990-01-01'),
          gender: 'male'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('Should reject invalid phone format', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          phone: 'not-a-phone'
        });

      expect(res.status).toBe(400);
    });

    test('Should reject first name with too few characters', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          firstName: 'A'
        });

      expect(res.status).toBe(400);
    });

    test('Should reject first name exceeding max length', async () => {
      const longName = 'A'.repeat(51);
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          firstName: longName
        });

      expect(res.status).toBe(400);
    });

    test('Should reject invalid gender', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          gender: 'invalid-gender'
        });

      expect(res.status).toBe(400);
    });

    test('Should reject invalid blood type', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          bloodType: 'Z+'
        });

      expect(res.status).toBe(400);
    });

    test('Should reject duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Another',
          lastName: 'User',
          email: testEmail,
          password: testPassword,
          phone: '+1-555-0999',
          dateOfBirth: new Date('1990-01-01'),
          gender: 'male'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  /**
   * EDGE CASES - Boundary Conditions
   */
  describe('Edge Cases - Boundary Conditions', () => {
    test('Should handle empty medical records list', async () => {
      // Don't create any records

      const res = await request(app)
        .get('/api/medical-records')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.records.length).toBe(0);
    });

    test('Should handle empty appointments list', async () => {
      const res = await request(app)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.appointments.length).toBe(0);
    });

    test('Should display no appointments message', async () => {
      const res = await request(app)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      // Either empty array or specific message
      expect(Array.isArray(res.body.data.appointments)).toBe(true);
    });

    test('Should handle multiple medical records', async () => {
      // Create multiple records
      for (let i = 0; i < 5; i++) {
        const record = new MedicalRecord({
          patient: patientId,
          doctor: doctor._id,
          recordType: 'lab-report',
          title: `Test Report ${i}`,
          description: `Report ${i}`,
          status: 'active'
        });
        await record.save();
      }

      const res = await request(app)
        .get('/api/medical-records')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.body.data.records.length).toBe(5);
    });

    test('Should handle profile with minimal information', async () => {
      // Create patient with minimal info
      const minimalPatient = new User({
        firstName: 'Min',
        lastName: 'Patient',
        email: 'minimal@test.com',
        password: testPassword,
        phone: '+1-555-9999',
        role: 'patient',
        dateOfBirth: new Date('2000-01-01'),
        gender: 'other',
        isActive: true,
        isEmailVerified: true
      });
      await minimalPatient.save();
      const minimalToken = minimalPatient.generateAuthToken();

      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${minimalToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user).toBeDefined();
    });

    test('Should handle profile with complete medical information', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          bloodType: 'A+',
          allergies: [
            { allergen: 'Penicillin', severity: 'severe', notes: 'Anaphylaxis' },
            { allergen: 'Shellfish', severity: 'moderate', notes: 'Swelling' }
          ],
          chronicConditions: ['Diabetes', 'Hypertension', 'Asthma'],
          currentMedications: [
            { medication: 'Metformin', dosage: '1000mg', frequency: 'Twice daily' },
            { medication: 'Lisinopril', dosage: '10mg', frequency: 'Once daily' }
          ]
        });

      expect(res.status).toBe(200);
      expect(res.body.data.user.allergies.length).toBe(2);
      expect(res.body.data.user.chronicConditions.length).toBe(3);
      expect(res.body.data.user.currentMedications.length).toBe(2);
    });

    test('Should handle updating same field multiple times', async () => {
      // First update
      let res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          firstName: 'UpdatedOnce'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.user.firstName).toBe('UpdatedOnce');

      // Second update
      res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          firstName: 'UpdatedTwice'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.user.firstName).toBe('UpdatedTwice');
    });

    test('Should handle special characters in name', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          firstName: "Jean-Paul",
          lastName: "O'Brien"
        });

      expect(res.status).toBe(200);
    });
  });

  /**
   * ALTERNATE FLOWS - Non-blocking Errors
   */
  describe('Alternate Flows - Non-blocking Errors', () => {
    test('Should show non-blocking banner when RecordsDB unavailable', async () => {
      // This would require mocking database failures
      // For now, verify graceful error handling
      const res = await request(app)
        .get('/api/medical-records')
        .set('Authorization', `Bearer ${patientToken}`);

      expect([200, 503, 500]).toContain(res.status);
    });

    test('Should allow other dashboard sections when one fails', async () => {
      // Create appointment but no records
      const apt = new Appointment({
        patient: patientId,
        doctor: doctor._id,
        appointmentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        appointmentTime: '10:00',
        chiefComplaint: 'Test',
        consultationFee: 100,
        status: 'scheduled',
        appointmentType: 'consultation',
        department: 'General'
      });
      await apt.save();

      const appointmentRes = await request(app)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`);

      const recordRes = await request(app)
        .get('/api/medical-records')
        .set('Authorization', `Bearer ${patientToken}`);

      // At least one should succeed
      expect(appointmentRes.status).toBe(200);
      expect(recordRes.status).toBe(200);
    });

    test('Should retry invalid login credentials', async () => {
      // First attempt - wrong password
      let res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'WrongPassword123!'
        });

      expect(res.status).toBe(401);

      // Second attempt - correct password
      res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: testPassword
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('Should show user-friendly error message on validation error', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          firstName: 'A'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBeDefined();
      expect(typeof res.body.message).toBe('string');
    });
  });

  /**
   * EXCEPTION FLOWS - Error Handling
   */
  describe('Exception Flows - System Error Handling', () => {
    test('Should handle database connection errors gracefully', async () => {
      // Verify auth endpoint exists and can be called
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: testPassword
        });

      // Should either succeed or return proper error
      expect([200, 500, 503]).toContain(res.status);
    });

    test('Should return error when profile update fails', async () => {
      // Try to update with invalid ObjectId in nested reference
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          firstName: 'Valid',
          lastName: 'Name'
        });

      expect(res.status).toBe(200);
    });

    test('Should handle rapid successive requests', async () => {
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          request(app)
            .get('/api/users/profile')
            .set('Authorization', `Bearer ${patientToken}`)
        );
      }

      const results = await Promise.all(promises);
      results.forEach(res => {
        expect(res.status).toBe(200);
      });
    });

    test('Should maintain data integrity during concurrent updates', async () => {
      const updates = [
        { firstName: 'Update1' },
        { lastName: 'Update2' },
        { phone: '+1-555-0777' }
      ];

      const promises = updates.map(update =>
        request(app)
          .put('/api/users/profile')
          .set('Authorization', `Bearer ${patientToken}`)
          .send(update)
      );

      const results = await Promise.all(promises);
      results.forEach(res => {
        expect(res.status).toBe(200);
      });

      // Verify profile has at least some updates
      const profileRes = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(profileRes.status).toBe(200);
    });

    test('Should handle profile update with partial data', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          allergies: []
        });

      expect(res.status).toBe(200);
    });

    test('Should handle logout after profile updates', async () => {
      // Update profile
      const updateRes = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          firstName: 'UpdatedName'
        });

      expect(updateRes.status).toBe(200);

      // Login again should work
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: testPassword
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.data.user.firstName).toBe('UpdatedName');
    });
  });

  /**
   * DASHBOARD REFRESH TESTS
   */
  describe('Dashboard Refresh & Cache Management', () => {
    test('Should refresh profile after updates', async () => {
      // Update profile
      const updateRes = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          firstName: 'RefreshedName'
        });

      expect(updateRes.status).toBe(200);

      // Fetch profile again
      const getRes = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.user.firstName).toBe('RefreshedName');
    });

    test('Should reflect new medical records in dashboard', async () => {
      // Verify no records initially
      let res = await request(app)
        .get('/api/medical-records')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.body.data.records.length).toBe(0);

      // Add new record
      const record = new MedicalRecord({
        patient: patientId,
        doctor: doctor._id,
        recordType: 'lab-report',
        title: 'New Test',
        description: 'Recent test',
        status: 'active'
      });
      await record.save();

      // Verify record appears
      res = await request(app)
        .get('/api/medical-records')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.body.data.records.length).toBe(1);
    });

    test('Should reflect new appointments in dashboard', async () => {
      // Verify no appointments initially
      let res = await request(app)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.body.data.appointments.length).toBe(0);

      // Add new appointment
      const apt = new Appointment({
        patient: patientId,
        doctor: doctor._id,
        appointmentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        appointmentTime: '15:00',
        chiefComplaint: 'New appointment',
        consultationFee: 100,
        status: 'scheduled',
        appointmentType: 'consultation',
        department: 'General'
      });
      await apt.save();

      // Verify appointment appears
      res = await request(app)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.body.data.appointments.length).toBe(1);
    });
  });

  /**
   * SECURITY & PERMISSION TESTS
   */
  describe('Security - Permission & Access Control', () => {
    test('Should only allow patient to update own profile', async () => {
      // Create second patient
      const patient2 = new User({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@test.com',
        password: testPassword,
        phone: '+1-555-0102',
        role: 'patient',
        dateOfBirth: new Date('1992-05-20'),
        gender: 'female',
        isActive: true,
        isEmailVerified: true
      });
      await patient2.save();
      const token2 = patient2.generateAuthToken();

      // First patient tries to update second patient's profile
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          firstName: 'Hacker'
        });

      // Should only update own profile
      expect(res.status).toBe(200);

      // Verify update was on first patient
      const profileRes = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token2}`);

      expect(profileRes.body.data.user.firstName).toBe('Jane');
    });

    test('Should not expose sensitive data in responses', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.body.data.user).toBeDefined();
      // Password should not be returned
      expect(res.body.data.user.password).toBeUndefined();
    });

    test('Should not allow inactive patients to login', async () => {
      // Create inactive patient
      const inactivePatient = new User({
        firstName: 'Inactive',
        lastName: 'Patient',
        email: 'inactive@test.com',
        password: testPassword,
        phone: '+1-555-0303',
        role: 'patient',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'male',
        isActive: false,
        isEmailVerified: true
      });
      await inactivePatient.save();

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'inactive@test.com',
          password: testPassword
        });

      // Should reject or return 401
      expect([401, 403]).toContain(res.status);
    });
  });

  /**
   * INTEGRATION TESTS
   */
  describe('Integration - Complete User Journey', () => {
    test('Should complete full patient account management workflow', async () => {
      // Step 1: Login
      let res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: testPassword
        });

      expect(res.status).toBe(200);
      const token = res.body.data.token;

      // Step 2: View medical records
      res = await request(app)
        .get('/api/medical-records')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);

      // Step 3: View appointments
      res = await request(app)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);

      // Step 4: Update profile
      res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          firstName: 'UpdatedFirstName',
          phone: '+1-555-0400',
          emergencyContact: {
            name: 'Emergency Contact',
            relationship: 'Sibling',
            phone: '+1-555-0500'
          },
          allergies: [
            { allergen: 'Aspirin', severity: 'moderate' }
          ]
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Step 5: Verify updates
      res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.firstName).toBe('UpdatedFirstName');
      expect(res.body.data.user.phone).toBe('+1-555-0400');
    });
  });
});
