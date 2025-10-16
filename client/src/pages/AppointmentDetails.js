import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';
import { appointmentAPI, refundAPI } from '../services/api';
import toast from 'react-hot-toast';

const AppointmentDetails = () => {
  // Enhanced with card layouts
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [refundDescription, setRefundDescription] = useState('');
  const [submittingRefund, setSubmittingRefund] = useState(false);

  useEffect(() => {
    fetchAppointmentDetails();
  }, [id]);

  const fetchAppointmentDetails = async () => {
    try {
      setLoading(true);
      const response = await appointmentAPI.getAppointmentById(id);
      
      if (response.data.success) {
        setAppointment(response.data.data.appointment);
      } else {
        toast.error('Appointment not found');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error fetching appointment:', error);
      toast.error('Failed to load appointment details');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async () => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      const response = await appointmentAPI.cancelAppointment(id, 'Cancelled by patient');
      
      if (response.data.success) {
        toast.success('Appointment cancelled successfully');
        fetchAppointmentDetails(); // Refresh data to show refund button
      } else {
        toast.error('Failed to cancel appointment');
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel appointment');
    }
  };

  const handleRequestRefund = async () => {
    if (!refundReason.trim()) {
      toast.error('Please provide a reason for the refund');
      return;
    }

    try {
      setSubmittingRefund(true);
      
      const refundData = {
        appointmentId: id,
        refundReason,
        refundDescription: refundDescription.trim() || refundReason,
        refundAmount: appointment.consultationFee || 0
      };

      await refundAPI.requestRefund(refundData);
      toast.success('Refund request submitted successfully');
      setShowRefundModal(false);
      setRefundReason('');
      setRefundDescription('');
      fetchAppointmentDetails(); // Refresh to show refund status
    } catch (error) {
      console.error('Error requesting refund:', error);
      toast.error('Failed to submit refund request');
    } finally {
      setSubmittingRefund(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      'pay-at-hospital': 'bg-orange-100 text-orange-800',
      failed: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading appointment details...</p>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Appointment Not Found</h2>
          <p className="text-gray-600 mb-6">The appointment you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
          
          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Appointment Details</h1>
                <p className="text-gray-600 mt-2">
                  Appointment ID: {appointment._id}
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(appointment.status)}`}>
                  {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                </span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(appointment.paymentStatus)}`}>
                  {appointment.paymentStatus === 'pay-at-hospital' ? 'Pay at Hospital' : 
                   appointment.paymentStatus.charAt(0).toUpperCase() + appointment.paymentStatus.slice(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Cancellation Notice */}
          {appointment.status === 'cancelled' && (
            <div className="mt-4 bg-red-50 border-2 border-red-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-red-900 font-semibold mb-1">This appointment has been cancelled</h3>
                  <p className="text-red-700 text-sm">
                    {appointment.paymentStatus === 'paid' 
                      ? 'You can request a refund using the button in the Actions section.'
                      : 'No payment was made for this appointment.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Content Card Wrapper */}
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
            {/* Appointment Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Appointment Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-3">
                  <CalendarIcon className="w-6 h-6 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-semibold text-gray-900">{formatDate(appointment.appointmentDate)}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <ClockIcon className="w-6 h-6 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">Time</p>
                    <p className="font-semibold text-gray-900">{appointment.appointmentTime || 'Time TBD'}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <DocumentTextIcon className="w-6 h-6 text-purple-500" />
                  <div>
                    <p className="text-sm text-gray-600">Type</p>
                    <p className="font-semibold text-gray-900">{appointment.appointmentType || 'Consultation'}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <CurrencyDollarIcon className="w-6 h-6 text-yellow-500" />
                  <div>
                    <p className="text-sm text-gray-600">Fee</p>
                    <p className="font-semibold text-gray-900">${appointment.consultationFee || 'N/A'}</p>
                  </div>
                </div>
              </div>
              
              {appointment.chiefComplaint && (
                <div className="mt-6">
                  <p className="text-sm text-gray-600 mb-2">Chief Complaint</p>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{appointment.chiefComplaint}</p>
                </div>
              )}
              
              {appointment.symptoms && appointment.symptoms.length > 0 && (
                <div className="mt-6">
                  <p className="text-sm text-gray-600 mb-2">Symptoms</p>
                  <div className="flex flex-wrap gap-2">
                    {appointment.symptoms.map((symptom, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {symptom}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Doctor/Patient Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                {user.role === 'patient' ? 'Doctor Information' : 'Patient Information'}
              </h2>
              
              {user.role === 'patient' && appointment.doctor ? (
                <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200 shadow-sm">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <UserIcon className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Dr. {appointment.doctor.firstName} {appointment.doctor.lastName}
                      </h3>
                      <p className="text-blue-600 font-medium mb-4">{appointment.doctor.specialization}</p>
                      
                      <div className="space-y-3 mt-4">
                        {appointment.doctor.email && (
                          <div className="bg-white rounded-xl p-4 border-2 border-gray-300 shadow-sm">
                            <div className="flex items-center space-x-3">
                              <EnvelopeIcon className="w-5 h-5 text-blue-500" />
                              <span className="text-sm text-gray-900 font-semibold">{appointment.doctor.email}</span>
                            </div>
                          </div>
                        )}
                        {appointment.doctor.phone && (
                          <div className="bg-white rounded-xl p-4 border-2 border-gray-300 shadow-sm">
                            <div className="flex items-center space-x-3">
                              <PhoneIcon className="w-5 h-5 text-green-500" />
                              <span className="text-sm text-gray-900 font-semibold">{appointment.doctor.phone}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : appointment.patient ? (
                <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200 shadow-sm">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <UserIcon className="w-8 h-8 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        {appointment.patient.firstName} {appointment.patient.lastName}
                      </h3>
                      
                      <div className="space-y-3 mt-4">
                        {appointment.patient.email && (
                          <div className="bg-white rounded-xl p-4 border-2 border-gray-300 shadow-sm">
                            <div className="flex items-center space-x-3">
                              <EnvelopeIcon className="w-5 h-5 text-blue-500" />
                              <span className="text-sm text-gray-900 font-semibold">{appointment.patient.email}</span>
                            </div>
                          </div>
                        )}
                        {appointment.patient.phone && (
                          <div className="bg-white rounded-xl p-4 border-2 border-gray-300 shadow-sm">
                            <div className="flex items-center space-x-3">
                              <PhoneIcon className="w-5 h-5 text-green-500" />
                              <span className="text-sm text-gray-900 font-semibold">{appointment.patient.phone}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Information not available</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Actions</h3>
              
              <div className="space-y-3">
                {['scheduled', 'confirmed', 'pending-payment'].includes(appointment.status) && 
                 user.role === 'patient' && (
                  <button
                    onClick={handleCancelAppointment}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <XCircleIcon className="w-5 h-5 inline mr-2" />
                    Cancel Appointment
                  </button>
                )}
                
                {appointment.paymentStatus === 'paid' && 
                 ['scheduled', 'confirmed', 'cancelled'].includes(appointment.status) && 
                 user.role === 'patient' && (
                  <button
                    onClick={() => setShowRefundModal(true)}
                    className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                  >
                    <CurrencyDollarIcon className="w-5 h-5 inline mr-2" />
                    Request Refund
                  </button>
                )}
                
                {user.role === 'doctor' && appointment.status === 'scheduled' && (
                  <button
                    onClick={() => appointmentAPI.updateAppointment(id, { status: 'confirmed' })}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircleIcon className="w-5 h-5 inline mr-2" />
                    Confirm Appointment
                  </button>
                )}
                
                <button
                  onClick={() => navigate('/appointments/book')}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <PencilIcon className="w-5 h-5 inline mr-2" />
                  Book Another Appointment
                </button>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Details</h3>
              
              <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                <div className="space-y-3">
                  <div className="bg-white rounded-xl p-4 border-2 border-gray-300 shadow-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 text-sm font-medium">Consultation Fee</span>
                      <span className="font-bold text-gray-900 text-lg">${appointment.consultationFee || 'N/A'}</span>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl p-4 border-2 border-gray-300 shadow-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 text-sm font-medium">Payment Status</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPaymentStatusColor(appointment.paymentStatus)}`}>
                        {appointment.paymentStatus === 'pay-at-hospital' ? 'Pay at Hospital' : 
                         appointment.paymentStatus.charAt(0).toUpperCase() + appointment.paymentStatus.slice(1)}
                      </span>
                    </div>
                  </div>
                  
                  {appointment.paymentMethod && (
                    <div className="bg-white rounded-xl p-4 border-2 border-gray-300 shadow-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 text-sm font-medium">Payment Method</span>
                        <span className="font-bold text-gray-900">{appointment.paymentMethod}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Request Refund</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Refund *
                </label>
                <select
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a reason</option>
                  <option value="Doctor unavailable">Doctor unavailable</option>
                  <option value="Personal emergency">Personal emergency</option>
                  <option value="Scheduling conflict">Scheduling conflict</option>
                  <option value="Medical condition improved">Medical condition improved</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Details (Optional)
                </label>
                <textarea
                  value={refundDescription}
                  onChange={(e) => setRefundDescription(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Please provide any additional details..."
                />
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Refund Amount:</strong> ${appointment.consultationFee || 0}
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  Refunds typically take 3-5 business days to process.
                </p>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowRefundModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={submittingRefund}
              >
                Cancel
              </button>
              <button
                onClick={handleRequestRefund}
                disabled={!refundReason.trim() || submittingRefund}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {submittingRefund ? 'Submitting...' : 'Submit Refund Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentDetails;
