# UrbanCare - Smart Healthcare System

A comprehensive Smart Healthcare Management System built with the MERN stack for urban hospitals.

## 🏥 Overview

UrbanCare digitalizes hospital services, enabling patients to manage appointments and medical records while providing healthcare staff and managers with efficient tools for patient management, reporting, and analytics.

## 🚀 Features

### Patient Features
- 🏥 Digital Health Card for secure identification
- 📅 Real-time appointment booking with integrated payments
- 📋 Medical record access (history, prescriptions, lab reports)
- 👤 Profile management with emergency contacts
- 🔔 Notifications and reminders

### Healthcare Staff Features
- 🔍 Patient record access via digital health card validation
- ✏️ Treatment notes and prescription updates
- ✅ Appointment verification and payment confirmation

### Manager/Admin Features
- 📊 Comprehensive reporting and analytics
- 👥 User and role management
- 🖥️ System monitoring and audit tracking

## 🛠️ Tech Stack

- **Frontend**: React.js + Tailwind CSS
- **Backend**: Node.js + Express.js
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT + Role-based Access Control
- **Payments**: Stripe/PayPal integration
- **Real-time**: Socket.io
- **Deployment**: Docker + CI/CD

## 📁 Project Structure

```
UrbanCare/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API services
│   │   ├── store/         # State management
│   │   ├── utils/         # Utility functions
│   │   └── styles/        # Tailwind CSS
│   └── package.json
├── server/                # Node.js backend
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Custom middleware
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── utils/            # Utility functions
│   ├── config/           # Configuration files
│   └── package.json
├── shared/               # Shared utilities
├── docs/                 # Documentation
└── README.md
```

## 🏃‍♂️ Quick Start

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas account (or local MongoDB)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd UrbanCare
   ```

2. **Install dependencies**
   ```bash
   # Install all dependencies (root, server, and client)
   npm run install-all
   
   # Or install individually:
   npm install
   cd server && npm install
   cd ../client && npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment files
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```

4. **Database Setup**
   - The project is configured to use MongoDB Atlas
   - Update the `MONGODB_URI` in `server/.env` with your connection string
   - Current format: `mongodb+srv://username:password@cluster.mongodb.net/urbancare`

5. **Run the application**
   ```bash
   # Run both server and client concurrently
   npm run dev
   
   # Or run individually:
   npm run server  # Starts backend on port 5000
   npm run client  # Starts frontend on port 3000
   ```

## 🔧 Development

### Available Scripts

**Server:**
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run seed` - Seed database with sample data

**Client:**
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run lint` - Run ESLint

### Environment Variables

**Server (.env):**
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/urbancare
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
STRIPE_SECRET_KEY=your_stripe_secret
EMAIL_SERVICE=your_email_service
```

**Client (.env):**
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_STRIPE_PUBLIC_KEY=your_stripe_public_key
```

## 🏗️ Architecture

### Frontend Architecture
- **React** with functional components and hooks
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Context API** for state management
- **Axios** for API calls

### Backend Architecture
- **Express.js** REST API
- **MongoDB** with Mongoose ODM
- **JWT** authentication middleware
- **Role-based authorization**
- **Input validation** with Joi
- **Error handling** middleware

### Database Schema
- **Users** (patients, doctors, staff, managers, admins)
- **Appointments** with real-time availability
- **MedicalRecords** with encrypted sensitive data
- **Payments** transaction tracking
- **AuditLogs** for compliance

## 🔐 Security

- JWT-based authentication
- Role-based access control (RBAC)
- Field-level encryption for sensitive data
- Input validation and sanitization
- Rate limiting and DDoS protection
- HIPAA/GDPR compliance measures

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - User logout

### Appointments
- `GET /api/appointments` - Get user appointments
- `POST /api/appointments` - Book appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment

### Medical Records
- `GET /api/medical-records` - Get patient records
- `POST /api/medical-records` - Create record
- `PUT /api/medical-records/:id` - Update record

### Reports (Admin/Manager only)
- `GET /api/reports/dashboard` - Dashboard statistics
- `GET /api/reports/appointments` - Appointment reports
- `GET /api/reports/revenue` - Revenue reports

## 🧪 Testing

Run tests with:
```bash
# Server tests
cd server && npm test

# Client tests
cd client && npm test
```

## 🚀 Deployment

### Production Deployment
1. Build the React app: `cd client && npm run build`
2. Set production environment variables
3. Deploy to your preferred cloud platform (AWS, GCP, Azure, Heroku)
4. Ensure MongoDB Atlas is accessible from your production environment
5. Update CORS settings to allow your production domain

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions, please contact the development team or create an issue in the repository.

---

**Built with ❤️ for better healthcare management**