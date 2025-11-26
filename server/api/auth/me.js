// Standalone serverless function for /api/auth/me
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

let cachedDb = null;
let User = null;

async function connectToDatabase() {
  if (cachedDb && mongoose.connection.readyState === 1) return cachedDb;
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI not set');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    cachedDb = mongoose.connection;
    console.log('✅ MongoDB connected');
    
    // Load model after connection
    if (!User) {
      User = require('../../models/User');
    }
    
    return cachedDb;
  } catch (err) {
    console.error('❌ MongoDB error:', err.message);
    throw err;
  }
}

const allowedOrigins = ['https://urban-care-front.vercel.app', 'http://localhost:3000'];

function setCorsHeaders(req, res) {
  const origin = req.headers.origin || req.headers.Origin;
  res.setHeader('Access-Control-Allow-Origin', allowedOrigins.includes(origin) ? origin : allowedOrigins[0]);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

module.exports = async (req, res) => {
  console.log('🔵 /api/auth/me endpoint hit');
  setCorsHeaders(req, res);
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed' });

  try {
    await connectToDatabase();
    
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password -sessionTokens');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ 
      success: true, 
      data: user 
    });
  } catch (error) {
    console.error('❌ /api/auth/me error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message
    });
  }
};
