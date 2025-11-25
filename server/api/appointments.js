// Proxy handler for /api/appointments
const handler = require('./proxy');

module.exports = async (req, res) => {
  req.url = `/api/appointments${req.url}`;
  return handler(req, res);
};
