// Standalone serverless function for medical records
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

let cachedDb = null;
let MedicalRecord = null;
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
    
    // Load models after connection
    if (!User) {
      User = require('../models/User');
    }
    if (!MedicalRecord) {
      MedicalRecord = require('../models/MedicalRecord');
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

module.exports = async (req, res) => {
  console.log('🔵 Medical records endpoint hit');
  setCorsHeaders(req, res);
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed' });

  try {
    await connectToDatabase();
    
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      console.error('❌ No token in request');
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ Token verified for user:', decoded.id || decoded.userId);
    } catch (jwtError) {
      console.error('❌ JWT verification failed:', jwtError.message);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired token',
        error: jwtError.message 
      });
    }
    
    // Handle both id and userId
    const userId = decoded.id || decoded.userId;
    if (!userId) {
      console.error('❌ No user ID in token');
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token structure' 
      });
    }
    
    // Get medical records for this user
    console.log('📋 Fetching medical records for user:', userId);
    const records = await MedicalRecord.find({ patient: userId })
      .populate('doctor', 'firstName lastName specialization')
      .sort('-createdAt')
      .limit(50);
    
    console.log('✅ Found medical records:', records.length);
    res.json({
      success: true,
      data: { records }
    });
  } catch (error) {
    console.error('❌ Medical records error:', error.message, error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message
    });
  }
};
