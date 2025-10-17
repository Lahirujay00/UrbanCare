/**
 * @fileoverview Appointments List Component
 * @author UrbanCare Development Team
 * @version 1.0.0
 */

import React from 'react';
import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

/**
 * AppointmentsList component for displaying patient appointments
 * Follows Single Responsibility Principle - only renders appointments list
 * @param {Object} props - Component props
 * @param {Array} props.appointments - Appointments array
 * @param {boolean} props.loading - Loading state
 * @param {Function} props.onViewDetails - Callback for viewing appointment details
 * @param {Function} props.onCancel - Callback for cancelling appointment
 * @param {Function} props.onReschedule - Callback for rescheduling appointment
 * @returns {JSX.Element} Appointments list component
 */
const AppointmentsList = ({ 
  appointments = [], 
  loading = false,
  onViewDetails = () => {},
  onCancel = () => {},
  onReschedule = () => {}
}) => {
  /**
   * Gets status badge styling
   * @param {string} status - Appointment status
   * @returns {string} CSS classes for status badge
   */
  const getStatusBadge = (status) => {
    const statusStyles = {
      scheduled: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      'no-show': 'bg-yellow-100 text-yellow-800'
    };
    
    return statusStyles[status] || 'bg-gray-100 text-gray-800';
  };

  /**
   * Formats appointment date and time
   * @param {string|Date} dateTime - Appointment date time
   * @returns {Object} Formatted date and time
   */
  const formatDateTime = (dateTime) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  /**
   * Checks if appointment is upcoming
   * @param {string|Date} dateTime - Appointment date time
   * @returns {boolean} True if appointment is upcoming
   */
  const isUpcoming = (dateTime) => {
    return new Date(dateTime) > new Date();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        </div>
        <div className="p-6">
          {[1, 2, 3].map((index) => (
            <div key={index} className="flex items-center p-4 border border-gray-200 rounded-lg mb-4 animate-pulse">
              <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
              <div className="ml-4 flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="w-20 h-6 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Appointments</h3>
        </div>
        <div className="p-6 text-center">
          <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have any appointments scheduled yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Recent Appointments</h3>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {appointments.map((appointment) => {
            const { date, time } = formatDateTime(appointment.appointmentDate);
            const upcoming = isUpcoming(appointment.appointmentDate);
            
            return (
              <div
                key={appointment.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <CalendarIcon className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {appointment.doctor ? 
                          `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}` : 
                          'Doctor TBA'
                        }
                      </p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(appointment.status)}`}>
                        {appointment.status}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <ClockIcon className="w-4 h-4 mr-1" />
                        {date} at {time}
                      </div>
                      
                      {appointment.department && (
                        <div className="flex items-center">
                          <MapPinIcon className="w-4 h-4 mr-1" />
                          {appointment.department}
                        </div>
                      )}
                    </div>
                    
                    {appointment.reasonForVisit && (
                      <p className="text-sm text-gray-600 mt-1 truncate">
                        {appointment.reasonForVisit}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onViewDetails(appointment)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View
                  </button>
                  
                  {upcoming && (appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
                    <>
                      <button
                        onClick={() => onReschedule(appointment)}
                        className="text-yellow-600 hover:text-yellow-800 text-sm font-medium"
                      >
                        Reschedule
                      </button>
                      <button
                        onClick={() => onCancel(appointment)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AppointmentsList;
