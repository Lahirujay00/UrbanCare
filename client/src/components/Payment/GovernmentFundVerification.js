import React, { useState } from 'react';
import {
  BuildingLibraryIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  IdentificationIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const GovernmentFundVerification = ({ patientId, appointmentAmount, onVerificationComplete }) => {
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [fundData, setFundData] = useState({
    fundType: '',
    beneficiaryId: '',
    referenceNumber: '',
    eligibilityCard: null,
    supportingDocuments: []
  });

  const fundTypes = [
    {
      id: 'medicaid',
      name: 'Medicaid',
      description: 'State and federal program for low-income individuals',
      eligibilityRequirements: ['Income below federal poverty level', 'Valid state residency', 'Citizenship/legal status'],
      coveragePercentage: 100,
      copay: 0
    },
    {
      id: 'medicare',
      name: 'Medicare',
      description: 'Federal program for seniors 65+ and disabled individuals',
      eligibilityRequirements: ['Age 65 or older', 'Disability status', 'End-stage renal disease'],
      coveragePercentage: 80,
      copay: 25
    },
    {
      id: 'veterans',
      name: 'Veterans Affairs',
      description: 'Healthcare benefits for military veterans',
      eligibilityRequirements: ['Military service record', 'Honorable discharge', 'VA enrollment'],
      coveragePercentage: 100,
      copay: 0
    },
    {
      id: 'disability',
      name: 'Disability Fund',
      description: 'Support for individuals with disabilities',
      eligibilityRequirements: ['Disability determination', 'Medical documentation', 'Income verification'],
      coveragePercentage: 90,
      copay: 10
    },
    {
      id: 'low-income',
      name: 'Low Income Support',
      description: 'State assistance for low-income families',
      eligibilityRequirements: ['Income verification', 'Family size documentation', 'State residency'],
      coveragePercentage: 75,
      copay: 15
    },
    {
      id: 'emergency',
      name: 'Emergency Fund',
      description: 'Emergency healthcare assistance',
      eligibilityRequirements: ['Emergency medical situation', 'Financial hardship documentation'],
      coveragePercentage: 100,
      copay: 0
    }
  ];

  const handleInputChange = (field, value) => {
    setFundData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = (event, type) => {
    const file = event.target.files[0];
    if (file) {
      if (type === 'eligibilityCard') {
        setFundData(prev => ({
          ...prev,
          eligibilityCard: file
        }));
      } else {
        setFundData(prev => ({
          ...prev,
          supportingDocuments: [...prev.supportingDocuments, file]
        }));
      }
      toast.success(`${file.name} uploaded successfully`);
    }
  };

  const verifyGovernmentFund = async () => {
    if (!fundData.fundType || !fundData.beneficiaryId) {
      toast.error('Please fill in required fields');
      return;
    }

    setVerifying(true);
    
    try {
      // Simulate government fund verification API call
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      const selectedFund = fundTypes.find(f => f.id === fundData.fundType);
      
      // Mock verification result
      const mockResult = {
        status: Math.random() > 0.2 ? 'approved' : 'pending',
        fundType: selectedFund,
        eligibility: {
          verified: true,
          validUntil: '2024-12-31',
          remainingBenefit: Math.floor(Math.random() * 5000) + 1000,
          yearlyLimit: 10000
        },
        coverage: {
          approvedAmount: Math.floor(appointmentAmount * (selectedFund.coveragePercentage / 100)),
          patientResponsibility: Math.max(0, appointmentAmount - Math.floor(appointmentAmount * (selectedFund.coveragePercentage / 100))),
          copay: selectedFund.copay,
          deductible: 0
        },
        authorizationNumber: `AUTH-${Date.now()}`,
        approvalDate: new Date().toISOString().split('T')[0],
        notes: 'Eligibility verified. Coverage approved for this appointment.',
        requiredDocuments: selectedFund.eligibilityRequirements
      };

      setVerificationResult(mockResult);
      
      if (onVerificationComplete) {
        onVerificationComplete(mockResult);
      }

      toast.success('Government fund verification completed');
      
    } catch (error) {
      console.error('Government fund verification error:', error);
      toast.error('Failed to verify government fund eligibility');
      
      setVerificationResult({
        status: 'error',
        error: 'Unable to verify eligibility at this time. Please contact the fund administrator.'
      });
    } finally {
      setVerifying(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-50 border-green-200';
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'denied': return 'text-red-600 bg-red-50 border-red-200';
      case 'error': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircleIcon className="w-6 h-6 text-green-600" />;
      case 'pending': return <ClockIcon className="w-6 h-6 text-yellow-600" />;
      case 'denied': return <XCircleIcon className="w-6 h-6 text-red-600" />;
      case 'error': return <XCircleIcon className="w-6 h-6 text-gray-600" />;
      default: return <ClockIcon className="w-6 h-6 text-blue-600" />;
    }
  };

  const selectedFundType = fundTypes.find(f => f.id === fundData.fundType);

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
          <BuildingLibraryIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Government Fund Verification</h2>
          <p className="text-gray-600">Verify eligibility for government healthcare assistance</p>
        </div>
      </div>

      {!verificationResult ? (
        <div className="space-y-6">
          {/* Fund Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Government Fund Type *
            </label>
            <select
              value={fundData.fundType}
              onChange={(e) => handleInputChange('fundType', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              required
            >
              <option value="">Select Fund Type</option>
              {fundTypes.map(fund => (
                <option key={fund.id} value={fund.id}>
                  {fund.name} - {fund.description}
                </option>
              ))}
            </select>
          </div>

          {/* Fund Details */}
          {selectedFundType && (
            <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
              <h4 className="font-semibold text-purple-900 mb-2">{selectedFundType.name} Details</h4>
              <p className="text-sm text-purple-700 mb-3">{selectedFundType.description}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Coverage:</span> {selectedFundType.coveragePercentage}%
                </div>
                <div>
                  <span className="font-medium">Copay:</span> ${selectedFundType.copay}
                </div>
              </div>
              <div className="mt-3">
                <span className="font-medium text-purple-800">Eligibility Requirements:</span>
                <ul className="list-disc list-inside text-sm text-purple-700 mt-1">
                  {selectedFundType.eligibilityRequirements.map((req, index) => (
                    <li key={index}>{req}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Beneficiary Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Beneficiary ID *
              </label>
              <input
                type="text"
                value={fundData.beneficiaryId}
                onChange={(e) => handleInputChange('beneficiaryId', e.target.value)}
                placeholder="Enter beneficiary ID number"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reference Number
              </label>
              <input
                type="text"
                value={fundData.referenceNumber}
                onChange={(e) => handleInputChange('referenceNumber', e.target.value)}
                placeholder="Case/reference number (if any)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Document Upload */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Eligibility Card/Document
              </label>
              <input
                type="file"
                onChange={(e) => handleFileUpload(e, 'eligibilityCard')}
                accept=".pdf,.jpg,.jpeg,.png"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              {fundData.eligibilityCard && (
                <p className="text-sm text-green-600 mt-1">✓ {fundData.eligibilityCard.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supporting Documents
              </label>
              <input
                type="file"
                onChange={(e) => handleFileUpload(e, 'supporting')}
                accept=".pdf,.jpg,.jpeg,.png"
                multiple
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              {fundData.supportingDocuments.length > 0 && (
                <div className="mt-2">
                  {fundData.supportingDocuments.map((doc, index) => (
                    <p key={index} className="text-sm text-green-600">✓ {doc.name}</p>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cost Estimate */}
          {selectedFundType && appointmentAmount && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">Cost Estimate</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Appointment Cost:</span>
                  <span className="font-medium">${appointmentAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Fund Coverage ({selectedFundType.coveragePercentage}%):</span>
                  <span className="font-medium text-green-600">
                    -${Math.floor(appointmentAmount * (selectedFundType.coveragePercentage / 100))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Copay:</span>
                  <span className="font-medium">${selectedFundType.copay}</span>
                </div>
                <div className="border-t border-gray-300 pt-2 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Your Responsibility:</span>
                    <span className="text-blue-600">
                      ${Math.max(0, appointmentAmount - Math.floor(appointmentAmount * (selectedFundType.coveragePercentage / 100)) + selectedFundType.copay)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Verify Button */}
          <button
            onClick={verifyGovernmentFund}
            disabled={verifying || !fundData.fundType || !fundData.beneficiaryId}
            className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-medium hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {verifying ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Verifying Eligibility...</span>
              </div>
            ) : (
              'Verify Government Fund Eligibility'
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
                  {verificationResult.status === 'approved' ? 'Eligibility Approved' :
                   verificationResult.status === 'pending' ? 'Verification Pending' :
                   verificationResult.status === 'denied' ? 'Eligibility Denied' :
                   'Verification Error'}
                </h3>
                <p className="text-sm">{verificationResult.notes || verificationResult.error}</p>
                {verificationResult.authorizationNumber && (
                  <p className="text-xs font-mono mt-1">Auth: {verificationResult.authorizationNumber}</p>
                )}
              </div>
            </div>
          </div>

          {/* Coverage Details */}
          {verificationResult.coverage && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Coverage Breakdown</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Approved Amount:</span>
                    <span className="font-medium text-green-600">${verificationResult.coverage.approvedAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Your Responsibility:</span>
                    <span className="font-medium">${verificationResult.coverage.patientResponsibility}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Copay:</span>
                    <span className="font-medium">${verificationResult.coverage.copay}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Benefit Status</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Valid Until:</span>
                    <span className="font-medium">{verificationResult.eligibility.validUntil}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Remaining Benefit:</span>
                    <span className="font-medium text-blue-600">${verificationResult.eligibility.remainingBenefit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Yearly Limit:</span>
                    <span className="font-medium">${verificationResult.eligibility.yearlyLimit}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Required Documents */}
          {verificationResult.requiredDocuments && (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <div className="flex items-start space-x-3">
                <DocumentTextIcon className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-800">Required Documentation</h4>
                  <p className="text-sm text-yellow-700 mb-2">Please bring the following documents to your appointment:</p>
                  <ul className="text-sm text-yellow-700 list-disc list-inside">
                    {verificationResult.requiredDocuments.map((doc, index) => (
                      <li key={index}>{doc}</li>
                    ))}
                  </ul>
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
              Verify Different Fund
            </button>
            <button
              onClick={() => window.print()}
              className="flex-1 py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Print Authorization
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GovernmentFundVerification;
