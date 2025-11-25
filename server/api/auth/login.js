// Serverless function for /api/auth/login
const handler = require('../index.js');

module.exports = async (req, res) => {
  // Set the full path for Express routing
  req.url = '/api/auth/login';
  
  console.log(`🔵 Login Request: ${req.method} ${req.url}`);
  
  return handler(req, res);
};
