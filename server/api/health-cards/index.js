// Catch-all for /api/health-cards/*
const path = require('path');
const handler = require(path.join(__dirname, '..', 'proxy.js'));

module.exports = async (req, res) => {
  const path = req.url.startsWith('/') ? req.url : `/${req.url}`;
  req.url = `/api/health-cards${path}`;
  console.log(`🔵 Health Cards: ${req.method} ${req.url}`);
  return handler(req, res);
};
