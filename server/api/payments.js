// Catch-all for /api/payments/*
const handler = require(__dirname + '/proxy.js');

module.exports = async (req, res) => {
  const path = req.url.startsWith('/') ? req.url : `/${req.url}`;
  req.url = `/api/payments${path}`;
  console.log(`🔵 Payments: ${req.method} ${req.url}`);
  return handler(req, res);
};
