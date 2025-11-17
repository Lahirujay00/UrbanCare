const mongoose = require('mongoose');

// Import the Express app
const app = require('../server');

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
      throw new Error('MONGODB_URI environment variable is not set');
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
    throw err;
  }
}

// Serverless function handler for Vercel
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Connect to database before handling request
    await connectToDatabase();
    
    // Handle request with Express app
    app(req, res);
  } catch (error) {
    console.error('Serverless function error:', error);
    
    // Return error response
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
};
