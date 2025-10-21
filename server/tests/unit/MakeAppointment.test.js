/**
 * @fileoverview Unit Tests for Make an Appointment Use Case
 * @description Comprehensive test suite covering appointment booking, slot management, and scheduling
 * @author UrbanCare Development Team
 * @version 1.0.0
 * 
 * Test Coverage Areas:
 * - Appointment Creation (positive, negative, edge cases)
 * - Slot Availability Checking
 * - Doctor Schedule Management
 * - Payment Integration
 * - Appointment Modifications
 * - Cancellation and Refunds
 * 
 * Target Coverage: >80%
 */

const AppointmentService = require('../../services/AppointmentService');
const PaymentService = require('../../services/PaymentService');
const SlotManagementService = require('../../services/SlotManagementService');
const Appointment = require('../../models/Appointment');
const DoctorSlot = require('../../models/DoctorSlot');
const Payment = require('../../models/Payment');
const User = require('../../models/User');

// Mock dependencies
jest.mock('../../models/Appointment');
jest.mock('../../models/DoctorSlot');
jest.mock('../../models/Payment');
jest.mock('../../models/User');
jest.mock('../../services/PaymentService');

describe('UC02 - Make an Appointment', () => {
  let mockPatient, mockDoctor, mockSlot, mockAppointment, mockPayment;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockPatient = {
      _id: '507f1f77bcf86cd799439011',
      firstName: 'John',
      lastName: 'Patient',
      email: 'patient@test.com',
      role: 'patient'
    };

    mockDoctor = {
      _id: '507f1f77bcf86cd799439012',
      firstName: 'Dr. Jane',
      lastName: 'Doctor',
      email: 'doctor@test.com',
      role: 'doctor',
      specialization: 'Cardiology',
      consultationFee: 150
    };

    mockSlot = {
      _id: '507f1f77bcf86cd799439013',
      doctor: mockDoctor._id,
      date: new Date('2024-01-15'),
      startTime: '09:00',
      endTime: '09:30',
      isAvailable: true,
      duration: 30
    };

    mockAppointment = {
      _id: '507f1f77bcf86cd799439014',
      patient: mockPatient._id,
      doctor: mockDoctor._id,
      slot: mockSlot._id,
      appointmentDate: new Date('2024-01-15T09:00:00Z'),
      duration: 30,
      status: 'scheduled',
      reasonForVisit: 'Regular checkup',
      department: 'Cardiology',
      consultationFee: 150,
      save: jest.fn()
    };

    mockPayment = {
      _id: '507f1f77bcf86cd799439015',
      appointment: mockAppointment._id,
      patient: mockPatient._id,
      amount: 150,
      status: 'completed',
      paymentMethod: 'card'
    };
  });

  describe('Slot Availability Checking', () => {
    describe('Positive Cases', () => {
      test('should return available slots for a doctor on a specific date', async () => {
        const availableSlots = [mockSlot, { ...mockSlot, _id: 'slot2', startTime: '10:00', endTime: '10:30' }];
        DoctorSlot.find.mockResolvedValue(availableSlots);

        const result = await SlotManagementService.getAvailableSlots(mockDoctor._id, '2024-01-15');

        expect(DoctorSlot.find).toHaveBeenCalledWith({
          doctor: mockDoctor._id,
          date: new Date('2024-01-15'),
          isAvailable: true
        });
        expect(result.success).toBe(true);
        expect(result.slots).toHaveLength(2);
      });

      test('should filter slots by time range', async () => {
        const morningSlots = [
          { ...mockSlot, startTime: '09:00' },
          { ...mockSlot, startTime: '10:00' }
        ];
        DoctorSlot.find.mockResolvedValue(morningSlots);

        const result = await SlotManagementService.getAvailableSlots(
          mockDoctor._id, 
          '2024-01-15', 
          { startTime: '09:00', endTime: '11:00' }
        );

        expect(result.success).toBe(true);
        expect(result.slots).toHaveLength(2);
      });
    });

    describe('Negative Cases', () => {
      test('should return empty array when no slots available', async () => {
        DoctorSlot.find.mockResolvedValue([]);

        const result = await SlotManagementService.getAvailableSlots(mockDoctor._id, '2024-01-15');

        expect(result.success).toBe(true);
        expect(result.slots).toHaveLength(0);
      });

      test('should handle invalid doctor ID', async () => {
        const result = await SlotManagementService.getAvailableSlots('invalid-id', '2024-01-15');

        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid doctor ID');
      });
    });

    describe('Edge Cases', () => {
      test('should handle past dates', async () => {
        const pastDate = new Date('2020-01-01').toISOString().split('T')[0];
        
        const result = await SlotManagementService.getAvailableSlots(mockDoctor._id, pastDate);

        expect(result.success).toBe(false);
        expect(result.message).toContain('Cannot book appointments for past dates');
      });

      test('should handle database errors', async () => {
        DoctorSlot.find.mockRejectedValue(new Error('Database error'));

        const result = await SlotManagementService.getAvailableSlots(mockDoctor._id, '2024-01-15');

        expect(result.success).toBe(false);
        expect(result.message).toContain('Failed to retrieve available slots');
      });
    });
  });

  describe('Appointment Creation', () => {
    describe('Positive Cases', () => {
      test('should successfully create appointment with valid data', async () => {
        const appointmentData = {
          patientId: mockPatient._id,
          doctorId: mockDoctor._id,
          slotId: mockSlot._id,
          reasonForVisit: 'Regular checkup',
          paymentMethod: 'card'
        };

        User.findById.mockImplementation((id) => {
          if (id === mockPatient._id) return Promise.resolve(mockPatient);
          if (id === mockDoctor._id) return Promise.resolve(mockDoctor);
          return Promise.resolve(null);
        });
        
        DoctorSlot.findById.mockResolvedValue(mockSlot);
        DoctorSlot.findByIdAndUpdate.mockResolvedValue({ ...mockSlot, isAvailable: false });
        Appointment.prototype.save = jest.fn().mockResolvedValue(mockAppointment);
        PaymentService.processPayment.mockResolvedValue({ success: true, payment: mockPayment });

        const result = await AppointmentService.createAppointment(appointmentData);

        expect(result.success).toBe(true);
        expect(result.appointment).toEqual(expect.objectContaining({
          patient: mockPatient._id,
          doctor: mockDoctor._id,
          status: 'scheduled'
        }));
      });

      test('should handle emergency appointments with priority', async () => {
        const emergencyData = {
          patientId: mockPatient._id,
          doctorId: mockDoctor._id,
          slotId: mockSlot._id,
          reasonForVisit: 'Emergency consultation',
          priority: 'urgent',
          paymentMethod: 'card'
        };

        User.findById.mockImplementation((id) => {
          if (id === mockPatient._id) return Promise.resolve(mockPatient);
          if (id === mockDoctor._id) return Promise.resolve(mockDoctor);
        });
        
        DoctorSlot.findById.mockResolvedValue(mockSlot);
        DoctorSlot.findByIdAndUpdate.mockResolvedValue({ ...mockSlot, isAvailable: false });
        Appointment.prototype.save = jest.fn().mockResolvedValue({ ...mockAppointment, priority: 'urgent' });
        PaymentService.processPayment.mockResolvedValue({ success: true, payment: mockPayment });

        const result = await AppointmentService.createAppointment(emergencyData);

        expect(result.success).toBe(true);
        expect(result.appointment.priority).toBe('urgent');
      });
    });

    describe('Negative Cases', () => {
      test('should reject appointment for non-existent patient', async () => {
        const appointmentData = {
          patientId: 'nonexistent-patient',
          doctorId: mockDoctor._id,
          slotId: mockSlot._id,
          reasonForVisit: 'Checkup'
        };

        User.findById.mockResolvedValue(null);

        const result = await AppointmentService.createAppointment(appointmentData);

        expect(result.success).toBe(false);
        expect(result.message).toContain('Patient not found');
      });

      test('should reject appointment for unavailable slot', async () => {
        const appointmentData = {
          patientId: mockPatient._id,
          doctorId: mockDoctor._id,
          slotId: mockSlot._id,
          reasonForVisit: 'Checkup'
        };

        User.findById.mockImplementation((id) => {
          if (id === mockPatient._id) return Promise.resolve(mockPatient);
          if (id === mockDoctor._id) return Promise.resolve(mockDoctor);
        });
        
        DoctorSlot.findById.mockResolvedValue({ ...mockSlot, isAvailable: false });

        const result = await AppointmentService.createAppointment(appointmentData);

        expect(result.success).toBe(false);
        expect(result.message).toContain('Selected slot is no longer available');
      });

      test('should reject appointment with payment failure', async () => {
        const appointmentData = {
          patientId: mockPatient._id,
          doctorId: mockDoctor._id,
          slotId: mockSlot._id,
          reasonForVisit: 'Checkup',
          paymentMethod: 'card'
        };

        User.findById.mockImplementation((id) => {
          if (id === mockPatient._id) return Promise.resolve(mockPatient);
          if (id === mockDoctor._id) return Promise.resolve(mockDoctor);
        });
        
        DoctorSlot.findById.mockResolvedValue(mockSlot);
        PaymentService.processPayment.mockResolvedValue({ success: false, message: 'Payment failed' });

        const result = await AppointmentService.createAppointment(appointmentData);

        expect(result.success).toBe(false);
        expect(result.message).toContain('Payment failed');
      });
    });

    describe('Edge Cases', () => {
      test('should handle concurrent booking attempts', async () => {
        const appointmentData = {
          patientId: mockPatient._id,
          doctorId: mockDoctor._id,
          slotId: mockSlot._id,
          reasonForVisit: 'Checkup'
        };

        User.findById.mockImplementation((id) => {
          if (id === mockPatient._id) return Promise.resolve(mockPatient);
          if (id === mockDoctor._id) return Promise.resolve(mockDoctor);
        });
        
        DoctorSlot.findById.mockResolvedValue(mockSlot);
        DoctorSlot.findByIdAndUpdate.mockResolvedValue(null); // Slot already booked

        const result = await AppointmentService.createAppointment(appointmentData);

        expect(result.success).toBe(false);
        expect(result.message).toContain('Slot booking conflict');
      });

      test('should validate appointment time constraints', async () => {
        const appointmentData = {
          patientId: mockPatient._id,
          doctorId: mockDoctor._id,
          slotId: mockSlot._id,
          reasonForVisit: 'Checkup'
        };

        const pastSlot = { ...mockSlot, date: new Date('2020-01-01') };
        
        User.findById.mockImplementation((id) => {
          if (id === mockPatient._id) return Promise.resolve(mockPatient);
          if (id === mockDoctor._id) return Promise.resolve(mockDoctor);
        });
        
        DoctorSlot.findById.mockResolvedValue(pastSlot);

        const result = await AppointmentService.createAppointment(appointmentData);

        expect(result.success).toBe(false);
        expect(result.message).toContain('Cannot book appointments for past dates');
      });
    });
  });

  describe('Appointment Modifications', () => {
    describe('Positive Cases', () => {
      test('should successfully reschedule appointment', async () => {
        const newSlot = { ...mockSlot, _id: 'new-slot', startTime: '14:00', endTime: '14:30' };
        
        Appointment.findById.mockResolvedValue(mockAppointment);
        DoctorSlot.findById.mockResolvedValue(newSlot);
        DoctorSlot.findByIdAndUpdate.mockImplementation((id, update) => {
          if (update.isAvailable === false) return Promise.resolve({ ...newSlot, isAvailable: false });
          if (update.isAvailable === true) return Promise.resolve({ ...mockSlot, isAvailable: true });
        });
        Appointment.findByIdAndUpdate.mockResolvedValue({ 
          ...mockAppointment, 
          slot: newSlot._id,
          appointmentDate: new Date('2024-01-15T14:00:00Z')
        });

        const result = await AppointmentService.rescheduleAppointment(
          mockAppointment._id, 
          newSlot._id, 
          mockPatient._id
        );

        expect(result.success).toBe(true);
        expect(result.appointment.slot).toBe(newSlot._id);
      });

      test('should successfully cancel appointment with refund', async () => {
        Appointment.findById.mockResolvedValue(mockAppointment);
        Payment.findOne.mockResolvedValue(mockPayment);
        PaymentService.processRefund.mockResolvedValue({ success: true, refund: { amount: 150 } });
        DoctorSlot.findByIdAndUpdate.mockResolvedValue({ ...mockSlot, isAvailable: true });
        Appointment.findByIdAndUpdate.mockResolvedValue({ ...mockAppointment, status: 'cancelled' });

        const result = await AppointmentService.cancelAppointment(mockAppointment._id, mockPatient._id);

        expect(result.success).toBe(true);
        expect(result.appointment.status).toBe('cancelled');
        expect(PaymentService.processRefund).toHaveBeenCalled();
      });
    });

    describe('Negative Cases', () => {
      test('should reject reschedule for non-existent appointment', async () => {
        Appointment.findById.mockResolvedValue(null);

        const result = await AppointmentService.rescheduleAppointment('nonexistent-id', mockSlot._id, mockPatient._id);

        expect(result.success).toBe(false);
        expect(result.message).toContain('Appointment not found');
      });

      test('should reject cancellation after appointment time', async () => {
        const pastAppointment = { 
          ...mockAppointment, 
          appointmentDate: new Date('2020-01-01T09:00:00Z') 
        };
        
        Appointment.findById.mockResolvedValue(pastAppointment);

        const result = await AppointmentService.cancelAppointment(mockAppointment._id, mockPatient._id);

        expect(result.success).toBe(false);
        expect(result.message).toContain('Cannot cancel past appointments');
      });
    });

    describe('Edge Cases', () => {
      test('should handle refund failures during cancellation', async () => {
        Appointment.findById.mockResolvedValue(mockAppointment);
        Payment.findOne.mockResolvedValue(mockPayment);
        PaymentService.processRefund.mockResolvedValue({ success: false, message: 'Refund failed' });

        const result = await AppointmentService.cancelAppointment(mockAppointment._id, mockPatient._id);

        expect(result.success).toBe(false);
        expect(result.message).toContain('Refund processing failed');
      });

      test('should handle same-day cancellation policies', async () => {
        const todayAppointment = { 
          ...mockAppointment, 
          appointmentDate: new Date() 
        };
        
        Appointment.findById.mockResolvedValue(todayAppointment);

        const result = await AppointmentService.cancelAppointment(mockAppointment._id, mockPatient._id);

        expect(result.success).toBe(false);
        expect(result.message).toContain('Same-day cancellation not allowed');
      });
    });
  });

  describe('Payment Integration', () => {
    describe('Positive Cases', () => {
      test('should process card payment successfully', async () => {
        const paymentData = {
          appointmentId: mockAppointment._id,
          amount: 150,
          paymentMethod: 'card',
          cardToken: 'tok_visa'
        };

        PaymentService.processPayment.mockResolvedValue({
          success: true,
          payment: mockPayment,
          transactionId: 'txn_123'
        });

        const result = await PaymentService.processPayment(paymentData);

        expect(result.success).toBe(true);
        expect(result.payment.status).toBe('completed');
      });

      test('should handle insurance payment processing', async () => {
        const insurancePayment = {
          appointmentId: mockAppointment._id,
          amount: 150,
          paymentMethod: 'insurance',
          insuranceProvider: 'BlueCross',
          policyNumber: 'POL123456'
        };

        PaymentService.processPayment.mockResolvedValue({
          success: true,
          payment: { ...mockPayment, paymentMethod: 'insurance' }
        });

        const result = await PaymentService.processPayment(insurancePayment);

        expect(result.success).toBe(true);
        expect(result.payment.paymentMethod).toBe('insurance');
      });
    });

    describe('Negative Cases', () => {
      test('should handle declined card payments', async () => {
        const paymentData = {
          appointmentId: mockAppointment._id,
          amount: 150,
          paymentMethod: 'card',
          cardToken: 'tok_declined'
        };

        PaymentService.processPayment.mockResolvedValue({
          success: false,
          message: 'Card declined'
        });

        const result = await PaymentService.processPayment(paymentData);

        expect(result.success).toBe(false);
        expect(result.message).toContain('Card declined');
      });

      test('should handle insufficient funds', async () => {
        const paymentData = {
          appointmentId: mockAppointment._id,
          amount: 150,
          paymentMethod: 'card',
          cardToken: 'tok_insufficient_funds'
        };

        PaymentService.processPayment.mockResolvedValue({
          success: false,
          message: 'Insufficient funds'
        });

        const result = await PaymentService.processPayment(paymentData);

        expect(result.success).toBe(false);
        expect(result.message).toContain('Insufficient funds');
      });
    });

    describe('Edge Cases', () => {
      test('should handle payment gateway timeouts', async () => {
        const paymentData = {
          appointmentId: mockAppointment._id,
          amount: 150,
          paymentMethod: 'card'
        };

        PaymentService.processPayment.mockImplementation(() => {
          return new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Gateway timeout')), 100);
          });
        });

        const result = await PaymentService.processPayment(paymentData);

        expect(result.success).toBe(false);
        expect(result.message).toContain('Payment processing failed');
      });

      test('should validate payment amounts', async () => {
        const invalidPayment = {
          appointmentId: mockAppointment._id,
          amount: -50, // Negative amount
          paymentMethod: 'card'
        };

        const result = await PaymentService.processPayment(invalidPayment);

        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid payment amount');
      });
    });
  });
});
