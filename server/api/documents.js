// Standalone serverless function for documents
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
  console.log('🔵 Documents endpoint hit');
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
    
    console.log('📋 Fetching documents for patient:', patientId);
    
    const documents = await db.collection('documents')
      .find({ patient: new ObjectId(patientId) })
      .sort({ uploadDate: -1 })
      .limit(100)
      .toArray();
    
    // Populate uploadedBy field
    for (const doc of documents) {
      if (doc.uploadedBy) {
        const user = await db.collection('users').findOne(
          { _id: new ObjectId(doc.uploadedBy) },
          { projection: { firstName: 1, lastName: 1, role: 1 } }
        );
        if (user) doc.uploadedBy = user;
      }
    }
    
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
