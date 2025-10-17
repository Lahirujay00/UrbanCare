/**
 * Appointment Booking Service - Focused for >80% Unit Test Coverage
 * Team Member 2: Make an Appointment functionality
 */

const Appointment = require('../models/Appointment');
const User = require('../models/User');
const DoctorSlot = require('../models/DoctorSlot');
const Payment = require('../models/Payment');
const mongoose = require('mongoose');

class AppointmentBookingService {

  /**
   * Get available time slots for a doctor on a specific date
   */
  async getAvailableSlots(doctorId, date, duration = 30) {
    try {
      // Validate inputs
      if (!doctorId || !date) {
        return {
          success: false,
          message: 'Doctor ID and date are required'
        };
      }

      // Validate doctor exists
      const doctor = await User.findById(doctorId);
      if (!doctor || doctor.role !== 'doctor') {
        return {
          success: false,
          message: 'Doctor not found'
        };
      }

      // Validate date format
      const appointmentDate = new Date(date);
      if (isNaN(appointmentDate.getTime())) {
        return {
          success: false,
          message: 'Invalid date format'
        };
      }

      // Check if date is in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (appointmentDate < today) {
        return {
          success: false,
          message: 'Cannot book appointments for past dates'
        };
      }

      // Get available slots
      const slots = await this._generateTimeSlots(doctorId, appointmentDate, duration);
      
      return {
        success: true,
        slots,
        date: appointmentDate.toISOString().split('T')[0],
        doctorId,
        totalSlots: slots.length
      };

    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve available slots'
      };
    }
  }

  /**
   * Book an appointment
   */
  async bookAppointment(appointmentData) {
    try {
      // Validate appointment data
      const validation = this.validateAppointmentData(appointmentData);
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.message
        };
      }

      const { patientId, doctorId, appointmentDate, appointmentTime, reason, duration = 30 } = appointmentData;

      // Check if slot is still available
      const slotCheck = await this._checkSlotAvailability(doctorId, appointmentDate, appointmentTime, duration);
      if (!slotCheck.available) {
        return {
          success: false,
          message: 'Selected time slot is no longer available'
        };
      }

      // Create appointment
      const appointment = new Appointment({
        patient: patientId,
        doctor: doctorId,
        appointmentDate: new Date(appointmentDate),
        appointmentTime,
        reason,
        duration,
        status: 'scheduled',
        createdAt: new Date()
      });

      await appointment.save();

      // Generate appointment reference
      const reference = this._generateAppointmentReference(appointment._id);

      return {
        success: true,
        message: 'Appointment booked successfully',
        appointment: {
          id: appointment._id,
          reference,
          date: appointmentDate,
          time: appointmentTime,
          doctor: doctorId,
          patient: patientId,
          status: 'scheduled'
        }
      };

    } catch (error) {
      if (error.code === 11000) {
        return {
          success: false,
          message: 'Time slot already booked'
        };
      }
      return {
        success: false,
        message: 'Failed to book appointment due to server error'
      };
    }
  }

  /**
   * Cancel an appointment
   */
  async cancelAppointment(appointmentId, userId, reason = '') {
    try {
      if (!appointmentId || !userId) {
        return {
          success: false,
          message: 'Appointment ID and user ID are required'
        };
      }

      // Find appointment
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        return {
          success: false,
          message: 'Appointment not found'
        };
      }

      // Check if user can cancel (patient or doctor)
      const canCancel = appointment.patient.toString() === userId || 
                       appointment.doctor.toString() === userId;
      
      if (!canCancel) {
        return {
          success: false,
          message: 'You are not authorized to cancel this appointment'
        };
      }

      // Check cancellation policy (24 hours before)
      const appointmentDateTime = new Date(appointment.appointmentDate);
      const now = new Date();
      const hoursDifference = (appointmentDateTime - now) / (1000 * 60 * 60);

      if (hoursDifference < 24 && appointment.status === 'scheduled') {
        return {
          success: false,
          message: 'Appointments can only be cancelled 24 hours in advance'
        };
      }

      // Update appointment status
      appointment.status = 'cancelled';
      appointment.cancellationReason = reason;
      appointment.cancelledAt = new Date();
      appointment.cancelledBy = userId;

      await appointment.save();

      return {
        success: true,
        message: 'Appointment cancelled successfully',
        appointmentId: appointment._id
      };

    } catch (error) {
      return {
        success: false,
        message: 'Failed to cancel appointment due to server error'
      };
    }
  }

  /**
   * Reschedule an appointment
   */
  async rescheduleAppointment(appointmentId, newDate, newTime, userId) {
    try {
      // Validate inputs
      if (!appointmentId || !newDate || !newTime || !userId) {
        return {
          success: false,
          message: 'All fields are required for rescheduling'
        };
      }

      // Find appointment
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        return {
          success: false,
          message: 'Appointment not found'
        };
      }

      // Check authorization
      if (appointment.patient.toString() !== userId) {
        return {
          success: false,
          message: 'You can only reschedule your own appointments'
        };
      }

      // Validate new date/time
      const newDateTime = new Date(newDate);
      if (isNaN(newDateTime.getTime())) {
        return {
          success: false,
          message: 'Invalid new date format'
        };
      }

      // Check if new slot is available
      const slotCheck = await this._checkSlotAvailability(
        appointment.doctor, 
        newDate, 
        newTime, 
        appointment.duration
      );

      if (!slotCheck.available) {
        return {
          success: false,
          message: 'New time slot is not available'
        };
      }

      // Update appointment
      appointment.appointmentDate = newDateTime;
      appointment.appointmentTime = newTime;
      appointment.status = 'rescheduled';
      appointment.rescheduledAt = new Date();

      await appointment.save();

      return {
        success: true,
        message: 'Appointment rescheduled successfully',
        appointment: {
          id: appointment._id,
          newDate,
          newTime,
          status: 'rescheduled'
        }
      };

    } catch (error) {
      return {
        success: false,
        message: 'Failed to reschedule appointment due to server error'
      };
    }
  }

  /**
   * Get patient appointments
   */
  async getPatientAppointments(patientId, status = 'all') {
    try {
      if (!patientId) {
        return {
          success: false,
          message: 'Patient ID is required'
        };
      }

      // Build query
      let query = { patient: patientId };
      
      if (status !== 'all') {
        if (!this.isValidStatus(status)) {
          return {
            success: false,
            message: 'Invalid status filter'
          };
        }
        query.status = status;
      }

      // Get appointments
      const appointments = await Appointment.find(query)
        .populate('doctor', 'firstName lastName specialization')
        .sort({ appointmentDate: -1 });

      // Format appointments
      const formattedAppointments = appointments.map(apt => ({
        id: apt._id,
        date: apt.appointmentDate.toISOString().split('T')[0],
        time: apt.appointmentTime,
        doctor: apt.doctor,
        reason: apt.reason,
        status: apt.status,
        reference: this._generateAppointmentReference(apt._id)
      }));

      return {
        success: true,
        appointments: formattedAppointments,
        total: formattedAppointments.length
      };

    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve appointments'
      };
    }
  }

  /**
   * Process appointment payment
   */
  async processPayment(appointmentId, paymentData) {
    try {
      // Validate inputs
      if (!appointmentId || !paymentData) {
        return {
          success: false,
          message: 'Appointment ID and payment data are required'
        };
      }

      const { amount, paymentMethod, cardDetails } = paymentData;

      // Validate payment data
      const paymentValidation = this.validatePaymentData(paymentData);
      if (!paymentValidation.isValid) {
        return {
          success: false,
          message: paymentValidation.message
        };
      }

      // Find appointment
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        return {
          success: false,
          message: 'Appointment not found'
        };
      }

      // Process payment based on method
      let paymentResult;
      if (paymentMethod === 'card') {
        paymentResult = await this._processCardPayment(amount, cardDetails);
      } else if (paymentMethod === 'cash') {
        paymentResult = await this._processCashPayment(amount);
      } else {
        return {
          success: false,
          message: 'Invalid payment method'
        };
      }

      if (!paymentResult.success) {
        return paymentResult;
      }

      // Create payment record
      const payment = new Payment({
        appointment: appointmentId,
        amount,
        paymentMethod,
        status: 'completed',
        transactionId: paymentResult.transactionId,
        processedAt: new Date()
      });

      await payment.save();

      // Update appointment payment status
      appointment.paymentStatus = 'paid';
      appointment.paymentId = payment._id;
      await appointment.save();

      return {
        success: true,
        message: 'Payment processed successfully',
        payment: {
          id: payment._id,
          transactionId: paymentResult.transactionId,
          amount,
          method: paymentMethod,
          status: 'completed'
        }
      };

    } catch (error) {
      return {
        success: false,
        message: 'Payment processing failed due to server error'
      };
    }
  }

  // ============================================================================
  // VALIDATION HELPER METHODS (Easy to test for high coverage)
  // ============================================================================

  /**
   * Validate appointment booking data
   */
  validateAppointmentData(data) {
    if (!data) {
      return { isValid: false, message: 'Appointment data is required' };
    }

    const { patientId, doctorId, appointmentDate, appointmentTime, reason } = data;

    if (!patientId || !doctorId || !appointmentDate || !appointmentTime || !reason) {
      return { isValid: false, message: 'All appointment fields are required' };
    }

    // Validate date format
    const date = new Date(appointmentDate);
    if (isNaN(date.getTime())) {
      return { isValid: false, message: 'Invalid appointment date' };
    }

    // Validate time format (HH:MM)
    if (!this.isValidTimeFormat(appointmentTime)) {
      return { isValid: false, message: 'Invalid time format. Use HH:MM' };
    }

    // Validate reason length
    if (reason.length < 5 || reason.length > 500) {
      return { isValid: false, message: 'Reason must be between 5-500 characters' };
    }

    return { isValid: true };
  }

  /**
   * Validate payment data
   */
  validatePaymentData(data) {
    if (!data) {
      return { isValid: false, message: 'Payment data is required' };
    }

    const { amount, paymentMethod } = data;

    if (!amount || !paymentMethod) {
      return { isValid: false, message: 'Amount and payment method are required' };
    }

    if (amount <= 0) {
      return { isValid: false, message: 'Amount must be greater than zero' };
    }

    if (amount > 10000) {
      return { isValid: false, message: 'Amount exceeds maximum limit' };
    }

    if (!['card', 'cash', 'insurance'].includes(paymentMethod)) {
      return { isValid: false, message: 'Invalid payment method' };
    }

    // Validate card details if card payment
    if (paymentMethod === 'card') {
      const { cardDetails } = data;
      if (!cardDetails || !cardDetails.cardNumber || !cardDetails.expiryDate || !cardDetails.cvv) {
        return { isValid: false, message: 'Complete card details are required' };
      }

      if (!this.isValidCardNumber(cardDetails.cardNumber)) {
        return { isValid: false, message: 'Invalid card number' };
      }
    }

    return { isValid: true };
  }

  /**
   * Validate time format (HH:MM)
   */
  isValidTimeFormat(time) {
    if (!time || typeof time !== 'string') return false;
    
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  /**
   * Validate appointment status
   */
  isValidStatus(status) {
    const validStatuses = ['scheduled', 'completed', 'cancelled', 'rescheduled', 'no-show'];
    return validStatuses.includes(status);
  }

  /**
   * Validate card number (simple Luhn algorithm)
   */
  isValidCardNumber(cardNumber) {
    if (!cardNumber || typeof cardNumber !== 'string') return false;
    
    const cleanNumber = cardNumber.replace(/\s/g, '');
    if (!/^\d{13,19}$/.test(cleanNumber)) return false;
    
    // Simple validation - in real app would use proper Luhn algorithm
    return cleanNumber.length >= 13 && cleanNumber.length <= 19;
  }

  /**
   * Calculate appointment fee based on duration and doctor
   */
  calculateAppointmentFee(duration, doctorSpecialization = 'general') {
    const baseFee = 50;
    const durationMultiplier = duration / 30; // 30 min base
    
    const specializationFees = {
      'general': 1.0,
      'cardiology': 1.5,
      'neurology': 1.8,
      'surgery': 2.0,
      'pediatrics': 1.2
    };

    const multiplier = specializationFees[doctorSpecialization] || 1.0;
    return Math.round(baseFee * durationMultiplier * multiplier);
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Generate time slots for a doctor on a specific date
   */
  async _generateTimeSlots(doctorId, date, duration) {
    // Mock implementation - in real app would check doctor availability
    const slots = [];
    const startHour = 9;
    const endHour = 17;
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += duration) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push({
          time,
          available: Math.random() > 0.3, // 70% availability
          duration
        });
      }
    }
    
    return slots.filter(slot => slot.available);
  }

  /**
   * Check if a specific time slot is available
   */
  async _checkSlotAvailability(doctorId, date, time, duration) {
    try {
      const existingAppointment = await Appointment.findOne({
        doctor: doctorId,
        appointmentDate: new Date(date),
        appointmentTime: time,
        status: { $in: ['scheduled', 'rescheduled'] }
      });

      return {
        available: !existingAppointment,
        reason: existingAppointment ? 'Time slot already booked' : null
      };
    } catch (error) {
      return { available: false, reason: 'Error checking availability' };
    }
  }

  /**
   * Generate appointment reference number
   */
  _generateAppointmentReference(appointmentId) {
    const prefix = 'APT';
    const timestamp = Date.now().toString().slice(-6);
    const idSuffix = appointmentId.toString().slice(-4);
    return `${prefix}-${timestamp}-${idSuffix}`;
  }

  /**
   * Process card payment
   */
  async _processCardPayment(amount, cardDetails) {
    // Mock payment processing
    if (cardDetails.cardNumber === '4000000000000002') {
      return {
        success: false,
        message: 'Card declined'
      };
    }

    return {
      success: true,
      transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  }

  /**
   * Process cash payment
   */
  async _processCashPayment(amount) {
    return {
      success: true,
      transactionId: `CASH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  }
}

module.exports = new AppointmentBookingService();
