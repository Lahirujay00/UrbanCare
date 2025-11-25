// Catch-all for /api/medical-records/*
const handler = require('../proxy');
module.exports = async (req, res) => { req.url = `/api/medical-records${req.url}`; return handler(req, res); };
