// Root catch-all that handles ALL requests
const handler = require('./server/api/index.js');

module.exports = async (req, res) => {
  console.log(`🔵 Catch-all Request: ${req.method} ${req.url}`);
  
  // Pass directly to main handler (no URL modification needed)
  return handler(req, res);
};
