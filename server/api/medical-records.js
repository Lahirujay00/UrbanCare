// Catch-all for /api/medical-records/*
const handler = require(__dirname + '/proxy.js');

module.exports = async (req, res) => {
  const path = req.url.startsWith('/') ? req.url : `/${req.url}`;
  req.url = `/api/medical-records${path}`;
  console.log(`🔵 Medical Records: ${req.method} ${req.url}`);
  return handler(req, res);
};
