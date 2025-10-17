# Receptionist Portal - UrbanCare

## Overview
The Receptionist Portal provides front desk staff with comprehensive tools to manage patient registration, identity verification, and medical record creation.

## Features Implemented

### 1. **Patient Search**
- Search patients by:
  - Health Card ID (digitalHealthCardId)
  - Name (first name, last name)
  - Email address
  - Phone number
  - NIC number
- Real-time search results
- Select patient for further actions

### 2. **Identity Verification**
- Verify patient identity by Health Card ID
- Displays complete patient information:
  - Name
  - Health Card ID
  - Date of Birth
  - Gender
  - Contact information (phone, email)
- Shows identity verification status:
  - ✅ Verified
  - ⏳ Pending
  - ❌ Rejected
  - ⚠️ Unverified

### 3. **Medical Record Creation**
- Create medical records for patients
- Record types:
  - Consultation
  - Diagnosis
  - Treatment Plan
  - Lab Result
  - Prescription
- Form fields:
  - **Title** (required) - Brief description of the record
  - **Description** (required) - Detailed information
  - **Treatment Plan** - Specific treatment instructions
  - **Primary Diagnosis** - Main diagnosis
  - **Severity** - Mild, Moderate, Severe, Critical
- Auto-associates record with verified patient

## Login Credentials

### Receptionist Account
- **Email**: receptionist@urbancare.com
- **Password**: Receptionist123!
- **Role**: Receptionist
- **Name**: Front Desk

## Dashboard Sections

### Tab 1: Patient Search
- Search interface with advanced filtering
- Quick patient lookup
- View patient details
- Select patient for verification or record creation

### Tab 2: Verify Identity
- Health Card ID input field
- One-click identity verification
- Complete patient profile display
- Proceed to medical record creation

### Tab 3: Create Record
- Medical record creation form
- Multiple record types supported
- Required field validation
- Integration with patient medical history

## API Endpoints

### Search Patients
```
GET /api/users/search?query={searchTerm}&role=patient
Authorization: Bearer {token}
Roles: staff, manager, receptionist
```

### Verify Health Card
```
GET /api/users/verify-health-card/:healthCardId
Authorization: Bearer {token}
Roles: staff, manager, receptionist
```

### Create Medical Record
```
POST /api/medical-records
Authorization: Bearer {token}
Body: {
  patient: patientId,
  recordType: "consultation",
  title: "Record Title",
  description: "Detailed description",
  treatmentPlan: "Treatment details",
  diagnosis: {
    primary: "Primary diagnosis",
    severity: "moderate",
    secondary: []
  }
}
```

## Technical Details

### Frontend Components
- **File**: `client/src/pages/receptionist/ReceptionistDashboard.js`
- **State Management**: React hooks (useState, useEffect)
- **API Integration**: Axios with authentication interceptors
- **UI Framework**: Tailwind CSS
- **Icons**: Heroicons

### Backend Routes
- **File**: `server/routes/users.js`
- **New Endpoints**:
  - `/api/users/search` - Patient search
  - `/api/users/verify-health-card/:healthCardId` - Identity verification
- **Authorization**: Role-based middleware (receptionist, staff, manager)

### Database Model
- **File**: `server/models/User.js`
- **Updated**: Added 'receptionist' to role enum
- **Roles**: patient, doctor, staff, manager, receptionist

## Workflow

### 1. Patient Check-In Workflow
```
1. Patient arrives at front desk
2. Receptionist logs in to dashboard
3. Search patient by Health Card ID or name
4. Verify patient identity
5. View patient status and verification
6. Proceed to create medical record if needed
```

### 2. New Patient Registration
```
1. Patient provides Health Card ID
2. Receptionist enters Health Card ID in Verify Identity tab
3. If not found, system shows error
4. Receptionist can guide patient to registration
5. After registration, patient can be verified
```

### 3. Medical Record Entry from Doctor
```
1. Doctor provides treatment notes on paper
2. Receptionist selects/verifies patient
3. Receptionist opens Create Record tab
4. Enters record type, title, and description
5. Adds treatment plan and diagnosis
6. Submits record - saves to patient's medical history
7. Doctor can view record in their portal
```

## Navigation

### Routes
- `/receptionist/dashboard` - Main receptionist dashboard

### Navbar Links
- Home
- Dashboard
- About

### Tab Navigation
- Patient Search
- Verify Identity
- Create Record

## Security

