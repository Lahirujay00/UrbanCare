const express = require('express');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const router = express.Router();

// @desc    Get medical records
// @route   GET /api/medical-records
// @access  Private
router.get('/', auth, async (req, res) => {
  res.json({
    success: true,
    message: 'Medical records endpoint - Coming soon',
    data: { records: [] }
  });
});

module.exports = router;