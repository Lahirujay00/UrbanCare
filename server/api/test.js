// Simple test endpoint to verify serverless function is working
const express = require('express');
const testApp = express();

testApp.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Serverless function is working!',
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      MONGODB_CONNECTED: process.env.MONGODB_URI ? 'URI exists' : 'URI missing'
    }
  });
});

testApp.get('*', (req, res) => {
  res.json({
    success: true,
    message: 'UrbanCare API - Serverless',
    path: req.path
  });
});

module.exports = testApp;
