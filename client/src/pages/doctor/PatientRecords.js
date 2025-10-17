import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  DocumentTextIcon, 
  UserIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  FunnelIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  PlusIcon,
  ClockIcon,
  PhoneIcon,
  EnvelopeIcon,
  ArrowLeftIcon,
  BeakerIcon,
  ShieldExclamationIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const PatientRecords = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [patientProfile, setPatientProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [showTreatmentPlanModal, setShowTreatmentPlanModal] = useState(false);
  const [showViewRecordModal, setShowViewRecordModal] = useState(false);
  const [showEditRecordModal, setShowEditRecordModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editFormData, setEditFormData] = useState({
    diagnosis: '',
    treatment: '',
    notes: '',
    priority: 'normal',
    medications: [],
    allergies: [],
    conditions: [],
    followUpDate: ''
  });
  const [treatmentPlanData, setTreatmentPlanData] = useState({
    appointmentId: '',
    diagnosis: '',
    treatment: '',
    notes: '',
    medications: [],
    allergies: [],
    conditions: [],
    followUpDate: '',
    priority: 'normal'
  });
  const [formErrors, setFormErrors] = useState({});
  
  const patientId = searchParams.get('patientId');

  useEffect(() => {
    if (patientId) {
      fetchPatientProfile();
    } else {
      setError('No patient ID provided');
      setLoading(false);
    }
  }, [patientId]);

  const fetchPatientProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/doctor/patients/${patientId}/profile`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      const data = await response.json();
      setPatientProfile(data.data);
      
    } catch (error) {
      console.error('Error fetching patient profile:', error);
      setError(`Unable to load patient profile: ${error.message}`);
    }
    
    // Always try to fetch documents, even if profile fails
    try {
      console.log('Fetching documents for patient:', patientId);
      await fetchPatientDocuments();
    } catch (docError) {
      console.error('Error fetching documents:', docError);
      // Don't set main error for document fetch failure
    }
    
    setLoading(false);
  };

  const fetchPatientDocuments = async () => {
    try {
      const response = await fetch(`/api/documents/patient/${patientId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Documents API response:', data);
        console.log('Document URLs:', data.data?.documents?.map(doc => doc.fileUrl));
        setDocuments(data.data?.documents || []);
      } else {
        console.error('Failed to fetch patient documents:', response.status, response.statusText);
        setDocuments([]);
      }
    } catch (error) {
      console.error('Error fetching patient documents:', error);
      setDocuments([]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-48 mx-auto mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error || !patientProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Patient</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/doctor')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const patient = patientProfile.patient;
  const medicalRecords = patientProfile.medicalRecords;
  const appointments = patientProfile.appointments;
  const alerts = patientProfile.alerts;

  // Mock patient records data for fallback
  const patientRecords = [
    {
      id: 1,
      name: 'Sarah Johnson',
      age: 28,
      gender: 'Female',
      bloodType: 'O+',
      phone: '+1 (555) 123-4567',
      email: 'sarah.johnson@email.com',
      address: '123 Main St, City, State 12345',
      emergencyContact: 'John Johnson - +1 (555) 123-4568',
      allergies: ['Penicillin', 'Shellfish'],
      conditions: ['Hypertension', 'Anxiety'],
      lastVisit: '2025-01-02',
      nextAppointment: '2025-01-15',
      status: 'stable',
      records: [
        {
          id: 1,
          date: '2025-01-02',
          type: 'Consultation',
          diagnosis: 'Hypertension follow-up',
          treatment: 'Continued medication, lifestyle modifications',
          notes: 'Blood pressure well controlled. Patient reports feeling better.',
          doctor: 'Dr. Smith'
        },
        {
          id: 2,
          date: '2024-12-15',
          type: 'Lab Results',
          diagnosis: 'Annual blood work',
          treatment: 'No immediate action required',
          notes: 'All values within normal range except slightly elevated cholesterol.',
          doctor: 'Dr. Smith'
        }
      ],
      vitals: {
        bloodPressure: '120/80',
        heartRate: '72 bpm',
        temperature: '98.6°F',
        weight: '145 lbs',
        height: '5\'6\"'
      },
      prescriptions: [
        {
          id: 1,
          date: '2025-01-02',
          medications: [
            { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily', duration: '30 days' },
            { name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', duration: '30 days' }
          ],
          prescribedBy: 'Dr. Smith',
          instructions: 'Take with food. Monitor blood pressure daily.'
        }
      ],
      labResults: [
        {
          id: 1,
          date: '2024-12-15',
          type: 'Comprehensive Metabolic Panel',
          results: {
            'Glucose': { value: '95', range: '70-100 mg/dL', status: 'normal' },
            'Creatinine': { value: '0.9', range: '0.6-1.2 mg/dL', status: 'normal' },
            'Total Cholesterol': { value: '220', range: '<200 mg/dL', status: 'high' },
            'HDL': { value: '45', range: '>40 mg/dL', status: 'normal' }
          },
          orderedBy: 'Dr. Smith',
          notes: 'Cholesterol slightly elevated, recommend dietary changes'
        }
      ],
      appointments: [
        {
          id: 1,
          date: '2025-01-15',
          time: '10:00 AM',
          type: 'Follow-up',
          status: 'scheduled',
          reason: 'Blood pressure check'
        },
        {
          id: 2,
          date: '2025-02-15',
          time: '2:00 PM',
          type: 'Consultation',
          status: 'scheduled',
          reason: 'Annual physical'
        }
      ]
    },
    {
      id: 2,
      name: 'Michael Chen',
      age: 45,
      gender: 'Male',
      bloodType: 'A+',
      phone: '+1 (555) 987-6543',
      email: 'michael.chen@email.com',
      address: '456 Oak Ave, City, State 12345',
      emergencyContact: 'Lisa Chen - +1 (555) 987-6544',
      allergies: ['None'],
      conditions: ['Diabetes Type 2', 'High Cholesterol'],
      lastVisit: '2024-12-20',
      nextAppointment: '2025-01-08',
      status: 'needs-attention',
      records: [
        {
          id: 1,
          date: '2024-12-20',
          type: 'Follow-up',
          diagnosis: 'Diabetes management',
          treatment: 'Adjusted medication dosage, dietary consultation',
          notes: 'HbA1c levels improved but still above target. Referred to nutritionist.',
          doctor: 'Dr. Smith'
        }
      ],
      vitals: {
        bloodPressure: '140/90',
        heartRate: '80 bpm',
        temperature: '98.4°F',
        weight: '180 lbs',
        height: '5\'10\"'
      }
    },
    {
      id: 3,
      name: 'Emily Rodriguez',
      age: 32,
      gender: 'Female',
      bloodType: 'B-',
      phone: '+1 (555) 456-7890',
      email: 'emily.rodriguez@email.com',
      address: '789 Pine Rd, City, State 12345',
      emergencyContact: 'Carlos Rodriguez - +1 (555) 456-7891',
      allergies: ['Latex', 'Shellfish'],
      conditions: ['Migraine', 'GERD'],
      lastVisit: '2024-11-30',
      nextAppointment: '2025-01-10',
      status: 'stable',
      records: [
        {
          id: 1,
          date: '2024-11-30',
          type: 'Consultation',
          diagnosis: 'Migraine management',
          treatment: 'Prescribed preventive medication',
          notes: 'Patient reports reduced frequency of migraines with new medication.',
          doctor: 'Dr. Smith'
        }
      ],
      vitals: {
        bloodPressure: '115/75',
        heartRate: '68 bpm',
        temperature: '98.7°F',
        weight: '135 lbs',
        height: '5\'4\"'
      }
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'stable': return 'text-green-600 bg-green-100';
      case 'needs-attention': return 'text-red-600 bg-red-100';
      case 'critical': return 'text-red-800 bg-red-200';
      case 'recovering': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getLinkedAppointment = (appointmentId) => {
    if (!appointmentId || !appointments) return null;
    
    // Search in appointment history
    const historyAppointment = appointments?.history?.find(apt => apt._id === appointmentId);
    if (historyAppointment) return historyAppointment;
    
    // Search in upcoming appointments
    const upcomingAppointment = appointments?.upcoming?.find(apt => apt._id === appointmentId);
    if (upcomingAppointment) return upcomingAppointment;
    
    return null;
  };

  // Helper function to get appointment ID from record (handles both appointmentId and appointment fields)
  const getRecordAppointmentId = (record) => {
    return record.appointmentId || record.appointment || record.treatmentPlanData?.appointmentId;
  };

  const checkAppointmentHasTreatmentPlan = (appointmentId) => {
    if (!appointmentId || !medicalRecords?.all) {
      console.log(`No appointmentId (${appointmentId}) or no medical records`);
      return false;
    }
    
    // Check if any existing medical record is linked to this appointment and is a treatment plan
    const matchingRecords = medicalRecords.all.filter(record => {
      const isLinked = record.appointmentId === appointmentId || 
                      record.appointment === appointmentId ||
                      record.treatmentPlanData?.appointmentId === appointmentId;
      const isTreatmentPlan = record.recordType === 'Treatment Plan' || 
                             record.recordType === 'treatment-plan';
      
      if (isLinked) {
        console.log(`Found linked record for appointment ${appointmentId}:`, {
          recordId: record._id,
          recordType: record.recordType,
          appointmentId: record.appointmentId,
          appointment: record.appointment,
          treatmentPlanDataAppointmentId: record.treatmentPlanData?.appointmentId,
          isTreatmentPlan
        });
      }
      
      return isLinked && isTreatmentPlan;
    });
    
    const hasPlan = matchingRecords.length > 0;
    console.log(`Appointment ${appointmentId} has treatment plan: ${hasPlan} (${matchingRecords.length} matching records)`);
    return hasPlan;
  };

  const populateEditForm = (record) => {
    setEditFormData({
      diagnosis: record.diagnosis?.primary || record.diagnosis || '',
      treatment: record.treatment || record.description || '',
      notes: record.notes || '',
      priority: record.priority || 'normal',
      medications: record.medications || [],
      allergies: record.allergies || [],
      conditions: record.conditions || [],
      followUpDate: record.followUpDate ? new Date(record.followUpDate).toISOString().split('T')[0] : ''
    });
  };

  const validateTreatmentPlanForm = (data) => {
    const errors = {};
    
    if (!data.appointmentId?.trim()) {
      errors.appointmentId = 'Please select an appointment';
    }
    
    if (!data.diagnosis?.trim()) {
      errors.diagnosis = 'Primary diagnosis is required';
    }
    
    if (!data.treatment?.trim()) {
      errors.treatment = 'Treatment plan is required';
    }
    
    // Validate medications
    if (data.medications && data.medications.length > 0) {
      data.medications.forEach((med, index) => {
        if (!med.name?.trim()) {
          errors[`medication_${index}_name`] = 'Medication name is required';
        }
        if (!med.dosage?.trim()) {
          errors[`medication_${index}_dosage`] = 'Dosage is required';
        }
        if (!med.frequency?.trim()) {
          errors[`medication_${index}_frequency`] = 'Frequency is required';
        }
      });
    }
    
    // Validate allergies
    if (data.allergies && data.allergies.length > 0) {
      data.allergies.forEach((allergy, index) => {
        const allergen = allergy.allergen || allergy;
        if (!allergen?.trim()) {
          errors[`allergy_${index}`] = 'Allergy name is required';
        }
      });
    }
    
    // Validate conditions
    if (data.conditions && data.conditions.length > 0) {
      data.conditions.forEach((condition, index) => {
        const name = condition.name || condition;
        if (!name?.trim()) {
          errors[`condition_${index}`] = 'Condition name is required';
        }
      });
    }
    
    return errors;
  };

  const updateMedicalRecord = async (recordId, updatedData) => {
    try {
      const requestBody = {
        title: `Treatment Plan: ${updatedData.diagnosis}`,
        description: updatedData.treatment,
        diagnosis: {
          primary: updatedData.diagnosis,
          severity: updatedData.priority === 'normal' ? 'moderate' : updatedData.priority
        },
        prescriptions: updatedData.medications.map(med => ({
          medication: med.name,
          dosage: med.dosage,
          frequency: med.frequency,
          instructions: `${med.name} - ${med.dosage} - ${med.frequency}`
        })),
        notes: updatedData.notes,
        priority: updatedData.priority,
        followUp: updatedData.followUpDate ? {
          required: true,
          date: updatedData.followUpDate,
          instructions: 'Follow-up appointment scheduled'
        } : undefined,
        treatmentPlanData: {
          allergies: updatedData.allergies,
          conditions: updatedData.conditions
        }
      };

      console.log('Updating record:', recordId, requestBody);

      const response = await fetch(`/api/medical-records/${recordId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      
      console.log('Update Response:', JSON.stringify(data, null, 2));
      
      if (data.success) {
        // Update the local state
        setPatientProfile(prev => ({
          ...prev,
          medicalRecords: {
            ...prev.medicalRecords,
            all: prev.medicalRecords.all.map(record => 
              record._id === recordId 
                ? {
                    ...record,
                    diagnosis: data.data.record.diagnosis || { primary: updatedData.diagnosis },
                    treatment: updatedData.treatment,
                    notes: updatedData.notes,
                    priority: updatedData.priority,
                    medications: updatedData.medications,
                    allergies: updatedData.allergies,
                    conditions: updatedData.conditions,
                    followUpDate: updatedData.followUpDate,
                    updatedAt: new Date().toISOString()
                  }
                : record
            )
          }
        }));

        return { success: true, data: data.data };
      } else {
        if (data.errors && Array.isArray(data.errors)) {
          const errorMessages = data.errors.map(err => err.msg || err.message).join(', ');
          throw new Error(`Validation failed: ${errorMessages}`);
        }
        throw new Error(data.message || 'Failed to update medical record');
      }
    } catch (error) {
      console.error('Error updating medical record:', error);
      throw error;
    }
  };

  const saveTreatmentPlan = async (treatmentPlanData) => {
    try {
      const requestBody = {
        patient: patientId,
        doctor: user._id,
        appointment: treatmentPlanData.appointmentId,
        recordType: 'treatment-plan',
        title: `Treatment Plan: ${treatmentPlanData.diagnosis}`,
        description: treatmentPlanData.treatment,
        diagnosis: {
          primary: treatmentPlanData.diagnosis,
          severity: treatmentPlanData.priority === 'normal' ? 'moderate' : treatmentPlanData.priority
        },
        prescriptions: treatmentPlanData.medications.map(med => ({
          medication: med.name,
          dosage: med.dosage,
          frequency: med.frequency,
          instructions: `${med.name} - ${med.dosage} - ${med.frequency}`
        })),
        notes: treatmentPlanData.notes,
        priority: treatmentPlanData.priority,
        followUp: treatmentPlanData.followUpDate ? {
          required: true,
          date: treatmentPlanData.followUpDate,
          instructions: 'Follow-up appointment scheduled'
        } : undefined,
        // Store treatment plan specific data in a custom field
        treatmentPlanData: {
          allergies: treatmentPlanData.allergies,
          conditions: treatmentPlanData.conditions,
          appointmentId: treatmentPlanData.appointmentId
        }
      };

      console.log('Request Body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch('/api/medical-records', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      
      // Log the full response for debugging
      console.log('API Response:', JSON.stringify(data, null, 2));
      
      if (data.success) {
        // Add the new record to local state to update UI immediately
        const newRecord = {
          _id: data.data.record._id || Date.now().toString(),
          recordType: 'Treatment Plan',
          title: data.data.record.title,
          description: data.data.record.description || treatmentPlanData.treatment,
          diagnosis: data.data.record.diagnosis || { primary: treatmentPlanData.diagnosis },
          treatment: treatmentPlanData.treatment,
          notes: treatmentPlanData.notes,
          priority: treatmentPlanData.priority,
          medications: treatmentPlanData.medications,
          allergies: treatmentPlanData.allergies,
          conditions: treatmentPlanData.conditions,
          followUpDate: treatmentPlanData.followUpDate,
          appointmentId: treatmentPlanData.appointmentId,
          treatmentPlanData: {
            allergies: treatmentPlanData.allergies,
            conditions: treatmentPlanData.conditions,
            appointmentId: treatmentPlanData.appointmentId
          },
          createdAt: data.data.record.createdAt || new Date().toISOString(),
          createdBy: data.data.record.createdBy || {
            firstName: user.firstName,
            lastName: user.lastName
          }
        };

        // Update the patient profile state to include the new record
        setPatientProfile(prev => ({
          ...prev,
          medicalRecords: {
            ...prev.medicalRecords,
            all: [newRecord, ...(prev.medicalRecords?.all || [])],
            summary: {
              ...prev.medicalRecords?.summary,
              total: (prev.medicalRecords?.summary?.total || 0) + 1
            }
          }
        }));

        return { success: true, data: newRecord };
      } else {
        // Show detailed validation errors if available
        if (data.errors && Array.isArray(data.errors)) {
          const errorMessages = data.errors.map(err => err.msg || err.message).join(', ');
          throw new Error(`Validation failed: ${errorMessages}`);
        }
        
        // Handle specific error codes
        if (data.code === 'DUPLICATE_TREATMENT_PLAN') {
          throw new Error('This appointment already has a treatment plan. Please select a different appointment or edit the existing treatment plan.');
        }
        
        throw new Error(data.message || 'Failed to save treatment plan');
      }
    } catch (error) {
      console.error('Error saving treatment plan:', error);
      throw error;
    }
  };

  // Remove old mock data filtering logic since we're using real API data now

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        
        {/* Header with Back Button */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/doctor/patient-records')}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {patient?.fullName || `${patient?.firstName} ${patient?.lastName}`}
              </h1>
              <p className="text-gray-600">Complete Patient Profile & Medical Records</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Patient ID</p>
            <p className="font-mono text-sm text-gray-900">{patient?.digitalHealthCardId || 'N/A'}</p>
          </div>
        </div>

        {/* Patient Alerts */}
        {alerts && alerts.length > 0 && (
          <div className="mb-6">
            {alerts.map((alert, index) => (
              <div key={index} className={`p-4 rounded-lg border-l-4 mb-3 ${
                alert.severity === 'HIGH' ? 'bg-red-50 border-red-400' : 
                alert.severity === 'MEDIUM' ? 'bg-yellow-50 border-yellow-400' : 
                'bg-blue-50 border-blue-400'
              }`}>
                <div className="flex items-center">
                  <span className="text-lg mr-2">{alert.icon}</span>
                  <p className={`font-medium ${
                    alert.severity === 'HIGH' ? 'text-red-800' : 
                    alert.severity === 'MEDIUM' ? 'text-yellow-800' : 
                    'text-blue-800'
                  }`}>
                    {alert.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Patient Overview Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="flex items-center space-x-6 mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {patient?.firstName?.charAt(0)}{patient?.lastName?.charAt(0)}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {patient?.firstName} {patient?.lastName}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Age:</span>
                  <span className="ml-2 font-medium">{patient?.age || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Gender:</span>
                  <span className="ml-2 font-medium capitalize">{patient?.gender || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Blood Type:</span>
                  <span className="ml-2 font-medium">{patient?.bloodType || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Phone:</span>
                  <span className="ml-2 font-medium">{patient?.phone || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Contact Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <EnvelopeIcon className="w-4 h-4 text-gray-400 mr-2" />
                  <span>{patient?.email || 'N/A'}</span>
                </div>
                <div className="flex items-center">
                  <PhoneIcon className="w-4 h-4 text-gray-400 mr-2" />
                  <span>{patient?.phone || 'N/A'}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Medical Summary</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">Total Records:</span>
                  <span className="ml-2 font-medium">{medicalRecords?.summary?.total || 0}</span>
                </div>
                <div>
                  <span className="text-gray-500">Last Visit:</span>
                  <span className="ml-2 font-medium">
                    {appointments?.summary?.lastVisit ? 
                      new Date(appointments.summary.lastVisit).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Medical Records Tabs */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', name: 'Medical Records', icon: DocumentTextIcon },
                { id: 'appointments', name: 'Appointments', icon: CalendarIcon },
                { id: 'documents', name: 'Documents', icon: DocumentDuplicateIcon }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Medical Records Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">Medical Records</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      {medicalRecords?.all?.length || 0} records
                    </span>
                    <button 
                      onClick={() => setShowTreatmentPlanModal(true)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <PlusIcon className="w-4 h-4 inline mr-2" />
                      Create/Manage Treatment Plan
                    </button>
                  </div>
                </div>

                {medicalRecords?.all && medicalRecords.all.length > 0 ? (
                  <div className="space-y-4">
                    {medicalRecords.all.map((record) => (
                      <div key={record._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow h-64 flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                              <DocumentTextIcon className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">
                                {record.recordType || 'General Record'}
                              </p>
                              <p className="text-sm text-gray-500">
                                {(() => {
                                  const appointmentId = getRecordAppointmentId(record);
                                  const linkedAppointment = getLinkedAppointment(appointmentId);
                                  const displayDate = linkedAppointment ? 
                                    new Date(linkedAppointment.appointmentDate).toLocaleDateString() :
                                    new Date(record.createdAt).toLocaleDateString();
                                  return `${displayDate} - Dr. ${record.createdBy?.firstName} ${record.createdBy?.lastName}`;
                                })()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => {
                                setSelectedRecord(record);
                                setShowViewRecordModal(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                              title="View Record"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => {
                                setSelectedRecord(record);
                                populateEditForm(record);
                                setShowEditRecordModal(true);
                              }}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                              title="Edit Record"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Appointment Reference */}
                        {getRecordAppointmentId(record) && (
                          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="text-sm font-medium text-blue-800">Appointment:</span>
                              <span className="text-sm text-blue-700">
                                {(() => {
                                  const appointmentId = getRecordAppointmentId(record);
                                  const linkedAppointment = getLinkedAppointment(appointmentId);
                                  return linkedAppointment ? 
                                    `${new Date(linkedAppointment.appointmentDate).toLocaleDateString()} - ${linkedAppointment.appointmentType}` :
                                    'Reference not available';
                                })()}
                              </span>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex-grow">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="font-medium text-gray-700 mb-1">Diagnosis:</p>
                              <p className="text-gray-600 truncate">{record.diagnosis?.primary || record.diagnosis || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-700 mb-1">Treatment Plan:</p>
                              <p className="text-gray-600 truncate">{record.treatment || record.description || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Treatment Plan Priority */}
                        {record.priority && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-700">Priority:</span>
                              <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                record.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                record.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                record.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {record.priority.charAt(0).toUpperCase() + record.priority.slice(1)}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Allergies */}
                        {record.allergies && record.allergies.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="font-medium text-gray-700 mb-2">Allergies:</p>
                            <div className="flex flex-wrap gap-2">
                              {record.allergies.map((allergy, index) => (
                                <span key={index} className={`px-2 py-1 text-xs rounded-full font-medium ${
                                  allergy.severity === 'severe' ? 'bg-red-100 text-red-800' :
                                  allergy.severity === 'moderate' ? 'bg-orange-100 text-orange-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {allergy.allergen || allergy} {allergy.severity && `(${allergy.severity})`}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Medical Conditions */}
                        {record.conditions && record.conditions.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="font-medium text-gray-700 mb-2">Medical Conditions:</p>
                            <div className="flex flex-wrap gap-2">
                              {record.conditions.map((condition, index) => (
                                <span key={index} className={`px-2 py-1 text-xs rounded-full font-medium ${
                                  condition.status === 'active' ? 'bg-red-100 text-red-800' :
                                  condition.status === 'managed' ? 'bg-blue-100 text-blue-800' :
                                  condition.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {condition.name || condition} {condition.status && `(${condition.status})`}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Follow-up Date */}
                        {record.followUpDate && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2 text-sm">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="font-medium text-gray-700">Follow-up Scheduled:</span>
                                <span className="text-blue-600 font-medium">
                                  {new Date(record.followUpDate).toLocaleDateString()}
                                </span>
                              </div>
                              {(() => {
                                const followUpDate = new Date(record.followUpDate);
                                const today = new Date();
                                const diffTime = followUpDate - today;
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                
                                if (diffDays < 0) {
                                  return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Overdue</span>;
                                } else if (diffDays === 0) {
                                  return <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">Today</span>;
                                } else if (diffDays <= 7) {
                                  return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">This Week</span>;
                                } else {
                                  return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Upcoming</span>;
                                }
                              })()}
                            </div>
                          </div>
                        )}
                        
                        {record.notes && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="font-medium text-gray-700 mb-1">Notes:</p>
                            <p className="text-gray-600 text-sm">{record.notes}</p>
                          </div>
                        )}

                        {record.medications && record.medications.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="font-medium text-gray-700 mb-2">Medications:</p>
                            <div className="flex flex-wrap gap-2">
                              {record.medications.map((med, index) => (
                                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                  {med.name} - {med.dosage}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No medical records found</p>
                    <p className="text-gray-400">Medical records will appear here after visits</p>
                  </div>
                )}
              </div>
            )}

            {/* Appointments Tab */}
            {activeTab === 'appointments' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900">Appointment History</h3>
                
                {appointments?.history && appointments.history.length > 0 ? (
                  <div className="space-y-4">
                    {appointments.history.map((appointment) => (
                      <div key={appointment._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {new Date(appointment.appointmentDate).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-500">
                              {appointment.appointmentType} - {appointment.status}
                            </p>
                            {appointment.chiefComplaint && (
                              <p className="text-sm text-gray-600 mt-1">
                                <strong>Chief Complaint:</strong> {appointment.chiefComplaint}
                              </p>
                            )}
                          </div>
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            {appointment.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No appointment history</p>
                  </div>
                )}

                {/* Upcoming Appointments */}
                {appointments?.upcoming && appointments.upcoming.length > 0 && (
                  <div className="mt-8">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Appointments</h4>
                    <div className="space-y-4">
                      {appointments.upcoming.map((appointment) => (
                        <div key={appointment._id} className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-blue-900">
                                {new Date(appointment.appointmentDate).toLocaleDateString()}
                              </p>
                              <p className="text-sm text-blue-700">
                                {appointment.appointmentType} - {appointment.appointmentTime}
                              </p>
                            </div>
                            <span className="px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded-full">
                              {appointment.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">Patient Documents</h3>
                  <span className="text-sm text-gray-500">
                    {documents?.length || 0} documents
                  </span>
                </div>
                
                {documents && documents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {documents.map((doc) => (
                      <div key={doc._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              {doc.documentType === 'lab-report' ? (
                                <BeakerIcon className="w-5 h-5 text-blue-600" />
                              ) : doc.documentType === 'blood-test' ? (
                                <BeakerIcon className="w-5 h-5 text-red-600" />
                              ) : doc.documentType === 'x-ray' ? (
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              ) : (
                                <DocumentTextIcon className="w-5 h-5 text-gray-600" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900 text-sm">
                                {doc.title}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(doc.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Document Type Badge */}
                        <div className="mb-3">
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                            doc.documentType === 'lab-report' ? 'bg-blue-100 text-blue-800' :
                            doc.documentType === 'blood-test' ? 'bg-red-100 text-red-800' :
                            doc.documentType === 'x-ray' ? 'bg-gray-100 text-gray-800' :
                            doc.documentType === 'prescription' ? 'bg-green-100 text-green-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {doc.documentType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </div>

                        {/* Description */}
                        {doc.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {doc.description}
                          </p>
                        )}

                        {/* File Info */}
                        <div className="text-xs text-gray-500 mb-3">
                          <p>File: {doc.originalName}</p>
                          <p>Size: {(doc.fileSize / 1024).toFixed(1)} KB</p>
                          <p>Type: {doc.mimeType}</p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              console.log('Document details:', doc);
                              console.log('File type:', doc.mimeType);
                              console.log('File URL:', doc.fileUrl);
                              
                              // For images, create an image viewer modal or direct display
                              if (doc.mimeType && doc.mimeType.startsWith('image/')) {
                                // Create a simple image viewer
                                const imageWindow = window.open('', '_blank');
                                imageWindow.document.write(`
                                  <html>
                                    <head>
                                      <title>${doc.title}</title>
                                      <style>
                                        body { margin: 0; padding: 20px; background: #f0f0f0; text-align: center; }
                                        img { max-width: 100%; max-height: 90vh; border: 1px solid #ddd; }
                                        h3 { color: #333; }
                                      </style>
                                    </head>
                                    <body>
                                      <h3>${doc.title}</h3>
                                      <img src="http://localhost:5000${doc.fileUrl}" alt="${doc.title}" 
                                           onerror="this.parentElement.innerHTML='<p>Error loading image. File may not exist.</p>'" />
                                    </body>
                                  </html>
                                `);
                              } else {
                                // For PDFs and other documents, try direct URL
                                const fullUrl = `http://localhost:5000${doc.fileUrl}`;
                                window.open(fullUrl, '_blank');
                              }
                            }}
                            className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1"
                          >
                            <EyeIcon className="w-4 h-4" />
                            <span>{doc.mimeType && doc.mimeType.startsWith('image/') ? 'View Image' : 'View Document'}</span>
                          </button>
                        </div>

                        {/* Linked Records */}
                        {(doc.appointment || doc.medicalRecord) && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs text-gray-500 mb-1">Linked to:</p>
                            {doc.appointment && (
                              <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded mr-2">
                                Appointment
                              </span>
                            )}
                            {doc.medicalRecord && (
                              <span className="inline-block px-2 py-1 bg-green-50 text-green-700 text-xs rounded">
                                Medical Record
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <DocumentDuplicateIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No documents found</p>
                    <p className="text-gray-400">Patient documents will appear here when uploaded</p>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Treatment Plan Modal */}
        {showTreatmentPlanModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Create/Manage Treatment Plan</h2>
                  <button
                    onClick={() => setShowTreatmentPlanModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-gray-600 mt-2">
                  Comprehensive treatment plan for {patient?.firstName} {patient?.lastName}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Appointment Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Link to Appointment *
                  </label>
                  <select
                    value={treatmentPlanData.appointmentId}
                    onChange={(e) => {
                      setTreatmentPlanData({...treatmentPlanData, appointmentId: e.target.value});
                      if (formErrors.appointmentId) {
                        setFormErrors({...formErrors, appointmentId: undefined});
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                      formErrors.appointmentId 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-green-500'
                    }`}
                    required
                  >
                    {(() => {
                      const hasAvailableAppointments = 
                        (appointments?.history?.some(apt => !checkAppointmentHasTreatmentPlan(apt._id))) ||
                        (appointments?.upcoming?.some(apt => !checkAppointmentHasTreatmentPlan(apt._id)));
                      
                      return hasAvailableAppointments ? 
                        <option value="">Select an appointment...</option> :
                        <option value="">No appointments available (all have treatment plans)</option>;
                    })()}
                    {/* Recent/Completed Appointments */}
                    {appointments?.history && appointments.history.length > 0 && (
                      (() => {
                        const availableAppointments = appointments.history
                          .slice(0, 5)
                          .filter(appointment => !checkAppointmentHasTreatmentPlan(appointment._id));
                        
                        return availableAppointments.length > 0 && (
                          <optgroup label="Recent Appointments">
                            {availableAppointments.map((appointment) => (
                              <option 
                                key={appointment._id} 
                                value={appointment._id}
                              >
                                {new Date(appointment.appointmentDate).toLocaleDateString()} - {appointment.appointmentType} ({appointment.status})
                              </option>
                            ))}
                          </optgroup>
                        );
                      })()
                    )}
                    {/* Upcoming Appointments */}
                    {appointments?.upcoming && appointments.upcoming.length > 0 && (
                      (() => {
                        const availableAppointments = appointments.upcoming
                          .filter(appointment => !checkAppointmentHasTreatmentPlan(appointment._id));
                        
                        return availableAppointments.length > 0 && (
                          <optgroup label="Upcoming Appointments">
                            {availableAppointments.map((appointment) => (
                              <option 
                                key={appointment._id} 
                                value={appointment._id}
                              >
                                {new Date(appointment.appointmentDate).toLocaleDateString()} - {appointment.appointmentType} ({appointment.status})
                              </option>
                            ))}
                          </optgroup>
                        );
                      })()
                    )}
                  </select>
                  {formErrors.appointmentId ? (
                    <p className="text-xs text-red-600 mt-1">{formErrors.appointmentId}</p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">
                      Select an appointment to link this treatment plan. Only appointments without existing treatment plans are shown.
                    </p>
                  )}
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Primary Diagnosis *
                    </label>
                    <input
                      type="text"
                      value={treatmentPlanData.diagnosis}
                      onChange={(e) => {
                        setTreatmentPlanData({...treatmentPlanData, diagnosis: e.target.value});
                        if (formErrors.diagnosis) {
                          setFormErrors({...formErrors, diagnosis: undefined});
                        }
                      }}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                        formErrors.diagnosis 
                          ? 'border-red-300 focus:ring-red-500' 
                          : 'border-gray-300 focus:ring-green-500'
                      }`}
                      placeholder="Enter primary diagnosis"
                    />
                    {formErrors.diagnosis && (
                      <p className="text-xs text-red-600 mt-1">{formErrors.diagnosis}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority Level
                    </label>
                    <select
                      value={treatmentPlanData.priority}
                      onChange={(e) => setTreatmentPlanData({...treatmentPlanData, priority: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="low">Low Priority</option>
                      <option value="normal">Normal Priority</option>
                      <option value="high">High Priority</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                {/* Treatment Plan */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Treatment Plan *
                  </label>
                  <textarea
                    value={treatmentPlanData.treatment}
                    onChange={(e) => {
                      setTreatmentPlanData({...treatmentPlanData, treatment: e.target.value});
                      if (formErrors.treatment) {
                        setFormErrors({...formErrors, treatment: undefined});
                      }
                    }}
                    rows={4}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                      formErrors.treatment 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-green-500'
                    }`}
                    placeholder="Describe the treatment plan, procedures, lifestyle modifications, etc."
                  />
                  {formErrors.treatment && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.treatment}</p>
                  )}
                </div>

                {/* Allergies Management */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Patient Allergies
                  </label>
                  <div className="space-y-3">
                    {treatmentPlanData.allergies.map((allergy, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <input
                          type="text"
                          value={allergy.allergen}
                          onChange={(e) => {
                            const newAllergies = [...treatmentPlanData.allergies];
                            newAllergies[index].allergen = e.target.value;
                            setTreatmentPlanData({...treatmentPlanData, allergies: newAllergies});
                          }}
                          className="flex-1 px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500"
                          placeholder="Allergy name"
                        />
                        <select
                          value={allergy.severity}
                          onChange={(e) => {
                            const newAllergies = [...treatmentPlanData.allergies];
                            newAllergies[index].severity = e.target.value;
                            setTreatmentPlanData({...treatmentPlanData, allergies: newAllergies});
                          }}
                          className="px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500"
                        >
                          <option value="mild">Mild</option>
                          <option value="moderate">Moderate</option>
                          <option value="severe">Severe</option>
                        </select>
                        <button
                          onClick={() => {
                            const newAllergies = treatmentPlanData.allergies.filter((_, i) => i !== index);
                            setTreatmentPlanData({...treatmentPlanData, allergies: newAllergies});
                          }}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        setTreatmentPlanData({
                          ...treatmentPlanData,
                          allergies: [...treatmentPlanData.allergies, { allergen: '', severity: 'mild' }]
                        });
                      }}
                      className="w-full px-4 py-2 border-2 border-dashed border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      + Add Allergy
                    </button>
                  </div>
                </div>

                {/* Conditions Management */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Medical Conditions
                  </label>
                  <div className="space-y-3">
                    {treatmentPlanData.conditions.map((condition, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <input
                          type="text"
                          value={condition.name}
                          onChange={(e) => {
                            const newConditions = [...treatmentPlanData.conditions];
                            newConditions[index].name = e.target.value;
                            setTreatmentPlanData({...treatmentPlanData, conditions: newConditions});
                          }}
                          className="flex-1 px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                          placeholder="Condition name"
                        />
                        <select
                          value={condition.status}
                          onChange={(e) => {
                            const newConditions = [...treatmentPlanData.conditions];
                            newConditions[index].status = e.target.value;
                            setTreatmentPlanData({...treatmentPlanData, conditions: newConditions});
                          }}
                          className="px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                        >
                          <option value="active">Active</option>
                          <option value="managed">Managed</option>
                          <option value="resolved">Resolved</option>
                          <option value="monitoring">Monitoring</option>
                        </select>
                        <button
                          onClick={() => {
                            const newConditions = treatmentPlanData.conditions.filter((_, i) => i !== index);
                            setTreatmentPlanData({...treatmentPlanData, conditions: newConditions});
                          }}
                          className="p-2 text-yellow-600 hover:bg-yellow-100 rounded-lg"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        setTreatmentPlanData({
                          ...treatmentPlanData,
                          conditions: [...treatmentPlanData.conditions, { name: '', status: 'active' }]
                        });
                      }}
                      className="w-full px-4 py-2 border-2 border-dashed border-yellow-300 text-yellow-600 rounded-lg hover:bg-yellow-50 transition-colors"
                    >
                      + Add Condition
                    </button>
                  </div>
                </div>

                {/* Medications */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prescribed Medications
                  </label>
                  <div className="space-y-3">
                    {treatmentPlanData.medications.map((medication, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <input
                          type="text"
                          value={medication.name}
                          onChange={(e) => {
                            const newMedications = [...treatmentPlanData.medications];
                            newMedications[index].name = e.target.value;
                            setTreatmentPlanData({...treatmentPlanData, medications: newMedications});
                          }}
                          className="px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Medication name"
                        />
                        <input
                          type="text"
                          value={medication.dosage}
                          onChange={(e) => {
                            const newMedications = [...treatmentPlanData.medications];
                            newMedications[index].dosage = e.target.value;
                            setTreatmentPlanData({...treatmentPlanData, medications: newMedications});
                          }}
                          className="px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Dosage"
                        />
                        <input
                          type="text"
                          value={medication.frequency}
                          onChange={(e) => {
                            const newMedications = [...treatmentPlanData.medications];
                            newMedications[index].frequency = e.target.value;
                            setTreatmentPlanData({...treatmentPlanData, medications: newMedications});
                          }}
                          className="px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Frequency"
                        />
                        <button
                          onClick={() => {
                            const newMedications = treatmentPlanData.medications.filter((_, i) => i !== index);
                            setTreatmentPlanData({...treatmentPlanData, medications: newMedications});
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        setTreatmentPlanData({
                          ...treatmentPlanData,
                          medications: [...treatmentPlanData.medications, { name: '', dosage: '', frequency: '' }]
                        });
                      }}
                      className="w-full px-4 py-2 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      + Add Medication
                    </button>
                  </div>
                </div>

                {/* Additional Notes and Follow-up */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Notes
                    </label>
                    <textarea
                      value={treatmentPlanData.notes}
                      onChange={(e) => setTreatmentPlanData({...treatmentPlanData, notes: e.target.value})}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Any additional notes, instructions, or observations"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Follow-up Date
                    </label>
                    <input
                      type="date"
                      value={treatmentPlanData.followUpDate}
                      onChange={(e) => setTreatmentPlanData({...treatmentPlanData, followUpDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="text-xs text-blue-800">
                          <p className="font-medium mb-1">What does Follow-up Date do?</p>
                          <ul className="space-y-1 text-blue-700">
                            <li>• <strong>Reminder System:</strong> Creates automatic reminders for the next appointment</li>
                            <li>• <strong>Treatment Tracking:</strong> Helps monitor treatment progress over time</li>
                            <li>• <strong>Care Continuity:</strong> Ensures patients don't miss important follow-up visits</li>
                            <li>• <strong>Dashboard Alerts:</strong> Appears in doctor's dashboard for upcoming follow-ups</li>
                            <li>• <strong>Patient Notifications:</strong> Can trigger patient reminder notifications</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex-shrink-0 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => setShowTreatmentPlanModal(false)}
                    className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      // Clear previous errors
                      setFormErrors({});
                      
                      // Validate form
                      const errors = validateTreatmentPlanForm(treatmentPlanData);
                      if (Object.keys(errors).length > 0) {
                        setFormErrors(errors);
                        return;
                      }

                      let button = null;
                      try {
                        // Show loading state
                        button = document.activeElement;
                        const originalText = button.textContent;
                        button.textContent = 'Saving...';
                        button.disabled = true;

                        // Save treatment plan
                        console.log('Saving treatment plan:', treatmentPlanData);
                        console.log('Patient ID:', patientId);
                        console.log('User ID:', user._id);
                        const result = await saveTreatmentPlan(treatmentPlanData);
                        
                        if (result.success) {
                          toast.success('Treatment plan saved successfully!');
                          setShowTreatmentPlanModal(false);
                          
                          // Reset form
                          setTreatmentPlanData({
                            appointmentId: '',
                            diagnosis: '',
                            treatment: '',
                            notes: '',
                            medications: [],
                            allergies: [],
                            conditions: [],
                            followUpDate: '',
                            priority: 'normal'
                          });
                          
                          // Refresh patient data to update appointment filtering
                          fetchPatientProfile();
                        }
                      } catch (error) {
                        console.error('Failed to save treatment plan:', error);
                        toast.error(error.message || 'Failed to save treatment plan. Please try again.');
                      } finally {
                        // Always reset button state
                        if (button) {
                          button.textContent = 'Save Treatment Plan';
                          button.disabled = false;
                        }
                      }
                    }}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    Save Treatment Plan
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Record Modal */}
        {showViewRecordModal && selectedRecord && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">View Medical Record</h2>
                  <button
                    onClick={() => setShowViewRecordModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-gray-600 mt-2">
                  {selectedRecord.recordType} - {new Date(selectedRecord.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Record Type</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedRecord.recordType || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedRecord.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                      selectedRecord.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      selectedRecord.priority === 'normal' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {selectedRecord.priority ? selectedRecord.priority.charAt(0).toUpperCase() + selectedRecord.priority.slice(1) : 'Normal'}
                    </span>
                  </div>
                </div>

                {/* Diagnosis */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Diagnosis</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {selectedRecord.diagnosis?.primary || selectedRecord.diagnosis || 'N/A'}
                  </p>
                </div>

                {/* Treatment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Treatment Plan</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                    {selectedRecord.treatment || selectedRecord.description || 'N/A'}
                  </p>
                </div>

                {/* Notes */}
                {selectedRecord.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                      {selectedRecord.notes}
                    </p>
                  </div>
                )}

                {/* Medications */}
                {selectedRecord.medications && selectedRecord.medications.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Medications</label>
                    <div className="space-y-2">
                      {selectedRecord.medications.map((med, index) => (
                        <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <div>
                              <span className="font-medium text-blue-800">Name:</span>
                              <span className="ml-2 text-blue-700">{med.name}</span>
                            </div>
                            <div>
                              <span className="font-medium text-blue-800">Dosage:</span>
                              <span className="ml-2 text-blue-700">{med.dosage}</span>
                            </div>
                            <div>
                              <span className="font-medium text-blue-800">Frequency:</span>
                              <span className="ml-2 text-blue-700">{med.frequency}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Allergies */}
                {selectedRecord.allergies && selectedRecord.allergies.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Allergies</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedRecord.allergies.map((allergy, index) => (
                        <span key={index} className={`px-3 py-1 rounded-full text-sm font-medium ${
                          allergy.severity === 'severe' ? 'bg-red-100 text-red-800' :
                          allergy.severity === 'moderate' ? 'bg-orange-100 text-orange-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {allergy.allergen || allergy} {allergy.severity && `(${allergy.severity})`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Conditions */}
                {selectedRecord.conditions && selectedRecord.conditions.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Medical Conditions</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedRecord.conditions.map((condition, index) => (
                        <span key={index} className={`px-3 py-1 rounded-full text-sm font-medium ${
                          condition.status === 'active' ? 'bg-red-100 text-red-800' :
                          condition.status === 'managed' ? 'bg-blue-100 text-blue-800' :
                          condition.status === 'resolved' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {condition.name || condition} {condition.status && `(${condition.status})`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Follow-up Date */}
                {selectedRecord.followUpDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Follow-up Date</label>
                    <p className="text-blue-600 font-medium bg-blue-50 p-3 rounded-lg">
                      {new Date(selectedRecord.followUpDate).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {/* Created By */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Created By</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                      Dr. {selectedRecord.createdBy?.firstName} {selectedRecord.createdBy?.lastName}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Created Date</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                      {new Date(selectedRecord.createdAt).toLocaleDateString()} at {new Date(selectedRecord.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => setShowViewRecordModal(false)}
                    className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      populateEditForm(selectedRecord);
                      setShowViewRecordModal(false);
                      setShowEditRecordModal(true);
                    }}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Edit Record
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Record Modal */}
        {showEditRecordModal && selectedRecord && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Edit Medical Record</h2>
                  <button
                    onClick={() => setShowEditRecordModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-gray-600 mt-2">
                  Edit {selectedRecord.recordType} - {new Date(selectedRecord.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Primary Diagnosis *
                    </label>
                    <input
                      type="text"
                      value={editFormData.diagnosis}
                      onChange={(e) => setEditFormData({...editFormData, diagnosis: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter primary diagnosis"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority Level
                    </label>
                    <select
                      value={editFormData.priority}
                      onChange={(e) => setEditFormData({...editFormData, priority: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="low">Low Priority</option>
                      <option value="normal">Normal Priority</option>
                      <option value="high">High Priority</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                {/* Treatment Plan */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Treatment Plan *
                  </label>
                  <textarea
                    value={editFormData.treatment}
                    onChange={(e) => setEditFormData({...editFormData, treatment: e.target.value})}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe the treatment plan, procedures, lifestyle modifications, etc."
                  />
                </div>

                {/* Allergies Management */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Patient Allergies
                  </label>
                  <div className="space-y-3">
                    {editFormData.allergies.map((allergy, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <input
                          type="text"
                          value={allergy.allergen || allergy}
                          onChange={(e) => {
                            const newAllergies = [...editFormData.allergies];
                            if (typeof allergy === 'string') {
                              newAllergies[index] = { allergen: e.target.value, severity: 'mild' };
                            } else {
                              newAllergies[index].allergen = e.target.value;
                            }
                            setEditFormData({...editFormData, allergies: newAllergies});
                          }}
                          className="flex-1 px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500"
                          placeholder="Allergy name"
                        />
                        <select
                          value={allergy.severity || 'mild'}
                          onChange={(e) => {
                            const newAllergies = [...editFormData.allergies];
                            if (typeof allergy === 'string') {
                              newAllergies[index] = { allergen: allergy, severity: e.target.value };
                            } else {
                              newAllergies[index].severity = e.target.value;
                            }
                            setEditFormData({...editFormData, allergies: newAllergies});
                          }}
                          className="px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500"
                        >
                          <option value="mild">Mild</option>
                          <option value="moderate">Moderate</option>
                          <option value="severe">Severe</option>
                        </select>
                        <button
                          onClick={() => {
                            const newAllergies = editFormData.allergies.filter((_, i) => i !== index);
                            setEditFormData({...editFormData, allergies: newAllergies});
                          }}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        setEditFormData({
                          ...editFormData,
                          allergies: [...editFormData.allergies, { allergen: '', severity: 'mild' }]
                        });
                      }}
                      className="w-full px-4 py-2 border-2 border-dashed border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      + Add Allergy
                    </button>
                  </div>
                </div>

                {/* Conditions Management */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Medical Conditions
                  </label>
                  <div className="space-y-3">
                    {editFormData.conditions.map((condition, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <input
                          type="text"
                          value={condition.name || condition}
                          onChange={(e) => {
                            const newConditions = [...editFormData.conditions];
                            if (typeof condition === 'string') {
                              newConditions[index] = { name: e.target.value, status: 'active' };
                            } else {
                              newConditions[index].name = e.target.value;
                            }
                            setEditFormData({...editFormData, conditions: newConditions});
                          }}
                          className="flex-1 px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                          placeholder="Condition name"
                        />
                        <select
                          value={condition.status || 'active'}
                          onChange={(e) => {
                            const newConditions = [...editFormData.conditions];
                            if (typeof condition === 'string') {
                              newConditions[index] = { name: condition, status: e.target.value };
                            } else {
                              newConditions[index].status = e.target.value;
                            }
                            setEditFormData({...editFormData, conditions: newConditions});
                          }}
                          className="px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                        >
                          <option value="active">Active</option>
                          <option value="managed">Managed</option>
                          <option value="resolved">Resolved</option>
                          <option value="monitoring">Monitoring</option>
                        </select>
                        <button
                          onClick={() => {
                            const newConditions = editFormData.conditions.filter((_, i) => i !== index);
                            setEditFormData({...editFormData, conditions: newConditions});
                          }}
                          className="p-2 text-yellow-600 hover:bg-yellow-100 rounded-lg"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        setEditFormData({
                          ...editFormData,
                          conditions: [...editFormData.conditions, { name: '', status: 'active' }]
                        });
                      }}
                      className="w-full px-4 py-2 border-2 border-dashed border-yellow-300 text-yellow-600 rounded-lg hover:bg-yellow-50 transition-colors"
                    >
                      + Add Condition
                    </button>
                  </div>
                </div>

                {/* Medications */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prescribed Medications
                  </label>
                  <div className="space-y-3">
                    {editFormData.medications.map((medication, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <input
                          type="text"
                          value={medication.name}
                          onChange={(e) => {
                            const newMedications = [...editFormData.medications];
                            newMedications[index].name = e.target.value;
                            setEditFormData({...editFormData, medications: newMedications});
                          }}
                          className="px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Medication name"
                        />
                        <input
                          type="text"
                          value={medication.dosage}
                          onChange={(e) => {
                            const newMedications = [...editFormData.medications];
                            newMedications[index].dosage = e.target.value;
                            setEditFormData({...editFormData, medications: newMedications});
                          }}
                          className="px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Dosage"
                        />
                        <input
                          type="text"
                          value={medication.frequency}
                          onChange={(e) => {
                            const newMedications = [...editFormData.medications];
                            newMedications[index].frequency = e.target.value;
                            setEditFormData({...editFormData, medications: newMedications});
                          }}
                          className="px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Frequency"
                        />
                        <button
                          onClick={() => {
                            const newMedications = editFormData.medications.filter((_, i) => i !== index);
                            setEditFormData({...editFormData, medications: newMedications});
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        setEditFormData({
                          ...editFormData,
                          medications: [...editFormData.medications, { name: '', dosage: '', frequency: '' }]
                        });
                      }}
                      className="w-full px-4 py-2 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      + Add Medication
                    </button>
                  </div>
                </div>

                {/* Additional Notes and Follow-up */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Notes
                    </label>
                    <textarea
                      value={editFormData.notes}
                      onChange={(e) => setEditFormData({...editFormData, notes: e.target.value})}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Any additional notes, instructions, or observations"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Follow-up Date
                    </label>
                    <input
                      type="date"
                      value={editFormData.followUpDate}
                      onChange={(e) => setEditFormData({...editFormData, followUpDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => setShowEditRecordModal(false)}
                    className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      // Validation
                      if (!editFormData.diagnosis.trim()) {
                        toast.error('Please enter a primary diagnosis');
                        return;
                      }
                      if (!editFormData.treatment.trim()) {
                        toast.error('Please enter a treatment plan');
                        return;
                      }

                      let button = null;
                      try {
                        // Show loading state
                        button = document.activeElement;
                        button.textContent = 'Updating...';
                        button.disabled = true;

                        // Update medical record
                        const result = await updateMedicalRecord(selectedRecord._id, editFormData);
                        
                        if (result.success) {
                          toast.success('Medical record updated successfully!');
                          setShowEditRecordModal(false);
                          setSelectedRecord(null);
                        }
                      } catch (error) {
                        console.error('Failed to update medical record:', error);
                        toast.error(error.message || 'Failed to update medical record. Please try again.');
                      } finally {
                        // Always reset button state
                        if (button) {
                          button.textContent = 'Update Record';
                          button.disabled = false;
                        }
                      }
                    }}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    Update Record
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientRecords;