/**
 * @fileoverview Recent Activity Component
 * @author UrbanCare Development Team
 * @version 1.0.0
 */

import React from 'react';
import {
  CalendarIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

/**
 * RecentActivity component for displaying patient recent activities
 * Follows Single Responsibility Principle - only renders activity feed
 * @param {Object} props - Component props
 * @param {Array} props.activities - Activities array
 * @param {boolean} props.loading - Loading state
 * @param {Function} props.onActivityClick - Callback for activity click
 * @returns {JSX.Element} Recent activity component
 */
const RecentActivity = ({ 
  activities = [], 
  loading = false,
  onActivityClick = () => {}
}) => {
  /**
   * Gets activity icon based on type and status
   * @param {string} type - Activity type
   * @param {string} status - Activity status
   * @returns {JSX.Element} Activity icon
   */
  const getActivityIcon = (type, status) => {
    const iconProps = { className: "w-5 h-5" };
    
    if (type === 'appointment') {
      if (status === 'completed') {
        return <CheckCircleIcon {...iconProps} className="w-5 h-5 text-green-500" />;
      } else if (status === 'cancelled') {
        return <XCircleIcon {...iconProps} className="w-5 h-5 text-red-500" />;
      } else {
        return <CalendarIcon {...iconProps} className="w-5 h-5 text-blue-500" />;
      }
    } else if (type === 'medical_record') {
      return <DocumentTextIcon {...iconProps} className="w-5 h-5 text-green-500" />;
    } else {
      return <ExclamationCircleIcon {...iconProps} className="w-5 h-5 text-gray-500" />;
    }
  };

  /**
   * Gets activity color based on type and status
   * @param {string} type - Activity type
   * @param {string} status - Activity status
   * @returns {string} CSS color classes
   */
  const getActivityColor = (type, status) => {
    if (type === 'appointment') {
      if (status === 'completed') return 'bg-green-100 border-green-200';
      if (status === 'cancelled') return 'bg-red-100 border-red-200';
      return 'bg-blue-100 border-blue-200';
    } else if (type === 'medical_record') {
      return 'bg-green-100 border-green-200';
    }
    return 'bg-gray-100 border-gray-200';
  };

  /**
   * Formats activity date
   * @param {string|Date} date - Activity date
   * @returns {string} Formatted date
   */
  const formatDate = (date) => {
    const activityDate = new Date(date);
    const now = new Date();
    const diffInHours = Math.floor((now - activityDate) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return activityDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        </div>
        <div className="p-6">
          {[1, 2, 3, 4, 5].map((index) => (
            <div key={index} className="flex items-start space-x-3 mb-4 animate-pulse">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        </div>
        <div className="p-6 text-center">
          <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
          <p className="mt-1 text-sm text-gray-500">
            Your recent appointments and medical records will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
      </div>
      <div className="p-6">
        <div className="flow-root">
          <ul className="-mb-8">
            {activities.map((activity, activityIdx) => (
              <li key={activity.id}>
                <div className="relative pb-8">
                  {activityIdx !== activities.length - 1 ? (
                    <span
                      className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                      aria-hidden="true"
                    />
                  ) : null}
                  
                  <div className="relative flex space-x-3">
                    <div>
                      <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${getActivityColor(activity.type, activity.status)}`}>
                        {getActivityIcon(activity.type, activity.status)}
                      </span>
                    </div>
                    
                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                      <div>
                        <p 
                          className="text-sm text-gray-900 cursor-pointer hover:text-blue-600"
                          onClick={() => onActivityClick(activity)}
                        >
                          {activity.title}
                        </p>
                        
                        {activity.data?.reasonForVisit && (
                          <p className="text-sm text-gray-500 mt-1">
                            {activity.data.reasonForVisit}
                          </p>
                        )}
                        
                        {activity.data?.diagnosis && (
                          <p className="text-sm text-gray-500 mt-1">
                            Diagnosis: {activity.data.diagnosis}
                          </p>
                        )}
                        
                        {activity.data?.department && (
                          <p className="text-sm text-gray-500 mt-1">
                            Department: {activity.data.department}
                          </p>
                        )}
                      </div>
                      
                      <div className="text-right text-sm whitespace-nowrap text-gray-500">
                        <time dateTime={activity.date}>
                          {formatDate(activity.date)}
                        </time>
                        
                        {activity.status && (
                          <div className="mt-1">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              activity.status === 'completed' ? 'bg-green-100 text-green-800' :
                              activity.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              activity.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {activity.status}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RecentActivity;
