# Doctor Portal API Documentation

## Overview

The Doctor Portal API provides secure, role-based access for healthcare professionals to manage patient records, treatment notes, and schedules. This implementation follows SOLID principles and includes comprehensive audit logging for compliance.

## Base URL
```
http://localhost:5000/api/doctor
```

## Authentication

All endpoints require:
- Valid JWT token in Authorization header: `Bearer <token>`
- User role must be `doctor`

## User Stories Implemented

### ✅ User Story 3: View Patient Medical History
**Endpoint:** `GET /patients/:patientId/medical-history`

### ✅ User Story 4: Add Treatment Notes
**Endpoint:** `POST /patients/:patientId/treatment-notes`

### ✅ User Story 5: Update Records with Audit Logging
**Endpoint:** `PUT /treatment-notes/:recordId`

### ✅ User Story 6: Manage Schedule
**Endpoint:** `PUT /availability`

### ✅ User Story 7: Check Available Slots
**Endpoint:** `GET /schedule`

---

## API Endpoints

### 1. Search Patients

Search for patients by digital health card ID or name.

**Endpoint:** `GET /patients/search`

**Query Parameters:**
- `q` (required): Search query (min 2, max 100 characters)

**Example Request:**
```bash
GET /api/doctor/patients/search?q=HC-1K2L3M4N5O
Authorization: Bearer <jwt_token>
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@email.com",
      "digitalHealthCardId": "HC-1K2L3M4N5O",
      "dateOfBirth": "1985-06-15T00:00:00.000Z",
      "gender": "male",
      "phone": "+1-555-0123"
    }
  ],
  "message": "Found 1 patient(s)"
}
```

---

### 2. Get Patient Medical History

Retrieve complete medical history for a specific patient.

**Endpoint:** `GET /patients/:patientId/medical-history`

**Path Parameters:**
- `patientId` (required): MongoDB ObjectId of the patient

**Example Request:**
```bash
GET /api/doctor/patients/64f8a1b2c3d4e5f6a7b8c9d0/medical-history
Authorization: Bearer <jwt_token>
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "patient": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "firstName": "John",
      "lastName": "Doe",
      "digitalHealthCardId": "HC-1K2L3M4N5O",
      "dateOfBirth": "1985-06-15T00:00:00.000Z",
      "gender": "male",
      "bloodType": "O+",
      "allergies": [
        {
          "allergen": "Penicillin",
          "severity": "severe"
        }
      ]
    },
    "medicalRecords": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
        "recordType": "consultation",
        "title": "Annual Checkup",
        "description": "Routine annual physical examination",
        "createdBy": {
          "firstName": "Dr. Sarah",
          "lastName": "Johnson",
          "specialization": "Internal Medicine"
        },
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "recentAppointments": [],
    "summary": {
      "totalRecords": 1,
      "lastVisit": null,
      "recordTypes": {
        "consultation": 1
      }
    }
  },
  "message": "Patient medical history retrieved successfully"
}
```

---

### 3. Add Treatment Note

Create a new treatment note for a patient.

**Endpoint:** `POST /patients/:patientId/treatment-notes`

**Path Parameters:**
- `patientId` (required): MongoDB ObjectId of the patient

**Request Body:**
```json
{
  "title": "Follow-up Consultation",
  "description": "Patient reports improvement in symptoms after prescribed treatment",
  "diagnosis": {
    "primary": "Hypertension, controlled",
    "secondary": ["Type 2 Diabetes"],
    "severity": "moderate"
  },
  "prescriptions": [
    {
      "medication": "Lisinopril",
      "dosage": "10mg",
      "frequency": "Once daily",
      "duration": "30 days",
      "instructions": "Take with food"
    }
  ],
  "vitalSigns": {
    "bloodPressure": {
      "systolic": 130,
      "diastolic": 85
    },
    "heartRate": 72,
    "temperature": 98.6,
    "weight": 180,
    "height": 175
  },
  "notes": "Patient responding well to current treatment plan",
  "followUp": {
    "required": true,
    "date": "2024-02-15T10:00:00.000Z",
    "instructions": "Return for blood pressure check"
  },
  "tags": ["hypertension", "follow-up"]
}
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
    "patient": "64f8a1b2c3d4e5f6a7b8c9d0",
    "recordType": "consultation",
    "title": "Follow-up Consultation",
    "description": "Patient reports improvement in symptoms after prescribed treatment",
    "createdAt": "2024-01-16T14:30:00.000Z"
  },
  "message": "Treatment note added successfully"
}
```

