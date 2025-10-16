# Smart Healthcare System - Receptionist Module

## Overview

This module provides a secure backend system for hospital receptionists to verify patient identity, view records, and update limited patient information based on the UC03: Patient Identification and Record Access use case.

## Features

- ✅ Secure JWT-based receptionist authentication
- ✅ Patient identity validation via digital health card ID
- ✅ View comprehensive patient information
- ✅ Update non-sensitive patient details (contact number, visit reason)
- ✅ Comprehensive activity logging
- ✅ Error handling for invalid card IDs and system errors
- ✅ Input validation and sanitization

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (JSON Web Tokens)
- **Security:** bcrypt for password hashing, helmet, xss-clean, express-mongo-sanitize
- **Environment:** dotenv

## Project Structure

```
server/
 ├── server.js                          # Main application entry point
 ├── seed.js                            # Database seeding script
 ├── config/
 │    └── db.js                         # MongoDB connection configuration
 ├── middleware/
 │    ├── authMiddleware.js             # JWT authentication middleware
 │    └── errorMiddleware.js            # Global error handling
 ├── models/
 │    ├── Receptionist.js               # Receptionist schema
 │    ├── Patient.js                    # Patient schema with health card
 │    └── Log.js                        # Activity logging schema
 ├── routes/
 │    ├── authRoutes.js                 # Authentication routes
 │    ├── patientRoutes.js              # Patient management routes
 │    └── logRoutes.js                  # Activity log routes
 └── controllers/
      ├── authController.js             # Authentication logic
      ├── patientController.js          # Patient management logic
      └── logController.js              # Log management logic
```

## Environment Variables

Create a `.env` file in the server directory:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/urbancare

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production

# Client URL (for CORS)
CLIENT_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Installation

1. **Navigate to server directory:**

   ```bash
   cd server
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Setup environment variables:**

   - Copy `.env.example` to `.env`
   - Update the values according to your environment

4. **Seed the database:**
   ```bash
   node seed.js
   ```

## Database Seeding

The seeding script (`seed.js`) populates the database with sample data for testing:

### Run the seeder:

```bash
node seed.js
```

### Sample Data Created:

**Receptionists:**

- Kavindu Perera (kavindu@hospital.lk) - Password: 123456
- Sithmi Fernando (sithmi@hospital.lk) - Password: 654321

**Patients (5 sample records):**

- HC2025001 - Nimal Perera
- HC2025002 - Sanduni Wijesinghe
- HC2025003 - Rajith Fernando
- HC2025004 - Dilini Amarasinghe
- HC2025005 - Chandana Gunasekara

**Activity Logs:** 5 sample log entries

## API Endpoints

### Base URL: `http://localhost:5000/api/receptionist`

### Authentication

#### 1. Login Receptionist

```http
POST /auth/login
Content-Type: application/json

{
  "email": "kavindu@hospital.lk",
  "password": "123456"
}

Response (200 OK):
{
  "success": true,
  "data": {
    "id": "64f7a1b2c3d4e5f6g7h8i9j0",
    "name": "Kavindu Perera",
    "email": "kavindu@hospital.lk",
    "employeeId": "REC001",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 2. Get Current Receptionist

```http
GET /auth/me
Authorization: Bearer <token>

Response (200 OK):
{
  "success": true,
  "data": {
    "id": "64f7a1b2c3d4e5f6g7h8i9j0",
    "name": "Kavindu Perera",
    "email": "kavindu@hospital.lk",
    "employeeId": "REC001",
    "isActive": true
  }
}
```

### Patient Management

#### 3. Get Patient by Card ID

```http
GET /patients/:cardId
Authorization: Bearer <token>

Example: GET /patients/HC2025001

Response (200 OK):
{
  "success": true,
  "data": {
    "_id": "64f7a1b2c3d4e5f6g7h8i9j0",
    "cardId": "HC2025001",
    "name": "Nimal Perera",
    "age": 45,
    "gender": "Male",
    "contactNumber": "+94 77 123 4567",
    "bloodType": "O+",
    "allergies": ["Penicillin", "Pollen"],
    "prescriptions": [...],
    "appointments": [...],
    "visitReason": "Diabetes management",
    "emergencyContact": {...}
  }
}

Error Responses:
- 404: Patient not found
- 409: Multiple matches found
- 401: Unauthorized (invalid/missing token)
```

#### 4. Update Patient Details

```http
PUT /patients/update/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "contactNumber": "+94 77 123 9999",
  "visitReason": "Routine checkup"
}

Response (200 OK):
{
  "success": true,
  "message": "Patient information updated successfully",
  "data": { ... }
}
```

#### 5. Get All Patients

```http
GET /patients
Authorization: Bearer <token>

Response (200 OK):
{
  "success": true,
  "count": 5,
  "data": [...]
}
```

### Activity Logs

#### 6. Get Recent Logs

```http
GET /logs?limit=50&page=1
Authorization: Bearer <token>

