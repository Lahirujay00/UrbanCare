// API Router - handles all /api/* requests
const serverless = require('serverless-http');
const mongoose = require('mongoose');

let cachedDb = null;
let cachedApp = null;
let cachedHandler = null;

async function connectToDatabase() {
  if (cachedDb && mongoose.connection.readyState === 1) return cachedDb;
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI not set');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 4000,
      connectTimeoutMS: 4000,
      socketTimeoutMS: 4000,
    });
    cachedDb = mongoose.connection;
    console.log('✅ MongoDB connected');
    return cachedDb;
  } catch (err) {
    console.error('❌ MongoDB error:', err.message);
    throw err;
  }
}

function getHandler() {
  if (!cachedHandler) {
    console.log('Loading Express app...');
    cachedApp = require('../server');
    cachedHandler = serverless(cachedApp);
    console.log('✅ Express app loaded');
  }
  return cachedHandler;
}

const allowedOrigins = ['https://urban-care-front.vercel.app', 'http://localhost:3000'];

function setCorsHeaders(req, res) {
  const origin = req.headers.origin || req.headers.Origin;
  res.setHeader('Access-Control-Allow-Origin', allowedOrigins.includes(origin) ? origin : allowedOrigins[0]);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

module.exports = async (req, res) => {
  console.log(`🔵 API Request: ${req.method} ${req.url}`);
  
  setCorsHeaders(req, res);
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // Connect to database with timeout
    const dbPromise = connectToDatabase();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database connection timeout')), 8000)
    );
    
    await Promise.race([dbPromise, timeoutPromise]);
    
    // Get handler and route request
    const handler = getHandler();
    req.url = `/api${req.url}`;
    
    return handler(req, res);
  } catch (error) {
    console.error('❌ Handler error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