---

### 4. Update Treatment Note

Update an existing treatment note with audit logging.

**Endpoint:** `PUT /treatment-notes/:recordId`

**Path Parameters:**
- `recordId` (required): MongoDB ObjectId of the medical record

**Request Body:** (All fields optional for updates)
```json
{
  "title": "Updated Follow-up Consultation",
  "description": "Updated description with additional findings",
  "notes": "Patient shows continued improvement"
}
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
    "title": "Updated Follow-up Consultation",
    "description": "Updated description with additional findings",
    "version": 2,
    "updatedAt": "2024-01-16T15:45:00.000Z"
  },
  "message": "Treatment note updated successfully"
}
```

---

### 5. Get Doctor Schedule

Retrieve doctor's schedule and upcoming appointments.

**Endpoint:** `GET /schedule`

**Example Response:**
```json
{
  "success": true,
  "data": {
    "doctor": {
      "name": "Dr. Sarah Johnson",
      "availability": {
        "monday": {
          "enabled": true,
          "startTime": "09:00",
          "endTime": "17:00"
        },
        "tuesday": {
          "enabled": true,
          "startTime": "09:00",
          "endTime": "17:00"
        }
      }
    },
    "upcomingAppointments": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d3",
        "appointmentDate": "2024-01-17T10:00:00.000Z",
        "status": "confirmed",
        "patient": {
          "firstName": "John",
          "lastName": "Doe",
          "digitalHealthCardId": "HC-1K2L3M4N5O"
        }
      }
    ]
  },
  "message": "Schedule retrieved successfully"
}
```

---

### 6. Update Availability

Update doctor's weekly availability schedule.

**Endpoint:** `PUT /availability`

**Request Body:**
```json
{
  "monday": {
    "enabled": true,
    "startTime": "08:00",
    "endTime": "16:00"
  },
  "tuesday": {
    "enabled": true,
    "startTime": "09:00",
    "endTime": "17:00"
  },
  "wednesday": {
    "enabled": false
  }
}
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
    "availability": {
      "monday": {
        "enabled": true,
        "startTime": "08:00",
        "endTime": "16:00"
      }
    }
  },
  "message": "Availability updated successfully"
}
```

---

### 7. Get Dashboard

Retrieve doctor's dashboard summary.

**Endpoint:** `GET /dashboard`

**Example Response:**
```json
{
  "success": true,
  "data": {
    "doctor": {
      "name": "Dr. Sarah Johnson",
      "availability": { /* availability object */ }
    },
    "upcomingAppointments": [ /* appointments array */ ],
    "summary": {
      "todaysAppointments": 3,
      "totalUpcoming": 8,
      "lastLogin": "2024-01-16T08:30:00.000Z"
    }
  },
  "message": "Dashboard data retrieved successfully"
}
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [ /* validation errors if applicable */ ]
}
```

**Common HTTP Status Codes:**
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

---

## Security Features

### 🔒 **Audit Logging**
Every action is logged with:
- User ID and role
- Action performed
- Resource accessed
- IP address and user agent
- Timestamp
- Change details (for updates)

### 🛡️ **Input Validation**
- Comprehensive validation using express-validator
- XSS protection
- NoSQL injection prevention
- Parameter pollution protection

### 🔐 **Authentication & Authorization**
- JWT-based authentication
- Role-based access control
- Doctor role verification on all endpoints

### 📊 **Rate Limiting**
- 100 requests per 15 minutes per IP
- Configurable via environment variables

---

## Compliance Features

### HIPAA Compliance
- Complete audit trails
- Secure data transmission
- Access logging
- Data encryption support

### Data Retention
- Audit logs retained for 7 years
- Automatic cleanup via TTL indexes
- Version history for medical records

---

## Testing

Run the test suite:
```bash
cd server
npm test
```

Test specific endpoints:
```bash
npm run test:doctor
```

---

## Environment Variables

Required environment variables:
```env
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/urbancare
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```
