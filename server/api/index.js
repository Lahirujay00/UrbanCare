// Vercel Serverless Function Entry Point
const serverless = require('serverless-http');
const mongoose = require('mongoose');

// Import the Express app
let app;
try {
  app = require('../server');
} catch (error) {
  console.error('Error loading server:', error);
  // Create a minimal Express app as fallback
  const express = require('express');
  app = express();
  app.get('*', (req, res) => {
    res.status(500).json({
      success: false,
      error: 'Failed to load application',
      message: error.message
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

// Wrap the handler to add CORS and database connection
const handler = async (req, res) => {
  // Set CORS headers for all requests
  const allowedOrigins = [
    'https://urban-care-front.vercel.app',
    'http://localhost:3000',
    'http://localhost:5000'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (process.env.CLIENT_URL) {
    res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_URL);
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Connect to database before handling request
  await connectToDatabase();
  
  // Pass to Express app via serverless-http
  return serverless(app)(req, res);
};

module.exports = handler;
