import React, { useState, useEffect } from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  DocumentMagnifyingGlassIcon,
  IdentificationIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '../../services/api';

const PatientIdentityVerification = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending'); // pending, verified, rejected, all
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [verificationNote, setVerificationNote] = useState('');
  const [nicImageUrl, setNicImageUrl] = useState(null);
  const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchPatientsForVerification();
  }, [filterStatus]);

  // Fetch NIC image when a patient is selected
  useEffect(() => {
    if (selectedPatient && selectedPatient.nicDocument) {
      fetchNicImage(selectedPatient._id);
    } else {
      setNicImageUrl(null);
    }

    // Cleanup blob URL when component unmounts or patient changes
    return () => {
      if (nicImageUrl) {
        URL.revokeObjectURL(nicImageUrl);
      }
    };
  }, [selectedPatient]);

  const fetchNicImage = async (patientId) => {
    try {
      const response = await api.get(`/users/nic-document/${patientId}`, {
        responseType: 'blob'
      });
      const imageUrl = URL.createObjectURL(response.data);
      setNicImageUrl(imageUrl);
    } catch (error) {
      console.error('Error fetching NIC image:', error);
      setNicImageUrl(null);
    }
  };

  const fetchPatientsForVerification = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/patients/verification', {
        params: { status: filterStatus !== 'all' ? filterStatus : undefined }
      });
      
      if (response.data.success) {
        setPatients(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyIdentity = async (patientId, status, note) => {
    try {
      const response = await api.put(`/users/patients/${patientId}/verify-identity`, {
        verificationStatus: status,
        verificationNote: note
      });

      if (response.data.success) {
        toast.success(`Patient identity ${status === 'verified' ? 'verified' : 'rejected'} successfully`);
        fetchPatientsForVerification();
        setSelectedPatient(null);
        setVerificationNote('');
      }
    } catch (error) {
      console.error('Error verifying identity:', error);
      toast.error('Failed to update verification status');
    }
  };

  const filteredPatients = patients.filter(patient => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      patient.firstName?.toLowerCase().includes(searchLower) ||
      patient.lastName?.toLowerCase().includes(searchLower) ||
      patient.email?.toLowerCase().includes(searchLower) ||
      patient.nicNumber?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      verified: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      unverified: 'bg-gray-100 text-gray-800'
    };
    
    const icons = {
      pending: ClockIcon,
      verified: CheckCircleIcon,
      rejected: XCircleIcon,
      unverified: ClockIcon
    };
    
    const Icon = icons[status] || ClockIcon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        <Icon className="w-4 h-4 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ShieldCheckIcon className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Patient Identity Verification</h1>
                <p className="text-gray-600 mt-1">
                  Review and verify patient identity information
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                {patients.filter(p => p.identityVerificationStatus === 'pending').length} Pending
              </span>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            {/* Search */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, or health card number..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="flex space-x-2">
              {['all', 'pending', 'verified', 'rejected'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    filterStatus === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Patients List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading patients...</p>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <DocumentMagnifyingGlassIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No patients found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredPatients.map((patient) => (
              <div
                key={patient._id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Avatar */}
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <UserIcon className="w-6 h-6 text-blue-600" />
                    </div>

                    {/* Patient Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {patient.firstName} {patient.lastName}
                        </h3>
                        {getStatusBadge(patient.identityVerificationStatus || 'unverified')}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <EnvelopeIcon className="w-4 h-4" />
                          <span>{patient.email}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <PhoneIcon className="w-4 h-4" />
                          <span>{patient.phone || 'N/A'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CalendarIcon className="w-4 h-4" />
                          <span>DOB: {patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </div>

                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2 text-sm">
                          <IdentificationIcon className="w-5 h-5 text-gray-500" />
                          <span className="font-medium text-gray-700">NIC Number:</span>
                          <span className="text-gray-900 font-mono">
                            {patient.nicNumber || 'Not provided'}
                          </span>
                        </div>
                        {patient.nicDocument && (
                          <div className="mt-2 flex items-center space-x-2">
                            <DocumentMagnifyingGlassIcon className="w-4 h-4 text-blue-600" />
                            <span className="text-xs text-blue-600 font-medium">
                              NIC Document uploaded
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(patient.nicDocument.uploadedAt).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Verification Note */}
                      {patient.verificationNote && (
                        <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <p className="text-sm text-yellow-800">
                            <strong>Note:</strong> {patient.verificationNote}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {patient.identityVerificationStatus === 'pending' && (
                    <div className="flex flex-col space-y-2 ml-4">
                      <button
                        onClick={() => setSelectedPatient(patient)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center space-x-2"
                      >
                        <DocumentMagnifyingGlassIcon className="w-4 h-4" />
                        <span>Review</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Verification Modal */}
        {selectedPatient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Verify Patient Identity</h2>
                  <button
                    onClick={() => {
                      setSelectedPatient(null);
                      setVerificationNote('');
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircleIcon className="w-6 h-6" />
                  </button>
                </div>

                {/* Patient Details */}
                <div className="space-y-4 mb-6">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">Patient Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Full Name:</span>
                        <span className="font-medium">{selectedPatient.firstName} {selectedPatient.lastName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium">{selectedPatient.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-medium">{selectedPatient.phone || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date of Birth:</span>
                        <span className="font-medium">
                          {selectedPatient.dateOfBirth ? new Date(selectedPatient.dateOfBirth).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">NIC Number:</span>
                        <span className="font-medium font-mono">{selectedPatient.nicNumber || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* NIC Document Preview */}
                  {selectedPatient.nicDocument && (
                    <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                        <DocumentMagnifyingGlassIcon className="w-5 h-5 text-blue-600" />
                        <span>NIC Document</span>
                      </h3>
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        {selectedPatient.nicDocument.mimetype?.includes('pdf') ? (
                          <div className="text-center py-8">
                            <DocumentMagnifyingGlassIcon className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                            <p className="text-sm text-gray-600 mb-4">PDF Document</p>
                            <a
                              href={`${apiBaseUrl}/users/nic-document/${selectedPatient._id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                              View PDF Document
                            </a>
                          </div>
                        ) : (
                          <div className="relative">
                            {nicImageUrl ? (
                              <img
                                src={nicImageUrl}
                                alt="NIC Document"
                                className="w-full rounded-lg border border-gray-300 max-h-96 object-contain"
                              />
                            ) : (
                              <div className="text-center py-8">
                                <div className="animate-pulse">
                                  <div className="w-full h-64 bg-gray-200 rounded-lg"></div>
                                  <p className="text-sm text-gray-500 mt-4">Loading image...</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          Uploaded: {new Date(selectedPatient.nicDocument.uploadedAt).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          File: {selectedPatient.nicDocument.filename}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Verification Note */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Verification Note {selectedPatient.nicDocument ? '(Optional)' : '(Required for rejection)'}
                    </label>
                    <textarea
                      value={verificationNote}
                      onChange={(e) => setVerificationNote(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Add any notes about this verification (e.g., document unclear, please re-upload)..."
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleVerifyIdentity(selectedPatient._id, 'verified', verificationNote)}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center justify-center space-x-2"
                  >
                    <CheckCircleIcon className="w-5 h-5" />
                    <span>Verify Identity</span>
                  </button>
                  <button
                    onClick={() => handleVerifyIdentity(selectedPatient._id, 'rejected', verificationNote)}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold flex items-center justify-center space-x-2"
                  >
                    <XCircleIcon className="w-5 h-5" />
                    <span>Reject</span>
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

export default PatientIdentityVerification;
