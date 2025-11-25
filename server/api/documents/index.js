// Catch-all for /api/documents/*
const handler = require(__dirname + '/proxy.js');

module.exports = async (req, res) => {
  const path = req.url.startsWith('/') ? req.url : `/${req.url}`;
  req.url = `/api/documents${path}`;
  console.log(`🔵 Documents: ${req.method} ${req.url}`);
  return handler(req, res);
};
