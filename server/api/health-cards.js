// Proxy handler for /api/health-cards
const handler = require('./proxy');

module.exports = async (req, res) => {
  req.url = `/api/health-cards${req.url}`;
  return handler(req, res);
};
