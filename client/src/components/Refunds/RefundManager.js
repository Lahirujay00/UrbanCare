import React, { useState, useEffect } from 'react';
import {
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  EyeIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { refundAPI, appointmentAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const RefundManager = () => {
  const { user } = useAuth();
  const [refunds, setRefunds] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [refundForm, setRefundForm] = useState({
    appointmentId: '',
    refundReason: 'patient-request',
    refundDescription: ''
  });

  const refundReasons = [
    { value: 'appointment-cancelled', label: 'Appointment Cancelled' },
    { value: 'doctor-unavailable', label: 'Doctor Unavailable' },
    { value: 'technical-issue', label: 'Technical Issue' },
    { value: 'patient-request', label: 'Patient Request' },
    { value: 'medical-emergency', label: 'Medical Emergency' },
    { value: 'system-error', label: 'System Error' },
    { value: 'duplicate-payment', label: 'Duplicate Payment' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    fetchRefunds();
    fetchEligibleAppointments();
  }, []);

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      const response = await refundAPI.getRefunds();
      
      if (response.data.success) {
        setRefunds(response.data.data.refunds);
      }
    } catch (error) {
      console.error('Error fetching refunds:', error);
      toast.error('Failed to load refunds');
    } finally {
      setLoading(false);
    }
  };

  const fetchEligibleAppointments = async () => {
    try {
      const response = await appointmentAPI.getAppointments({
        status: 'scheduled,confirmed',
        paymentStatus: 'paid'
      });
      
      if (response.data.success) {
        setAppointments(response.data.data.appointments);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const handleRequestRefund = async (e) => {
    e.preventDefault();
    
    if (!refundForm.appointmentId) {
      toast.error('Please select an appointment');
      return;
    }

    if (refundForm.refundDescription.trim().length < 10) {
      toast.error('Please provide a detailed reason (minimum 10 characters)');
      return;
    }

    try {
      const response = await refundAPI.requestRefund(refundForm);
      
      if (response.data.success) {
        toast.success('Refund request submitted successfully');
        setShowRequestModal(false);
        setRefundForm({
          appointmentId: '',
          refundReason: 'patient-request',
          refundDescription: ''
        });
        fetchRefunds();
      }
    } catch (error) {
      console.error('Error requesting refund:', error);
      toast.error(error.response?.data?.message || 'Failed to submit refund request');
    }
  };

  const handleCancelRefund = async (refundId) => {
    if (!window.confirm('Are you sure you want to cancel this refund request?')) {
      return;
    }

    try {
      await refundAPI.cancelRefund(refundId, { reason: 'Cancelled by patient' });
      toast.success('Refund request cancelled');
      fetchRefunds();
    } catch (error) {
      console.error('Error cancelling refund:', error);
      toast.error('Failed to cancel refund request');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'processed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="w-4 h-4" />;
      case 'approved':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'processed':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'rejected':
        return <XCircleIcon className="w-4 h-4" />;
      case 'cancelled':
        return <XCircleIcon className="w-4 h-4" />;
      default:
        return <ClockIcon className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Refund Requests</h2>
          <p className="text-gray-600">Manage your appointment refund requests</p>
        </div>
        <button
          onClick={() => setShowRequestModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Request Refund</span>
        </button>
      </div>

      {/* Refunds List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : refunds.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <CurrencyDollarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No refund requests</h3>
          <p className="text-gray-500 mb-6">
            You haven't submitted any refund requests yet
          </p>
          <button
            onClick={() => setShowRequestModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Request Refund
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {refunds.map((refund) => (
            <div key={refund._id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <CurrencyDollarIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Refund Request #{refund._id.slice(-8)}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Submitted on {formatDate(refund.createdAt)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(refund.status)}`}>
                    {getStatusIcon(refund.status)}
                    <span>{refund.status.charAt(0).toUpperCase() + refund.status.slice(1)}</span>
                  </span>
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-500">Appointment Date</div>
                  <div className="font-medium">
                    {new Date(refund.appointment.appointmentDate).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Refund Amount</div>
                  <div className="font-medium text-green-600">
                    {formatCurrency(refund.refundAmount)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Reason</div>
                  <div className="font-medium">
                    {refundReasons.find(r => r.value === refund.refundReason)?.label || refund.refundReason}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Processing Time</div>
                  <div className="font-medium">
                    {refund.actualProcessingTime ? 
                      `${Math.round(refund.actualProcessingTime)} hours` : 
                      `${refund.expectedProcessingTime || 72} hours (expected)`
                    }
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-4">
                <div className="text-sm text-gray-500 mb-1">Description</div>
                <p className="text-gray-700">{refund.refundDescription}</p>
              </div>

              {/* Timeline */}
              {refund.timeline && refund.timeline.length > 0 && (
                <div className="mb-4">
                  <div className="text-sm text-gray-500 mb-2">Timeline</div>
                  <div className="space-y-2">
                    {refund.timeline.slice(-3).map((entry, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-gray-600">{entry.action}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-400">{formatDate(entry.performedAt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setSelectedRefund(refund)}
                  className="flex items-center space-x-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  <EyeIcon className="w-4 h-4" />
                  <span>View Details</span>
                </button>
                
                {refund.status === 'pending' && (
                  <button
                    onClick={() => handleCancelRefund(refund._id)}
                    className="flex items-center space-x-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                  >
                    <XCircleIcon className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Request Refund Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Request Refund</h3>
              
              <form onSubmit={handleRequestRefund} className="space-y-4">
                {/* Appointment Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Appointment *
                  </label>
                  <select
                    value={refundForm.appointmentId}
                    onChange={(e) => setRefundForm({...refundForm, appointmentId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Choose an appointment</option>
                    {appointments.map(appointment => (
                      <option key={appointment._id} value={appointment._id}>
                        {new Date(appointment.appointmentDate).toLocaleDateString()} - 
                        Dr. {appointment.doctor?.firstName} {appointment.doctor?.lastName} - 
                        ${appointment.consultationFee}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Refund Reason */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Refund *
                  </label>
                  <select
                    value={refundForm.refundReason}
                    onChange={(e) => setRefundForm({...refundForm, refundReason: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    {refundReasons.map(reason => (
                      <option key={reason.value} value={reason.value}>
                        {reason.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Detailed Explanation *
                  </label>
                  <textarea
                    value={refundForm.refundDescription}
                    onChange={(e) => setRefundForm({...refundForm, refundDescription: e.target.value})}
                    placeholder="Please provide a detailed explanation for the refund request (minimum 10 characters)"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {refundForm.refundDescription.length}/500 characters
                  </p>
                </div>

                {/* Actions */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowRequestModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Refund Details Modal */}
      {selectedRefund && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Refund Details #{selectedRefund._id.slice(-8)}
                </h3>
                <button
                  onClick={() => setSelectedRefund(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Status & Amount */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-500 mb-1">Status</div>
                    <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedRefund.status)}`}>
                      {getStatusIcon(selectedRefund.status)}
                      <span>{selectedRefund.status.charAt(0).toUpperCase() + selectedRefund.status.slice(1)}</span>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-500 mb-1">Refund Amount</div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(selectedRefund.refundAmount)}
                    </div>
                  </div>
                </div>

                {/* Appointment Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Appointment Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Date:</span>
                      <span className="ml-2 font-medium">
                        {new Date(selectedRefund.appointment.appointmentDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Time:</span>
                      <span className="ml-2 font-medium">{selectedRefund.appointment.appointmentTime}</span>
                    </div>
                  </div>
                </div>

                {/* Complete Timeline */}
                {selectedRefund.timeline && selectedRefund.timeline.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Timeline</h4>
                    <div className="space-y-3">
                      {selectedRefund.timeline.map((entry, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{entry.action}</div>
                            <div className="text-sm text-gray-500">{formatDate(entry.performedAt)}</div>
                            {entry.comments && (
                              <div className="text-sm text-gray-600 mt-1">{entry.comments}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RefundManager;
