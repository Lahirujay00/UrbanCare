import React, { useState } from 'react';
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
  EnvelopeIcon
} from '@heroicons/react/24/outline';

const PatientRecords = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCondition, setFilterCondition] = useState('all');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Mock patient records data
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

  const filteredPatients = patientRecords.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.conditions.some(condition => condition.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCondition = filterCondition === 'all' || 
                            patient.conditions.some(condition => condition.toLowerCase().includes(filterCondition.toLowerCase()));
    return matchesSearch && matchesCondition;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Patient Records</h1>
          <p className="text-gray-600">Access and manage patient medical records</p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Patients</label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by patient name or condition..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Condition Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Condition</label>
              <div className="relative">
                <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={filterCondition}
                  onChange={(e) => setFilterCondition(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="all">All Conditions</option>
                  <option value="diabetes">Diabetes</option>
                  <option value="hypertension">Hypertension</option>
                  <option value="migraine">Migraine</option>
                  <option value="anxiety">Anxiety</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Patient List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">Patients ({filteredPatients.length})</h2>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {filteredPatients.map((patient) => (
                  <div
                    key={patient.id}
                    onClick={() => setSelectedPatient(patient)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedPatient?.id === patient.id ? 'bg-green-50 border-l-4 border-l-green-500' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center">
                        <UserIcon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm">{patient.name}</h3>
                        <p className="text-xs text-gray-500">Age: {patient.age} • {patient.gender}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(patient.status)}`}>
                            {patient.status.replace('-', ' ').toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

                {/* Patient Details */}
          <div className="lg:col-span-2">
            {selectedPatient ? (
              <div className="space-y-6">
                
                {/* Tab Navigation */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
                  <div className="border-b border-gray-200">
                    <nav className="flex space-x-8 px-6" aria-label="Tabs">
                      {[
                        { id: 'overview', name: 'Overview', icon: UserIcon },
                        { id: 'history', name: 'Medical History', icon: DocumentTextIcon },
                        { id: 'prescriptions', name: 'Prescriptions', icon: HeartIcon },
                        { id: 'labs', name: 'Lab Results', icon: ClockIcon },
                        { id: 'appointments', name: 'Appointments', icon: CalendarIcon }
                      ].map((tab) => {
                        const Icon = tab.icon;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                              activeTab === tab.id
                                ? 'border-green-500 text-green-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span>{tab.name}</span>
                          </button>
                        );
                      })}
                    </nav>
                  </div>
                  
                  <div className="p-6">
                    {activeTab === 'overview' && (
                      <div className="space-y-6">                {/* Patient Overview */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl flex items-center justify-center">
                        <UserIcon className="w-10 h-10 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">{selectedPatient.name}</h2>
                        <p className="text-gray-600">{selectedPatient.age} years old • {selectedPatient.gender}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedPatient.status)}`}>
                            {selectedPatient.status.replace('-', ' ').toUpperCase()}
                          </span>
                          <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded-full">
                            Blood Type: {selectedPatient.bloodType}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium shadow-md flex items-center space-x-2">
                        <PencilIcon className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-md flex items-center space-x-2">
                        <ArrowDownTrayIcon className="w-4 h-4" />
                        <span>Export</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Contact Information</h3>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <PhoneIcon className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">{selectedPatient.phone}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <EnvelopeIcon className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">{selectedPatient.email}</span>
                        </div>
                        <div className="flex items-start space-x-2">
                          <svg className="w-4 h-4 text-gray-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="text-sm text-gray-600">{selectedPatient.address}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
                          <span className="text-sm text-gray-600">Emergency: {selectedPatient.emergencyContact}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Medical Information</h3>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm font-medium text-gray-700">Allergies:</span>
                          <p className="text-sm text-red-600">{selectedPatient.allergies.join(', ')}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">Conditions:</span>
                          <p className="text-sm text-gray-600">{selectedPatient.conditions.join(', ')}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">Last Visit:</span>
                          <p className="text-sm text-gray-600">{selectedPatient.lastVisit}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">Next Appointment:</span>
                          <p className="text-sm text-gray-600">{selectedPatient.nextAppointment}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                    {/* Prescription History Tab */}
                    {activeTab === 'prescriptions' && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-bold text-gray-900">Prescription History</h3>
                          <button className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium flex items-center space-x-2">
                            <PlusIcon className="w-4 h-4" />
                            <span>New Prescription</span>
                          </button>
                        </div>
                        
                        <div className="space-y-4">
                          {selectedPatient.prescriptions?.map((prescription) => (
                            <div key={prescription.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                                    <HeartIcon className="w-5 h-5 text-white" />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-900">Prescription #{prescription.id}</p>
                                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                                      <CalendarIcon className="w-4 h-4" />
                                      <span>{prescription.date}</span>
                                      <span>•</span>
                                      <span>{prescription.prescribedBy}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex space-x-2">
                                  <button className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors">
                                    <EyeIcon className="w-4 h-4" />
                                  </button>
                                  <button className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors">
                                    <ArrowDownTrayIcon className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                              
                              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                                <h4 className="font-medium text-gray-900 mb-3">Medications</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {prescription.medications.map((med, index) => (
                                    <div key={index} className="bg-white p-3 rounded-lg border border-gray-200">
                                      <div className="font-medium text-gray-900">{med.name}</div>
                                      <div className="text-sm text-gray-600">{med.dosage} - {med.frequency}</div>
                                      <div className="text-xs text-gray-500">Duration: {med.duration}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              {prescription.instructions && (
                                <div className="bg-blue-50 p-4 rounded-lg">
                                  <h4 className="font-medium text-blue-900 mb-2">Instructions</h4>
                                  <p className="text-blue-800 text-sm">{prescription.instructions}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Lab Results Tab */}
                    {activeTab === 'labs' && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-bold text-gray-900">Laboratory Results</h3>
                          <button className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2">
                            <PlusIcon className="w-4 h-4" />
                            <span>Order Lab</span>
                          </button>
                        </div>
                        
                        <div className="space-y-4">
                          {selectedPatient.labResults?.map((lab) => (
                            <div key={lab.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                                    <DocumentTextIcon className="w-5 h-5 text-white" />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-900">{lab.type}</p>
                                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                                      <CalendarIcon className="w-4 h-4" />
                                      <span>{lab.date}</span>
                                      <span>•</span>
                                      <span>Ordered by {lab.orderedBy}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex space-x-2">
                                  <button className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors">
                                    <EyeIcon className="w-4 h-4" />
                                  </button>
                                  <button className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors">
                                    <ArrowDownTrayIcon className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                              
                              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                                <h4 className="font-medium text-gray-900 mb-3">Results</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {Object.entries(lab.results).map(([test, data]) => (
                                    <div key={test} className="bg-white p-3 rounded-lg border border-gray-200">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <div className="font-medium text-gray-900">{test}</div>
                                          <div className="text-sm text-gray-600">{data.range}</div>
                                        </div>
                                        <div className="text-right">
                                          <div className={`font-bold ${
                                            data.status === 'normal' ? 'text-green-600' :
                                            data.status === 'high' ? 'text-red-600' :
                                            data.status === 'low' ? 'text-yellow-600' : 'text-gray-600'
                                          }`}>{data.value}</div>
                                          <div className={`text-xs ${
                                            data.status === 'normal' ? 'text-green-500' :
                                            data.status === 'high' ? 'text-red-500' :
                                            data.status === 'low' ? 'text-yellow-500' : 'text-gray-500'
                                          }`}>{data.status.toUpperCase()}</div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              {lab.notes && (
                                <div className="bg-yellow-50 p-4 rounded-lg">
                                  <h4 className="font-medium text-yellow-900 mb-2">Notes</h4>
                                  <p className="text-yellow-800 text-sm">{lab.notes}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Appointments Tab */}
                    {activeTab === 'appointments' && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-bold text-gray-900">Upcoming Appointments</h3>
                          <button 
                            onClick={() => setShowScheduleModal(true)}
                            className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium flex items-center space-x-2"
                          >
                            <PlusIcon className="w-4 h-4" />
                            <span>Schedule Appointment</span>
                          </button>
                        </div>
                        
                        <div className="space-y-4">
                          {selectedPatient.appointments?.map((appointment) => (
                            <div key={appointment.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                                    <CalendarIcon className="w-6 h-6 text-white" />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-gray-900">{appointment.type}</h4>
                                    <p className="text-sm text-gray-600">{appointment.reason}</p>
                                    <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                                      <CalendarIcon className="w-4 h-4" />
                                      <span>{appointment.date} at {appointment.time}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    appointment.status === 'scheduled' ? 'bg-green-100 text-green-800' :
                                    appointment.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {appointment.status.toUpperCase()}
                                  </span>
                                  <button className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors">
                                    <PencilIcon className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Vital Signs */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Current Vital Signs</h3>
                    <button className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-lg hover:bg-green-200 transition-colors">
                      Update Vitals
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center p-3 bg-gradient-to-br from-red-50 to-red-100 rounded-xl">
                      <div className="text-lg font-bold text-red-700">{selectedPatient.vitals.bloodPressure}</div>
                      <div className="text-xs text-red-600">Blood Pressure</div>
                    </div>
                    <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                      <div className="text-lg font-bold text-blue-700">{selectedPatient.vitals.heartRate}</div>
                      <div className="text-xs text-blue-600">Heart Rate</div>
                    </div>
                    <div className="text-center p-3 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl">
                      <div className="text-lg font-bold text-yellow-700">{selectedPatient.vitals.temperature}</div>
                      <div className="text-xs text-yellow-600">Temperature</div>
                    </div>
                    <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                      <div className="text-lg font-bold text-green-700">{selectedPatient.vitals.weight}</div>
                      <div className="text-xs text-green-600">Weight</div>
                    </div>
                    <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                      <div className="text-lg font-bold text-purple-700">{selectedPatient.vitals.height}</div>
                      <div className="text-xs text-purple-600">Height</div>
                    </div>
                  </div>
                </div>

                {/* Medical Records */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Medical Records</h3>
                    <button className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium flex items-center space-x-2">
                      <PlusIcon className="w-4 h-4" />
                      <span>Add Record</span>
                    </button>
                  </div>
                  <div className="space-y-4">
                    {selectedPatient.records.map((record) => (
                      <div key={record.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                              <DocumentTextIcon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{record.type}</h4>
                              <div className="flex items-center space-x-2 text-sm text-gray-500">
                                <CalendarIcon className="w-4 h-4" />
                                <span>{record.date}</span>
                                <span>•</span>
                                <span>{record.doctor}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors">
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors">
                              <PencilIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="mb-2">
                            <span className="text-sm font-medium text-gray-700">Diagnosis:</span>
                            <p className="text-sm text-gray-600">{record.diagnosis}</p>
                          </div>
                          <div className="mb-2">
                            <span className="text-sm font-medium text-gray-700">Treatment:</span>
                            <p className="text-sm text-gray-600">{record.treatment}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-700">Notes:</span>
                            <p className="text-sm text-gray-600">{record.notes}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <UserIcon className="w-12 h-12 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Patient</h3>
                <p className="text-gray-500">Choose a patient from the list to view their detailed medical records</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientRecords;