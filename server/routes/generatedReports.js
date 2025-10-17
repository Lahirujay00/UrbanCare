const express = require('express');
const router = express.Router();
const GeneratedReport = require('../models/GeneratedReport');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { body, validationResult } = require('express-validator');

// @desc    Get all generated reports
// @route   GET /api/generated-reports
// @access  Private (Manager, Staff)
router.get('/', auth, authorize('manager', 'staff'), async (req, res) => {
  try {
    const { 
      reportType, 
      page = 1, 
      limit = 20, 
      sortBy = 'generatedAt', 
      sortOrder = 'desc',
      search 
    } = req.query;

    const query = { isArchived: false };
    
    // Filter by report type
    if (reportType) {
      query.reportType = reportType;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const reports = await GeneratedReport.find(query)
      .populate('generatedBy', 'firstName lastName email role')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const totalReports = await GeneratedReport.countDocuments(query);
    const totalPages = Math.ceil(totalReports / parseInt(limit));

    // Get report type statistics
    const reportTypeStats = await GeneratedReport.aggregate([
      { $match: { isArchived: false } },
      { $group: { _id: '$reportType', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        reports,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalReports,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        },
        statistics: {
          totalReports,
          reportTypeStats: reportTypeStats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
          }, {})
        }
      }
    });
  } catch (error) {
    console.error('Get generated reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get single generated report
// @route   GET /api/generated-reports/:id
// @access  Private (Manager, Staff)
router.get('/:id', auth, authorize('manager', 'staff'), async (req, res) => {
  try {
    const report = await GeneratedReport.findById(req.params.id)
      .populate('generatedBy', 'firstName lastName email role');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Get generated report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Create new generated report
// @route   POST /api/generated-reports
// @access  Private (Manager, Staff)
router.post('/', [
  auth,
  authorize('manager', 'staff'),
  body('title').notEmpty().withMessage('Report title is required'),
  body('reportType').isIn([
    'patient-visit', 'staff-utilization', 'financial-summary', 
    'comprehensive', 'peak-hours', 'appointment-analytics', 'revenue-analysis'
  ]).withMessage('Valid report type is required'),
  body('dateRange.startDate').isISO8601().withMessage('Valid start date is required'),
  body('dateRange.endDate').isISO8601().withMessage('Valid end date is required'),
  body('data').notEmpty().withMessage('Report data is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      title,
      reportType,
      description,
      dateRange,
      filters,
      summary,
      data,
      tags
    } = req.body;

    const report = new GeneratedReport({
      title,
      reportType,
      description,
      dateRange,
      filters,
      summary,
      data,
      tags,
      generatedBy: req.user.id,
      status: 'completed'
    });

    await report.save();
    
    // Populate the generated report
    await report.populate('generatedBy', 'firstName lastName email role');

    res.status(201).json({
      success: true,
      message: 'Report saved successfully',
      data: report
    });
  } catch (error) {
    console.error('Create generated report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update generated report
// @route   PUT /api/generated-reports/:id
// @access  Private (Manager, Staff)
router.put('/:id', [
  auth,
  authorize('manager', 'staff'),
  body('title').optional().notEmpty().withMessage('Report title cannot be empty'),
  body('description').optional().isString().withMessage('Description must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { title, description, tags, isArchived } = req.body;
    
    const report = await GeneratedReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Update fields
    if (title) report.title = title;
    if (description !== undefined) report.description = description;
    if (tags) report.tags = tags;
    if (isArchived !== undefined) report.isArchived = isArchived;

    await report.save();
    await report.populate('generatedBy', 'firstName lastName email role');

    res.json({
      success: true,
      message: 'Report updated successfully',
      data: report
    });
  } catch (error) {
    console.error('Update generated report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Delete generated report
// @route   DELETE /api/generated-reports/:id
// @access  Private (Manager)
router.delete('/:id', auth, authorize('manager'), async (req, res) => {
  try {
    const report = await GeneratedReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    await GeneratedReport.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    console.error('Delete generated report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Download generated report
// @route   GET /api/generated-reports/:id/download
// @access  Private (Manager, Staff)
router.get('/:id/download', auth, authorize('manager', 'staff'), async (req, res) => {
  try {
    const report = await GeneratedReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Record download
    await report.recordDownload();

    // Set headers for download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${report.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.json"`);

    res.json({
      reportInfo: {
        title: report.title,
        reportType: report.reportType,
        dateRange: report.dateRange,
        generatedAt: report.generatedAt,
        generatedBy: report.generatedBy
      },
      data: report.data,
      summary: report.summary
    });
  } catch (error) {
    console.error('Download generated report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get report statistics
// @route   GET /api/generated-reports/stats/overview
// @access  Private (Manager)
router.get('/stats/overview', auth, authorize('manager'), async (req, res) => {
  try {
    const totalReports = await GeneratedReport.countDocuments({ isArchived: false });
    const totalDownloads = await GeneratedReport.aggregate([
      { $match: { isArchived: false } },
      { $group: { _id: null, total: { $sum: '$downloadCount' } } }
    ]);

    const recentReports = await GeneratedReport.find({ isArchived: false })
      .sort({ generatedAt: -1 })
      .limit(5)
      .populate('generatedBy', 'firstName lastName');

    const reportsByType = await GeneratedReport.aggregate([
      { $match: { isArchived: false } },
      { $group: { _id: '$reportType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        totalReports,
        totalDownloads: totalDownloads[0]?.total || 0,
        recentReports,
        reportsByType
      }
    });
  } catch (error) {
    console.error('Get report statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
