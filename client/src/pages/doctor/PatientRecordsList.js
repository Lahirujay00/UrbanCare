import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DocumentTextIcon, 
  UserIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  FunnelIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  HeartIcon,
  ArrowLeftIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const PatientRecordsList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCondition, setFilterCondition] = useState('all');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    filterPatients();
  }, [patients, searchTerm, filterCondition]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/doctor/patients/list?limit=50', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        const patientList = data.data.patients || [];
        setPatients(patientList);
        setFilteredPatients(patientList);
      } else {
        setError(data.message || 'Failed to fetch patients');
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      setError('Failed to fetch patients');
      toast.error('Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  };

  const filterPatients = () => {
    let filtered = patients;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(patient => {
        const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
        const searchLower = searchTerm.toLowerCase();
        return fullName.includes(searchLower) ||
               patient.email?.toLowerCase().includes(searchLower) ||
               patient.digitalHealthCardId?.toLowerCase().includes(searchLower) ||
               (patient.chronicConditions && patient.chronicConditions.some(condition => 
                 condition.toLowerCase().includes(searchLower)
               ));
      });
    }

    // Apply condition filter
    if (filterCondition !== 'all') {
      filtered = filtered.filter(patient => 
        patient.chronicConditions && 
        patient.chronicConditions.some(condition => 
          condition.toLowerCase().includes(filterCondition.toLowerCase())
        )
      );
    }

    setFilteredPatients(filtered);
  };

  const getStatusColor = (hasAllergies, hasConditions) => {
    if (hasAllergies && hasConditions) return 'text-red-600 bg-red-100';
    if (hasAllergies) return 'text-orange-600 bg-orange-100';
    if (hasConditions) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getStatusText = (hasAllergies, hasConditions) => {
    if (hasAllergies && hasConditions) return 'High Risk';
    if (hasAllergies) return 'Allergies';
    if (hasConditions) return 'Conditions';
    return 'Stable';
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

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Patients</h2>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        
        {/* Header with Back Button */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/doctor')}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Patient Records</h1>
              <p className="text-gray-600">Access and manage patient medical records</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Total Patients</p>
            <p className="text-2xl font-bold text-gray-900">{filteredPatients.length}</p>
          </div>
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
                  placeholder="Search by name, email, ID, or condition..."
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
                  <option value="heart">Heart Disease</option>
                  <option value="asthma">Asthma</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Patient Cards Grid */}
        {filteredPatients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPatients.map((patient) => (
              <div key={patient._id} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
                {/* Patient Header */}
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xl font-bold">
                      {patient.firstName?.charAt(0)}{patient.lastName?.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">
                      {patient.firstName} {patient.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {patient.age ? `${patient.age} years` : 'Age N/A'} • {patient.gender || 'N/A'}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(patient.hasAllergies, patient.hasChronicConditions)}`}>
                        {getStatusText(patient.hasAllergies, patient.hasChronicConditions)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Patient Details */}
                <div className="space-y-3 mb-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Blood Type:</span>
                      <span className="ml-2 font-medium">{patient.bloodType || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Records:</span>
                      <span className="ml-2 font-medium">{patient.totalRecords || 0}</span>
                    </div>
                  </div>
                  
                  {patient.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <PhoneIcon className="w-4 h-4 mr-2" />
                      <span>{patient.phone}</span>
                    </div>
                  )}
                  
                  {patient.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <EnvelopeIcon className="w-4 h-4 mr-2" />
                      <span className="truncate">{patient.email}</span>
                    </div>
                  )}

                  {patient.digitalHealthCardId && (
                    <div className="text-sm">
                      <span className="text-gray-500">Health Card:</span>
                      <span className="ml-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                        {patient.digitalHealthCardId}
                      </span>
                    </div>
                  )}
                </div>

                {/* Medical Alerts */}
                {(patient.hasAllergies || patient.hasChronicConditions) && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center text-yellow-800 text-sm">
                      <ExclamationTriangleIcon className="w-4 h-4 mr-2" />
                      <span className="font-medium">Medical Alerts</span>
                    </div>
                    {patient.chronicConditions && patient.chronicConditions.length > 0 && (
                      <div className="mt-1 text-xs text-yellow-700">
                        Conditions: {patient.chronicConditions.slice(0, 2).join(', ')}
                        {patient.chronicConditions.length > 2 && ` +${patient.chronicConditions.length - 2} more`}
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => navigate(`/doctor/patient-records?patientId=${patient._id}`)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <DocumentTextIcon className="w-4 h-4" />
                    <span>View Records</span>
                  </button>
                  <button
                    onClick={() => navigate(`/doctor/appointments?patientId=${patient._id}`)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
                  >
                    <CalendarIcon className="w-4 h-4" />
                    <span>Appointments</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <UserIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Patients Found</h3>
            <p className="text-gray-500">
              {searchTerm || filterCondition !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'No patients have been assigned to you yet'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientRecordsList;
