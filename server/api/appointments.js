// Catch-all for /api/appointments/*
const handler = require(__dirname + '/proxy.js');

module.exports = async (req, res) => {
  // Build the full Express route path
  const path = req.url.startsWith('/') ? req.url : `/${req.url}`;
  req.url = `/api/appointments${path}`;
  console.log(`🔵 Appointments: ${req.method} ${req.url}`);
  return handler(req, res);
};
