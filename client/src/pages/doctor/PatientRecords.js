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
  HeartIcon,
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
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPatientProfile(data.data);
      } else {
        setError(data.message || 'Failed to load patient profile');
      }
    } catch (error) {
      console.error('Error fetching patient profile:', error);
      setError('Failed to load patient profile');
      toast.error('Failed to load patient profile');
    } finally {
      setLoading(false);
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
                { id: 'allergies', name: 'Allergies & Conditions', icon: ExclamationTriangleIcon }
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
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                      <PlusIcon className="w-4 h-4 inline mr-2" />
                      Add Record
                    </button>
                  </div>
                </div>

                {medicalRecords?.all && medicalRecords.all.length > 0 ? (
                  <div className="space-y-4">
                    {medicalRecords.all.map((record) => (
                      <div key={record._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
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
                                {new Date(record.createdAt).toLocaleDateString()} - 
                                Dr. {record.createdBy?.firstName} {record.createdBy?.lastName}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg">
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                              <PencilIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="font-medium text-gray-700 mb-1">Diagnosis:</p>
                            <p className="text-gray-600">{record.diagnosis || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-700 mb-1">Treatment:</p>
                            <p className="text-gray-600">{record.treatment || 'N/A'}</p>
                          </div>
                        </div>
                        
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

            {/* Allergies & Conditions Tab */}
            {activeTab === 'allergies' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900">Allergies & Medical Conditions</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Allergies</h4>
                    {patient?.allergies && patient.allergies.length > 0 ? (
                      <div className="space-y-2">
                        {patient.allergies.map((allergy, index) => (
                          <div key={index} className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                            <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-2" />
                            <span className="text-red-800 font-medium">
                              {typeof allergy === 'string' ? allergy : allergy.allergen}
                            </span>
                            {typeof allergy === 'object' && allergy.severity && (
                              <span className="ml-2 px-2 py-1 bg-red-200 text-red-800 text-xs rounded">
                                {allergy.severity}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No known allergies</p>
                    )}
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Chronic Conditions</h4>
                    {patient?.chronicConditions && patient.chronicConditions.length > 0 ? (
                      <div className="space-y-2">
                        {patient.chronicConditions.map((condition, index) => (
                          <div key={index} className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <HeartIcon className="w-5 h-5 text-yellow-600 mr-2" />
                            <span className="text-yellow-800 font-medium">{condition}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No chronic conditions recorded</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientRecords;