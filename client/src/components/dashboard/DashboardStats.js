/**
 * @fileoverview Dashboard Statistics Component
 * @author UrbanCare Development Team
 * @version 1.0.0
 */

import React from 'react';
import {
  CalendarIcon,
  DocumentTextIcon,
  ClockIcon,
  BellIcon
} from '@heroicons/react/24/outline';

/**
 * DashboardStats component for displaying patient statistics
 * Follows Single Responsibility Principle - only renders statistics
 * @param {Object} props - Component props
 * @param {Object} props.stats - Statistics data
 * @param {boolean} props.loading - Loading state
 * @returns {JSX.Element} Dashboard statistics component
 */
const DashboardStats = ({ stats = {}, loading = false }) => {
  const {
    upcomingAppointments = 0,
    totalRecords = 0,
    recentRecords = 0,
    notifications = 0
  } = stats;

  const statItems = [
    {
      id: 'appointments',
      name: 'Upcoming Appointments',
      value: upcomingAppointments,
      icon: CalendarIcon,
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      id: 'records',
      name: 'Medical Records',
      value: totalRecords,
      icon: DocumentTextIcon,
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      id: 'recent',
      name: 'Recent Records',
      value: recentRecords,
      icon: ClockIcon,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600'
    },
    {
      id: 'notifications',
      name: 'Notifications',
      value: notifications,
      icon: BellIcon,
      color: 'bg-red-500',
      textColor: 'text-red-600'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
              <div className="ml-4 flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statItems.map((item) => {
        const Icon = item.icon;
        
        return (
          <div key={item.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
            <div className="flex items-center">
              <div className={`${item.color} p-3 rounded-lg`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{item.name}</p>
                <p className={`text-2xl font-bold ${item.textColor}`}>
                  {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DashboardStats;
