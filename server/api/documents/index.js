// Catch-all for /api/documents/*
const handler = require('../proxy');
module.exports = async (req, res) => { req.url = `/api/documents${req.url}`; return handler(req, res); };
