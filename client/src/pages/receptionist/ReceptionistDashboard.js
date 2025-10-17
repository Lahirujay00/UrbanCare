import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  UserPlusIcon,
  IdentificationIcon,
  ClipboardDocumentListIcon,
  DocumentMagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ReceptionistDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Patient verification state (for tab 2)
  const [patientsForVerification, setPatientsForVerification] = useState([]);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [nicImageUrl, setNicImageUrl] = useState(null);
  const [verificationNote, setVerificationNote] = useState('');
  
  // Medical record creation state
  const [medicalRecordForm, setMedicalRecordForm] = useState({
    recordType: 'consultation',
    title: '',
    description: '',
    treatmentPlan: '',
    diagnosis: {
      primary: '',
      severity: 'moderate',
      secondary: []
    },
    labTests: [],
    prescriptions: []
  });

  const tabs = [
    { id: 'search', name: 'Patient Search', icon: MagnifyingGlassIcon },
    { id: 'verify', name: 'Verify Identity', icon: ShieldCheckIcon },
    { id: 'records', name: 'Create Record', icon: ClipboardDocumentListIcon }
  ];

  // Fetch patients for verification when switching to verify tab
  useEffect(() => {
    if (activeTab === 'verify') {
      fetchPatientsForVerification();
    }
  }, [activeTab, filterStatus]);

  // Fetch NIC image when a patient is selected in verify tab
  useEffect(() => {
    if (selectedPatient && selectedPatient.nicDocument && activeTab === 'verify') {
      fetchNicImage(selectedPatient._id);
    } else {
      setNicImageUrl(null);
    }

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
        setPatientsForVerification(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Failed to load patients for verification');
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

  // Search patients by query
  const searchPatients = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    try {
      setLoading(true);
      const response = await api.get('/users/search', {
        params: { query: searchQuery, role: 'patient' }
      });

      if (response.data.success) {
        setSearchResults(response.data.data.users || []);
        if (response.data.data.users.length === 0) {
          toast.info('No patients found');
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search patients');
    } finally {
      setLoading(false);
    }
  };

  // Create medical record
  const createMedicalRecord = async () => {
    if (!selectedPatient) {
      toast.error('Please select a patient first');
      return;
    }

    if (!medicalRecordForm.title || !medicalRecordForm.description) {
      toast.error('Please fill in required fields (Title and Description)');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/medical-records', {
        patient: selectedPatient._id,
        ...medicalRecordForm,
        createdBy: user.id || user._id
      });

      if (response.data.success) {
        toast.success('Medical record created successfully!');
        // Reset form
        setMedicalRecordForm({
          recordType: 'consultation',
          title: '',
          description: '',
          treatmentPlan: '',
          diagnosis: {
            primary: '',
            severity: 'moderate',
            secondary: []
          },
          labTests: [],
          prescriptions: []
        });
      }
    } catch (error) {
      console.error('Create record error:', error);
      toast.error(error.response?.data?.message || 'Failed to create medical record');
    } finally {
      setLoading(false);
    }
  };

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

  const filteredPatientsForVerification = patientsForVerification.filter(patient => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      patient.firstName?.toLowerCase().includes(searchLower) ||
      patient.lastName?.toLowerCase().includes(searchLower) ||
      patient.email?.toLowerCase().includes(searchLower) ||
      patient.nicNumber?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl">
                <UserIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Receptionist Dashboard</h1>
                <p className="text-gray-600 mt-1">Welcome back, {user?.firstName}! Manage patient records and verifications.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-8">
          <div className="border-b border-gray-200 bg-gray-50">
            <nav className="flex -mb-px">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 group inline-flex items-center justify-center px-6 py-4 border-b-2 font-semibold text-sm transition-all ${
                      activeTab === tab.id
                        ? 'border-purple-600 text-purple-600 bg-white'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`-ml-0.5 mr-2 h-5 w-5 ${
                      activeTab === tab.id ? 'text-purple-600' : 'text-gray-400 group-hover:text-gray-500'
                    }`} />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-8">
            {/* Patient Search Tab */}
            {activeTab === 'search' && (
              <div>
                <div className="flex items-center space-x-3 mb-6">
                  <MagnifyingGlassIcon className="w-6 h-6 text-purple-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Search Patients</h2>
                </div>
                
                <div className="mb-8">
                  <div className="flex space-x-4">
                    <div className="flex-1 relative">
                      <MagnifyingGlassIcon className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && searchPatients()}
                        placeholder="Enter Health Card ID, name, email, or phone..."
                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                      />
                    </div>
                    <button
                      onClick={searchPatients}
                      disabled={loading}
                      className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all font-semibold flex items-center space-x-2 disabled:opacity-50 shadow-lg hover:shadow-xl"
                    >
                      <MagnifyingGlassIcon className="w-5 h-5" />
                      <span>Search</span>
                    </button>
                  </div>
                </div>

                {/* Search Results */}
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="text-gray-600 mt-4">Searching...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Search Results ({searchResults.length})
                    </h3>
                    {searchResults.map((patient) => (
                      <div
                        key={patient._id}
                        className="border-2 border-gray-200 rounded-xl p-6 hover:border-purple-500 hover:shadow-lg transition-all cursor-pointer bg-white"
                        onClick={() => {
                          setSelectedPatient(patient);
                          setActiveTab('records');
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl flex items-center justify-center">
                              <UserIcon className="w-7 h-7 text-purple-600" />
                            </div>
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900 mb-1">
                                {patient.firstName} {patient.lastName}
                              </h4>
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <span className="flex items-center space-x-1">
                                  <IdentificationIcon className="w-4 h-4" />
                                  <span>{patient.digitalHealthCardId || 'No Health Card'}</span>
                                </span>
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
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPatient(patient);
                              setActiveTab('records');
                            }}
                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all text-sm font-semibold shadow-md"
                          >
                            Select Patient
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            )}

            {/* Identity Verification Tab */}
            {activeTab === 'verify' && (
              <div>
                <div className="flex items-center space-x-3 mb-6">
                  <ShieldCheckIcon className="w-6 h-6 text-purple-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Verify Patient Identity</h2>
                </div>

                {/* Search and Filter */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 mb-6 border border-purple-100">
                  <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                      <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name, email, or NIC..."
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    {/* Status Filter */}
                    <div className="flex space-x-2">
                      {['all', 'pending', 'verified', 'rejected'].map((status) => (
                        <button
                          key={status}
                          onClick={() => setFilterStatus(status)}
                          className={`px-4 py-3 rounded-lg font-semibold text-sm transition-all shadow-sm ${
                            filterStatus === status
                              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md'
                              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
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
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="text-gray-600 mt-4">Loading patients...</p>
                  </div>
                ) : filteredPatientsForVerification.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-12 text-center">
                    <DocumentMagnifyingGlassIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No patients found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {filteredPatientsForVerification.map((patient) => (
                      <div
                        key={patient._id}
                        className="bg-white rounded-xl shadow-md border-2 border-gray-100 p-6 hover:shadow-lg hover:border-purple-200 transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4 flex-1">
                            <div className="p-3 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl">
                              <UserIcon className="w-6 h-6 text-purple-600" />
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {patient.firstName} {patient.lastName}
                                </h3>
                                {getStatusBadge(patient.identityVerificationStatus || 'unverified')}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600 mb-3">
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

                              <div className="p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
                                <div className="flex items-center space-x-2 text-sm">
                                  <IdentificationIcon className="w-5 h-5 text-purple-600" />
                                  <span className="font-medium text-gray-700">NIC Number:</span>
                                  <span className="text-gray-900 font-mono">
                                    {patient.nicNumber || 'Not provided'}
                                  </span>
                                </div>
                                {patient.nicDocument && (
                                  <div className="mt-2 flex items-center space-x-2">
                                    <DocumentMagnifyingGlassIcon className="w-4 h-4 text-green-600" />
                                    <span className="text-xs text-green-600 font-medium">
                                      NIC Document uploaded
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {new Date(patient.nicDocument.uploadedAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {patient.verificationNote && (
                                <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                  <p className="text-sm text-yellow-800">
                                    <strong>Note:</strong> {patient.verificationNote}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {patient.identityVerificationStatus === 'pending' && (
                            <div className="flex flex-col space-y-2 ml-4">
                              <button
                                onClick={() => setSelectedPatient(patient)}
                                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all text-sm font-semibold flex items-center space-x-2 shadow-md"
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
              </div>
            )}

            {/* Create Medical Record Tab */}
            {activeTab === 'records' && (
              <div>
                <div className="flex items-center space-x-3 mb-6">
                  <ClipboardDocumentListIcon className="w-6 h-6 text-purple-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Create Medical Record</h2>
                </div>
                
                {!selectedPatient ? (
                  <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border-2 border-dashed border-gray-300">
                    <UserIcon className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-6 text-lg">Please select or search for a patient first</p>
                    <button
                      onClick={() => setActiveTab('search')}
                      className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all font-semibold shadow-lg"
                    >
                      Search for Patient
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Selected Patient Info */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6">
                      <p className="text-sm text-blue-600 font-semibold mb-2">Selected Patient</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xl font-bold text-blue-900">
                            {selectedPatient.firstName} {selectedPatient.lastName}
                          </p>
                          <p className="text-sm text-blue-700 mt-1">
                            Health Card ID: {selectedPatient.digitalHealthCardId || 'Not assigned'}
                          </p>
                        </div>
                        <button
                          onClick={() => setSelectedPatient(null)}
                          className="text-blue-600 hover:text-blue-800 font-semibold"
                        >
                          Change Patient
                        </button>
                      </div>
                    </div>

                    {/* Record Form */}
                    <div className="bg-white border-2 border-gray-200 rounded-xl p-6 space-y-6">
                      {/* Record Type */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Record Type</label>
                        <select
                          value={medicalRecordForm.recordType}
                          onChange={(e) => setMedicalRecordForm({ ...medicalRecordForm, recordType: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="consultation">Consultation</option>
                          <option value="diagnosis">Diagnosis</option>
                          <option value="treatment-plan">Treatment Plan</option>
                          <option value="lab-result">Lab Result</option>
                          <option value="prescription">Prescription</option>
                        </select>
                      </div>

                      {/* Title */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Title <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={medicalRecordForm.title}
                          onChange={(e) => setMedicalRecordForm({ ...medicalRecordForm, title: e.target.value })}
                          placeholder="e.g., Annual Check-up, Treatment Plan for..."
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={medicalRecordForm.description}
                          onChange={(e) => setMedicalRecordForm({ ...medicalRecordForm, description: e.target.value })}
                          rows={4}
                          placeholder="Enter detailed description of the medical record..."
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>

                      {/* Treatment Plan */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Treatment Plan</label>
                        <textarea
                          value={medicalRecordForm.treatmentPlan}
                          onChange={(e) => setMedicalRecordForm({ ...medicalRecordForm, treatmentPlan: e.target.value })}
                          rows={3}
                          placeholder="Enter treatment plan details..."
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Primary Diagnosis */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Primary Diagnosis</label>
                          <input
                            type="text"
                            value={medicalRecordForm.diagnosis.primary}
                            onChange={(e) => setMedicalRecordForm({
                              ...medicalRecordForm,
                              diagnosis: { ...medicalRecordForm.diagnosis, primary: e.target.value }
                            })}
                            placeholder="Enter primary diagnosis..."
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>

                        {/* Severity */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Severity</label>
                          <select
                            value={medicalRecordForm.diagnosis.severity}
                            onChange={(e) => setMedicalRecordForm({
                              ...medicalRecordForm,
                              diagnosis: { ...medicalRecordForm.diagnosis, severity: e.target.value }
                            })}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          >
                            <option value="mild">Mild</option>
                            <option value="moderate">Moderate</option>
                            <option value="severe">Severe</option>
                            <option value="critical">Critical</option>
                          </select>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-4 pt-4 border-t-2 border-gray-100">
                        <button
                          onClick={createMedicalRecord}
                          disabled={loading}
                          className="flex-1 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all font-bold disabled:opacity-50 shadow-lg"
                        >
                          {loading ? 'Creating...' : 'Create Medical Record'}
                        </button>
                        <button
                          onClick={() => setSelectedPatient(null)}
                          className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Verification Modal (for verify tab) */}
        {selectedPatient && activeTab === 'verify' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Verify Patient Identity</h2>
                  <button
                    onClick={() => {
                      setSelectedPatient(null);
                      setVerificationNote('');
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XCircleIcon className="w-8 h-8" />
                  </button>
                </div>

                {/* Patient Details */}
                <div className="space-y-6 mb-6">
                  <div className="p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border-2 border-gray-200">
                    <h3 className="font-bold text-gray-900 mb-4 text-lg">Patient Information</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-600 font-semibold">Full Name:</span>
                        <span className="font-bold text-gray-900">{selectedPatient.firstName} {selectedPatient.lastName}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-600 font-semibold">Email:</span>
                        <span className="font-medium text-gray-900">{selectedPatient.email}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-600 font-semibold">Phone:</span>
                        <span className="font-medium text-gray-900">{selectedPatient.phone || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-600 font-semibold">Date of Birth:</span>
                        <span className="font-medium text-gray-900">
                          {selectedPatient.dateOfBirth ? new Date(selectedPatient.dateOfBirth).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600 font-semibold">NIC Number:</span>
                        <span className="font-mono font-bold text-gray-900">{selectedPatient.nicNumber || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* NIC Document Preview */}
                  {selectedPatient.nicDocument && (
                    <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl">
                      <h3 className="font-bold text-gray-900 mb-4 flex items-center space-x-2 text-lg">
                        <DocumentMagnifyingGlassIcon className="w-6 h-6 text-blue-600" />
                        <span>NIC Document</span>
                      </h3>
                      <div className="bg-white rounded-xl p-4 border-2 border-gray-200">
                        {selectedPatient.nicDocument.mimetype?.includes('pdf') ? (
                          <div className="text-center py-8">
                            <DocumentMagnifyingGlassIcon className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                            <p className="text-sm text-gray-600 mb-4">PDF Document</p>
                            <a
                              href={`${process.env.REACT_APP_API_URL}/users/nic-document/${selectedPatient._id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
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
                                className="w-full rounded-xl border-2 border-gray-300 max-h-96 object-contain"
                              />
                            ) : (
                              <div className="text-center py-8">
                                <div className="animate-pulse">
                                  <div className="w-full h-64 bg-gray-200 rounded-xl"></div>
                                  <p className="text-sm text-gray-500 mt-4">Loading image...</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-3">
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
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Verification Note {selectedPatient.nicDocument ? '(Optional)' : '(Required for rejection)'}
                    </label>
                    <textarea
                      value={verificationNote}
                      onChange={(e) => setVerificationNote(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Add any notes about this verification (e.g., document unclear, please re-upload)..."
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4">
                  <button
                    onClick={() => handleVerifyIdentity(selectedPatient._id, 'verified', verificationNote)}
                    className="flex-1 px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all font-bold flex items-center justify-center space-x-2 shadow-lg"
                  >
                    <CheckCircleIcon className="w-6 h-6" />
                    <span>Verify Identity</span>
                  </button>
                  <button
                    onClick={() => handleVerifyIdentity(selectedPatient._id, 'rejected', verificationNote)}
                    className="flex-1 px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all font-bold flex items-center justify-center space-x-2 shadow-lg"
                  >
                    <XCircleIcon className="w-6 h-6" />
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

export default ReceptionistDashboard;
