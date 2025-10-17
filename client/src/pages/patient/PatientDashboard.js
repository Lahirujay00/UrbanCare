/**
 * @fileoverview Refactored Patient Dashboard following SOLID principles
 * @author UrbanCare Development Team
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { usePatientDashboard } from '../../hooks/usePatientDashboard';
import DashboardStats from '../../components/dashboard/DashboardStats';
import AppointmentsList from '../../components/dashboard/AppointmentsList';
import RecentActivity from '../../components/dashboard/RecentActivity';
import toast from 'react-hot-toast';
import {
  ArrowPathIcon,
  PlusIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

/**
 * PatientDashboard component following SOLID principles
 * Single Responsibility: Only orchestrates dashboard components
 * Open/Closed: Extensible by adding new dashboard components
 * Dependency Inversion: Depends on hooks abstraction, not concrete implementations
 * @returns {JSX.Element} Patient dashboard component
 */
const PatientDashboard = () => {
  const {
    data,
    loading,
    error,
    refreshing,
    refreshData,
    bookAppointment,
    cancelAppointment,
    hasAppointments,
    upcomingAppointmentsCount
  } = usePatientDashboard();

  // Local UI state
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  /**
   * Handles appointment details view
   * @param {Object} appointment - Appointment object
   */
  const handleViewAppointmentDetails = (appointment) => {
    setSelectedAppointment(appointment);
    // In a real app, this would open a modal or navigate to details page
    console.log('View appointment details:', appointment);
  };

  /**
   * Handles appointment cancellation
   * @param {Object} appointment - Appointment object
   */
  const handleCancelAppointment = async (appointment) => {
    const confirmed = window.confirm(
      `Are you sure you want to cancel your appointment with ${appointment.doctor?.firstName} ${appointment.doctor?.lastName}?`
    );
    
    if (confirmed) {
      try {
        await cancelAppointment(appointment.id, 'Patient requested cancellation');
      } catch (error) {
        // Error is already handled by the hook
        console.error('Failed to cancel appointment:', error);
      }
    }
  };

  /**
   * Handles appointment rescheduling
   * @param {Object} appointment - Appointment object
   */
  const handleRescheduleAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setShowBookingModal(true);
    // In a real app, this would open a rescheduling modal
    console.log('Reschedule appointment:', appointment);
  };

  /**
   * Handles activity item click
   * @param {Object} activity - Activity object
   */
  const handleActivityClick = (activity) => {
    if (activity.type === 'appointment') {
      handleViewAppointmentDetails(activity.data);
    } else if (activity.type === 'medical_record') {
      // Navigate to medical records or show details
      console.log('View medical record:', activity.data);
    }
  };

  /**
   * Handles new appointment booking
   */
  const handleBookNewAppointment = () => {
    setShowBookingModal(true);
    // In a real app, this would open a booking modal
    console.log('Book new appointment');
  };

  // Error state
  if (error && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Unable to Load Dashboard
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {error}
          </p>
          <button
            onClick={refreshData}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Patient Dashboard
              </h1>
              <p className="text-sm text-gray-500">
                Welcome back! Here's your health overview.
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={refreshData}
                disabled={refreshing}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <ArrowPathIcon className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              
              <button
                onClick={handleBookNewAppointment}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Book Appointment
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Statistics */}
        <DashboardStats 
          stats={data.stats} 
          loading={loading}
        />

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Appointments */}
          <div className="lg:col-span-2">
            <AppointmentsList
              appointments={data.appointments}
              loading={loading}
              onViewDetails={handleViewAppointmentDetails}
              onCancel={handleCancelAppointment}
              onReschedule={handleRescheduleAppointment}
            />
          </div>

          {/* Right Column - Recent Activity */}
          <div className="lg:col-span-1">
            <RecentActivity
              activities={data.recentActivity}
              loading={loading}
              onActivityClick={handleActivityClick}
            />
          </div>
        </div>

        {/* Quick Actions */}
        {!loading && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={handleBookNewAppointment}
                className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Book Appointment
              </button>
              
              <button
                onClick={() => console.log('View medical records')}
                className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                View Records
              </button>
              
              <button
                onClick={() => console.log('Update profile')}
                className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Update Profile
              </button>
              
              <button
                onClick={() => console.log('Contact support')}
                className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Contact Support
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDashboard;
