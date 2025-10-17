import React, { useState, useEffect } from 'react';
import {
  ShieldCheckIcon,
  CloudArrowUpIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import toast from 'react-hot-toast';

const NICVerification = () => {
  const { user, updateUser, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [nicNumber, setNicNumber] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState({
    status: 'unverified',
    note: '',
    nicNumber: '',
    hasDocument: false
  });

  useEffect(() => {
    fetchVerificationStatus();
  }, []);

  const fetchVerificationStatus = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/nic-status');
      
      if (response.data.success) {
        setVerificationStatus(response.data.data);
        setNicNumber(response.data.data.nicNumber || '');
      }
    } catch (error) {
      console.error('Error fetching verification status:', error);
      console.error('Error response:', error.response?.data);
      
      const errorMessage = error.response?.data?.message || 'Failed to load verification status';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only JPG, PNG, and PDF files are allowed');
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    if (!nicNumber.trim()) {
      toast.error('Please enter your NIC number');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('nicDocument', selectedFile);
      formData.append('nicNumber', nicNumber);

      console.log('Uploading NIC document...');
      console.log('File:', selectedFile.name);
      console.log('NIC Number:', nicNumber);

      const response = await api.post('/users/upload-nic', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Upload response:', response.data);

      if (response.data.success) {
        toast.success('NIC document uploaded successfully! Awaiting verification.');
        setSelectedFile(null);
        fetchVerificationStatus();
        
        // Update user context
        if (updateUser) {
          updateUser(response.data.data.user);
        }
        // Refresh user data from server
        if (refreshUser) {
          refreshUser();
        }
      }
    } catch (error) {
      console.error('Error uploading NIC:', error);
      console.error('Error response:', error.response?.data);
      
      const errorMessage = error.response?.data?.message 
        || error.response?.data?.error
        || 'Failed to upload NIC document';
      
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const getStatusDisplay = () => {
    switch (verificationStatus.status) {
      case 'verified':
        return {
          icon: CheckCircleIcon,
          color: 'green',
          bg: 'bg-green-50',
          border: 'border-green-500',
          text: 'text-green-700',
          title: 'Identity Verified ✓',
          message: 'Your identity has been verified successfully.'
        };
      case 'pending':
        return {
          icon: ClockIcon,
          color: 'yellow',
          bg: 'bg-yellow-50',
          border: 'border-yellow-500',
          text: 'text-yellow-700',
          title: 'Verification Pending',
          message: 'Your NIC document is under review by our healthcare manager.'
        };
      case 'rejected':
        return {
          icon: XCircleIcon,
          color: 'red',
          bg: 'bg-red-50',
          border: 'border-red-500',
          text: 'text-red-700',
          title: 'Verification Rejected',
          message: verificationStatus.note || 'Your NIC document was rejected. Please upload a clear image.'
        };
      default:
        return {
          icon: ExclamationCircleIcon,
          color: 'gray',
          bg: 'bg-gray-50',
          border: 'border-gray-300',
          text: 'text-gray-700',
          title: 'Not Verified',
          message: 'Please upload your NIC document for identity verification.'
        };
    }
  };

  const statusDisplay = getStatusDisplay();
  const StatusIcon = statusDisplay.icon;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <div className="flex items-center space-x-3">
            <ShieldCheckIcon className="w-8 h-8 text-white" />
            <div>
              <h2 className="text-xl font-bold text-white">Identity Verification</h2>
              <p className="text-blue-100 text-sm">NIC Document Upload</p>
            </div>
          </div>
        </div>

        {/* Status Display */}
        <div className={`${statusDisplay.bg} border-l-4 ${statusDisplay.border} p-6 m-6`}>
          <div className="flex items-start space-x-4">
            <StatusIcon className={`w-8 h-8 ${statusDisplay.text} flex-shrink-0`} />
            <div className="flex-1">
              <h3 className={`text-lg font-semibold ${statusDisplay.text} mb-2`}>
                {statusDisplay.title}
              </h3>
              <p className={`${statusDisplay.text} text-sm`}>
                {statusDisplay.message}
              </p>
              {verificationStatus.nicNumber && (
                <p className="text-sm text-gray-600 mt-2">
                  NIC Number: <span className="font-semibold">{verificationStatus.nicNumber}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Upload Form - Show if unverified or rejected */}
        {(verificationStatus.status === 'unverified' || verificationStatus.status === 'rejected') && (
          <div className="px-6 pb-6">
            <form onSubmit={handleUpload} className="space-y-6">
              {/* NIC Number Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  NIC Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={nicNumber}
                  onChange={(e) => setNicNumber(e.target.value)}
                  placeholder="e.g., 199812345678 or 998123456V"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter your National Identity Card number
                </p>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload NIC Document <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400 transition-colors">
                  <div className="space-y-1 text-center">
                    <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                        <span>Choose a file</span>
                        <input
                          type="file"
                          className="sr-only"
                          accept="image/jpeg,image/jpg,image/png,application/pdf"
                          onChange={handleFileChange}
                          required
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      JPG, PNG, or PDF up to 5MB
                    </p>
                    {selectedFile && (
                      <div className="mt-3 flex items-center justify-center space-x-2 text-sm text-green-600">
                        <DocumentTextIcon className="w-5 h-5" />
                        <span className="font-medium">{selectedFile.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">📌 Upload Instructions:</h4>
                <ul className="text-sm text-blue-800 space-y-1 ml-4 list-disc">
                  <li>Upload a clear photo or scan of your NIC (front side)</li>
                  <li>Ensure all details are visible and readable</li>
                  <li>File must be in JPG, PNG, or PDF format</li>
                  <li>Maximum file size: 5MB</li>
                </ul>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={uploading || !selectedFile || !nicNumber.trim()}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <CloudArrowUpIcon className="w-5 h-5" />
                    <span>Upload NIC Document</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Pending Status - Show message only */}
        {verificationStatus.status === 'pending' && (
          <div className="px-6 pb-6">
            <div className="text-center text-gray-600">
              <ClockIcon className="w-16 h-16 text-yellow-500 mx-auto mb-3" />
              <p className="text-lg font-medium mb-2">Verification in Progress</p>
              <p className="text-sm">
                Our healthcare manager is reviewing your document. This usually takes 1-2 business days.
              </p>
            </div>
          </div>
        )}

        {/* Verified Status - Show success message */}
        {verificationStatus.status === 'verified' && (
          <div className="px-6 pb-6">
            <div className="text-center text-gray-600">
              <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-3" />
              <p className="text-lg font-medium mb-2">Your identity is verified!</p>
              <p className="text-sm">
                You can now access all features of UrbanCare Healthcare.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NICVerification;
