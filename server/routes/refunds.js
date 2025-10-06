const express = require('express');
const router = express.Router();
const Refund = require('../models/Refund');
const Appointment = require('../models/Appointment');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// @desc    Request refund for appointment
// @route   POST /api/refunds/request
// @access  Private (Patient, Staff, Admin)
router.post('/request', auth, async (req, res) => {
  try {
    const {
      appointmentId,
      refundReason,
      refundDescription,
      bankDetails
    } = req.body;

    // Get appointment details
    const appointment = await Appointment.findById(appointmentId)
      .populate('patient', 'firstName lastName email phone');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if user can request refund for this appointment
    const canRequest = appointment.patient._id.toString() === req.user.id ||
                      ['staff', 'admin'].includes(req.user.role);

    if (!canRequest) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to request refund for this appointment'
      });
    }

    // Check refund eligibility
    const eligibility = Refund.checkEligibility(appointment);
    if (!eligibility.eligible) {
      return res.status(400).json({
        success: false,
        message: eligibility.reason
      });
    }

    // Check if refund already exists
    const existingRefund = await Refund.findOne({ 
      appointment: appointmentId,
      status: { $nin: ['rejected', 'cancelled'] }
    });

    if (existingRefund) {
      return res.status(400).json({
        success: false,
        message: 'Refund request already exists for this appointment'
      });
    }

    // Create refund request
    const refund = new Refund({
      appointment: appointmentId,
      patient: appointment.patient._id,
      originalPayment: {
        transactionId: appointment.transactionId,
        amount: appointment.consultationFee,
        paymentMethod: appointment.paymentMethod,
        paymentDate: appointment.paymentDate
      },
      refundAmount: appointment.consultationFee, // Will be calculated based on policy
      refundReason,
      refundDescription,
      requestedBy: req.user.id,
      refundDetails: {
        bankDetails: bankDetails || null
      },
      priority: refundReason === 'medical-emergency' ? 'urgent' : 'medium'
    });

    // Calculate actual refund amount based on policy
    refund.refundAmount = refund.calculateRefundAmount();

    // Add initial timeline entry
    await refund.addTimelineEntry(
      'Refund request created',
      req.user.id,
      'Initial refund request submitted',
      null,
      'pending'
    );

    await refund.save();

    // Populate references
    await refund.populate([
      { path: 'appointment', select: 'appointmentDate appointmentTime consultationFee' },
      { path: 'patient', select: 'firstName lastName email phone' },
      { path: 'requestedBy', select: 'firstName lastName role' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Refund request submitted successfully',
      data: { refund }
    });

  } catch (error) {
    console.error('Request refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get refund requests
// @route   GET /api/refunds
// @access  Private (Staff, Admin for all; Patient for own)
router.get('/', auth, async (req, res) => {
  try {
    const { status, patientId, page = 1, limit = 10 } = req.query;

    let query = {};

    // If patient, only show their refunds
    if (req.user.role === 'patient') {
      query.patient = req.user.id;
    } else if (patientId) {
      query.patient = patientId;
    }

    if (status) {
      query.status = status;
    }

    const refunds = await Refund.find(query)
      .populate('appointment', 'appointmentDate appointmentTime consultationFee')
      .populate('patient', 'firstName lastName email phone')
      .populate('requestedBy', 'firstName lastName role')
      .populate('approvalWorkflow.reviewedBy', 'firstName lastName')
      .populate('approvalWorkflow.approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Refund.countDocuments(query);

    res.json({
      success: true,
      data: {
        refunds,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get refunds error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get single refund
// @route   GET /api/refunds/:id
// @access  Private (Patient own, Staff, Admin)
router.get('/:id', auth, async (req, res) => {
  try {
    const refund = await Refund.findById(req.params.id)
      .populate('appointment', 'appointmentDate appointmentTime consultationFee')
      .populate('patient', 'firstName lastName email phone')
      .populate('requestedBy', 'firstName lastName role')
      .populate('approvalWorkflow.reviewedBy', 'firstName lastName')
      .populate('approvalWorkflow.approvedBy', 'firstName lastName')
      .populate('refundDetails.processedBy', 'firstName lastName')
      .populate('timeline.performedBy', 'firstName lastName role');

    if (!refund) {
      return res.status(404).json({
        success: false,
        message: 'Refund not found'
      });
    }

    // Check authorization
    const canView = refund.patient._id.toString() === req.user.id ||
                   ['staff', 'admin'].includes(req.user.role);

    if (!canView) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this refund'
      });
    }

    res.json({
      success: true,
      data: { refund }
    });

  } catch (error) {
    console.error('Get refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Review refund request
// @route   PUT /api/refunds/:id/review
// @access  Private (Staff, Admin)
router.put('/:id/review', auth, authorize('staff', 'admin'), async (req, res) => {
  try {
    const { action, comments } = req.body; // action: 'approve' or 'reject'

    const refund = await Refund.findById(req.params.id);

    if (!refund) {
      return res.status(404).json({
        success: false,
        message: 'Refund not found'
      });
    }

    if (refund.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Refund is not in pending status'
      });
    }

    // Update approval workflow
    refund.approvalWorkflow.reviewedBy = req.user.id;
    refund.approvalWorkflow.reviewedAt = new Date();
    refund.approvalWorkflow.reviewComments = comments;

    if (action === 'approve') {
      refund.approvalWorkflow.approvedBy = req.user.id;
      refund.approvalWorkflow.approvedAt = new Date();
      refund.approvalWorkflow.approvalComments = comments;
      
      await refund.updateStatus('approved', req.user.id, comments);
    } else if (action === 'reject') {
      await refund.updateStatus('rejected', req.user.id, comments);
    }

    await refund.populate([
      { path: 'appointment', select: 'appointmentDate appointmentTime' },
      { path: 'patient', select: 'firstName lastName email' },
      { path: 'approvalWorkflow.reviewedBy', select: 'firstName lastName' },
      { path: 'approvalWorkflow.approvedBy', select: 'firstName lastName' }
    ]);

    res.json({
      success: true,
      message: `Refund ${action}d successfully`,
      data: { refund }
    });

  } catch (error) {
    console.error('Review refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Process refund (actual payment)
// @route   PUT /api/refunds/:id/process
// @access  Private (Admin, Manager)
router.put('/:id/process', auth, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { 
      refundMethod = 'original-payment-method',
      bankDetails,
      gatewayTransactionId 
    } = req.body;

    const refund = await Refund.findById(req.params.id);

    if (!refund) {
      return res.status(404).json({
        success: false,
        message: 'Refund not found'
      });
    }

    if (refund.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Refund must be approved before processing'
      });
    }

    // Simulate payment gateway processing
    const mockGatewayResponse = {
      success: true,
      message: 'Refund processed successfully',
      gatewayTransactionId: gatewayTransactionId || `REF-${Date.now()}`,
      errorCode: null
    };

    // Update refund details
    refund.refundDetails.refundMethod = refundMethod;
    refund.refundDetails.refundDate = new Date();
    refund.refundDetails.processedBy = req.user.id;
    refund.refundDetails.refundTransactionId = mockGatewayResponse.gatewayTransactionId;
    refund.refundDetails.gatewayResponse = mockGatewayResponse;

    if (bankDetails) {
      refund.refundDetails.bankDetails = bankDetails;
    }

    // Update appointment payment status
    await Appointment.findByIdAndUpdate(refund.appointment, {
      paymentStatus: 'refunded',
      'paymentDetails.refundTransactionId': mockGatewayResponse.gatewayTransactionId,
      'paymentDetails.refundDate': new Date(),
      'paymentDetails.refundAmount': refund.refundAmount
    });

    await refund.updateStatus('processed', req.user.id, 'Refund processed successfully');

    await refund.populate([
      { path: 'appointment', select: 'appointmentDate appointmentTime' },
      { path: 'patient', select: 'firstName lastName email' },
      { path: 'refundDetails.processedBy', select: 'firstName lastName' }
    ]);

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: { refund }
    });

  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Cancel refund request
// @route   PUT /api/refunds/:id/cancel
// @access  Private (Patient own, Staff, Admin)
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const { reason } = req.body;

    const refund = await Refund.findById(req.params.id);

    if (!refund) {
      return res.status(404).json({
        success: false,
        message: 'Refund not found'
      });
    }

    // Check authorization
    const canCancel = refund.patient.toString() === req.user.id ||
                     ['staff', 'admin'].includes(req.user.role);

    if (!canCancel) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this refund'
      });
    }

    if (!['pending', 'approved'].includes(refund.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel refund in current status'
      });
    }

    await refund.updateStatus('cancelled', req.user.id, reason || 'Refund cancelled');

    res.json({
      success: true,
      message: 'Refund cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get refund statistics
// @route   GET /api/refunds/stats/summary
// @access  Private (Staff, Admin, Manager)
router.get('/stats/summary', auth, authorize('staff', 'admin', 'manager'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const stats = await Refund.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$refundAmount' }
        }
      }
    ]);

    const totalRefunds = await Refund.countDocuments(dateFilter);
    const totalRefundAmount = await Refund.aggregate([
      { $match: { ...dateFilter, status: 'processed' } },
      { $group: { _id: null, total: { $sum: '$refundAmount' } } }
    ]);

    const avgProcessingTime = await Refund.aggregate([
      { $match: { ...dateFilter, status: 'processed' } },
      { $group: { _id: null, avgTime: { $avg: '$actualProcessingTime' } } }
    ]);

    res.json({
      success: true,
      data: {
        statusBreakdown: stats,
        totalRefunds,
        totalRefundAmount: totalRefundAmount[0]?.total || 0,
        avgProcessingTime: avgProcessingTime[0]?.avgTime || 0
      }
    });

  } catch (error) {
    console.error('Get refund stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