Query Parameters:
- limit: Number of records per page (default: 50)
- page: Page number (default: 1)
- receptionistId: Filter by receptionist
- action: Filter by action type

Response (200 OK):
{
  "success": true,
  "count": 50,
  "total": 150,
  "page": 1,
  "pages": 3,
  "data": [
    {
      "_id": "...",
      "receptionistName": "Kavindu Perera",
      "patientCardId": "HC2025001",
      "action": "Viewed patient record",
      "details": "Accessed record for Nimal Perera",
      "timestamp": "2025-01-15T09:30:00.000Z"
    }
  ]
}
```

#### 7. Get Logs for Specific Patient

```http
GET /logs/patient/:cardId
Authorization: Bearer <token>

Example: GET /logs/patient/HC2025001

Response (200 OK):
{
  "success": true,
  "count": 3,
  "patientCardId": "HC2025001",
  "data": [...]
}
```

#### 8. Get Current Receptionist's Logs

```http
GET /logs/me
Authorization: Bearer <token>

Response (200 OK):
{
  "success": true,
  "count": 25,
  "data": [...]
}
```

## Security Features

1. **JWT Authentication:** All protected routes require valid JWT token
2. **Password Hashing:** bcrypt with salt rounds for secure password storage
3. **Input Validation:** Mongoose schema validation for all inputs
4. **Query Sanitization:** Protection against NoSQL injection attacks
5. **XSS Protection:** Clean user input to prevent cross-site scripting
6. **Rate Limiting:** Prevent brute force attacks
7. **CORS:** Configured for specific frontend origin
8. **Helmet:** Security headers for HTTP responses

## Error Handling

The API uses standard HTTP status codes and provides detailed error messages:

```javascript
// Success Response
{
  "success": true,
  "data": { ... }
}

// Error Response
{
  "success": false,
  "message": "Error description"
}
```

### Common Status Codes:

- **200:** Success
- **400:** Bad Request (validation error)
- **401:** Unauthorized (invalid/missing token)
- **404:** Not Found
- **409:** Conflict (multiple matches)
- **500:** Internal Server Error

## Activity Logging

All receptionist actions are automatically logged with:

- Receptionist ID and name
- Patient Card ID and ID
- Action type
- Timestamp
- Additional details
- IP address

### Log Action Types:

- `Viewed patient record`
- `Updated patient contact`
- `Updated visit reason`
- `Patient search - not found`
- `Patient search - multiple matches`
- `Login successful`
- `Login failed`

## Testing with Postman/Thunder Client

### Setup:

1. Import the API endpoints
2. Create an environment variable for `baseURL`: `http://localhost:5000/api/receptionist`
3. Create an environment variable for `token`

### Testing Flow:

1. **Login:** POST to `/auth/login` with credentials
2. **Copy Token:** Save the token from response
3. **Search Patient:** GET `/patients/HC2025001` with Bearer token
4. **Update Patient:** PUT `/patients/update/{id}` with Bearer token
5. **Check Logs:** GET `/logs/me` to see your activity

## Integration with React Frontend

The backend is designed to integrate seamlessly with the React frontend:

```javascript
// Example API calls from React
import axios from "axios";

const API_BASE = "http://localhost:5000/api/receptionist";

// Login
const login = async (email, password) => {
  const response = await axios.post(`${API_BASE}/auth/login`, {
    email,
    password,
  });
  localStorage.setItem("token", response.data.data.token);
  return response.data;
};

// Get patient by card ID
const getPatient = async (cardId) => {
  const token = localStorage.getItem("token");
  const response = await axios.get(`${API_BASE}/patients/${cardId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Update patient
const updatePatient = async (id, updates) => {
  const token = localStorage.getItem("token");
  const response = await axios.put(
    `${API_BASE}/patients/update/${id}`,
    updates,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};
```

## Running the Server

### Development Mode:

```bash
npm run dev
```

### Production Mode:

```bash
npm start
```

### Check Server Health:

```bash
curl http://localhost:5000/health
```

## Monitoring & Logs

- **Morgan:** HTTP request logging in development mode
- **Console Logs:** Connection status, errors, and important events
- **Database Logs:** All receptionist activities stored in Log collection

## Future Enhancements

- [ ] Email notifications for suspicious activities
- [ ] Two-factor authentication for receptionists
- [ ] Patient photo verification
- [ ] Audit trail export functionality
- [ ] Real-time activity dashboard
- [ ] Role-based permissions (senior receptionist vs junior)
- [ ] Bulk patient operations
- [ ] Advanced search filters

## Support

For issues or questions:

- Check the logs in MongoDB
- Review the error messages
- Ensure JWT token is valid
- Verify environment variables are set correctly

## License

MIT License - See LICENSE file for details

---

**Created for:** Smart Healthcare System - UC03: Patient Identification and Record Access  
**Version:** 1.0.0  
**Last Updated:** January 2025
