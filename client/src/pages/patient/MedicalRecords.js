import React, { useState, useEffect } from 'react';
import { 
  DocumentTextIcon, 
  EyeIcon, 
  ArrowDownTrayIcon,
  CalendarIcon,
  UserIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  HeartIcon,
  BeakerIcon,
  CameraIcon,
  FunnelIcon,
  ClockIcon,
  CloudArrowUpIcon,
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { medicalRecordsAPI, documentAPI } from '../../services/api';
import toast from 'react-hot-toast';

const MedicalRecords = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Server base URL for static file access (without /api)
  const SERVER_BASE = process.env.REACT_APP_API_URL 
    ? process.env.REACT_APP_API_URL.replace('/api', '') 
    : 'http://localhost:5000';
  
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    category: 'lab-report',
    file: null,
    previewUrl: null
  });

  useEffect(() => {
    fetchMedicalRecords();
    fetchUploadedDocuments();
  }, []);

  useEffect(() => {
    filterRecords();
  }, [records, selectedCategory, searchTerm]);

  const fetchMedicalRecords = async () => {
    try {
      setLoading(true);
      const response = await medicalRecordsAPI.getRecords();
      
      if (response.data.success) {
        const recordsList = response.data.data.records || [];
        setRecords(recordsList);
        setFilteredRecords(recordsList);
      }
    } catch (error) {
      console.error('Error fetching medical records:', error);
      toast.error('Failed to load medical records');
    } finally {
      setLoading(false);
    }
  };

  const fetchUploadedDocuments = async () => {
    if (!user?.id && !user?._id) return;
    
    try {
      setLoadingDocuments(true);
      const patientId = user.id || user._id;
      const response = await documentAPI.getPatientDocuments(patientId);
      console.log('Fetched documents response:', response.data);
      
      if (response.data.success && response.data.data) {
        setUploadedDocuments(response.data.data.documents || []);
      } else {
        setUploadedDocuments([]);
      }
    } catch (error) {
      console.error('Error fetching uploaded documents:', error);
      // Don't show error toast if it's just a connection issue
      if (error.response) {
        toast.error('Failed to load uploaded documents');
      }
    } finally {
      setLoadingDocuments(false);
    }
  };

  const filterRecords = () => {
    let filtered = records;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(record => 
        record.recordType === selectedCategory
      );
    }
    
    if (searchTerm.trim()) {
      filtered = filtered.filter(record =>
        record.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.diagnosis?.primary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.recordType?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredRecords(filtered);
  };

  const handleViewRecord = (record) => {
    setSelectedRecord(record);
    setShowModal(true);
  };

  const handleUploadDocument = async () => {
    if (!uploadForm.title.trim()) {
      toast.error('Please enter a document title');
      return;
    }
    if (!uploadForm.file) {
      toast.error('Please select a file to upload');
      return;
    }

    try {
      setUploadingDocument(true);
      
      const formData = new FormData();
      formData.append('document', uploadForm.file);
      formData.append('title', uploadForm.title);
      formData.append('description', uploadForm.description);
      formData.append('documentType', uploadForm.category);
      formData.append('category', uploadForm.category);
      formData.append('uploadedBy', 'patient');
      formData.append('status', 'approved'); // Auto-approved for patient uploads
      
      // Upload document to server
      const response = await documentAPI.uploadDocument(formData);
      
      if (response.data.success) {
        toast.success('Document uploaded successfully!');
        setShowUploadModal(false);
        
        // Clean up preview URL to prevent memory leaks
        if (uploadForm.previewUrl) {
          URL.revokeObjectURL(uploadForm.previewUrl);
        }
        
        setUploadForm({
          title: '',
          description: '',
          category: 'lab-report',
          file: null,
          previewUrl: null
        });
        // Refresh uploaded documents list
        fetchUploadedDocuments();
      } else {
        throw new Error(response.data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to upload document';
      toast.error(errorMessage);
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only PDF, JPEG, and PNG files are allowed');
        return;
      }
      
      // Create preview URL for images
      let previewUrl = null;
      if (file.type.startsWith('image/')) {
        previewUrl = URL.createObjectURL(file);
      }
      
      setUploadForm({ ...uploadForm, file, previewUrl });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCategoryIcon = (type) => {
    const icons = {
      'diagnosis': ChartBarIcon,
      'prescription': DocumentTextIcon,
      'lab-result': BeakerIcon,
      'imaging': CameraIcon,
      'surgery': HeartIcon,
      'vaccination': HeartIcon,
      'consultation': UserIcon,
      'other': DocumentTextIcon
    };
    return icons[type] || DocumentTextIcon;
  };

  const getCategoryColor = (type) => {
    const colors = {
      'diagnosis': 'bg-blue-100 text-blue-600',
      'prescription': 'bg-green-100 text-green-600',
      'lab-result': 'bg-purple-100 text-purple-600',
      'imaging': 'bg-yellow-100 text-yellow-600',
      'surgery': 'bg-red-100 text-red-600',
      'vaccination': 'bg-indigo-100 text-indigo-600',
      'consultation': 'bg-pink-100 text-pink-600',
      'other': 'bg-gray-100 text-gray-600'
    };
    return colors[type] || 'bg-gray-100 text-gray-600';
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      'high': 'bg-red-100 text-red-700',
      'normal': 'bg-blue-100 text-blue-700',
      'low': 'bg-gray-100 text-gray-700'
    };
    return badges[priority] || badges.normal;
  };

  const categories = [
    { value: 'all', label: 'All Records', icon: DocumentTextIcon },
    { value: 'diagnosis', label: 'Diagnosis', icon: ChartBarIcon },
    { value: 'prescription', label: 'Prescriptions', icon: DocumentTextIcon },
    { value: 'lab-result', label: 'Lab Results', icon: BeakerIcon },
    { value: 'imaging', label: 'Imaging', icon: CameraIcon },
    { value: 'surgery', label: 'Surgery', icon: HeartIcon },
    { value: 'vaccination', label: 'Vaccinations', icon: HeartIcon },
    { value: 'consultation', label: 'Consultations', icon: UserIcon }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">Medical Records</h1>
                <p className="text-blue-100 text-lg">View and manage your health history</p>
              </div>
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center space-x-2 px-6 py-3 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-all duration-200 transform hover:scale-105 shadow-lg font-semibold"
              >
                <CloudArrowUpIcon className="w-5 h-5" />
                <span>Upload Document</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{records.length}</p>
                <p className="text-sm text-gray-600">Total Records</p>
              </div>
              <DocumentTextIcon className="w-10 h-10 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {records.filter(r => r.recordType === 'prescription').length}
                </p>
                <p className="text-sm text-gray-600">Prescriptions</p>
              </div>
              <DocumentTextIcon className="w-10 h-10 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {records.filter(r => r.recordType === 'lab-result').length}
                </p>
                <p className="text-sm text-gray-600">Lab Results</p>
              </div>
              <BeakerIcon className="w-10 h-10 text-purple-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {records.filter(r => r.recordType === 'imaging').length}
                </p>
                <p className="text-sm text-gray-600">Imaging</p>
              </div>
              <CameraIcon className="w-10 h-10 text-yellow-500" />
            </div>
          </div>
        </div>

        {/* Info Sidebar */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 mb-8 shadow-lg">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <DocumentTextIcon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-3">How to Manage Your Medical Records</h3>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start space-x-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p><strong>Review Records:</strong> View all medical records created by doctors and hospital staff during your visits</p>
                </div>
                <div className="flex items-start space-x-2">
                  <CloudArrowUpIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p><strong>Upload Documents:</strong> Add your own medical documents (lab results, prescriptions, imaging, etc.) to your records</p>
                </div>
                <div className="flex items-start space-x-2">
                  <ArrowDownTrayIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p><strong>Download:</strong> Download any medical record for your personal files or sharing with other healthcare providers</p>
                </div>
              </div>
              <button
                onClick={() => setShowUploadModal(true)}
                className="mt-4 w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold shadow-md"
              >
                <CloudArrowUpIcon className="w-5 h-5" />
                <span>Upload Your Document</span>
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search records..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-3">
            {categories.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setSelectedCategory(value)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-all duration-200 ${
                  selectedCategory === value
                    ? 'border-blue-600 bg-blue-50 text-blue-600 font-semibold'
                    : 'border-gray-200 hover:border-blue-300 text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Uploaded Documents Section */}
        <div className="bg-white rounded-2xl shadow-xl mb-8">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CloudArrowUpIcon className="w-6 h-6 text-indigo-600" />
                <h2 className="text-xl font-bold text-gray-900">
                  My Uploaded Documents ({uploadedDocuments.length})
                </h2>
              </div>
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-semibold shadow-md"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Upload New</span>
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {loadingDocuments ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading documents...</p>
              </div>
            ) : uploadedDocuments.length > 0 ? (
              <div className="space-y-4">
                {uploadedDocuments.map((doc) => {
                  return (
                    <div
                      key={doc._id}
                      className="border-2 border-gray-200 rounded-xl p-6 hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <DocumentTextIcon className="w-6 h-6 text-indigo-600" />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {doc.title}
                              </h3>
                            </div>
                            
                            {doc.description && (
                              <p className="text-gray-600 text-sm mb-3">{doc.description}</p>
                            )}
                            
                            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                              <div className="flex items-center space-x-1">
                                <CalendarIcon className="w-4 h-4" />
                                <span>Uploaded: {formatDate(doc.uploadedAt || doc.createdAt)}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <DocumentTextIcon className="w-4 h-4" />
                                <span>Type: {doc.documentType?.replace(/-/g, ' ').toUpperCase() || 'N/A'}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <span className="font-semibold">{(doc.fileSize / 1024).toFixed(1)} KB</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {doc.fileUrl && (
                            <a
                              href={`${SERVER_BASE}${doc.fileUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Document"
                            >
                              <EyeIcon className="w-5 h-5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <CloudArrowUpIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Documents Uploaded Yet</h3>
                <p className="text-gray-600 mb-4">
                  Upload your medical documents to get them reviewed and added to your official records.
                </p>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold shadow-md"
                >
                  <CloudArrowUpIcon className="w-5 h-5" />
                  <span>Upload Your First Document</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Records List */}
        <div className="bg-white rounded-2xl shadow-xl">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              Your Medical Records ({filteredRecords.length})
            </h2>
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading records...</p>
              </div>
            ) : filteredRecords.length > 0 ? (
              <div className="space-y-4">
                {filteredRecords.map((record) => {
                  const Icon = getCategoryIcon(record.recordType);
                  return (
                    <div
                      key={record._id}
                      className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getCategoryColor(record.recordType)}`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {record.title}
                              </h3>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(record.priority)}`}>
                                {record.priority}
                              </span>
                            </div>
                            
                            <p className="text-gray-600 mb-3">
                              {record.diagnosis?.primary || record.description || 'No description available'}
                            </p>
                            
                            <div className="flex items-center space-x-6 text-sm text-gray-500">
                              <div className="flex items-center space-x-2">
                                <CalendarIcon className="w-4 h-4" />
                                <span>{formatDate(record.createdAt)}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <UserIcon className="w-4 h-4" />
                                <span>Dr. {record.doctor?.firstName} {record.doctor?.lastName}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <DocumentTextIcon className="w-4 h-4" />
                                <span className="capitalize">{record.recordType?.replace('-', ' ')}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleViewRecord(record)}
                          className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                        >
                          <EyeIcon className="w-4 h-4" />
                          <span>View</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">No medical records found</p>
                {searchTerm || selectedCategory !== 'all' ? (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('all');
                    }}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Clear filters
                  </button>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* View Record Modal */}
      {showModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-900">{selectedRecord.title}</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Record Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Record Type</p>
                  <p className="font-semibold capitalize">{selectedRecord.recordType?.replace('-', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-semibold">{formatDate(selectedRecord.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Doctor</p>
                  <p className="font-semibold">
                    Dr. {selectedRecord.doctor?.firstName} {selectedRecord.doctor?.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Priority</p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(selectedRecord.priority)}`}>
                    {selectedRecord.priority}
                  </span>
                </div>
              </div>

              {selectedRecord.diagnosis?.primary && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Primary Diagnosis</p>
                  <p className="text-gray-900">{selectedRecord.diagnosis.primary}</p>
                  {selectedRecord.diagnosis.severity && (
                    <p className="text-sm text-gray-600 mt-2">
                      Severity: <span className="font-medium">{selectedRecord.diagnosis.severity}</span>
                    </p>
                  )}
                  {selectedRecord.diagnosis.secondary && selectedRecord.diagnosis.secondary.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 mb-1">Secondary Diagnoses:</p>
                      <ul className="list-disc list-inside text-gray-900">
                        {selectedRecord.diagnosis.secondary.map((sec, idx) => (
                          <li key={idx}>{sec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {selectedRecord.symptoms && selectedRecord.symptoms.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Symptoms</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedRecord.symptoms.map((symptom, index) => (
                      <span key={index} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                        {symptom}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedRecord.medications && selectedRecord.medications.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Medications</p>
                  <div className="space-y-2">
                    {selectedRecord.medications.map((med, index) => (
                      <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="font-semibold text-gray-900">{med.name}</p>
                        <p className="text-sm text-gray-600">{med.dosage} - {med.frequency}</p>
                        {med.duration && <p className="text-sm text-gray-600">Duration: {med.duration}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedRecord.testResults && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Test Results</p>
                  <p className="text-gray-900">{selectedRecord.testResults}</p>
                </div>
              )}

              {selectedRecord.notes && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Notes</p>
                  <p className="text-gray-900">{selectedRecord.notes}</p>
                </div>
              )}

              {selectedRecord.followUpDate && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-blue-900">Follow-up Required</p>
                  <p className="text-sm text-blue-700">
                    Date: {formatDate(selectedRecord.followUpDate)}
                  </p>
                  {selectedRecord.followUpInstructions && (
                    <p className="text-sm text-blue-700 mt-1">{selectedRecord.followUpInstructions}</p>
                  )}
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                <ArrowDownTrayIcon className="w-4 h-4" />
                <span>Download</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-2xl">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Upload Medical Document</h3>
                <p className="text-sm text-gray-600 mt-1">Documents will be reviewed by hospital reception before appearing in your records</p>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Info Banner */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <CheckCircleIcon className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">Document Review Process</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Your document will be reviewed by hospital reception staff</li>
                      <li>• Approved documents will appear in your medical records</li>
                      <li>• You'll receive a notification once reviewed</li>
                      <li>• Supported formats: PDF, JPEG, PNG (Max 10MB)</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Document Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Document Title *
                </label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  placeholder="e.g., Blood Test Results - December 2024"
                  className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Document Category *
                </label>
                <select
                  value={uploadForm.category}
                  onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                  className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="lab-report">Lab Report</option>
                  <option value="blood-test">Blood Test</option>
                  <option value="x-ray">X-Ray</option>
                  <option value="mri-scan">MRI Scan</option>
                  <option value="ct-scan">CT Scan</option>
                  <option value="ultrasound">Ultrasound</option>
                  <option value="ecg">ECG</option>
                  <option value="prescription">Prescription</option>
                  <option value="vaccination-record">Vaccination Record</option>
                  <option value="discharge-summary">Discharge Summary</option>
                  <option value="medical-certificate">Medical Certificate</option>
                  <option value="insurance-card">Insurance Card</option>
                  <option value="id-proof">ID Proof</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  rows={4}
                  placeholder="Add any additional details about this document..."
                  className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Upload File *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-500 transition-colors">
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    {uploadForm.file ? (
                      <div className="space-y-4">
                        {/* Image Preview */}
                        {uploadForm.previewUrl ? (
                          <div className="mx-auto w-48 h-48 border-2 border-gray-200 rounded-lg overflow-hidden">
                            <img 
                              src={uploadForm.previewUrl} 
                              alt="Preview" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="mx-auto w-48 h-32 border-2 border-gray-200 rounded-lg flex items-center justify-center bg-gray-50">
                            <div className="text-center">
                              <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                              <p className="text-xs text-gray-500">PDF Document</p>
                            </div>
                          </div>
                        )}
                        
                        {/* File Info */}
                        <div className="text-center">
                          <p className="text-sm font-semibold text-green-600 mb-1">
                            {uploadForm.file.name}
                          </p>
                          <p className="text-xs text-gray-500 mb-2">
                            {(uploadForm.file.size / 1024 / 1024).toFixed(2)} MB • {uploadForm.file.type}
                          </p>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              // Clean up preview URL to prevent memory leaks
                              if (uploadForm.previewUrl) {
                                URL.revokeObjectURL(uploadForm.previewUrl);
                              }
                              setUploadForm({ ...uploadForm, file: null, previewUrl: null });
                            }}
                            className="px-3 py-1 text-sm text-red-600 hover:text-red-700 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            Remove file
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <CloudArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="text-blue-600 font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PDF, JPEG, PNG up to 10MB</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex justify-end space-x-3 rounded-b-2xl">
              <button
                onClick={() => setShowUploadModal(false)}
                disabled={uploadingDocument}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadDocument}
                disabled={uploadingDocument || !uploadForm.title.trim() || !uploadForm.file}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center space-x-2 font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {uploadingDocument ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <CloudArrowUpIcon className="w-5 h-5" />
                    <span>Upload Document</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalRecords;
