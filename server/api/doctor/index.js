// Catch-all for /api/doctor/*
const handler = require('../proxy');
module.exports = async (req, res) => { req.url = `/api/doctor${req.url}`; return handler(req, res); };
