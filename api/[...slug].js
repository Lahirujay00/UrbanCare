// Catch-all API route that proxies to Express app
const handler = require('../server/api/index.js');

module.exports = async (req, res) => {
  // Log incoming request for debugging
  console.log(`🔵 API Request: ${req.method} ${req.url}`);
  
  // Pass to main handler
  return handler(req, res);
};
