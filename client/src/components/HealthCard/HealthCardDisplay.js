import React, { useState, useEffect } from 'react';
import {
  QrCodeIcon,
  UserIcon,
  HeartIcon,
  PhoneIcon,
  CalendarIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { healthCardAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const HealthCardDisplay = () => {
  const { user } = useAuth();
  const [healthCard, setHealthCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    bloodGroup: '',
    emergencyContact: { name: '', phone: '', relationship: '' },
    allergies: [],
    chronicConditions: [],
    insuranceInfo: { provider: '', policyNumber: '' }
  });

  useEffect(() => {
    fetchHealthCard();
  }, []);

  const fetchHealthCard = async () => {
    try {
      setLoading(true);
      const response = await healthCardAPI.getPatientCard(user.id);
      
      if (response.data.success) {
        const card = response.data.data.healthCard;
        setHealthCard(card);
        // Initialize edit form with current data
        setEditForm({
          bloodGroup: card.bloodGroup || '',
          emergencyContact: card.emergencyContact || { name: '', phone: '', relationship: '' },
          allergies: card.allergies || [],
          chronicConditions: card.chronicConditions || [],
          insuranceInfo: card.insuranceInfo || { provider: '', policyNumber: '' }
        });
      }
    } catch (error) {
      console.error('Error fetching health card:', error);
      if (error.response?.status === 404) {
        // No health card exists - will be auto-created by backend
        toast.info('Creating your digital health card...');
        // Retry after a short delay
        setTimeout(() => fetchHealthCard(), 1000);
      } else {
        toast.error('Failed to load health card');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCard = async () => {
    try {
      const response = await healthCardAPI.updatePatientCard(user.id, editForm);
      if (response.data.success) {
        setHealthCard(response.data.data.healthCard);
        setIsEditing(false);
        toast.success('Health card updated successfully');
      }
    } catch (error) {
      console.error('Error updating health card:', error);
      toast.error('Failed to update health card');
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setEditForm(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setEditForm(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!healthCard) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <DocumentTextIcon className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No Digital Health Card</h3>
        <p className="text-gray-600 mb-6">
          You don't have a digital health card yet. Contact the hospital staff to create one.
        </p>
        <button
          onClick={() => toast.info('Please visit the hospital to get your digital health card created')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Request Health Card
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Health Card */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-2xl p-8 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
        </div>

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Digital Health Card</h2>
              <p className="text-blue-100">UrbanCare Hospital System</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-100">Card Number</div>
              <div className="text-lg font-mono font-bold">{healthCard.cardNumber}</div>
            </div>
          </div>

          {/* Patient Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <UserIcon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm text-blue-100">Patient Name</div>
                  <div className="text-xl font-bold">
                    {healthCard.patient.firstName} {healthCard.patient.lastName}
                  </div>
                </div>
              </div>

              {healthCard.bloodGroup && (
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <HeartIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm text-blue-100">Blood Group</div>
                    <div className="text-lg font-bold">{healthCard.bloodGroup}</div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <CalendarIcon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm text-blue-100">Issue Date</div>
                  <div className="text-lg font-bold">{formatDate(healthCard.issueDate)}</div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <ShieldCheckIcon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm text-blue-100">Status</div>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    healthCard.status === 'active' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                  }`}>
                    {healthCard.status.toUpperCase()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-blue-100 mb-1">Expires</div>
              <div className="text-lg font-bold">{formatDate(healthCard.expiryDate)}</div>
            </div>
            
            <button
              onClick={() => setShowQR(!showQR)}
              className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
            >
              <QrCodeIcon className="w-5 h-5" />
              <span>{showQR ? 'Hide QR' : 'Show QR'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* QR Code Display */}
      {showQR && (
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-4">QR Code for Quick Access</h3>
          <div className="flex justify-center mb-4">
            <img 
              src={healthCard.qrCode} 
              alt="Health Card QR Code"
              className="w-48 h-48 border-2 border-gray-200 rounded-lg"
            />
          </div>
          <p className="text-gray-600 text-sm">
            Show this QR code to hospital staff for quick verification
          </p>
        </div>
      )}

      {/* Emergency Contact */}
      {healthCard.emergencyContact && (
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <PhoneIcon className="w-5 h-5 mr-2 text-red-500" />
            Emergency Contact
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-500">Name</div>
              <div className="font-medium">{healthCard.emergencyContact.name}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Relation</div>
              <div className="font-medium">{healthCard.emergencyContact.relation}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Phone</div>
              <div className="font-medium">{healthCard.emergencyContact.phone}</div>
            </div>
          </div>
        </div>
      )}

      {/* Medical Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Allergies */}
        {healthCard.allergies && healthCard.allergies.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 mr-2 text-yellow-500" />
              Allergies
            </h3>
            <div className="space-y-2">
              {healthCard.allergies.map((allergy, index) => (
                <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                  <span className="text-yellow-800 font-medium">{allergy}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chronic Conditions */}
        {healthCard.chronicConditions && healthCard.chronicConditions.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <DocumentTextIcon className="w-5 h-5 mr-2 text-blue-500" />
              Chronic Conditions
            </h3>
            <div className="space-y-3">
              {healthCard.chronicConditions.map((condition, index) => (
                <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="font-medium text-blue-900">{condition.condition}</div>
                  {condition.diagnosedDate && (
                    <div className="text-sm text-blue-600">
                      Diagnosed: {formatDate(condition.diagnosedDate)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Insurance Information */}
      {healthCard.insuranceInfo && (
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <ShieldCheckIcon className="w-5 h-5 mr-2 text-green-500" />
            Insurance Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-500">Provider</div>
              <div className="font-medium">{healthCard.insuranceInfo.provider}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Policy Number</div>
              <div className="font-medium">{healthCard.insuranceInfo.policyNumber}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Valid Until</div>
              <div className="font-medium">
                {healthCard.insuranceInfo.validUntil ? 
                  formatDate(healthCard.insuranceInfo.validUntil) : 
                  'Not specified'
                }
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthCardDisplay;
