// Catch-all serverless handler for non-auth API routes
const serverless = require('serverless-http');
const mongoose = require('mongoose');

// Import Express app (cached by Node.js after first load)
const app = require('../../server');

// Cached database connection
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI not set');
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    cachedDb = mongoose.connection;
    console.log('✅ MongoDB connected');
    return cachedDb;
  } catch (err) {
    console.error('❌ MongoDB error:', err.message);
    throw err;
  }
}

// Create serverless handler
const handler = serverless(app);

// CORS headers
const allowedOrigins = [
  'https://urban-care-front.vercel.app',
  'http://localhost:3000'
];

function setCorsHeaders(req, res) {
  const origin = req.headers.origin || req.headers.Origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

module.exports = async (req, res) => {
  console.log(`🔵 API Request: ${req.method} ${req.url}`);
  
  // Set CORS headers
  setCorsHeaders(req, res);

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Connect to database
    await connectToDatabase();
    
    // Pass to Express app
    return handler(req, res);
  } catch (error) {
    console.error('❌ Handler error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
