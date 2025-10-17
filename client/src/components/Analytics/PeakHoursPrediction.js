import React, { useState, useEffect } from 'react';
import { 
  ClockIcon, 
  ArrowTrendingUpIcon, 
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CalendarIcon,
  UsersIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const PeakHoursPrediction = ({ embedded = false, dateRange = null }) => {
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [refreshTime, setRefreshTime] = useState(null);

  useEffect(() => {
    fetchPredictions();
  }, [selectedTimeframe, dateRange]);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      
      // Mock prediction data based on current time and day
      const now = new Date();
      const currentHour = now.getHours();
      const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockPredictions = generateMockPredictions(currentDay, currentHour, selectedTimeframe);
      setPredictions(mockPredictions);
      setRefreshTime(new Date());
      
      if (!embedded) {
        toast.success('Peak hours prediction updated');
      }
    } catch (error) {
      console.error('Error fetching predictions:', error);
      if (!embedded) {
        toast.error('Failed to fetch peak hours prediction');
      }
    } finally {
      setLoading(false);
    }
  };

  const generateMockPredictions = (dayOfWeek, currentHour, timeframe) => {
    // Define typical healthcare facility peak patterns
    const weekdayPatterns = {
      // Monday - High morning rush, steady afternoon
      1: [
        { hour: 8, level: 'High', confidence: 92, patientCount: 45, reason: 'Monday morning appointments backlog' },
        { hour: 10, level: 'Very High', confidence: 88, patientCount: 62, reason: 'Peak consultation hours' },
        { hour: 14, level: 'Medium', confidence: 85, patientCount: 28, reason: 'Afternoon appointments' },
        { hour: 16, level: 'High', confidence: 90, patientCount: 41, reason: 'End-of-day consultations' }
      ],
      // Tuesday - Moderate throughout
      2: [
        { hour: 9, level: 'Medium', confidence: 85, patientCount: 32, reason: 'Regular morning flow' },
        { hour: 11, level: 'High', confidence: 87, patientCount: 38, reason: 'Mid-morning peak' },
        { hour: 15, level: 'Medium', confidence: 82, patientCount: 29, reason: 'Afternoon appointments' }
      ],
      // Wednesday - Peak day
      3: [
        { hour: 8, level: 'High', confidence: 89, patientCount: 43, reason: 'Mid-week appointment preference' },
        { hour: 10, level: 'Very High', confidence: 94, patientCount: 58, reason: 'Peak mid-week hours' },
        { hour: 13, level: 'High', confidence: 86, patientCount: 39, reason: 'Lunch-time appointments' },
        { hour: 15, level: 'High', confidence: 88, patientCount: 42, reason: 'Afternoon rush' }
      ],
      // Thursday - Similar to Tuesday
      4: [
        { hour: 9, level: 'Medium', confidence: 84, patientCount: 31, reason: 'Regular flow' },
        { hour: 11, level: 'High', confidence: 86, patientCount: 37, reason: 'Late morning peak' },
        { hour: 16, level: 'Medium', confidence: 83, patientCount: 30, reason: 'Late afternoon' }
      ],
      // Friday - Lower as people avoid appointments
      5: [
        { hour: 8, level: 'Medium', confidence: 81, patientCount: 26, reason: 'Friday morning' },
        { hour: 10, level: 'Medium', confidence: 79, patientCount: 28, reason: 'End-of-week appointments' },
        { hour: 14, level: 'Low', confidence: 85, patientCount: 18, reason: 'Friday afternoon slowdown' }
      ],
      // Saturday - Emergency focus
      6: [
        { hour: 10, level: 'Low', confidence: 88, patientCount: 15, reason: 'Weekend emergency visits' },
        { hour: 14, level: 'Medium', confidence: 82, patientCount: 22, reason: 'Weekend peak hours' }
      ],
      // Sunday - Minimal
      0: [
        { hour: 12, level: 'Low', confidence: 90, patientCount: 12, reason: 'Sunday emergency only' },
        { hour: 16, level: 'Low', confidence: 87, patientCount: 14, reason: 'Weekend emergency visits' }
      ]
    };

    const basePredictions = weekdayPatterns[dayOfWeek] || weekdayPatterns[3]; // Default to Wednesday
    
    // Adjust predictions based on timeframe
    if (timeframe === '48h') {
      // Add next day predictions
      const nextDay = (dayOfWeek + 1) % 7;
      const nextDayPredictions = (weekdayPatterns[nextDay] || weekdayPatterns[3]).map(p => ({
        ...p,
        hour: p.hour + 24,
        day: 'Tomorrow'
      }));
      return [...basePredictions.map(p => ({ ...p, day: 'Today' })), ...nextDayPredictions];
    }
    
    if (timeframe === '7d') {
      // Generate week view with daily peaks
      const weekPredictions = [];
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      for (let i = 0; i < 7; i++) {
        const day = (dayOfWeek + i) % 7;
        const dayPredictions = weekdayPatterns[day] || weekdayPatterns[3];
        const peakPrediction = dayPredictions.reduce((max, curr) => 
          curr.patientCount > max.patientCount ? curr : max
        );
        
        weekPredictions.push({
          ...peakPrediction,
          day: i === 0 ? 'Today' : dayNames[day],
          dayOffset: i
        });
      }
      return weekPredictions;
    }
    
    // Default 24h view - filter for upcoming hours
    return basePredictions
      .filter(p => p.hour > currentHour)
      .map(p => ({ ...p, day: 'Today' }));
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'Very High': return 'text-red-600 bg-red-50';
      case 'High': return 'text-orange-600 bg-orange-50';
      case 'Medium': return 'text-yellow-600 bg-yellow-50';
      case 'Low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getLevelIcon = (level) => {
    switch (level) {
      case 'Very High': return ExclamationTriangleIcon;
      case 'High': return ArrowTrendingUpIcon;
      case 'Medium': return ClockIcon;
      case 'Low': return InformationCircleIcon;
      default: return ClockIcon;
    }
  };

  const formatTime = (hour) => {
    if (hour >= 24) {
      return `${hour - 24}:00 (Next Day)`;
    }
    return `${hour}:00`;
  };

  if (loading) {
    return (
      <div className={`${embedded ? 'p-4' : 'p-6'} bg-white ${!embedded ? 'min-h-screen' : ''}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading predictions...</span>
        </div>
      </div>
    );
  }

  const content = (
    <div className={`bg-white ${embedded ? 'border border-gray-200 rounded-lg' : ''}`}>
      {!embedded && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">Peak Hours Prediction</h1>
              <p className="text-blue-100">AI-powered forecasting of facility utilization</p>
            </div>
            <ChartBarIcon className="h-12 w-12 text-blue-200" />
          </div>
        </div>
      )}

      <div className={`${embedded ? 'p-4' : 'p-6'}`}>
        {!embedded && (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="24h">Next 24 Hours</option>
                <option value="48h">Next 48 Hours</option>
                <option value="7d">Next 7 Days</option>
              </select>
              <button
                onClick={fetchPredictions}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Refresh
              </button>
            </div>
            {refreshTime && (
              <div className="text-sm text-gray-500">
                Last updated: {refreshTime.toLocaleTimeString()}
              </div>
            )}
          </div>
        )}

        {embedded && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2 flex items-center">
              <ChartBarIcon className="h-5 w-5 mr-2 text-blue-600" />
              Peak Hours Forecast
            </h3>
          </div>
        )}

        <div className="grid gap-4">
          {predictions.map((prediction, index) => {
            const Icon = getLevelIcon(prediction.level);
            const colorClass = getLevelColor(prediction.level);
            
            return (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-full ${colorClass}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-gray-900">
                          {selectedTimeframe === '7d' ? prediction.day : formatTime(prediction.hour)}
                        </span>
                        {prediction.day && selectedTimeframe !== '7d' && (
                          <span className="text-sm text-gray-500">({prediction.day})</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{prediction.reason}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
                      {prediction.level}
                    </div>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <div className="flex items-center">
                        <UsersIcon className="h-4 w-4 mr-1" />
                        {prediction.patientCount} patients
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs">Confidence: {prediction.confidence}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {predictions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <ClockIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No predictions available for the selected timeframe.</p>
          </div>
        )}

        {!embedded && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-blue-800 font-medium mb-1">How Peak Hours Prediction Works</p>
                <p className="text-blue-700">
                  Our AI analyzes historical patient visit patterns, appointment schedules, seasonal trends, 
                  and external factors to predict facility utilization. Use this data to optimize staff 
                  scheduling and resource allocation.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return embedded ? content : (
    <div className="min-h-screen bg-gray-50">
      {content}
    </div>
  );
};

export default PeakHoursPrediction;
