// Serverless function for /api/auth/register
const handler = require('../index.js');

module.exports = async (req, res) => {
  // Set the full path for Express routing
  req.url = '/api/auth/register';
  
  console.log(`🔵 Register Request: ${req.method} ${req.url}`);
  
  return handler(req, res);
};
