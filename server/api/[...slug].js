// API Router - handles all /api/* requests
const serverless = require('serverless-http');
const mongoose = require('mongoose');
const app = require('../server');

let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb && mongoose.connection.readyState === 1) return cachedDb;
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI not set');
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  });
  cachedDb = mongoose.connection;
  console.log('✅ MongoDB connected');
  return cachedDb;
}

const handler = serverless(app);

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
    await connectToDatabase();
    
    // Route all requests to Express
    // Vercel removes /api prefix, so add /api back
    req.url = `/api${req.url}`;
    
    return handler(req, res);
  } catch (error) {
    console.error('❌ Handler error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
