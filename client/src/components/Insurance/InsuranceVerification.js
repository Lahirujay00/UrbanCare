import React, { useState } from 'react';
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  PhoneIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const InsuranceVerification = ({ patientId, onVerificationComplete }) => {
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [insuranceData, setInsuranceData] = useState({
    provider: '',
    policyNumber: '',
    groupNumber: '',
    subscriberName: '',
    subscriberId: '',
    relationshipToSubscriber: 'self'
  });

  const insuranceProviders = [
    { id: 'aetna', name: 'Aetna', phone: '1-800-872-3862' },
    { id: 'anthem', name: 'Anthem Blue Cross', phone: '1-800-331-1476' },
    { id: 'cigna', name: 'Cigna', phone: '1-800-244-6224' },
    { id: 'humana', name: 'Humana', phone: '1-800-448-6262' },
    { id: 'kaiser', name: 'Kaiser Permanente', phone: '1-800-464-4000' },
    { id: 'united', name: 'UnitedHealthcare', phone: '1-800-328-5979' },
    { id: 'bcbs', name: 'Blue Cross Blue Shield', phone: '1-888-630-2583' },
    { id: 'medicaid', name: 'Medicaid', phone: '1-800-318-2596' },
    { id: 'medicare', name: 'Medicare', phone: '1-800-633-4227' },
    { id: 'other', name: 'Other Insurance Provider', phone: '' }
  ];

  const handleInputChange = (field, value) => {
    setInsuranceData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const verifyInsurance = async () => {
    if (!insuranceData.provider || !insuranceData.policyNumber) {
      toast.error('Please fill in required fields');
      return;
    }

    setVerifying(true);
    
    try {
      // Simulate insurance verification API call
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock verification result
      const mockResult = {
        status: Math.random() > 0.3 ? 'verified' : 'partial',
        coverage: {
          deductible: '$500',
          copay: '$25',
          coinsurance: '20%',
          outOfPocketMax: '$3,000',
          coveragePercentage: Math.random() > 0.3 ? 80 : 60
        },
        eligibility: {
          active: true,
          effectiveDate: '2024-01-01',
          terminationDate: '2024-12-31'
        },
        benefits: {
          preventiveCare: true,
          emergencyCare: true,
          specialistCare: true,
          prescriptionDrugs: true,
          mentalHealth: true
        },
        preAuthRequired: Math.random() > 0.7,
        notes: Math.random() > 0.5 ? 'Coverage verified successfully' : 'Partial coverage - some services may require pre-authorization'
      };

      setVerificationResult(mockResult);
      
      if (onVerificationComplete) {
        onVerificationComplete(mockResult);
      }

      toast.success('Insurance verification completed');
      
    } catch (error) {
      console.error('Insurance verification error:', error);
      toast.error('Failed to verify insurance');
      
      setVerificationResult({
        status: 'error',
        error: 'Unable to verify insurance at this time. Please contact your insurance provider.'
      });
    } finally {
      setVerifying(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified': return 'text-green-600 bg-green-50 border-green-200';
      case 'partial': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'denied': return 'text-red-600 bg-red-50 border-red-200';
      case 'error': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified': return <CheckCircleIcon className="w-6 h-6 text-green-600" />;
      case 'partial': return <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />;
      case 'denied': return <XCircleIcon className="w-6 h-6 text-red-600" />;
      case 'error': return <XCircleIcon className="w-6 h-6 text-gray-600" />;
      default: return <ClockIcon className="w-6 h-6 text-blue-600" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
          <ShieldCheckIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Insurance Verification</h2>
          <p className="text-gray-600">Verify insurance coverage and benefits</p>
        </div>
      </div>

      {!verificationResult ? (
        <div className="space-y-6">
          {/* Insurance Provider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Insurance Provider *
            </label>
            <select
              value={insuranceData.provider}
              onChange={(e) => handleInputChange('provider', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Insurance Provider</option>
              {insuranceProviders.map(provider => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>
          </div>

          {/* Policy Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Policy Number *
              </label>
              <input
                type="text"
                value={insuranceData.policyNumber}
                onChange={(e) => handleInputChange('policyNumber', e.target.value)}
                placeholder="Enter policy number"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Group Number
              </label>
              <input
                type="text"
                value={insuranceData.groupNumber}
                onChange={(e) => handleInputChange('groupNumber', e.target.value)}
                placeholder="Enter group number"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Subscriber Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subscriber Name
              </label>
              <input
                type="text"
                value={insuranceData.subscriberName}
                onChange={(e) => handleInputChange('subscriberName', e.target.value)}
                placeholder="Name on insurance card"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subscriber ID
              </label>
              <input
                type="text"
                value={insuranceData.subscriberId}
                onChange={(e) => handleInputChange('subscriberId', e.target.value)}
                placeholder="Member ID"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Relationship */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Relationship to Subscriber
            </label>
            <select
              value={insuranceData.relationshipToSubscriber}
              onChange={(e) => handleInputChange('relationshipToSubscriber', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="self">Self</option>
              <option value="spouse">Spouse</option>
              <option value="child">Child</option>
              <option value="dependent">Dependent</option>
            </select>
          </div>

          {/* Verify Button */}
          <button
            onClick={verifyInsurance}
            disabled={verifying || !insuranceData.provider || !insuranceData.policyNumber}
            className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {verifying ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Verifying Insurance...</span>
              </div>
            ) : (
              'Verify Insurance Coverage'
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Verification Status */}
          <div className={`p-4 rounded-lg border ${getStatusColor(verificationResult.status)}`}>
            <div className="flex items-center space-x-3">
              {getStatusIcon(verificationResult.status)}
              <div>
                <h3 className="font-semibold">
                  {verificationResult.status === 'verified' ? 'Insurance Verified' :
                   verificationResult.status === 'partial' ? 'Partial Coverage' :
                   verificationResult.status === 'denied' ? 'Coverage Denied' :
                   'Verification Error'}
                </h3>
                <p className="text-sm">{verificationResult.notes || verificationResult.error}</p>
              </div>
            </div>
          </div>

          {/* Coverage Details */}
          {verificationResult.coverage && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Coverage Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Deductible:</span>
                    <span className="font-medium">{verificationResult.coverage.deductible}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Copay:</span>
                    <span className="font-medium">{verificationResult.coverage.copay}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Coinsurance:</span>
                    <span className="font-medium">{verificationResult.coverage.coinsurance}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Out-of-Pocket Max:</span>
                    <span className="font-medium">{verificationResult.coverage.outOfPocketMax}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Eligibility</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className={`font-medium ${verificationResult.eligibility.active ? 'text-green-600' : 'text-red-600'}`}>
                      {verificationResult.eligibility.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Effective Date:</span>
                    <span className="font-medium">{verificationResult.eligibility.effectiveDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Term Date:</span>
                    <span className="font-medium">{verificationResult.eligibility.terminationDate}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Benefits */}
          {verificationResult.benefits && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">Covered Benefits</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(verificationResult.benefits).map(([benefit, covered]) => (
                  <div key={benefit} className="flex items-center space-x-2">
                    {covered ? (
                      <CheckCircleIcon className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircleIcon className="w-4 h-4 text-red-600" />
                    )}
                    <span className="text-sm capitalize">
                      {benefit.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pre-authorization Notice */}
          {verificationResult.preAuthRequired && (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <div className="flex items-start space-x-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-800">Pre-authorization Required</h4>
                  <p className="text-sm text-yellow-700">
                    Some services may require pre-authorization from your insurance provider before treatment.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-4">
            <button
              onClick={() => setVerificationResult(null)}
              className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Verify Different Insurance
            </button>
            <button
              onClick={() => window.print()}
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Print Verification
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsuranceVerification;
