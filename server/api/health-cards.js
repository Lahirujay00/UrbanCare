// Standalone serverless function for health-cards
const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }
  
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI not set');
  
  try {
    const client = new MongoClient(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    
    await client.connect();
    const db = client.db();
    
    cachedClient = client;
    cachedDb = db;
    
    console.log('✅ MongoDB connected');
    return { client, db };
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
  console.log('🔵 Health cards endpoint hit');
  console.log('Query params:', req.query);
  setCorsHeaders(req, res);
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed' });

  try {
    const { db } = await connectToDatabase();
    
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      console.error('❌ No token provided');
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
    
    // Get patientId from query parameter (from rewrite) or use userId
    const patientId = req.query.patientId || userId;
    
    console.log('📋 Fetching health card for patient:', patientId);
    
    const healthCard = await db.collection('healthcards').findOne({ 
      patient: new ObjectId(patientId)
    });
    
    if (!healthCard) {
      console.log('⚠️ No health card found');
      return res.json({
        success: true,
        data: { healthCard: null }
      });
    }
    
    // Populate patient details
    const patient = await db.collection('users').findOne(
      { _id: new ObjectId(patientId) },
      { projection: { firstName: 1, lastName: 1, dateOfBirth: 1, gender: 1, email: 1, phone: 1 } }
    );
    
    if (patient) {
      healthCard.patient = patient;
    }
    
    console.log('✅ Found health card:', healthCard.cardNumber);
    res.json({
      success: true,
      data: { healthCard }
    });
  } catch (error) {
    console.error('❌ Health cards error:', error.message, error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message
    });
  }
};
