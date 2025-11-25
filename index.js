// Main entry point - redirects to serverless handler
// This satisfies Vercel's entrypoint requirement while using serverless functions
const handler = require('./server/api/index.js');

module.exports = handler;
