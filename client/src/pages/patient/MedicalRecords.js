import React, { useState } from 'react';
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
  FunnelIcon
} from '@heroicons/react/24/outline';

const MedicalRecords = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock medical records data
  const medicalRecords = [
    {
      id: 1,
      title: 'Blood Test Results',
      type: 'Lab Report',
      date: '2024-12-20',
      doctor: 'Dr. Sarah Johnson',
      category: 'lab',
      status: 'Normal',
      description: 'Complete Blood Count (CBC) and Lipid Profile',
      icon: BeakerIcon,
      urgency: 'normal'
    },
    {
      id: 2,
      title: 'Chest X-Ray Report',
      type: 'Radiology',
      date: '2024-12-15',
      doctor: 'Dr. Michael Chen',
      category: 'imaging',
      status: 'Clear',
      description: 'Chest X-ray showing clear lungs',
      icon: CameraIcon,
      urgency: 'normal'
    },
    {
      id: 3,
      title: 'Cardiology Consultation',
      type: 'Consultation Report',
      date: '2024-12-10',
      doctor: 'Dr. Sarah Johnson',
      category: 'consultation',
      status: 'Follow-up Required',
      description: 'Routine cardiac evaluation and ECG',
      icon: HeartIcon,
      urgency: 'medium'
    },
    {
      id: 4,
      title: 'Annual Physical Exam',
      type: 'Physical Examination',
      date: '2024-12-01',
      doctor: 'Dr. Michael Chen',
      category: 'examination',
      status: 'Complete',
      description: 'Comprehensive annual health checkup',
      icon: UserIcon,
      urgency: 'normal'
    },
    {
      id: 5,
      title: 'Allergy Test Results',
      type: 'Lab Report',
      date: '2024-11-25',
      doctor: 'Dr. Emily Rodriguez',
      category: 'lab',
      status: 'Positive for Pollen',
      description: 'Comprehensive allergy panel testing',
      icon: BeakerIcon,
      urgency: 'high'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Records', icon: DocumentTextIcon },
    { id: 'lab', name: 'Lab Reports', icon: BeakerIcon },
    { id: 'imaging', name: 'Imaging', icon: CameraIcon },
    { id: 'consultation', name: 'Consultations', icon: HeartIcon },
    { id: 'examination', name: 'Examinations', icon: UserIcon }
  ];

  const filteredRecords = medicalRecords.filter(record => {
    const matchesCategory = selectedCategory === 'all' || record.category === selectedCategory;
    const matchesSearch = record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.doctor.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getStatusColor = (status, urgency) => {
    if (urgency === 'high') return 'bg-red-100 text-red-800 border-red-200';
    if (urgency === 'medium') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getUrgencyIcon = (urgency) => {
    if (urgency === 'high') return '🔴';
    if (urgency === 'medium') return '🟡';
    return '🟢';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
            <h1 className="text-4xl font-bold mb-2">Medical Records</h1>
            <p className="text-blue-100 text-lg">Access and manage your complete health history</p>
            <div className="mt-4 flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <DocumentTextIcon className="w-5 h-5 text-blue-200" />
                <span className="text-blue-100">Total Records: {medicalRecords.length}</span>
              </div>
              <div className="flex items-center space-x-2">
                <CalendarIcon className="w-5 h-5 text-blue-200" />
                <span className="text-blue-100">Last Updated: Dec 20, 2024</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search records by title or doctor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <FunnelIcon className="w-5 h-5 text-gray-400" />
              <span className="text-gray-600 font-medium">Filter by:</span>
            </div>
          </div>

          {/* Category Filters */}
          <div className="mt-4 flex flex-wrap gap-3">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`inline-flex items-center px-4 py-2 rounded-xl border-2 transition-all duration-200 ${
                    selectedCategory === category.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {category.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Records Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredRecords.map((record) => {
            const Icon = record.icon;
            return (
              <div
                key={record.id}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{record.title}</h3>
                      <p className="text-sm text-blue-600 font-medium">{record.type}</p>
                    </div>
                  </div>
                  <span className="text-lg">{getUrgencyIcon(record.urgency)}</span>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-semibold">{record.date}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Doctor:</span>
                    <span className="font-semibold">{record.doctor}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Status:</span>
                    <span className={`px-2 py-1 rounded-lg text-xs font-semibold border ${getStatusColor(record.status, record.urgency)}`}>
                      {record.status}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4">{record.description}</p>

                <div className="flex space-x-2">
                  <button className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-semibold">
                    <EyeIcon className="w-4 h-4 mr-2" />
                    View
                  </button>
                  <button className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-sm font-semibold">
                    <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                    Download
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredRecords.length === 0 && (
          <div className="text-center py-12">
            <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No records found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        )}

        {/* Health Summary Card */}
        <div className="mt-8 bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <ChartBarIcon className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Health Summary</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-2">Recent Labs</h3>
              <p className="text-green-700 text-sm mb-3">All values within normal range</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Cholesterol:</span>
                  <span className="font-semibold">180 mg/dL</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Blood Sugar:</span>
                  <span className="font-semibold">95 mg/dL</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Vital Signs</h3>
              <p className="text-blue-700 text-sm mb-3">Last recorded: Dec 20, 2024</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Blood Pressure:</span>
                  <span className="font-semibold">120/80 mmHg</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Heart Rate:</span>
                  <span className="font-semibold">72 BPM</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-purple-900 mb-2">Allergies</h3>
              <p className="text-purple-700 text-sm mb-3">Known allergies</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Pollen:</span>
                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded-lg text-xs font-semibold">Severe</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Penicillin:</span>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-lg text-xs font-semibold">Mild</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicalRecords;