// Standalone serverless function for appointments
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

let cachedDb = null;
let Appointment = null;
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
    if (!Appointment) {
      Appointment = require('../models/Appointment');
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
  console.log('🔵 Appointments endpoint hit');
  console.log('Query params:', req.query);
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
      console.log('✅ Token decoded:', JSON.stringify(decoded));
      console.log('✅ Token verified for user:', decoded.id || decoded.userId);
    } catch (jwtError) {
      console.error('❌ JWT verification failed:', jwtError.message);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired token',
        error: jwtError.message 
      });
    }
    
    // Build query for appointments (handle both id and userId)
    const userId = decoded.id || decoded.userId;
    if (!userId) {
      console.error('❌ No user ID in token:', decoded);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token structure' 
      });
    }
    
    const query = { patient: userId };
    
    // Handle status filter (can be comma-separated)
    if (req.query.status) {
      const statuses = req.query.status.split(',');
      if (statuses.length > 1) {
        query.status = { $in: statuses };
      } else {
        query.status = statuses[0];
      }
      console.log('📊 Filtering by status:', query.status);
    }
    
    // Get appointments for this user
    console.log('📋 Fetching appointments for user:', userId, 'with query:', JSON.stringify(query));
    const appointments = await Appointment.find(query)
      .populate('doctor', 'firstName lastName specialization')
      .sort('-appointmentDate -appointmentTime');
    
    console.log('✅ Found appointments:', appointments.length);
    res.json({
      success: true,
      data: { appointments }
    });
  } catch (error) {
    console.error('❌ Appointments error:', error.message, error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message
    });
  }
};
