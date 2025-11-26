// Standalone serverless function for /api/documents
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

let cachedDb = null;
let Document = null;
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
    
    if (!User) {
      User = require('../models/User');
    }
    if (!Document) {
      Document = require('../models/Document');
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
  console.log('🔵 Documents endpoint hit');
  console.log('URL:', req.url);
  setCorsHeaders(req, res);
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed' });

  try {
    await connectToDatabase();
    
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      console.error('❌ No token provided');
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      console.error('❌ JWT verification failed:', jwtError.message);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired token'
      });
    }
    
    const userId = decoded.id || decoded.userId;
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token structure' 
      });
    }
    
    // Extract patientId from URL path (e.g., /api/documents/patient/123)
    const urlParts = req.url.split('/');
    const patientIndex = urlParts.indexOf('patient');
    const patientId = patientIndex !== -1 ? urlParts[patientIndex + 1]?.split('?')[0] : null;
    
    console.log('📋 Fetching documents for patient:', patientId || userId);
    
    // Find documents by patient ID
    const documents = await Document.find({ 
      patient: patientId || userId 
    })
    .populate('uploadedBy', 'firstName lastName role')
    .sort('-uploadDate')
    .limit(100);
    
    console.log('✅ Found documents:', documents.length);
    res.json({
      success: true,
      count: documents.length,
      data: { documents }
    });
  } catch (error) {
    console.error('❌ Documents error:', error.message, error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message
    });
  }
};
