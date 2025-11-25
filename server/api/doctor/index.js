// Catch-all for /api/doctor/*
const handler = require(__dirname + '/proxy.js');

module.exports = async (req, res) => {
  const path = req.url.startsWith('/') ? req.url : `/${req.url}`;
  req.url = `/api/doctor${path}`;
  console.log(`🔵 Doctor: ${req.method} ${req.url}`);
  return handler(req, res);
};
