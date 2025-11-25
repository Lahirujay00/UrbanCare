// Standalone serverless function for users
const mongoose = require('mongoose');
const User = require('../models/User');

let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb && mongoose.connection.readyState === 1) return cachedDb;
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI not set');
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  });
  cachedDb = mongoose.connection;
  return cachedDb;
}

const allowedOrigins = ['https://urban-care-front.vercel.app', 'http://localhost:3000'];

function setCorsHeaders(req, res) {
  const origin = req.headers.origin || req.headers.Origin;
  res.setHeader('Access-Control-Allow-Origin', allowedOrigins.includes(origin) ? origin : allowedOrigins[0]);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

module.exports = async (req, res) => {
  console.log('🔵 Users endpoint hit');
  setCorsHeaders(req, res);
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await connectToDatabase();
    
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (req.method === 'GET') {
      const user = await User.findById(decoded.id);
      return res.json({ success: true, data: { user } });
    }
    
    res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (error) {
    console.error('❌ Users error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
