// Auth route handler
const handler = require('../../server/api/index.js');

module.exports = async (req, res) => {
  // Add /api/auth prefix to the URL
  req.url = `/api/auth${req.url}`;
  
  console.log(`🔵 Auth Request: ${req.method} ${req.url}`);
  
  return handler(req, res);
};
