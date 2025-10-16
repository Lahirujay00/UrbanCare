const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const compression = require('compression');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const appointmentRoutes = require('./routes/appointments');
const medicalRecordRoutes = require('./routes/medicalRecords');
const reportRoutes = require('./routes/reports');
const paymentRoutes = require('./routes/payments');
const healthCardRoutes = require('./routes/healthCards');
const documentRoutes = require('./routes/documents');
const refundRoutes = require('./routes/refunds');
const chatbotRoutes = require('./routes/chatbot');
const doctorRoutes = require('./routes/doctor');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

const app = express();
const server = createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Make io accessible to routes
app.set('io', io);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('✅ MongoDB connected successfully');

  // Auto-setup admin user if it doesn't exist
  try {
    const User = require('./models/User');

    const existingAdmin = await User.findOne({ email: 'admin@urbancare.com' });
    if (!existingAdmin) {
      const adminUser = new User({
        firstName: 'System',
        lastName: 'Administrator',
        email: 'admin@urbancare.com',
        password: 'Admin123!', // Plain password - will be hashed by pre-save middleware
        phone: '+1-555-0100',
        role: 'admin',
        isActive: true,
        isEmailVerified: true,
        address: {
          street: '123 Admin Street',
          city: 'Healthcare City',
          state: 'HC',
          zipCode: '12345',
          country: 'USA'
        }
      });

      await adminUser.save();
      console.log('✅ Default admin user created automatically');
      console.log('📧 Email: admin@urbancare.com');
      console.log('🔑 Password: Admin123!');
    }
  } catch (error) {
    console.error('❌ Error auto-creating admin user:', error.message);
  }
})
.catch((err) => console.error('❌ MongoDB connection error:', err));

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.stripe.com"]
    }
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp());

// Compression middleware
app.use(compression());

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'UrbanCare API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

app.get('/favicon.ico', (req, res) => res.status(204).end());
app.get('/logo192.png', (req, res) => res.status(204).end());
app.get('/manifest.json', (req, res) => res.status(204).end());
app.get('/*.hot-update.json', (req, res) => res.status(204).end());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/medical-records', medicalRecordRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/health-cards', healthCardRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/refunds', refundRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/doctor', doctorRoutes);

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`👤 User connected: ${socket.id}`);
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`👤 User ${userId} joined their room`);
  });

  // Handle appointment notifications
  socket.on('appointment-update', (data) => {
    // Emit to specific user
    io.to(data.userId).emit('notification', {
      type: 'appointment',
      message: data.message,
      timestamp: new Date()
    });
  });

  socket.on('disconnect', () => {
    console.log(`👤 User disconnected: ${socket.id}`);
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
  console.log(`📊 Health Check: http://localhost:${PORT}/health`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`❌ Unhandled Rejection: ${err.message}`);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log(`❌ Uncaught Exception: ${err.message}`);
  process.exit(1);
});

module.exports = app;