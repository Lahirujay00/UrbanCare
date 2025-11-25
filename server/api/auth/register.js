// Standalone serverless function for user registration
const mongoose = require('mongoose');
const crypto = require('crypto');

// Import models
const User = require('../../models/User');

// Cached database connection
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI not set');
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    cachedDb = mongoose.connection;
    console.log('✅ MongoDB connected');
    return cachedDb;
  } catch (err) {
    console.error('❌ MongoDB error:', err.message);
    throw err;
  }
}

// CORS headers
const allowedOrigins = [
  'https://urban-care-front.vercel.app',
  'http://localhost:3000'
];

function setCorsHeaders(req, res) {
  const origin = req.headers.origin || req.headers.Origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

module.exports = async (req, res) => {
  console.log('🔵 Register endpoint hit');
  
  // Set CORS headers
  setCorsHeaders(req, res);

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    // Connect to database
    await connectToDatabase();

    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      role = 'patient',
      dateOfBirth,
      gender,
      bloodType,
      address,
      emergencyContact,
      specialization,
      department,
      licenseNumber
    } = req.body;

    // Basic validation
    if (!firstName || !lastName || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: firstName, lastName, email, password, phone'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Password validation
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create user data
    const userData = {
      firstName,
      lastName,
      email,
      password,
      phone,
      role,
      address
    };

    // Add role-specific fields
    if (role === 'patient') {
      if (!dateOfBirth || !gender) {
        return res.status(400).json({
          success: false,
          message: 'Date of birth and gender are required for patients'
        });
      }
      userData.dateOfBirth = dateOfBirth;
      userData.gender = gender;
      if (bloodType) userData.bloodType = bloodType;
      if (emergencyContact) userData.emergencyContact = emergencyContact;
    }

    if (role === 'doctor') {
      if (specialization) userData.specialization = specialization;
      if (department) userData.department = department;
      if (licenseNumber) userData.licenseNumber = licenseNumber;
      userData.profileComplete = !!(specialization && department && licenseNumber);
    }

    // Create user
    const user = await User.create(userData);

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = crypto
      .createHash('sha256')
      .update(emailVerificationToken)
      .digest('hex');
    user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;

    await user.save();

    // Generate tokens
    const token = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();

    // Remove password
    user.password = undefined;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        token,
        refreshToken
      }
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