### Role-Based Access Control
- Only authenticated users with 'receptionist' role can access
- JWT token required for all API calls
- Protected routes with middleware authorization
- Session management through AuthContext

### Data Protection
- Patient information protected by authentication
- Medical records require patient consent
- Audit trail maintained for all actions
- Sensitive data encrypted in transit

## Integration Points

### With Patient Portal
- Receptionists can verify patient identity status
- View patient's NIC verification status
- Access patient contact information

### With Doctor Portal
- Medical records created by receptionist visible to doctors
- Doctors can edit and enhance receptionist-created records
- Treatment plans synchronized across portals

### With Manager Portal
- Managers can monitor receptionist activities
- Audit logs track receptionist actions
- Reports include receptionist-created records

## Future Enhancements

### Planned Features
1. **Appointment Scheduling**
   - Create appointments for patients
   - View doctor availability
   - Manage appointment queue

2. **Payment Processing**
   - Collect consultation fees
   - Issue receipts
   - Track payment status

3. **Document Scanning**
   - Upload patient documents
   - Scan prescriptions
   - Attach lab reports

4. **Waiting Room Management**
   - Check-in system
   - Queue management
   - Notify doctors of patient arrival

5. **Insurance Verification**
   - Verify insurance coverage
   - Check eligibility
   - Pre-authorization requests

6. **Patient Communication**
   - Send appointment reminders
   - SMS notifications
   - Email confirmations

## Usage Instructions

### How to Login as Receptionist
1. Navigate to https://urbancare.com/login
2. Enter email: receptionist@urbancare.com
3. Enter password: Receptionist123!
4. Click "Login"
5. Redirects to receptionist dashboard

### How to Search for a Patient
1. Click "Patient Search" tab
2. Enter search query (Health Card ID, name, email, or phone)
3. Press Enter or click "Search" button
4. View results below
5. Click on patient card to select
6. Click "Select" button to proceed

### How to Verify Patient Identity
1. Click "Verify Identity" tab
2. Enter patient's Health Card ID (format: HC25XXXXXX)
3. Press Enter or click "Verify" button
4. System displays patient information if found
5. Review patient details for accuracy
6. Click "Proceed to Create Medical Record" if needed

### How to Create a Medical Record
1. Ensure a patient is selected (search or verify first)
2. Click "Create Record" tab
3. Select record type from dropdown
4. Enter title (required) - Brief description
5. Enter description (required) - Detailed information
6. Add treatment plan (optional)
7. Enter primary diagnosis (optional)
8. Select severity level
9. Click "Create Medical Record"
10. Success message confirms creation

## Troubleshooting

### Common Issues

**Issue**: Can't login as receptionist
- **Solution**: Ensure you're using receptionist@urbancare.com and Receptionist123!
- Check if account is active and email is verified

**Issue**: Search returns no results
- **Solution**: Check spelling of search query
- Try searching by different criteria (name, email, phone)
- Ensure patient exists in database

**Issue**: Health Card verification fails
- **Solution**: Verify Health Card ID format (HC25XXXXXX)
- Check if patient has a Health Card ID assigned
- Contact admin if patient record is missing

**Issue**: Can't create medical record
- **Solution**: Ensure patient is selected first
- Fill in all required fields (title, description)
- Check authorization - must be logged in as receptionist

**Issue**: Dashboard not loading
- **Solution**: Clear browser cache
- Check network connection
- Ensure server is running on port 5000
- Verify token is not expired

## Technical Support

### Development Team Contacts
- **Backend Issues**: Check server logs in `server/` directory
- **Frontend Issues**: Check browser console for errors
- **Database Issues**: Verify MongoDB connection

### Logs Location
- Server logs: Terminal running `npm start` in `server/`
- Client logs: Browser Developer Tools > Console
- MongoDB logs: MongoDB Atlas dashboard or local MongoDB logs

## Version History

### Version 1.0.0 (Current)
- ✅ Initial release
- ✅ Patient search functionality
- ✅ Identity verification by Health Card ID
- ✅ Medical record creation
- ✅ Role-based access control
- ✅ Integration with existing portals

### Upcoming Version 1.1.0
- ⏳ Appointment scheduling
- ⏳ Payment processing
- ⏳ Document scanning
- ⏳ Waiting room management

## Notes
- This portal is part of the UrbanCare healthcare management system
- Requires active internet connection
- Best viewed in modern browsers (Chrome, Firefox, Edge)
- Mobile-responsive design
- Adheres to healthcare data privacy regulations
