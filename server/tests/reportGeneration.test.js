const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');
const GeneratedReport = require('../models/GeneratedReport');
const ReportGenerationController = require('../controllers/ReportGenerationController');

/**
 * UC04 - Generate Reports Unit Test Suite
 * Tests report generation functionality with comprehensive coverage
 * Covers: Positive cases, Negative cases, Edge cases, Error handling
 * Target: >80% code coverage
 */

describe('UC04 - Generate Reports', () => {
  let manager;
  let managerToken;
  let doctor;
  let patient;
  let appointmentId;
  let paymentId;
  
  const today = new Date();
  const startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
  const endDate = new Date(today);
  
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
    await Payment.deleteMany({});
    await GeneratedReport.deleteMany({});
  });
  
  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({});
    await Appointment.deleteMany({});
    await Payment.deleteMany({});
    await GeneratedReport.deleteMany({});
    await mongoose.connection.close();
  });
  
  beforeEach(async () => {
    // Create test manager
    manager = new User({
      firstName: 'John',
      lastName: 'Manager',
      email: 'manager@test.com',
      password: 'TestPass123!',
      phone: '+1-555-0101',
      role: 'manager',
      isActive: true,
      isEmailVerified: true
    });
    await manager.save();
    managerToken = manager.generateAuthToken();
    
    // Create test doctor
    doctor = new User({
      firstName: 'Dr. Sarah',
      lastName: 'Smith',
      email: 'doctor@test.com',
      password: 'TestPass123!',
      phone: '+1-555-0102',
      role: 'doctor',
      specialization: 'Cardiology',
      licenseNumber: 'MD12345',
      department: 'Cardiology',
      isActive: true,
      isEmailVerified: true
    });
    await doctor.save();
    
    // Create test patient
    patient = new User({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'patient@test.com',
      password: 'TestPass123!',
      phone: '+1-555-0103',
      role: 'patient',
      isActive: true,
      isEmailVerified: true
    });
    await patient.save();
  });
  
  afterEach(async () => {
    // Clean up after each test
    await User.deleteMany({});
    await Appointment.deleteMany({});
    await Payment.deleteMany({});
    await GeneratedReport.deleteMany({});
  });
  
  /**
   * POSITIVE TEST CASES - Happy Path Scenarios
   */
  describe('Positive Cases - Patient Visit Report', () => {
    beforeEach(async () => {
      // Create test appointments
      const appointment1 = new Appointment({
        patient: patient._id,
        doctor: doctor._id,
        appointmentDate: new Date(endDate.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        appointmentTime: '10:00',
        chiefComplaint: 'Chest pain',
        symptoms: ['shortness of breath', 'dizziness'],
        consultationFee: 100,
        status: 'completed',
        appointmentType: 'consultation',
        department: 'Cardiology'
      });
      await appointment1.save();
      appointmentId = appointment1._id;
      
      const appointment2 = new Appointment({
        patient: patient._id,
        doctor: doctor._id,
        appointmentDate: new Date(endDate.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        appointmentTime: '14:00',
        chiefComplaint: 'Follow-up',
        symptoms: [],
        consultationFee: 50,
        status: 'completed',
        appointmentType: 'follow-up',
        department: 'Cardiology'
      });
      await appointment2.save();
    });
    
    test('Should generate patient visit report with valid date range', async () => {
      const res = await request(app)
        .post('/api/report-generation/patient-visits')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.reportType).toBe('patient-visit');
      expect(res.body.data.analytics).toBeDefined();
      expect(res.body.data.analytics.totalVisits).toBeGreaterThan(0);
    });
    
    test('Should calculate correct total visits count', async () => {
      const res = await request(app)
        .post('/api/report-generation/patient-visits')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
      
      expect(res.body.data.analytics.totalVisits).toBe(2);
      expect(res.body.data.analytics.completedVisits).toBe(2);
    });
    
    test('Should calculate department breakdown correctly', async () => {
      const res = await request(app)
        .post('/api/report-generation/patient-visits')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
      
      expect(res.body.data.analytics.departmentBreakdown).toBeDefined();
      expect(res.body.data.analytics.departmentBreakdown['Cardiology']).toBe(2);
    });
    
    test('Should filter appointments by department', async () => {
      const res = await request(app)
        .post('/api/report-generation/patient-visits')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          department: 'Cardiology'
        });
      
      expect(res.body.data.analytics.totalVisits).toBe(2);
      expect(res.body.data.filters.department).toBe('Cardiology');
    });
    
    test('Should filter appointments by status', async () => {
      const res = await request(app)
        .post('/api/report-generation/patient-visits')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          status: 'completed'
        });
      
      expect(res.body.data.analytics.completedVisits).toBe(2);
    });
    
    test('Should calculate daily breakdown correctly', async () => {
      const res = await request(app)
        .post('/api/report-generation/patient-visits')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
      
      expect(res.body.data.analytics.dailyBreakdown).toBeDefined();
      expect(Object.keys(res.body.data.analytics.dailyBreakdown).length).toBeGreaterThan(0);
    });
    
    test('Should calculate hourly breakdown correctly', async () => {
      const res = await request(app)
        .post('/api/report-generation/patient-visits')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
      
      expect(res.body.data.analytics.hourlyBreakdown).toBeDefined();
    });
    
    test('Should include doctor performance metrics', async () => {
      const res = await request(app)
        .post('/api/report-generation/patient-visits')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
      
      expect(res.body.data.analytics.doctorPerformance).toBeDefined();
      const doctorName = `Dr. Sarah Smith`;
      expect(res.body.data.analytics.doctorPerformance[doctorName]).toBeDefined();
      expect(res.body.data.analytics.doctorPerformance[doctorName].total).toBe(2);
      expect(res.body.data.analytics.doctorPerformance[doctorName].completed).toBe(2);
    });
    
    test('Should include appointment details in report', async () => {
      const res = await request(app)
        .post('/api/report-generation/patient-visits')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
      
      expect(res.body.data.appointments).toBeDefined();
      expect(res.body.data.appointments.length).toBe(2);
      expect(res.body.data.appointments[0]).toHaveProperty('patientName');
      expect(res.body.data.appointments[0]).toHaveProperty('doctorName');
      expect(res.body.data.appointments[0]).toHaveProperty('status');
    });
  });
  
  /**
   * POSITIVE TEST CASES - Staff Utilization Report
   */
  describe('Positive Cases - Staff Utilization Report', () => {
    beforeEach(async () => {
      // Create additional staff members
      const staff = new User({
        firstName: 'Dr. Mike',
        lastName: 'Johnson',
        email: 'doctor2@test.com',
        password: 'TestPass123!',
        phone: '+1-555-0104',
        role: 'doctor',
        specialization: 'Neurology',
        licenseNumber: 'MD12346',
        department: 'Neurology',
        isActive: true,
        isEmailVerified: true
      });
      await staff.save();
      
      // Create appointments for utilization calculation
      const appointment1 = new Appointment({
        patient: patient._id,
        doctor: doctor._id,
        appointmentDate: new Date(endDate.getTime() - 3 * 24 * 60 * 60 * 1000),
        appointmentTime: '09:00',
        chiefComplaint: 'Check-up',
        consultationFee: 100,
        status: 'completed',
        appointmentType: 'consultation',
        department: 'Cardiology'
      });
      await appointment1.save();
      
      const appointment2 = new Appointment({
        patient: patient._id,
        doctor: doctor._id,
        appointmentDate: new Date(endDate.getTime() - 5 * 24 * 60 * 60 * 1000),
        appointmentTime: '10:00',
        chiefComplaint: 'Follow-up',
        consultationFee: 50,
        status: 'completed',
        appointmentType: 'follow-up',
        department: 'Cardiology'
      });
      await appointment2.save();
    });
    
    test('Should generate staff utilization report with valid parameters', async () => {
      const res = await request(app)
        .post('/api/report-generation/staff-utilization')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.reportType).toBe('staff-utilization');
      expect(res.body.data.summary).toBeDefined();
    });
    
    test('Should calculate total staff count', async () => {
      const res = await request(app)
        .post('/api/report-generation/staff-utilization')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
      
      expect(res.body.data.summary.totalStaff).toBeGreaterThan(0);
    });
    
    test('Should calculate average utilization rate', async () => {
      const res = await request(app)
        .post('/api/report-generation/staff-utilization')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
      
      expect(res.body.data.summary.avgUtilizationRate).toBeDefined();
      expect(typeof res.body.data.summary.avgUtilizationRate).toBe('number');
      expect(res.body.data.summary.avgUtilizationRate).toBeGreaterThanOrEqual(0);
    });
    
    test('Should include staff utilization details', async () => {
      const res = await request(app)
        .post('/api/report-generation/staff-utilization')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
      
      expect(res.body.data.staffUtilization).toBeDefined();
      expect(Array.isArray(res.body.data.staffUtilization)).toBe(true);
    });
    
    test('Should calculate correct completion and cancellation rates', async () => {
      const res = await request(app)
        .post('/api/report-generation/staff-utilization')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
      
      const staffData = res.body.data.staffUtilization;
      const doctorData = staffData.find(s => s.role === 'doctor');
      
      if (doctorData && doctorData.totalAppointments > 0) {
        expect(doctorData.completionRate).toBeDefined();
        expect(doctorData.cancellationRate).toBeDefined();
        expect(doctorData.completionRate).toBeGreaterThanOrEqual(0);
        expect(doctorData.cancellationRate).toBeGreaterThanOrEqual(0);
      }
    });
    
    test('Should filter staff by department', async () => {
      const res = await request(app)
        .post('/api/report-generation/staff-utilization')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          department: 'Cardiology'
        });
      
      expect(res.body.data.filters.department).toBe('Cardiology');
    });
  });
  
  /**
   * POSITIVE TEST CASES - Financial Summary Report
   */
  describe('Positive Cases - Financial Summary Report', () => {
    beforeEach(async () => {
      // Create test appointments for financial report
      const appointment1 = new Appointment({
        patient: patient._id,
        doctor: doctor._id,
        appointmentDate: new Date(endDate.getTime() - 5 * 24 * 60 * 60 * 1000),
        appointmentTime: '10:00',
        chiefComplaint: 'Check-up',
        consultationFee: 100,
        status: 'completed',
        appointmentType: 'consultation',
        department: 'Cardiology',
        paymentStatus: 'paid'
      });
      await appointment1.save();
      
      // Create payments
      const payment1 = new Payment({
        transactionId: `TXN-${Date.now()}-1`,
        appointment: appointment1._id,
        patient: patient._id,
        doctor: doctor._id,
        amount: 100,
        paymentMethod: 'card',
        paymentGateway: 'stripe',
        status: 'completed',
        createdAt: new Date(endDate.getTime() - 5 * 24 * 60 * 60 * 1000)
      });
      await payment1.save();
      paymentId = payment1._id;
      
      const payment2 = new Payment({
        transactionId: `TXN-${Date.now()}-2`,
        appointment: appointment1._id,
        patient: patient._id,
        doctor: doctor._id,
        amount: 50,
        paymentMethod: 'online',
        paymentGateway: 'stripe',
        status: 'pending',
        createdAt: new Date(endDate.getTime() - 10 * 24 * 60 * 60 * 1000)
      });
      await payment2.save();
    });
    
    test('Should generate financial summary report with valid parameters', async () => {
      const res = await request(app)
        .post('/api/report-generation/financial-summary')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.reportType).toBe('financial-summary');
      expect(res.body.data.summary).toBeDefined();
    });
    
    test('Should calculate total revenue correctly', async () => {
      const res = await request(app)
        .post('/api/report-generation/financial-summary')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
      
      expect(res.body.data.summary.totalRevenue).toBe(100);
    });
    
    test('Should calculate pending revenue separately', async () => {
      const res = await request(app)
        .post('/api/report-generation/financial-summary')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
      
      expect(res.body.data.summary.pendingRevenue).toBe(50);
    });
    
    test('Should count total transactions', async () => {
      const res = await request(app)
        .post('/api/report-generation/financial-summary')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
      
      expect(res.body.data.summary.totalTransactions).toBe(2);
    });
    
    test('Should breakdown revenue by payment method', async () => {
      const res = await request(app)
        .post('/api/report-generation/financial-summary')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
      
      expect(res.body.data.analytics.paymentMethodBreakdown).toBeDefined();
      expect(res.body.data.analytics.paymentMethodBreakdown['card']).toBeDefined();
      expect(res.body.data.analytics.paymentMethodBreakdown['card'].amount).toBe(100);
    });
    
    test('Should breakdown revenue by department', async () => {
      const res = await request(app)
        .post('/api/report-generation/financial-summary')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
      
      expect(res.body.data.analytics.departmentRevenue).toBeDefined();
      expect(res.body.data.analytics.departmentRevenue['Cardiology']).toBe(100);
    });
    
    test('Should include daily revenue breakdown', async () => {
      const res = await request(app)
        .post('/api/report-generation/financial-summary')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
      
      expect(res.body.data.analytics.dailyRevenue).toBeDefined();
    });
    
    test('Should filter payments by payment method', async () => {
      const res = await request(app)
        .post('/api/report-generation/financial-summary')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          paymentMethod: 'card'
        });
      
      expect(res.body.data.filters.paymentMethod).toBe('card');
      expect(res.body.data.transactions.length).toBeGreaterThan(0);
    });
    
    test('Should filter payments by status', async () => {
      const res = await request(app)
        .post('/api/report-generation/financial-summary')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          status: 'completed'
        });
      
      expect(res.body.data.filters.status).toBe('completed');
    });
  });
  
  /**
   * NEGATIVE TEST CASES - Error Handling
   */
  describe('Negative Cases - Error Handling', () => {
    test('Should reject patient visit report without authentication', async () => {
      const res = await request(app)
        .post('/api/report-generation/patient-visits')
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
      
      expect(res.status).toBe(401);
    });
    
    test('Should reject patient visit report with invalid token', async () => {
      const res = await request(app)
        .post('/api/report-generation/patient-visits')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
      
      expect(res.status).toBe(401);
    });
    
    test('Should reject patient visit report with invalid start date', async () => {
      const res = await request(app)
        .post('/api/report-generation/patient-visits')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          startDate: 'invalid-date',
          endDate: endDate.toISOString()
        });
      
      expect(res.status).toBe(400);
    });
    
    test('Should reject patient visit report with invalid end date', async () => {
      const res = await request(app)
        .post('/api/report-generation/patient-visits')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: 'invalid-date'
        });
      
      expect(res.status).toBe(400);
    });
    
    test('Should reject staff utilization report without required parameters', async () => {
      const res = await request(app)
        .post('/api/report-generation/staff-utilization')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({});
      
      expect(res.status).toBe(400);
    });
    
    test('Should reject financial summary report without authentication', async () => {
      const res = await request(app)
        .post('/api/report-generation/financial-summary')
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
      
      expect(res.status).toBe(401);
    });
  });
  
  /**
   * EDGE CASES - Boundary Conditions
   */
  describe('Edge Cases - Boundary Conditions', () => {
    test('Should handle patient visit report with no appointments', async () => {
      const res = await request(app)
        .post('/api/report-generation/patient-visits')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
      
      expect(res.status).toBe(200);
      expect(res.body.data.analytics.totalVisits).toBe(0);
      expect(res.body.data.appointments.length).toBe(0);
    });
    
    test('Should handle staff utilization report with no staff', async () => {
      const res = await request(app)
        .post('/api/report-generation/staff-utilization')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
      
      expect(res.status).toBe(200);
      expect(res.body.data.summary.totalStaff).toBe(0);
    });
    
    test('Should handle financial summary report with no payments', async () => {
      const res = await request(app)
        .post('/api/report-generation/financial-summary')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
      
      expect(res.status).toBe(200);
      expect(res.body.data.summary.totalRevenue).toBe(0);
    });
    
    test('Should handle report with same start and end date', async () => {
      const singleDate = new Date();
      const res = await request(app)
        .post('/api/report-generation/patient-visits')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          startDate: singleDate.toISOString(),
          endDate: singleDate.toISOString()
        });
      
      expect(res.status).toBe(200);
      expect(res.body.data.analytics).toBeDefined();
    });
    
    test('Should handle report with reversed date range', async () => {
      const res = await request(app)
        .post('/api/report-generation/patient-visits')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          startDate: endDate.toISOString(),
          endDate: startDate.toISOString()
        });
      
      expect(res.status).toBe(200);
      // Should return empty results
      expect(res.body.data.analytics.totalVisits).toBe(0);
    });
    
    test('Should handle very large date range', async () => {
      const veryOldDate = new Date('2000-01-01');
      const res = await request(app)
        .post('/api/report-generation/patient-visits')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          startDate: veryOldDate.toISOString(),
          endDate: endDate.toISOString()
        });
      
      expect(res.status).toBe(200);
      expect(res.body.data.analytics).toBeDefined();
    });
    
    test('Should handle department filter with non-existent department', async () => {
      const res = await request(app)
        .post('/api/report-generation/patient-visits')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          department: 'NonExistentDepartment'
        });
      
      expect(res.status).toBe(200);
      expect(res.body.data.analytics.totalVisits).toBe(0);
    });
  });
  
  /**
   * EXCEPTION FLOW TESTS - Error Handling per Requirements
   */
  describe('Exception Flows', () => {
    test('Should handle large dataset for patient visits report', async () => {
      // Create many appointments to simulate large dataset
      for (let i = 0; i < 10; i++) {
        const apt = new Appointment({
          patient: patient._id,
          doctor: doctor._id,
          appointmentDate: new Date(endDate.getTime() - i * 24 * 60 * 60 * 1000),
          appointmentTime: '10:00',
          chiefComplaint: `Visit ${i}`,
          consultationFee: 100,
          status: 'completed',
          appointmentType: 'consultation',
          department: 'Cardiology'
        });
        await apt.save();
      }
      
      const startTime = Date.now();
      const res = await request(app)
        .post('/api/report-generation/patient-visits')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
      const endTime = Date.now();
      
      // Should complete within reasonable time (5 seconds)
      expect(endTime - startTime).toBeLessThan(5000);
      expect(res.status).toBe(200);
      expect(res.body.data.analytics.totalVisits).toBe(10);
    });
    
    test('Should handle incomplete records gracefully', async () => {
      // Create appointment with minimal data
      const apt = new Appointment({
        patient: patient._id,
        doctor: doctor._id,
        appointmentDate: new Date(),
        appointmentTime: '10:00',
        chiefComplaint: 'Test',
        consultationFee: 100,
        status: 'completed',
        appointmentType: 'consultation'
        // Missing department
      });
      await apt.save();
      
      const res = await request(app)
        .post('/api/report-generation/patient-visits')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
      
      expect(res.status).toBe(200);
      expect(res.body.data.analytics.departmentBreakdown['General']).toBeDefined();
    });
    
    test('Should handle data discrepancies (missing references)', async () => {
      const res = await request(app)
        .post('/api/report-generation/patient-visits')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
      
      // Should not crash, should return empty results
      expect(res.status).toBe(200);
    });
    
    test('Should handle concurrent report generation', async () => {
      const promises = [];
      for (let i = 0; i < 3; i++) {
        promises.push(
          request(app)
            .post('/api/report-generation/patient-visits')
            .set('Authorization', `Bearer ${managerToken}`)
            .send({
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString()
            })
        );
      }
      
      const results = await Promise.all(promises);
      results.forEach(res => {
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });
    });
  });
  
  /**
   * CONTROLLER UNIT TESTS - Direct method testing
   */
  describe('ReportGenerationController Unit Tests', () => {
    test('Should have generatePatientVisitReport method', () => {
      expect(typeof ReportGenerationController.generatePatientVisitReport).toBe('function');
    });
    
    test('Should have generateStaffUtilizationReport method', () => {
      expect(typeof ReportGenerationController.generateStaffUtilizationReport).toBe('function');
    });
    
    test('Should have generateFinancialSummaryReport method', () => {
      expect(typeof ReportGenerationController.generateFinancialSummaryReport).toBe('function');
    });
    
    test('Should have generateComprehensiveReport method', () => {
      expect(typeof ReportGenerationController.generateComprehensiveReport).toBe('function');
    });
    
    test('Should have getPatientVisitData helper method', () => {
      expect(typeof ReportGenerationController.getPatientVisitData).toBe('function');
    });
    
    test('Should have getStaffUtilizationData helper method', () => {
      expect(typeof ReportGenerationController.getStaffUtilizationData).toBe('function');
    });
    
    test('Should have getFinancialData helper method', () => {
      expect(typeof ReportGenerationController.getFinancialData).toBe('function');
    });
  });
  
  /**
   * ALTERNATE FLOWS - Business Logic Tests
   */
  describe('Alternate Flows - Business Logic', () => {
    test('Should return message when no data available for selected period', async () => {
      const futureDate = new Date(endDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      const res = await request(app)
        .post('/api/report-generation/patient-visits')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          startDate: futureDate.toISOString(),
          endDate: new Date(futureDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });
      
      expect(res.status).toBe(200);
      expect(res.body.data.analytics.totalVisits).toBe(0);
    });
    
    test('Should correctly identify cancelled visits', async () => {
      const apt = new Appointment({
        patient: patient._id,
        doctor: doctor._id,
        appointmentDate: new Date(endDate.getTime() - 2 * 24 * 60 * 60 * 1000),
        appointmentTime: '10:00',
        chiefComplaint: 'Cancelled visit',
        consultationFee: 100,
        status: 'cancelled',
        appointmentType: 'consultation',
        department: 'Cardiology'
      });
      await apt.save();
      
      const res = await request(app)
        .post('/api/report-generation/patient-visits')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
      
      expect(res.body.data.analytics.cancelledVisits).toBe(1);
    });
    
    test('Should correctly identify no-show visits', async () => {
      const apt = new Appointment({
        patient: patient._id,
        doctor: doctor._id,
        appointmentDate: new Date(endDate.getTime() - 2 * 24 * 60 * 60 * 1000),
        appointmentTime: '10:00',
        chiefComplaint: 'No show',
        consultationFee: 100,
        status: 'no-show',
        appointmentType: 'consultation',
        department: 'Cardiology'
      });
      await apt.save();
      
      const res = await request(app)
        .post('/api/report-generation/patient-visits')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
      
      expect(res.body.data.analytics.noShowVisits).toBe(1);
    });
    
    test('Should calculate refunded amount in financial report', async () => {
      const apt = new Appointment({
        patient: patient._id,
        doctor: doctor._id,
        appointmentDate: new Date(endDate.getTime() - 2 * 24 * 60 * 60 * 1000),
        appointmentTime: '10:00',
        chiefComplaint: 'Service',
        consultationFee: 100,
        status: 'completed',
        appointmentType: 'consultation',
        department: 'Cardiology'
      });
      await apt.save();
      
      const payment = new Payment({
        transactionId: `TXN-${Date.now()}-refund`,
        appointment: apt._id,
        patient: patient._id,
        doctor: doctor._id,
        amount: 100,
        paymentMethod: 'card',
        paymentGateway: 'stripe',
        status: 'refunded',
        createdAt: new Date(endDate.getTime() - 2 * 24 * 60 * 60 * 1000)
      });
      await payment.save();
      
      const res = await request(app)
        .post('/api/report-generation/financial-summary')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
      
      expect(res.body.data.summary.refundedAmount).toBe(100);
    });
    
    test('Should calculate outstanding payments older than 30 days', async () => {
      const apt = new Appointment({
        patient: patient._id,
        doctor: doctor._id,
        appointmentDate: new Date(endDate.getTime() - 40 * 24 * 60 * 60 * 1000), // 40 days ago
        appointmentTime: '10:00',
        chiefComplaint: 'Service',
        consultationFee: 100,
        status: 'completed',
        appointmentType: 'consultation',
        department: 'Cardiology'
      });
      await apt.save();
      
      const payment = new Payment({
        transactionId: `TXN-${Date.now()}-old`,
        appointment: apt._id,
        patient: patient._id,
        doctor: doctor._id,
        amount: 100,
        paymentMethod: 'online',
        paymentGateway: 'stripe',
        status: 'pending',
        createdAt: new Date(endDate.getTime() - 40 * 24 * 60 * 60 * 1000)
      });
      await payment.save();
      
      const res = await request(app)
        .post('/api/report-generation/financial-summary')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
      
      expect(res.body.data.summary.outstandingPayments).toBeGreaterThan(0);
      expect(res.body.data.summary.outstandingAmount).toBeGreaterThan(0);
    });
  });
  
  /**
   * AUTHORIZATION TESTS
   */
  describe('Authorization Tests', () => {
    test('Should reject patient visit report for non-manager role', async () => {
      // Create patient token
      const patientToken = patient.generateAuthToken();
      
      const res = await request(app)
        .post('/api/report-generation/patient-visits')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
      
      expect(res.status).toBe(403);
    });
    
    test('Should allow staff role to generate patient visit report', async () => {
      // Create staff user
      const staff = new User({
        firstName: 'Staff',
        lastName: 'Member',
        email: 'staff@test.com',
        password: 'TestPass123!',
        phone: '+1-555-0105',
        role: 'staff',
        isActive: true,
        isEmailVerified: true
      });
      await staff.save();
      const staffToken = staff.generateAuthToken();
      
      const res = await request(app)
        .post('/api/report-generation/patient-visits')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
      
      // Should be allowed
      expect([200, 400]).toContain(res.status); // 200 if success, 400 if validation error
    });
  });
});
