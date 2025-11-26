// Debug endpoint to test MongoDB connection
const mongoose = require('mongoose');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const debug = {
    timestamp: new Date().toISOString(),
    mongoUri: process.env.MONGODB_URI ? 'Set ✓' : 'Missing ✗',
    jwtSecret: process.env.JWT_SECRET ? 'Set ✓' : 'Missing ✗',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ? 'Set ✓' : 'Missing ✗',
    mongoState: mongoose.connection.readyState,
    nodeEnv: process.env.NODE_ENV
  };
  
  try {
    if (process.env.MONGODB_URI && mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      });
      debug.connectionTest = 'Success ✓';
    } else if (mongoose.connection.readyState === 1) {
      debug.connectionTest = 'Already connected ✓';
    }
  } catch (err) {
    debug.connectionTest = 'Failed ✗';
    debug.error = err.message;
  }
  
  res.json({ success: true, debug });
};
