// Standalone serverless function for /api/doctors (maps to /users/doctors via rewrite)
const { MongoClient } = require('mongodb');

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
  console.log('🔵 Doctors endpoint hit');
  console.log('Query params:', req.query);
  setCorsHeaders(req, res);
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed' });

  try {
    const { db } = await connectToDatabase();
    
    // Build query for active doctors
    const { specialization, department, search } = req.query;
    let query = { role: 'doctor', isActive: true };
    
    if (specialization) {
      query.specialization = { $regex: specialization, $options: 'i' };
    }
    
    if (department) {
      query.department = { $regex: department, $options: 'i' };
    }
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { specialization: { $regex: search, $options: 'i' } }
      ];
    }
    
    console.log('📋 Fetching doctors with query:', JSON.stringify(query));
    
    const doctors = await db.collection('users')
      .find(query)
      .project({ password: 0, sessionTokens: 0, __v: 0 })
      .sort({ firstName: 1 })
      .limit(100)
      .toArray();
    
    console.log('✅ Found doctors:', doctors.length);
    
    res.json({
      success: true,
      count: doctors.length,
      data: { doctors }
    });
  } catch (error) {
    console.error('❌ Doctors error:', error.message, error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message
    });
  }
};
