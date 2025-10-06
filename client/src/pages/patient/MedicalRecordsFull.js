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
  ClockIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { medicalRecordsAPI } from '../../services/api';
import toast from 'react-hot-toast';

const MedicalRecords = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchMedicalRecords();
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
        record.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.recordType?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredRecords(filtered);
  };

  const handleViewRecord = (record) => {
    setSelectedRecord(record);
    setShowModal(true);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
            <h1 className="text-4xl font-bold mb-2">Medical Records</h1>
            <p className="text-blue-100 text-lg">View and manage your health history</p>
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
                            
                            <p className="text-gray-600 mb-3">{record.diagnosis || record.description || 'No description available'}</p>
                            
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

              {selectedRecord.diagnosis && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Diagnosis</p>
                  <p className="text-gray-900">{selectedRecord.diagnosis}</p>
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
    </div>
  );
};

export default MedicalRecords;
