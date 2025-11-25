// Direct handler for /api/auth/refresh
const handler = require('../../server/api/index.js');

module.exports = async (req, res) => {
  // Set the full path for Express routing
  req.url = '/api/auth/refresh';
  
  console.log(`🔵 Refresh Request: ${req.method} ${req.url}`);
  
  return handler(req, res);
};
