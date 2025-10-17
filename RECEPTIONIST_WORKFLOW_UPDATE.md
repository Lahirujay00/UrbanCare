# Receptionist Workflow Update

## Overview
Updated the receptionist portal to match the correct medical record workflow where receptionists only upload documents to existing doctor treatment plans instead of creating new medical records.

## Changes Made

### 1. Tab Name Changed
- **Old:** "Create Record"
- **New:** "Upload Lab Tests"

### 2. Workflow Redesign
#### Previous Workflow (Incorrect):
- Receptionist could create full medical records with:
  - Record type, title, description
  - Treatment plan details
  - Diagnosis and severity
  - Upload documents

#### New Workflow (Correct):
1. Doctor creates treatment plan during patient visit
2. Receptionist searches for patient
3. Receptionist views list of recent doctor treatment plans
4. Receptionist selects the specific treatment plan for the current visit
5. Receptionist ONLY uploads lab test documents to that existing plan

### 3. UI Changes

#### Before:
- Full form with inputs for creating medical records
- Patient selection → Fill form → Upload documents

#### After:
- Patient selection → View doctor's treatment plans → Upload documents
- Shows treatment plans with:
  - **Recent visit indicator** (within last 7 days - green highlight)
  - Doctor's diagnosis, treatment plan, prescriptions
  - Lab tests ordered by doctor
  - Existing uploaded documents
  - Document upload section for each visit

### 4. Features Added
- **Recent Visit Badge:** Treatment plans created in the last 7 days are highlighted with "Recent Visit" badge
- **Documents Status:** Shows which treatment plans already have documents vs. need documents
- **Read-Only Treatment Details:** Receptionist can view but not edit doctor's medical content
- **Per-Visit Upload:** Upload documents directly to specific treatment plan
- **Instant Refresh:** Medical history refreshes after document upload

### 5. Code Changes

#### Removed:
- `medicalRecordForm` state (no longer needed)
- `createMedicalRecord` function (receptionists can't create records)
- Full medical record creation form UI
- All input fields for diagnosis, treatment plan, etc.

#### Updated:
- `uploadDocuments` function now:
  - Shows loading state
  - Better error handling
  - Auto-refreshes medical history after upload
  - Validates file selection

#### Kept:
- Patient search functionality
- Identity verification tab
- NIC document viewing
- File selection and validation (5MB limit, PDF/JPG/PNG)
- Document upload to medical records

### 6. User Experience Improvements
1. **Visual Indicators:**
   - 🟢 Green background for recent visits (last 7 days)
   - ⚪ Gray background for older visits
   - ✅ Green badges for visits with documents
   - 🔴 Clear "Recent Visit" animated pulse badge

2. **Information Display:**
   - Doctor name and visit timestamp
   - Treatment plan details (read-only)
   - Diagnosis with severity indicator
   - Prescriptions with dosage
   - Lab tests ordered
   - List of already uploaded documents with download links

3. **Workflow Clarity:**
   - Clear instructions: "Select a treatment plan to upload lab test documents"
   - Empty state message when no treatment plans found
   - Patient selection required before viewing plans

## Backend Support
Already implemented:
- `GET /api/medical-records/patient/:patientId` - Fetch all patient treatment plans
- `POST /api/medical-records/:id/documents` - Upload documents to existing record
- Authorization includes 'receptionist' role on both endpoints

## Benefits
1. **Data Integrity:** Prevents duplicate medical records for single visits
2. **Clear Responsibility:** Doctor creates medical content, receptionist adds supporting documents
3. **Workflow Efficiency:** Easy to find recent visits and upload test results
4. **Better Organization:** One visit = One medical record with complete documentation
5. **Reduced Errors:** No medical form filling by non-medical staff

## Usage Instructions for Receptionists
1. Select patient from search tab
2. Go to "Upload Lab Tests" tab
3. View list of doctor's treatment plans (recent ones highlighted)
4. Select the treatment plan for today's visit
5. Click the upload area under that specific treatment plan
6. Select lab test files (X-rays, blood tests, reports)
7. Click "Upload Documents to this Visit"
8. Documents are immediately attached to doctor's treatment plan

## Technical Details
- File upload: Up to 10 files, max 5MB each
- Supported formats: PDF, JPG, JPEG, PNG
- Storage path: `server/uploads/documents/`
- Naming pattern: `medical-doc-{timestamp}-{random}.{ext}`
- Auto-cleanup on upload errors
