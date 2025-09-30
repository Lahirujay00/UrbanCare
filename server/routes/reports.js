const express = require('express');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const router = express.Router();

// @desc    Get dashboard statistics
// @route   GET /api/reports/dashboard
// @access  Private (Manager/Admin)
router.get('/dashboard', auth, authorize('manager', 'admin'), async (req, res) => {
  res.json({
    success: true,
    message: 'Dashboard reports endpoint - Coming soon',
    data: {
      totalPatients: 1250,
      totalDoctors: 45,
      appointmentsToday: 78,
      revenue: 125000
    }
  });
});

module.exports = router;