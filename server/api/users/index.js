// Catch-all for /api/users/*
const handler = require(__dirname + '/proxy.js');

module.exports = async (req, res) => {
  const path = req.url.startsWith('/') ? req.url : `/${req.url}`;
  req.url = `/api/users${path}`;
  console.log(`🔵 Users: ${req.method} ${req.url}`);
  return handler(req, res);
};
