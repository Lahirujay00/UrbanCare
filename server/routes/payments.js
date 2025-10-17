const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { body, validationResult } = require('express-validator');
const Payment = require('../models/Payment');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const router = express.Router();

// @desc    Create payment intent for appointment
// @route   POST /api/payments/create-intent
// @access  Private (Patient)
router.post('/create-intent',
  auth,
  authorize('patient'),
  [
    body('appointmentId').isMongoId().withMessage('Valid appointment ID is required'),
    body('amount').isNumeric().withMessage('Valid amount is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { appointmentId, amount } = req.body;

      // Verify appointment
      const appointment = await Appointment.findById(appointmentId)
        .populate('patient')
        .populate('doctor');

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found'
        });
      }

      // Verify patient owns appointment
      if (appointment.patient._id.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized'
        });
      }

      // Check if already paid
      if (appointment.paymentStatus === 'paid') {
        return res.status(400).json({
          success: false,
          message: 'Appointment already paid'
        });
      }

      // Create payment intent with Stripe
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        metadata: {
          appointmentId: appointmentId,
          patientId: req.user.id,
          doctorId: appointment.doctor._id.toString()
        }
      });

      // Create payment record
      const payment = await Payment.create({
        transactionId: paymentIntent.id,
        appointment: appointmentId,
        patient: req.user.id,
        doctor: appointment.doctor._id,
        amount: amount,
        currency: 'USD',
        paymentMethod: 'card',
        paymentGateway: 'stripe',
        status: 'pending',
        gatewayResponse: {
          paymentIntentId: paymentIntent.id,
          responseCode: paymentIntent.status
        }
      });

      res.json({
        success: true,
        data: {
          clientSecret: paymentIntent.client_secret,
          paymentId: payment._id
        }
      });
    } catch (error) {
      console.error('Create payment intent error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  }
);

// @desc    Confirm payment
// @route   POST /api/payments/confirm
// @access  Private (Patient)
router.post('/confirm',
  auth,
  authorize('patient'),
  [
    body('paymentIntentId').notEmpty().withMessage('Payment intent ID is required'),
    body('appointmentId').isMongoId().withMessage('Valid appointment ID is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { paymentIntentId, appointmentId } = req.body;

      // Retrieve payment intent from Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status === 'succeeded') {
        // Update payment record
        const payment = await Payment.findOne({ transactionId: paymentIntentId });
        if (payment) {
          payment.status = 'completed';
          payment.paymentDate = new Date();
          payment.gatewayResponse.chargeId = paymentIntent.charges.data[0]?.id;
          payment.gatewayResponse.receiptUrl = paymentIntent.charges.data[0]?.receipt_url;
          await payment.save();

          // Update appointment payment status
          const appointment = await Appointment.findById(appointmentId);
          if (appointment) {
            appointment.paymentStatus = 'paid';
            appointment.paymentMethod = 'card';
            appointment.paymentDate = new Date();
            appointment.transactionId = paymentIntentId;
            await appointment.save();
          }

          res.json({
            success: true,
            message: 'Payment confirmed successfully',
            data: { payment }
          });
        } else {
          res.status(404).json({
            success: false,
            message: 'Payment record not found'
          });
        }
      } else {
        res.status(400).json({
          success: false,
          message: 'Payment not successful',
          status: paymentIntent.status
        });
      }
    } catch (error) {
      console.error('Confirm payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  }
);

// @desc    Get payment history
// @route   GET /api/payments
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let query = {};

    // Filter based on user role
    if (req.user.role === 'patient') {
      query.patient = req.user.id;
    } else if (req.user.role === 'doctor') {
      query.doctor = req.user.id;
    }

    const { status, startDate, endDate } = req.query;

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate);
      if (endDate) query.paymentDate.$lte = new Date(endDate);
    }

    const payments = await Payment.find(query)
      .populate('patient', 'firstName lastName email')
      .populate('doctor', 'firstName lastName specialization')
      .populate('appointment')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: payments.length,
      data: { payments }
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get single payment
// @route   GET /api/payments/:id
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('patient', 'firstName lastName email phone')
      .populate('doctor', 'firstName lastName specialization')
      .populate('appointment');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check authorization
    const isAuthorized =
      payment.patient._id.toString() === req.user.id ||
      payment.doctor._id.toString() === req.user.id ||
      ['staff', 'manager', 'admin'].includes(req.user.role);

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this payment'
      });
    }

    res.json({
      success: true,
      data: { payment }
    });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Process refund
// @route   POST /api/payments/:id/refund
// @access  Private (Admin, Manager)
router.post('/:id/refund',
  auth,
  authorize('admin', 'manager'),
  [
    body('refundAmount').isNumeric().withMessage('Valid refund amount is required'),
    body('reason').notEmpty().withMessage('Refund reason is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const payment = await Payment.findById(req.params.id);

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      const { refundAmount, reason } = req.body;

      // Process refund with Stripe
      const refund = await stripe.refunds.create({
        payment_intent: payment.gatewayResponse.paymentIntentId,
        amount: Math.round(refundAmount * 100)
      });

      // Update payment record
      await payment.processRefund(refundAmount, reason, req.user.id);
      payment.refund.refundTransactionId = refund.id;
      payment.refund.refundStatus = 'completed';
      await payment.save();

      // Update appointment
      const appointment = await Appointment.findById(payment.appointment);
      if (appointment) {
        appointment.paymentStatus = 'refunded';
        await appointment.save();
      }

      res.json({
        success: true,
        message: 'Refund processed successfully',
        data: { payment }
      });
    } catch (error) {
      console.error('Process refund error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  }
);

// @desc    Get payment statistics
// @route   GET /api/payments/stats/overview
// @access  Private (Manager, Admin)
router.get('/stats/overview', auth, authorize('manager', 'admin'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1));
    const end = endDate ? new Date(endDate) : new Date();

    const stats = await Payment.getStatistics(start, end);
    const dailyRevenue = await Payment.getDailyRevenue(start, end);
    
    // Get recent payments
    const recentPayments = await Payment.find({ status: 'completed' })
      .sort({ paymentDate: -1 })
      .limit(10)
      .populate('patient', 'firstName lastName email')
      .populate('appointment', 'appointmentDate')
      .lean();

    res.json({
      success: true,
      data: {
        stats,
        dailyRevenue,
        recentPayments,
        totalRevenue: stats.totalRevenue,
        totalTransactions: stats.totalTransactions
      }
    });
  } catch (error) {
    console.error('Get payment statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
