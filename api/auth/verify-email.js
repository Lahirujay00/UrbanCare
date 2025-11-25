// Direct handler for /api/auth/verify-email
const handler = require('../../server/api/index.js');

module.exports = async (req, res) => {
  // Set the full path for Express routing
  req.url = '/api/auth/verify-email';
  
  console.log(`🔵 Verify Email Request: ${req.method} ${req.url}`);
  
  return handler(req, res);
};
