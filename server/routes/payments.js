const express = require('express');
const auth = require('../middleware/auth');

const router = express.Router();

// @desc    Create payment intent
// @route   POST /api/payments/create-intent
// @access  Private
router.post('/create-intent', auth, async (req, res) => {
  res.json({
    success: true,
    message: 'Payment integration - Coming soon',
    data: { clientSecret: 'placeholder' }
  });
});

module.exports = router;