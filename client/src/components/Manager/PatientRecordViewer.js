import React, { useState } from 'react';
import { Search, Shield, User, Calendar, Phone, Mail, MapPin, Heart, Pill, FileText, Clock, AlertTriangle } from 'lucide-react';
import { mockPatientDB } from '../../data/mockData';
import toast from 'react-hot-toast';

const PatientRecordViewer = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [accessAttempts, setAccessAttempts] = useState(0);

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      toast.error('Please enter a Medical Record Number (MRN)');
      return;
    }

    // Simulate security check
    setAccessAttempts(prev => prev + 1);
    
    const patient = mockPatientDB[searchTerm.trim()];
    if (patient) {
      setSelectedPatient(patient);
      toast.success(`Patient record accessed: ${patient.name}`);
    } else {
      toast.error('Patient record not found. Please verify the MRN.');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSelectedPatient(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Security Header */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <Shield className="w-5 h-5 text-red-600 mr-2" />
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
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Patient Record Search</h2>
        
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Medical Record Number (MRN)
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter MRN (e.g., 12345, 67890, 11111)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            Search
          </button>
          {selectedPatient && (
            <button
              onClick={clearSearch}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Sample MRNs */}
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <p className="text-xs text-gray-600 mb-2">Sample MRNs for testing:</p>
          <div className="flex gap-4 text-xs">
            {Object.keys(mockPatientDB).map(mrn => (
              <button
                key={mrn}
                onClick={() => setSearchTerm(mrn)}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                {mrn} ({mockPatientDB[mrn].name})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Patient Record Display */}
      {selectedPatient && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* READ-ONLY Banner */}
          <div className="bg-yellow-100 border-b border-yellow-200 px-6 py-3">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
              <span className="text-sm font-semibold text-yellow-800">READ-ONLY ACCESS</span>
              <span className="text-xs text-yellow-700 ml-2">
                Last accessed: {new Date().toLocaleString()}
              </span>
            </div>
          </div>

          {/* Patient Header */}
          <div className="bg-blue-50 px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <User className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedPatient.name}</h3>
                  <p className="text-sm text-gray-600">MRN: {selectedPatient.mrn}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Age: {selectedPatient.age}</p>
                <p className="text-sm text-gray-600">Gender: {selectedPatient.gender}</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Patient Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Contact Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Phone className="w-5 h-5 mr-2 text-gray-600" />
                  Contact Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-gray-500" />
                    <span>{selectedPatient.phone}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-2 text-gray-500" />
                    <span>{selectedPatient.email}</span>
                  </div>
                  <div className="flex items-start">
                    <MapPin className="w-4 h-4 mr-2 text-gray-500 mt-0.5" />
                    <span>{selectedPatient.address}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="font-medium text-gray-700">Emergency Contact:</p>
                    <p>{selectedPatient.emergencyContact}</p>
                  </div>
                </div>
              </div>

              {/* Insurance Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-gray-600" />
                  Insurance & Demographics
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">Date of Birth:</p>
                    <p>{formatDate(selectedPatient.dob)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Insurance:</p>
                    <p>{selectedPatient.insurance}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Last Visit:</p>
                    <p>{formatDate(selectedPatient.lastVisit)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Next Appointment:</p>
                    <p>{selectedPatient.nextAppointment}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Medical Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Allergies */}
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <h4 className="text-lg font-semibold text-red-900 mb-3 flex items-center">
                  <Heart className="w-5 h-5 mr-2 text-red-600" />
                  Allergies
                </h4>
                <div className="space-y-1">
                  {selectedPatient.allergies.length > 0 ? (
                    selectedPatient.allergies.map((allergy, index) => (
                      <span
                        key={index}
                        className="inline-block bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium mr-2"
                      >
                        {allergy}
                      </span>
                    ))
                  ) : (
                    <span className="text-green-700 text-sm">No known allergies</span>
                  )}
                </div>
              </div>

              {/* Current Medications */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                  <Pill className="w-5 h-5 mr-2 text-blue-600" />
                  Current Medications
                </h4>
                <div className="space-y-1">
                  {selectedPatient.medications.map((medication, index) => (
                    <div key={index} className="text-sm text-blue-800">
                      • {medication}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Visit History */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-gray-600" />
                Visit History
              </h4>
              <div className="space-y-4">
                {selectedPatient.visitHistory.map((visit, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{visit.reason}</p>
                        <p className="text-sm text-gray-600">{visit.doctor} • {visit.department}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{formatDate(visit.date)}</p>
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <Clock className="w-3 h-3 mr-1" />
                          <span>Visit #{selectedPatient.visitHistory.length - index}</span>
                        </div>
                      </div>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <p className="text-sm text-gray-700 mb-2">
                        <strong>Diagnosis:</strong> {visit.diagnosis}
                      </p>
                      {visit.vitals && (
                        <div className="grid grid-cols-3 gap-4 text-xs text-gray-600">
                          <div>BP: {visit.vitals.bp}</div>
                          <div>Temp: {visit.vitals.temp}</div>
                          <div>Pulse: {visit.vitals.pulse}</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Clinical Notes */}
            <div className="mt-6 bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <h4 className="text-lg font-semibold text-yellow-900 mb-3 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-yellow-600" />
                Clinical Notes
              </h4>
              <p className="text-sm text-yellow-800">{selectedPatient.notes}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientRecordViewer;