import React, { useState } from 'react';
import { 
  HeartIcon, 
  QrCodeIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  UserIcon,
  CalendarIcon,
  IdentificationIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  PhoneIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';

const DigitalHealthCard = () => {
  const { user } = useAuth();
  const [showQRCode, setShowQRCode] = useState(false);

  // Mock health data - in real app, this would come from API
  const healthData = {
    patientId: 'UC-2024-001234',
    cardNumber: '4567 8901 2345 6789',
    bloodType: 'A+',
    emergencyContact: {
      name: 'Jane Smith',
      relationship: 'Spouse',
      phone: '+1 (555) 987-6543'
    },
    allergies: ['Penicillin', 'Pollen', 'Shellfish'],
    chronicConditions: ['Hypertension'],
    medications: ['Lisinopril 10mg', 'Vitamin D3'],
    insuranceProvider: 'HealthCare Plus',
    policyNumber: 'HCP-789456123',
    primaryDoctor: 'Dr. Sarah Johnson',
    lastUpdated: '2024-12-20'
  };

  const emergencyInfo = [
    { label: 'Blood Type', value: healthData.bloodType, urgent: true },
    { label: 'Allergies', value: healthData.allergies.join(', '), urgent: true },
    { label: 'Chronic Conditions', value: healthData.chronicConditions.join(', '), urgent: false },
    { label: 'Current Medications', value: healthData.medications.join(', '), urgent: false }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
            <h1 className="text-4xl font-bold mb-2">Digital Health Card</h1>
            <p className="text-blue-100 text-lg">Your secure, digital health identification</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Health Card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              {/* Card Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                      <UserIcon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{user?.firstName} {user?.lastName}</h2>
                      <p className="text-blue-100">Patient ID: {healthData.patientId}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-2">
                      <HeartIcon className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-xs text-blue-200">UrbanCare</p>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center">
                      <IdentificationIcon className="w-5 h-5 mr-2 text-blue-600" />
                      Personal Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date of Birth:</span>
                        <span className="font-semibold">{user?.dateOfBirth || 'Jan 15, 1990'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Gender:</span>
                        <span className="font-semibold capitalize">{user?.gender || 'Male'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Blood Type:</span>
                        <span className="font-bold text-red-600">{healthData.bloodType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Card Number:</span>
                        <span className="font-mono text-sm">{healthData.cardNumber}</span>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center">
                      <PhoneIcon className="w-5 h-5 mr-2 text-blue-600" />
                      Contact Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-semibold">{user?.phone || '+1 (555) 123-4567'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-semibold text-sm">{user?.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Emergency Contact:</span>
                        <div className="text-right">
                          <p className="font-semibold">{healthData.emergencyContact.name}</p>
                          <p className="text-sm text-gray-500">{healthData.emergencyContact.phone}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Medical Information */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <ExclamationTriangleIcon className="w-5 h-5 mr-2 text-red-500" />
                    Critical Medical Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {emergencyInfo.map((info, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-xl border-2 ${
                          info.urgent 
                            ? 'bg-red-50 border-red-200' 
                            : 'bg-yellow-50 border-yellow-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-semibold ${
                            info.urgent ? 'text-red-900' : 'text-yellow-900'
                          }`}>
                            {info.label}:
                          </span>
                          {info.urgent && (
                            <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                        <p className={`text-sm mt-1 ${
                          info.urgent ? 'text-red-700' : 'text-yellow-700'
                        }`}>
                          {info.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Insurance Information */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <ShieldCheckIcon className="w-5 h-5 mr-2 text-green-600" />
                    Insurance Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Provider:</span>
                      <span className="font-semibold">{healthData.insuranceProvider}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Policy Number:</span>
                      <span className="font-mono text-sm">{healthData.policyNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Primary Doctor:</span>
                      <span className="font-semibold">{healthData.primaryDoctor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Updated:</span>
                      <span className="font-semibold">{healthData.lastUpdated}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* QR Code */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <QrCodeIcon className="w-5 h-5 mr-2 text-blue-600" />
                Quick Access QR Code
              </h3>
              <div className="text-center">
                <div className="w-32 h-32 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <QrCodeIcon className="w-16 h-16 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Scan for emergency access to your health information
                </p>
                <button
                  onClick={() => setShowQRCode(!showQRCode)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold"
                >
                  {showQRCode ? 'Hide QR Code' : 'Show QR Code'}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Card Actions</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-lg font-semibold">
                  <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                  Download Card
                </button>
                <button className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold">
                  <ShareIcon className="w-5 h-5 mr-2" />
                  Share with Doctor
                </button>
                <button className="w-full flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold">
                  <DocumentTextIcon className="w-5 h-5 mr-2" />
                  Print Card
                </button>
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
              <div className="flex items-center space-x-3 mb-3">
                <ShieldCheckIcon className="w-6 h-6 text-green-600" />
                <h3 className="text-lg font-bold text-green-900">Secure & Private</h3>
              </div>
              <p className="text-sm text-green-700">
                Your health information is encrypted and protected. Only authorized medical personnel can access your data in emergency situations.
              </p>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <CalendarIcon className="w-5 h-5 mr-2 text-blue-600" />
                Recent Activity
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Card accessed by Dr. Johnson</p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Health information updated</p>
                    <p className="text-xs text-gray-500">1 day ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Card downloaded</p>
                    <p className="text-xs text-gray-500">3 days ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DigitalHealthCard;