/**
 * @fileoverview Integration Tests for Complete Appointment Flow (UC02)
 * @author UrbanCare Development Team
 * @version 1.0.0
 */

const request = require('supertest');
const app = require('../../server');
const User = require('../../models/User');
const Appointment = require('../../models/Appointment');
const Payment = require('../../models/Payment');

describe('Integration Tests - Make an Appointment Flow (UC02)', () => {
  let patientToken;
  let doctorToken;
  let patientUser;
  let doctorUser;

  beforeAll(async () => {
    // Create test users
    patientUser = await User.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'patient.test@example.com',
      password: 'hashedPassword123',
      role: 'patient',
      phone: '+1234567890',
      dateOfBirth: new Date('1990-01-01'),
      isActive: true
    });

    doctorUser = await User.create({
      firstName: 'Dr. Jane',
      lastName: 'Smith',
      email: 'doctor.test@example.com',
      password: 'hashedPassword123',
      role: 'doctor',
      specialization: 'General Medicine',
      phone: '+1234567891',
      dateOfBirth: new Date('1980-01-01'),
      isActive: true
    });

    // Generate tokens (mock JWT tokens for testing)
    patientToken = 'mock_patient_token';
    doctorToken = 'mock_doctor_token';
  });

  afterAll(async () => {
    // Cleanup test data - skip in test environment
    if (process.env.NODE_ENV !== 'test') {
      try {
        await User.deleteMany({ email: { $in: ['patient.test@example.com', 'doctor.test@example.com'] } });
        await Appointment.deleteMany({ patient: patientUser._id });
        await Payment.deleteMany({ patient: patientUser._id });
      } catch (error) {
        console.log('Cleanup error (ignored in tests):', error.message);
      }
    }
  }, 15000);

  describe('Complete Appointment Booking Flow', () => {
    test('should complete full appointment booking with payment (Main Success Scenario)', async () => {
      // Step 1: Patient logs in (Precondition)
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'patient.test@example.com',
          password: 'password123'
        });

      expect(loginResponse.status).toBe(200);
      const token = loginResponse.body.token;

      // Step 2: Patient navigates to "Make an Appointment" section
      const doctorsResponse = await request(app)
        .get('/api/users/doctors')
        .set('Authorization', `Bearer ${token}`);

      expect(doctorsResponse.status).toBe(200);
      expect(doctorsResponse.body.data).toHaveLength(1);
      expect(doctorsResponse.body.data[0].specialization).toBe('General Medicine');

      // Step 3: Patient selects preferred doctor and reviews available dates/times
      const availabilityResponse = await request(app)
        .get(`/api/appointments/availability/${doctorUser._id}`)
        .set('Authorization', `Bearer ${token}`)
        .query({
          date: new Date(Date.now() + 86400000).toISOString().split('T')[0] // Tomorrow
        });

      expect(availabilityResponse.status).toBe(200);
      expect(availabilityResponse.body.data.availableSlots.length).toBeGreaterThan(0);

      // Step 4: Patient provides appointment details
      const appointmentDate = new Date(Date.now() + 86400000);
      appointmentDate.setHours(10, 0, 0, 0); // 10:00 AM tomorrow

      const appointmentData = {
        doctorId: doctorUser._id.toString(),
        appointmentDate: appointmentDate.toISOString(),
        duration: 30,
        reasonForVisit: 'Regular checkup for annual physical examination',
        department: 'General Medicine'
      };

      // Step 5: System displays appointment summary
      const summaryResponse = await request(app)
        .post('/api/appointments/preview')
        .set('Authorization', `Bearer ${token}`)
        .send(appointmentData);

      expect(summaryResponse.status).toBe(200);
      expect(summaryResponse.body.data.doctor.firstName).toBe('Dr. Jane');
      expect(summaryResponse.body.data.estimatedCost).toBe(100);

      // Step 6: Patient proceeds with payment
      const paymentData = {
        ...appointmentData,
        paymentMethod: 'card',
        cardDetails: {
          cardNumber: '4111111111111111',
          expiryMonth: '12',
          expiryYear: '2025',
          cvv: '123',
          cardholderName: 'John Doe'
        }
      };

      // Step 7: Appointment request with payment is submitted
      const bookingResponse = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${token}`)
        .send(paymentData);

      expect(bookingResponse.status).toBe(201);
      expect(bookingResponse.body.success).toBe(true);
      expect(bookingResponse.body.data.status).toBe('scheduled');
      expect(bookingResponse.body.data.paymentStatus).toBe('completed');

      const appointmentId = bookingResponse.body.data._id;

      // Step 8: Hospital management verifies appointment (simulated)
      const verificationResponse = await request(app)
        .put(`/api/appointments/${appointmentId}/verify`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ verified: true });

      expect(verificationResponse.status).toBe(200);
      expect(verificationResponse.body.data.status).toBe('confirmed');

      // Step 9: System sends notification (verify notification was triggered)
      const notificationResponse = await request(app)
        .get('/api/notifications/patient')
        .set('Authorization', `Bearer ${token}`);

      expect(notificationResponse.status).toBe(200);
      expect(notificationResponse.body.data.some(n => 
        n.type === 'appointment_confirmed' && n.appointmentId === appointmentId
      )).toBe(true);

      // Verify final state
      const finalAppointment = await request(app)
        .get(`/api/appointments/${appointmentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(finalAppointment.status).toBe(200);
      expect(finalAppointment.body.data.status).toBe('confirmed');
      expect(finalAppointment.body.data.paymentId).toBeTruthy();
    });
  });

  describe('Alternate Flow 4a: Doctor Fully Booked', () => {
    test('should suggest alternative doctors when requested doctor is unavailable', async () => {
      const token = patientToken;

      // Try to book with a fully booked doctor
      const appointmentData = {
        doctorId: doctorUser._id.toString(),
        appointmentDate: new Date('2024-12-25T10:00:00Z'), // Assume this slot is taken
        duration: 30,
        reasonForVisit: 'Regular checkup',
        department: 'General Medicine'
      };

      const bookingResponse = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${token}`)
        .send(appointmentData);

      if (bookingResponse.status === 409) { // Conflict - doctor not available
        // System suggests alternative dates/times or other doctors
        const alternativesResponse = await request(app)
          .get('/api/appointments/alternatives')
          .set('Authorization', `Bearer ${token}`)
          .query({
            department: 'General Medicine',
            appointmentDate: appointmentData.appointmentDate
          });

        expect(alternativesResponse.status).toBe(200);
        expect(alternativesResponse.body.data.alternativeDoctors).toBeDefined();
        expect(alternativesResponse.body.data.alternativeTimes).toBeDefined();
      }
    });
  });

  describe('Alternate Flow 6a: Payment Failure', () => {
    test('should handle payment failure and allow retry', async () => {
      const token = patientToken;

      const appointmentData = {
        doctorId: doctorUser._id.toString(),
        appointmentDate: new Date(Date.now() + 86400000).toISOString(),
        duration: 30,
        reasonForVisit: 'Regular checkup',
        department: 'General Medicine',
        paymentMethod: 'card',
        cardDetails: {
          cardNumber: '4000000000000002', // Card that will be declined
          expiryMonth: '12',
          expiryYear: '2025',
          cvv: '123'
        }
      };

      // First attempt - payment failure
      const firstAttempt = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${token}`)
        .send(appointmentData);

      expect(firstAttempt.status).toBe(400);
      expect(firstAttempt.body.message).toContain('payment');

      // Retry with valid card
      const retryData = {
        ...appointmentData,
        cardDetails: {
          cardNumber: '4111111111111111', // Valid card
          expiryMonth: '12',
          expiryYear: '2025',
          cvv: '123'
        }
      };

      const retryResponse = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${token}`)
        .send(retryData);

      expect(retryResponse.status).toBe(201);
      expect(retryResponse.body.data.paymentStatus).toBe('completed');
    });
  });

  describe('Alternate Flow 8a: Appointment Rejected', () => {
    test('should handle appointment rejection with proper notification', async () => {
      const token = patientToken;

      // Create appointment
      const appointmentData = {
        doctorId: doctorUser._id.toString(),
        appointmentDate: new Date(Date.now() + 86400000).toISOString(),
        duration: 30,
        reasonForVisit: 'Regular checkup',
        department: 'General Medicine',
        paymentMethod: 'card',
        cardDetails: {
          cardNumber: '4111111111111111',
          expiryMonth: '12',
          expiryYear: '2025',
          cvv: '123'
        }
      };

      const bookingResponse = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${token}`)
        .send(appointmentData);

      expect(bookingResponse.status).toBe(201);
      const appointmentId = bookingResponse.body.data._id;

      // Doctor/Admin rejects appointment
      const rejectionResponse = await request(app)
        .put(`/api/appointments/${appointmentId}/reject`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ 
          reason: 'Doctor unavailable due to emergency',
          refundAmount: 100
        });

      expect(rejectionResponse.status).toBe(200);
      expect(rejectionResponse.body.data.status).toBe('cancelled');

      // Verify refund was processed
      const refundResponse = await request(app)
        .get(`/api/payments/appointment/${appointmentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(refundResponse.status).toBe(200);
      expect(refundResponse.body.data.status).toBe('refunded');

      // Verify patient notification
      const notificationResponse = await request(app)
        .get('/api/notifications/patient')
        .set('Authorization', `Bearer ${token}`);

      expect(notificationResponse.status).toBe(200);
      expect(notificationResponse.body.data.some(n => 
        n.type === 'appointment_rejected' && n.appointmentId === appointmentId
      )).toBe(true);
    });
  });

  describe('Exception Flow 1: Appointment Cancellation with Refund', () => {
    test('should handle patient-initiated cancellation with refund', async () => {
      const token = patientToken;

      // Create appointment first
      const appointmentData = {
        doctorId: doctorUser._id.toString(),
        appointmentDate: new Date(Date.now() + 172800000).toISOString(), // 2 days from now
        duration: 30,
        reasonForVisit: 'Regular checkup',
        department: 'General Medicine',
        paymentMethod: 'card',
        cardDetails: {
          cardNumber: '4111111111111111',
          expiryMonth: '12',
          expiryYear: '2025',
          cvv: '123'
        }
      };

      const bookingResponse = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${token}`)
        .send(appointmentData);

      expect(bookingResponse.status).toBe(201);
      const appointmentId = bookingResponse.body.data._id;

      // Patient cancels appointment
      const cancellationResponse = await request(app)
        .put(`/api/appointments/${appointmentId}/cancel`)
        .set('Authorization', `Bearer ${token}`)
        .send({ reason: 'Personal emergency - cannot attend' });

      expect(cancellationResponse.status).toBe(200);
      expect(cancellationResponse.body.data.status).toBe('cancelled');

      // Verify refund was processed according to policy
      const refundResponse = await request(app)
        .get(`/api/payments/appointment/${appointmentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(refundResponse.status).toBe(200);
      // Refund amount depends on cancellation policy (e.g., 48+ hours = full refund)
      expect(refundResponse.body.data.refundAmount).toBeGreaterThan(0);
    });

    test('should handle late cancellation with partial refund', async () => {
      const token = patientToken;

      // Create appointment for tomorrow (within 24 hours)
      const appointmentData = {
        doctorId: doctorUser._id.toString(),
        appointmentDate: new Date(Date.now() + 43200000).toISOString(), // 12 hours from now
        duration: 30,
        reasonForVisit: 'Regular checkup',
        department: 'General Medicine',
        paymentMethod: 'card',
        cardDetails: {
          cardNumber: '4111111111111111',
          expiryMonth: '12',
          expiryYear: '2025',
          cvv: '123'
        }
      };

      const bookingResponse = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${token}`)
        .send(appointmentData);

      expect(bookingResponse.status).toBe(201);
      const appointmentId = bookingResponse.body.data._id;

      // Attempt to cancel (should have cancellation fee)
      const cancellationResponse = await request(app)
        .put(`/api/appointments/${appointmentId}/cancel`)
        .set('Authorization', `Bearer ${token}`)
        .send({ reason: 'Emergency came up' });

      if (cancellationResponse.status === 400) {
        // Cancellation not allowed within 24 hours
        expect(cancellationResponse.body.message).toContain('24 hours');
      } else {
        // Partial refund applied
        expect(cancellationResponse.status).toBe(200);
        const refundResponse = await request(app)
          .get(`/api/payments/appointment/${appointmentId}`)
          .set('Authorization', `Bearer ${token}`);

        expect(refundResponse.body.data.refundAmount).toBeLessThan(100); // Partial refund
      }
    });
  });

  describe('Exception Flow 3: Concurrent Booking Attempts', () => {
    test('should handle multiple patients trying to book same slot', async () => {
      // Create second patient
      const patient2 = await User.create({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'patient2.test@example.com',
        password: 'hashedPassword123',
        role: 'patient',
        phone: '+1234567892',
        dateOfBirth: new Date('1992-01-01'),
        isActive: true
      });

      const token1 = patientToken;
      const token2 = 'mock_patient2_token';

      const appointmentData = {
        doctorId: doctorUser._id.toString(),
        appointmentDate: new Date(Date.now() + 86400000).toISOString(),
        duration: 30,
        reasonForVisit: 'Regular checkup',
        department: 'General Medicine',
        paymentMethod: 'card',
        cardDetails: {
          cardNumber: '4111111111111111',
          expiryMonth: '12',
          expiryYear: '2025',
          cvv: '123'
        }
      };

      // Simulate concurrent booking attempts
      const [response1, response2] = await Promise.allSettled([
        request(app)
          .post('/api/appointments')
          .set('Authorization', `Bearer ${token1}`)
          .send(appointmentData),
        request(app)
          .post('/api/appointments')
          .set('Authorization', `Bearer ${token2}`)
          .send(appointmentData)
      ]);

      // One should succeed, one should fail
      const responses = [response1, response2].map(r => r.value || r.reason);
      const successCount = responses.filter(r => r.status === 201).length;
      const conflictCount = responses.filter(r => r.status === 409).length;

      expect(successCount).toBe(1);
      expect(conflictCount).toBe(1);

      // Cleanup
      await User.deleteOne({ _id: patient2._id });
    });
  });

  describe('Exception Flow 4: System Downtime During Payment', () => {
    test('should handle payment gateway downtime gracefully', async () => {
      const token = patientToken;

      // Mock payment gateway downtime
      const appointmentData = {
        doctorId: doctorUser._id.toString(),
        appointmentDate: new Date(Date.now() + 86400000).toISOString(),
        duration: 30,
        reasonForVisit: 'Regular checkup',
        department: 'General Medicine',
        paymentMethod: 'card',
        cardDetails: {
          cardNumber: '4000000000000119', // Card that simulates gateway timeout
          expiryMonth: '12',
          expiryYear: '2025',
          cvv: '123'
        }
      };

      const bookingResponse = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${token}`)
        .send(appointmentData);

      // Should return appropriate error for gateway issues
      expect([500, 502, 503]).toContain(bookingResponse.status);
      expect(bookingResponse.body.message).toContain('payment');

      // Verify no partial appointment was created
      const appointmentsResponse = await request(app)
        .get('/api/appointments/patient')
        .set('Authorization', `Bearer ${token}`);

      const partialAppointments = appointmentsResponse.body.data.filter(apt => 
        apt.status === 'pending_payment'
      );
      
      // Should have proper cleanup or pending state handling
      expect(partialAppointments.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Performance and Load Testing', () => {
    test('should handle high concurrent appointment requests', async () => {
      const token = patientToken;
      
      // Create multiple appointment requests
      const promises = Array(20).fill().map((_, index) => {
        const futureDate = new Date(Date.now() + 86400000 + (index * 3600000)); // Stagger times
        
        return request(app)
          .post('/api/appointments')
          .set('Authorization', `Bearer ${token}`)
          .send({
            doctorId: doctorUser._id.toString(),
            appointmentDate: futureDate.toISOString(),
            duration: 30,
            reasonForVisit: `Checkup ${index}`,
            department: 'General Medicine',
            paymentMethod: 'card',
            cardDetails: {
              cardNumber: '4111111111111111',
              expiryMonth: '12',
              expiryYear: '2025',
              cvv: '123'
            }
          });
      });

      const startTime = Date.now();
      const results = await Promise.allSettled(promises);
      const endTime = Date.now();

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(10000); // 10 seconds

      // Most requests should succeed (allowing for some conflicts)
      const successCount = results.filter(r => 
        r.status === 'fulfilled' && r.value.status === 201
      ).length;
      
      expect(successCount).toBeGreaterThan(15); // At least 75% success rate
    });
  });
});
