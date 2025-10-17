import React, { useState } from 'react';
import { 
  MagnifyingGlassIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  MapPinIcon,
  HeartIcon,
  DocumentTextIcon,
  ClockIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  IdentificationIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import toast from 'react-hot-toast';

const PatientRecordViewer = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientMedicalHistory, setPatientMedicalHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [accessAttempts, setAccessAttempts] = useState(0);

  const searchPatients = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    try {
      setLoading(true);
      setAccessAttempts(prev => prev + 1);
      
      const response = await api.get('/users/search', {
        params: { query: searchQuery, role: 'patient' }
      });

      if (response.data.success) {
        setSearchResults(response.data.data.users || []);
        if (response.data.data.users.length === 0) {
          toast.info('No patients found');
        } else {
          toast.success(`Found ${response.data.data.users.length} patient(s)`);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search patients');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientMedicalHistory = async (patientId) => {
    try {
      console.log('Fetching medical history for patient:', patientId);
      const response = await api.get(`/medical-records/patient/${patientId}`);
      console.log('Medical history response:', response.data);
      if (response.data.success) {
        setPatientMedicalHistory(response.data.data.records || []);
        console.log('Medical records set:', response.data.data.records);
      }
    } catch (error) {
      console.error('Error fetching medical history:', error);
      setPatientMedicalHistory([]);
    }
  };

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    fetchPatientMedicalHistory(patient._id);
    toast.success(`Patient record accessed: ${patient.firstName} ${patient.lastName}`);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedPatient(null);
    setPatientMedicalHistory([]);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Security Header */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
        <div className="flex items-center">
          <ShieldCheckIcon className="w-5 h-5 text-red-600 mr-2" />
          <div>
            <h3 className="text-sm font-semibold text-red-800">Secure Patient Record Access</h3>
            <p className="text-xs text-red-700">
              This system maintains READ-ONLY access to patient records. All access is logged and monitored.
              Access attempts: {accessAttempts}
            </p>
          </div>
        </div>
      </div>

      {/* Search Interface */}
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
        <div className="flex items-center space-x-3 mb-6">
          <MagnifyingGlassIcon className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Patient Record Search</h2>
        </div>
        
        <div className="flex space-x-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchPatients()}
              placeholder="Enter Health Card ID, name, email, or phone..."
              className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            />
          </div>
          <button
            onClick={searchPatients}
            disabled={loading}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold flex items-center space-x-2 disabled:opacity-50 shadow-lg hover:shadow-xl"
          >
            <MagnifyingGlassIcon className="w-5 h-5" />
            <span>Search</span>
          </button>
          {(searchResults.length > 0 || selectedPatient) && (
            <button
              onClick={clearSearch}
              className="px-6 py-4 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors font-semibold"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Search Results */}
      {loading ? (
        <div className="text-center py-12 bg-white rounded-2xl shadow-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Searching...</p>
        </div>
      ) : searchResults.length > 0 && !selectedPatient ? (
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Search Results ({searchResults.length})
          </h3>
          <div className="space-y-4">
            {searchResults.map((patient) => (
              <div
                key={patient._id}
                className="border-2 border-gray-200 rounded-xl p-6 hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer bg-white"
                onClick={() => handleSelectPatient(patient)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
                      <UserIcon className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">
                        {patient.firstName} {patient.lastName}
                      </h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        {patient.digitalHealthCardId && (
                          <span className="flex items-center space-x-1">
                            <IdentificationIcon className="w-4 h-4" />
                            <span>HC: {patient.digitalHealthCardId}</span>
                          </span>
                        )}
                        <span className="flex items-center space-x-1">
                          <EnvelopeIcon className="w-4 h-4" />
                          <span>{patient.email}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <PhoneIcon className="w-4 h-4" />
                          <span>{patient.phone}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-blue-600">Click to view records</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Patient Record Display */}
      {selectedPatient && (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* READ-ONLY Banner */}
          <div className="bg-yellow-100 border-b border-yellow-200 px-6 py-3">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mr-2" />
              <span className="text-sm font-semibold text-yellow-800">READ-ONLY ACCESS</span>
              <span className="text-xs text-yellow-700 ml-2">
                Accessed: {new Date().toLocaleString()}
              </span>
            </div>
          </div>

          {/* Patient Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-6 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mr-4">
                  <UserIcon className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {selectedPatient.firstName} {selectedPatient.lastName}
                  </h3>
                  <div className="flex items-center space-x-4 mt-1">
                    {selectedPatient.digitalHealthCardId && (
                      <p className="text-sm text-gray-600 flex items-center space-x-1">
                        <IdentificationIcon className="w-4 h-4" />
                        <span>Health Card: {selectedPatient.digitalHealthCardId}</span>
                      </p>
                    )}
                    {selectedPatient.nicNumber && (
                      <p className="text-sm text-gray-600">NIC: {selectedPatient.nicNumber}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                {selectedPatient.dateOfBirth && (
                  <p className="text-sm text-gray-600">
                    Age: {Math.floor((new Date() - new Date(selectedPatient.dateOfBirth)) / 31557600000)} years
                  </p>
                )}
                <p className="text-sm text-gray-600 capitalize">
                  Gender: {selectedPatient.gender || 'N/A'}
                </p>
                <p className="text-sm text-gray-600 capitalize">
                  Blood Type: {selectedPatient.bloodType || selectedPatient.medicalInfo?.bloodType || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Patient Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Contact Information */}
              <div className="bg-gray-50 rounded-xl p-5">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <PhoneIcon className="w-5 h-5 mr-2 text-gray-600" />
                  Contact Information
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center">
                    <PhoneIcon className="w-4 h-4 mr-2 text-gray-500" />
                    <span>{selectedPatient.phone || selectedPatient.phoneNumber || 'N/A'}</span>
                  </div>
                  <div className="flex items-center">
                    <EnvelopeIcon className="w-4 h-4 mr-2 text-gray-500" />
                    <span>{selectedPatient.email || 'N/A'}</span>
                  </div>
                  <div className="flex items-start">
                    <MapPinIcon className="w-4 h-4 mr-2 text-gray-500 mt-0.5" />
                    <span>
                      {selectedPatient.address?.city 
                        ? `${selectedPatient.address.city}, ${selectedPatient.address.country || 'Sri Lanka'}`
                        : 'Address not provided'}
                    </span>
                  </div>
                  {(selectedPatient.emergencyContact || selectedPatient.medicalInfo?.emergencyContact) && (
                    <div className="pt-3 border-t">
                      <p className="font-medium text-gray-700 mb-2">Emergency Contact:</p>
                      {selectedPatient.medicalInfo?.emergencyContact ? (
                        <>
                          <p className="text-gray-600">{selectedPatient.medicalInfo.emergencyContact.name}</p>
                          <p className="text-gray-600">{selectedPatient.medicalInfo.emergencyContact.relationship}</p>
                          <p className="text-gray-600">{selectedPatient.medicalInfo.emergencyContact.phoneNumber}</p>
                        </>
                      ) : (
                        <p className="text-gray-600">{selectedPatient.emergencyContact}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Patient Demographics */}
              <div className="bg-gray-50 rounded-xl p-5">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <CalendarIcon className="w-5 h-5 mr-2 text-gray-600" />
                  Patient Demographics
                </h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">Date of Birth:</p>
                    <p>{selectedPatient.dateOfBirth ? formatDate(selectedPatient.dateOfBirth) : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Account Status:</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedPatient.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedPatient.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Identity Verification:</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedPatient.identityVerificationStatus === 'verified' 
                        ? 'bg-green-100 text-green-800' 
                        : selectedPatient.identityVerificationStatus === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedPatient.identityVerificationStatus || 'unverified'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Registered:</p>
                    <p>{selectedPatient.createdAt ? formatDate(selectedPatient.createdAt) : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Last Login:</p>
                    <p>{selectedPatient.lastLogin ? formatDate(selectedPatient.lastLogin) : 'Never'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Medical Information */}
            {(selectedPatient.medicalInfo?.allergies?.length > 0 || selectedPatient.medicalInfo?.chronicConditions?.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Allergies */}
                <div className="bg-red-50 rounded-xl p-5 border border-red-200">
                  <h4 className="text-lg font-semibold text-red-900 mb-3 flex items-center">
                    <HeartIcon className="w-5 h-5 mr-2 text-red-600" />
                    Allergies
                  </h4>
                  <div className="space-y-1">
                    {selectedPatient.medicalInfo?.allergies?.length > 0 ? (
                      selectedPatient.medicalInfo.allergies.map((allergy, index) => (
                        <span
                          key={index}
                          className="inline-block bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-medium mr-2 mb-2"
                        >
                          {allergy}
                        </span>
                      ))
                    ) : (
                      <span className="text-green-700 text-sm">No known allergies</span>
                    )}
                  </div>
                </div>

                {/* Chronic Conditions */}
                <div className="bg-orange-50 rounded-xl p-5 border border-orange-200">
                  <h4 className="text-lg font-semibold text-orange-900 mb-3 flex items-center">
                    <HeartIcon className="w-5 h-5 mr-2 text-orange-600" />
                    Chronic Conditions
                  </h4>
                  <div className="space-y-1">
                    {selectedPatient.medicalInfo?.chronicConditions?.length > 0 ? (
                      selectedPatient.medicalInfo.chronicConditions.map((condition, index) => (
                        <div key={index} className="text-sm text-orange-800">
                          • {condition}
                        </div>
                      ))
                    ) : (
                      <span className="text-green-700 text-sm">No chronic conditions</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Medical Records History */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <DocumentTextIcon className="w-5 h-5 mr-2 text-gray-600" />
                Medical Records ({patientMedicalHistory.length})
              </h4>
              {patientMedicalHistory.length > 0 ? (
                <div className="space-y-4">
                  {patientMedicalHistory.map((record, index) => (
                    <div key={record._id || index} className="bg-white rounded-xl p-5 border-2 border-gray-200 hover:border-blue-300 transition-all">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              record.recordType === 'treatment-plan' 
                                ? 'bg-purple-100 text-purple-800'
                                : record.recordType === 'lab-test'
                                ? 'bg-green-100 text-green-800'
                                : record.recordType === 'diagnosis'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {record.recordType?.replace(/-/g, ' ').toUpperCase() || 'RECORD'}
                            </span>
                            {record.diagnosis && (
                              <span className="text-sm font-semibold text-gray-900">
                                {typeof record.diagnosis === 'object' && record.diagnosis.primary 
                                  ? record.diagnosis.primary 
                                  : typeof record.diagnosis === 'string' 
                                  ? record.diagnosis 
                                  : 'Diagnosis recorded'}
                              </span>
                            )}
                          </div>
                          {record.description && (
                            <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{record.description}</p>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-sm font-medium text-gray-900">
                            {record.visitDate ? formatDate(record.visitDate) : formatDate(record.createdAt)}
                          </p>
                          <div className="flex items-center justify-end text-xs text-gray-500 mt-1">
                            <ClockIcon className="w-3 h-3 mr-1" />
                            <span>Record #{patientMedicalHistory.length - index}</span>
                          </div>
                        </div>
                      </div>
                      
                      {record.doctor && (
                        <div className="border-t pt-3 mt-3">
                          <p className="text-sm text-gray-600">
                            <strong>Doctor:</strong> Dr. {record.doctor.firstName} {record.doctor.lastName}
                            {record.doctor.specialization && ` • ${record.doctor.specialization}`}
                          </p>
                        </div>
                      )}
                      
                      {record.documents && record.documents.length > 0 && (
                        <div className="border-t pt-3 mt-3">
                          <p className="text-sm font-medium text-gray-700 mb-2">Attached Documents ({record.documents.length}):</p>
                          <div className="flex flex-wrap gap-2">
                            {record.documents.map((doc, idx) => (
                              <span key={idx} className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                                <DocumentTextIcon className="w-3 h-3 mr-1" />
                                Document {idx + 1}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <DocumentTextIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No medical records found for this patient</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientRecordViewer;