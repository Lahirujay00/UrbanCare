import React, { useState, useEffect } from 'react';
import { 
  ClockIcon, 
  ArrowTrendingUpIcon, 
  UsersIcon,
  ChartBarIcon,
  CalendarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const PeakHoursPrediction = ({ embedded = false, dateRange = null }) => {
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState('today');
  const [todayStats, setTodayStats] = useState({});

  useEffect(() => {
    fetchPredictions();
  }, [selectedTimeframe, dateRange]);

  const fetchPredictions = async () => {
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();
    
    const mockPredictions = generatePredictions(currentDay, currentHour, selectedTimeframe);
    const stats = generateTodayStats();
    
    setPredictions(mockPredictions);
    setTodayStats(stats);
    setLoading(false);
  };

  const generatePredictions = (dayOfWeek, currentHour, timeframe) => {
    const basePatterns = {
      // Monday - High volume due to weekend backlog
      1: [
        { hour: '08:00', level: 'High', patients: 45, wait: '25 min', staff: 8, status: 'upcoming' },
        { hour: '09:00', level: 'Very High', patients: 68, wait: '45 min', staff: 12, status: 'peak' },
        { hour: '10:00', level: 'High', patients: 52, wait: '30 min', staff: 10, status: 'current' },
        { hour: '11:00', level: 'Medium', patients: 35, wait: '18 min', staff: 7, status: 'upcoming' },
        { hour: '14:00', level: 'Medium', patients: 28, wait: '15 min', staff: 6, status: 'upcoming' },
        { hour: '15:00', level: 'High', patients: 42, wait: '25 min', staff: 8, status: 'upcoming' }
      ],
      // Tuesday-Thursday - Normal patterns
      2: [
        { hour: '09:00', level: 'Medium', patients: 32, wait: '18 min', staff: 6, status: 'current' },
        { hour: '10:00', level: 'Medium', patients: 28, wait: '15 min', staff: 6, status: 'upcoming' },
        { hour: '11:00', level: 'High', patients: 38, wait: '22 min', staff: 7, status: 'upcoming' },
        { hour: '15:00', level: 'Medium', patients: 29, wait: '16 min', staff: 6, status: 'upcoming' }
      ],
      // Wednesday - Peak mid-week
      3: [
        { hour: '08:00', level: 'Medium', patients: 35, wait: '20 min', staff: 7, status: 'upcoming' },
        { hour: '09:00', level: 'Very High', patients: 72, wait: '48 min', staff: 13, status: 'peak' },
        { hour: '10:00', level: 'High', patients: 48, wait: '28 min', staff: 9, status: 'current' },
        { hour: '11:00', level: 'High', patients: 41, wait: '24 min', staff: 8, status: 'upcoming' },
        { hour: '15:00', level: 'Medium', patients: 33, wait: '18 min', staff: 6, status: 'upcoming' }
      ],
      // Thursday
      4: [
        { hour: '09:00', level: 'Medium', patients: 31, wait: '17 min', staff: 6, status: 'current' },
        { hour: '10:00', level: 'Medium', patients: 27, wait: '14 min', staff: 5, status: 'upcoming' },
        { hour: '11:00', level: 'High', patients: 37, wait: '21 min', staff: 7, status: 'upcoming' },
        { hour: '16:00', level: 'Medium', patients: 30, wait: '18 min', staff: 6, status: 'upcoming' }
      ],
      // Friday - Lower volume
      5: [
        { hour: '08:00', level: 'Low', patients: 22, wait: '12 min', staff: 4, status: 'upcoming' },
        { hour: '10:00', level: 'Medium', patients: 28, wait: '16 min', staff: 5, status: 'current' },
        { hour: '11:00', level: 'Medium', patients: 25, wait: '14 min', staff: 5, status: 'upcoming' },
        { hour: '14:00', level: 'Low', patients: 18, wait: '8 min', staff: 4, status: 'upcoming' }
      ],
      // Weekend
      6: [
        { hour: '10:00', level: 'Low', patients: 15, wait: '10 min', staff: 3, status: 'current' },
        { hour: '11:00', level: 'Low', patients: 18, wait: '12 min', staff: 4, status: 'upcoming' },
        { hour: '13:00', level: 'Medium', patients: 24, wait: '15 min', staff: 5, status: 'upcoming' }
      ],
      0: [
        { hour: '11:00', level: 'Low', patients: 12, wait: '8 min', staff: 3, status: 'current' },
        { hour: '13:00', level: 'Low', patients: 16, wait: '10 min', staff: 3, status: 'upcoming' },
        { hour: '15:00', level: 'Medium', patients: 20, wait: '12 min', staff: 4, status: 'upcoming' }
      ]
    };

    return basePatterns[dayOfWeek] || basePatterns[2];
  };

  const generateTodayStats = () => {
    return {
      totalPatients: 287,
      currentWaitTime: '22 min',
      peakHour: '09:00 AM',
      staffOnDuty: 8,
      availableRooms: 12,
      nextPeak: '15:00 PM'
    };
  };

  const getLevelColor = (level) => {
    switch (level.toLowerCase()) {
      case 'very high': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'peak': return <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />;
      case 'current': return <ClockIcon className="w-4 h-4 text-blue-500" />;
      default: return <ArrowTrendingUpIcon className="w-4 h-4 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow ${embedded ? 'p-4' : 'p-6'}`}>
      {!embedded && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <ChartBarIcon className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Peak Hours Prediction</h2>
          </div>
          
          <div className="flex space-x-2">
            {['today', '3days', 'week'].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedTimeframe(period)}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  selectedTimeframe === period
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {period === 'today' ? 'Today' : period === '3days' ? '3 Days' : 'Week'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Today's Overview */}
      {!embedded && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <UsersIcon className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Today's Patients</p>
                <p className="text-xl font-bold text-gray-900">{todayStats.totalPatients}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center">
              <ClockIcon className="w-8 h-8 text-orange-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Current Wait</p>
                <p className="text-xl font-bold text-gray-900">{todayStats.currentWaitTime}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <CalendarIcon className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Next Peak</p>
                <p className="text-xl font-bold text-gray-900">{todayStats.nextPeak}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Predictions List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {selectedTimeframe === 'today' ? 'Today\'s Schedule' : 'Upcoming Periods'}
        </h3>
        
        {predictions.map((prediction, index) => (
          <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center space-x-4">
              {getStatusIcon(prediction.status)}
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-gray-900">{prediction.hour}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(prediction.level)}`}>
                    {prediction.level}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {prediction.patients} patients • {prediction.wait} wait • {prediction.staff} staff needed
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="flex items-center space-x-2">
                <UsersIcon className="w-4 h-4 text-gray-400" />
                <span className="text-lg font-bold text-gray-900">{prediction.patients}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      {!embedded && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
              Adjust Staffing
            </button>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm">
              Send Alerts
            </button>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm">
              View History
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PeakHoursPrediction;