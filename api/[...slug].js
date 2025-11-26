// Catch-all API route that proxies to Express app
const handler = require('../server/api/_old-index.js');

module.exports = async (req, res) => {
  // Vercel strips /api prefix from the URL when routing to /api/[...slug].js
  // So we need to add it back for our Express routes
  const originalUrl = req.url;
  req.url = `/api${req.url}`;
  
  console.log(`🔵 API Request: ${req.method} ${originalUrl} → ${req.url}`);
  
  // Pass to main handler
  return handler(req, res);
};
