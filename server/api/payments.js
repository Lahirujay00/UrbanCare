// Proxy handler for /api/payments
const handler = require('./proxy');

module.exports = async (req, res) => {
  req.url = `/api/payments${req.url}`;
  return handler(req, res);
};
