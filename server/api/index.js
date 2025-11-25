// Vercel Serverless Function Entry Point
const serverless = require('serverless-http');
const mongoose = require('mongoose');

// Import the Express app
let app;
try {
  app = require('../server');
  console.log('✅ Express app loaded successfully');
  console.log('App routes:', app._router?.stack?.filter(r => r.route || r.name === 'router').map(r => r.route?.path || r.name).join(', '));
} catch (error) {
  console.error('❌ Error loading server:', error);
  // Create a minimal Express app as fallback
  const express = require('express');
  app = express();
  app.all('*', (req, res) => {
    res.status(500).json({
      success: false,
      error: 'Failed to load application',
      message: error.message,
      stack: error.stack
    });
  });
}

// Cached database connection
let isConnecting = false;
let cachedDb = null;

async function connectToDatabase() {
  // If already connected, return immediately
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }

  // If connection is in progress, wait for it
  if (isConnecting) {
    await new Promise(resolve => setTimeout(resolve, 100));
    return connectToDatabase();
  }

  isConnecting = true;

  try {
    if (!process.env.MONGODB_URI) {
      console.warn('MONGODB_URI not set, skipping database connection');
      isConnecting = false;
      return null;
    }

    console.log('Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 1,
    });
    
    cachedDb = mongoose.connection;
    isConnecting = false;
    console.log('MongoDB connected successfully');
    return cachedDb;
  } catch (err) {
    isConnecting = false;
    cachedDb = null;
    console.error('MongoDB connection error:', err.message);
    // Don't throw - allow request to proceed without DB
    return null;
  }
}

// Create the serverless handler once
const serverlessHandler = serverless(app);

// Allowed origins for CORS
const allowedOrigins = [
  'https://urban-care-front.vercel.app',
  'http://localhost:3000',
  'http://localhost:5000'
];

// Main handler with CORS and database connection
module.exports = async (req, res) => {
  // Set CORS headers for all requests
  const origin = req.headers.origin || req.headers.Origin;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (process.env.CLIENT_URL && origin === process.env.CLIENT_URL) {
    res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_URL);
  } else {
    // Default to first allowed origin
    res.setHeader('Access-Control-Allow-Origin', 'https://urban-care-front.vercel.app');
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-CSRF-Token');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Handle preflight OPTIONS request immediately
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  try {
    // Connect to database before handling request
    await connectToDatabase();
    
    // Pass to Express app via serverless-http
    return serverlessHandler(req, res);
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
