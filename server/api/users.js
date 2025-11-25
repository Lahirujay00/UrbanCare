// Proxy handler for /api/users
const handler = require('./proxy');

module.exports = async (req, res) => {
  req.url = `/api/users${req.url}`;
  return handler(req, res);
};
