import React, { useState, useEffect } from 'react';
import { 
  ClockIcon, 
  ArrowTrendingUpIcon, 
  UsersIcon,
  ChartBarIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  ComposedChart,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from 'recharts';
import axios from 'axios';
import toast from 'react-hot-toast';

const PeakHoursChartDashboard = ({ embedded = false }) => {
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [refreshTime, setRefreshTime] = useState(null);
  const [insights, setInsights] = useState([]);
  const [todayStats, setTodayStats] = useState({});

  useEffect(() => {
    // Debounce the fetch to prevent multiple rapid calls
    const timeoutId = setTimeout(() => {
      fetchPeakHoursData();
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [selectedTimeframe]);

  const fetchPeakHoursData = async () => {
    try {
      setLoading(true);
      
      // Use mock data for demonstration
      if (process.env.NODE_ENV === 'development') {
        console.log('Loading peak hours prediction with mock data...');
      }
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockData = generateMockData();
      setPredictions(mockData.predictions);
      
      // Transform data for charts
      const transformedChartData = transformDataForCharts(mockData.predictions);
      setChartData(transformedChartData);
      
      // Generate insights
      const generatedInsights = generateInsights(mockData.predictions);
      setInsights(generatedInsights);
      
      // Generate today's stats
      const stats = generateTodayStats(mockData.predictions);
      setTodayStats(stats);
      
      setRefreshTime(new Date());
      
      if (!embedded) {
        toast.success('Peak hours prediction loaded');
      }
      
    } catch (error) {
      console.error('Error loading peak hours data:', error);
      if (!embedded) {
        toast.error('Failed to load peak hours data');
      }
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();
    
    const weekdayPatterns = {
      1: [ // Monday
        { hour: 8, level: 'High', confidence: 92, patientCount: 45, waitTime: 25, staffNeeded: 8, reason: 'Monday morning appointments backlog' },
        { hour: 9, level: 'Very High', confidence: 95, patientCount: 68, waitTime: 35, staffNeeded: 12, reason: 'Peak Monday rush hour' },
        { hour: 10, level: 'Very High', confidence: 88, patientCount: 62, waitTime: 45, staffNeeded: 12, reason: 'Peak consultation hours' },
        { hour: 11, level: 'High', confidence: 87, patientCount: 48, waitTime: 28, staffNeeded: 9, reason: 'Late morning appointments' },
        { hour: 14, level: 'Medium', confidence: 85, patientCount: 28, waitTime: 15, staffNeeded: 6, reason: 'Afternoon appointments' },
        { hour: 15, level: 'High', confidence: 89, patientCount: 38, waitTime: 22, staffNeeded: 7, reason: 'Afternoon peak' },
        { hour: 16, level: 'High', confidence: 90, patientCount: 41, waitTime: 25, staffNeeded: 8, reason: 'End-of-day consultations' }
      ],
      2: [ // Tuesday
        { hour: 8, level: 'Medium', confidence: 83, patientCount: 28, waitTime: 16, staffNeeded: 5, reason: 'Tuesday morning start' },
        { hour: 9, level: 'Medium', confidence: 85, patientCount: 32, waitTime: 18, staffNeeded: 6, reason: 'Regular morning flow' },
        { hour: 10, level: 'High', confidence: 89, patientCount: 42, waitTime: 25, staffNeeded: 8, reason: 'Mid-morning peak' },
        { hour: 11, level: 'High', confidence: 87, patientCount: 38, waitTime: 22, staffNeeded: 7, reason: 'Late morning appointments' },
        { hour: 14, level: 'Medium', confidence: 84, patientCount: 26, waitTime: 14, staffNeeded: 5, reason: 'Early afternoon' },
        { hour: 15, level: 'Medium', confidence: 82, patientCount: 29, waitTime: 16, staffNeeded: 6, reason: 'Afternoon appointments' },
        { hour: 16, level: 'Medium', confidence: 86, patientCount: 31, waitTime: 18, staffNeeded: 6, reason: 'Late afternoon' }
      ],
      3: [ // Wednesday - Peak day
        { hour: 8, level: 'High', confidence: 89, patientCount: 43, waitTime: 28, staffNeeded: 8, reason: 'Mid-week appointment preference' },
        { hour: 9, level: 'Very High', confidence: 96, patientCount: 72, waitTime: 42, staffNeeded: 13, reason: 'Wednesday peak hours' },
        { hour: 10, level: 'Very High', confidence: 94, patientCount: 58, waitTime: 48, staffNeeded: 11, reason: 'Peak mid-week hours' },
        { hour: 11, level: 'High', confidence: 91, patientCount: 51, waitTime: 32, staffNeeded: 9, reason: 'Sustained high demand' },
        { hour: 13, level: 'High', confidence: 86, patientCount: 39, waitTime: 24, staffNeeded: 7, reason: 'Lunch-time appointments' },
        { hour: 14, level: 'High', confidence: 88, patientCount: 44, waitTime: 27, staffNeeded: 8, reason: 'Afternoon continuation' },
        { hour: 15, level: 'High', confidence: 88, patientCount: 42, waitTime: 26, staffNeeded: 8, reason: 'Afternoon rush' },
        { hour: 16, level: 'Medium', confidence: 85, patientCount: 35, waitTime: 20, staffNeeded: 7, reason: 'Late afternoon' }
      ],
      4: [ // Thursday
        { hour: 8, level: 'Medium', confidence: 82, patientCount: 27, waitTime: 15, staffNeeded: 5, reason: 'Thursday morning' },
        { hour: 9, level: 'Medium', confidence: 84, patientCount: 31, waitTime: 17, staffNeeded: 6, reason: 'Regular flow' },
        { hour: 10, level: 'High', confidence: 87, patientCount: 39, waitTime: 23, staffNeeded: 7, reason: 'Mid-morning appointments' },
        { hour: 11, level: 'High', confidence: 86, patientCount: 37, waitTime: 21, staffNeeded: 7, reason: 'Late morning peak' },
        { hour: 14, level: 'Medium', confidence: 83, patientCount: 25, waitTime: 13, staffNeeded: 5, reason: 'Afternoon lull' },
        { hour: 15, level: 'Medium', confidence: 85, patientCount: 29, waitTime: 16, staffNeeded: 6, reason: 'Mid-afternoon' },
        { hour: 16, level: 'Medium', confidence: 83, patientCount: 30, waitTime: 18, staffNeeded: 6, reason: 'Late afternoon' }
      ],
      5: [ // Friday
        { hour: 8, level: 'Medium', confidence: 81, patientCount: 26, waitTime: 14, staffNeeded: 5, reason: 'Friday morning' },
        { hour: 9, level: 'Medium', confidence: 83, patientCount: 30, waitTime: 17, staffNeeded: 6, reason: 'End-of-week start' },
        { hour: 10, level: 'Medium', confidence: 79, patientCount: 28, waitTime: 16, staffNeeded: 6, reason: 'End-of-week appointments' },
        { hour: 11, level: 'Medium', confidence: 80, patientCount: 24, waitTime: 13, staffNeeded: 5, reason: 'Late morning' },
        { hour: 14, level: 'Low', confidence: 85, patientCount: 18, waitTime: 8, staffNeeded: 4, reason: 'Friday afternoon slowdown' },
        { hour: 15, level: 'Low', confidence: 82, patientCount: 16, waitTime: 7, staffNeeded: 3, reason: 'Weekend preparation' },
        { hour: 16, level: 'Low', confidence: 84, patientCount: 14, waitTime: 6, staffNeeded: 3, reason: 'End of week' }
      ],
      6: [ // Saturday
        { hour: 9, level: 'Low', confidence: 88, patientCount: 15, waitTime: 8, staffNeeded: 3, reason: 'Weekend emergency visits' },
        { hour: 10, level: 'Low', confidence: 86, patientCount: 18, waitTime: 10, staffNeeded: 4, reason: 'Saturday morning' },
        { hour: 11, level: 'Medium', confidence: 84, patientCount: 22, waitTime: 12, staffNeeded: 4, reason: 'Weekend appointments' },
        { hour: 14, level: 'Medium', confidence: 82, patientCount: 24, waitTime: 14, staffNeeded: 5, reason: 'Weekend peak hours' },
        { hour: 15, level: 'Low', confidence: 85, patientCount: 19, waitTime: 10, staffNeeded: 4, reason: 'Saturday afternoon' }
      ],
      0: [ // Sunday
        { hour: 10, level: 'Low', confidence: 90, patientCount: 12, waitTime: 6, staffNeeded: 3, reason: 'Sunday emergency only' },
        { hour: 12, level: 'Low', confidence: 88, patientCount: 14, waitTime: 7, staffNeeded: 3, reason: 'Sunday midday' },
        { hour: 14, level: 'Low', confidence: 86, patientCount: 16, waitTime: 8, staffNeeded: 3, reason: 'Sunday afternoon' },
        { hour: 16, level: 'Low', confidence: 87, patientCount: 13, waitTime: 6, staffNeeded: 3, reason: 'Weekend emergency visits' }
      ]
    };

    // Get base predictions for current day
    let basePredictions = weekdayPatterns[currentDay] || weekdayPatterns[3];
    
    // Adjust based on timeframe
    if (selectedTimeframe === '48h') {
      const nextDay = (currentDay + 1) % 7;
      const nextDayPredictions = (weekdayPatterns[nextDay] || weekdayPatterns[3]).map(p => ({
        ...p,
        hour: p.hour + 24,
        day: 'Tomorrow'
      }));
      basePredictions = [...basePredictions.map(p => ({ ...p, day: 'Today' })), ...nextDayPredictions];
    } else if (selectedTimeframe === '7d') {
      // Generate week view
      basePredictions = [];
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      for (let i = 0; i < 7; i++) {
        const day = (currentDay + i) % 7;
        const dayPredictions = weekdayPatterns[day] || weekdayPatterns[3];
        const peakPrediction = dayPredictions.reduce((max, curr) => 
          curr.patientCount > max.patientCount ? curr : max
        );
        
        basePredictions.push({
          ...peakPrediction,
          day: i === 0 ? 'Today' : dayNames[day],
          dayOffset: i
        });
      }
    } else {
      // 24h view - show all hours for current day
      basePredictions = basePredictions.map(p => ({ ...p, day: 'Today' }));
    }

    return {
      predictions: basePredictions
    };
  };

  const transformDataForCharts = (predictions) => {
    return predictions.map(pred => ({
      hour: `${pred.hour}:00`,
      hourNum: pred.hour,
      patients: pred.patientCount,
      waitTime: pred.waitTime || Math.floor(pred.patientCount * 0.4) + 10,
      staffNeeded: pred.staffNeeded || Math.ceil(pred.patientCount / 6),
      confidence: pred.confidence,
      level: pred.level,
      levelNum: pred.level === 'Very High' ? 4 : pred.level === 'High' ? 3 : pred.level === 'Medium' ? 2 : 1
    }));
  };

  const generateInsights = (predictions) => {
    if (!predictions.length) return [];
    
    const peakPrediction = predictions.reduce((max, curr) => 
      curr.patientCount > max.patientCount ? curr : max
    );
    
    const totalPatients = predictions.reduce((sum, pred) => sum + pred.patientCount, 0);
    const avgWaitTime = predictions.reduce((sum, pred) => sum + (pred.waitTime || 20), 0) / predictions.length;
    
    return [
      {
        type: 'peak',
        title: 'Peak Hour Identified',
        description: `Highest demand expected at ${peakPrediction.hour}:00 with ${peakPrediction.patientCount} patients`,
        recommendation: 'Schedule additional staff during this period',
        icon: ExclamationTriangleIcon,
        color: 'text-red-600 bg-red-50'
      },
      {
        type: 'capacity',
        title: 'Total Daily Volume',
        description: `Expected ${totalPatients} patients across all tracked hours`,
        recommendation: 'Ensure adequate resources are allocated',
        icon: UsersIcon,
        color: 'text-blue-600 bg-blue-50'
      },
      {
        type: 'efficiency',
        title: 'Average Wait Time',
        description: `Predicted average wait time: ${Math.round(avgWaitTime)} minutes`,
        recommendation: avgWaitTime > 25 ? 'Consider optimizing patient flow' : 'Wait times within acceptable range',
        icon: ClockIcon,
        color: avgWaitTime > 25 ? 'text-orange-600 bg-orange-50' : 'text-green-600 bg-green-50'
      }
    ];
  };

  const generateTodayStats = (predictions) => {
    if (!predictions.length) return {};
    
    const totalPatients = predictions.reduce((sum, pred) => sum + pred.patientCount, 0);
    const peakHour = predictions.reduce((max, curr) => 
      curr.patientCount > max.patientCount ? curr : max
    );
    const avgConfidence = predictions.reduce((sum, pred) => sum + pred.confidence, 0) / predictions.length;
    
    return {
      totalPredicted: totalPatients,
      peakHour: `${peakHour.hour}:00`,
      peakPatients: peakHour.patientCount,
      avgConfidence: Math.round(avgConfidence),
      staffRecommendation: Math.max(...predictions.map(p => p.staffNeeded || 6))
    };
  };

  const getLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'very high': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow ${embedded ? 'p-4' : 'p-6'}`}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
          <span className="text-gray-600">Loading peak hours prediction...</span>
        </div>
      </div>
    );
  }

  // Debug output (development only)
  if (process.env.NODE_ENV === 'development' && predictions.length > 0) {
    console.log('Peak Hours Dashboard rendered with:', {
      predictions: predictions.length,
      chartData: chartData.length,
      insights: insights.length
    });
  }

  return (
    <div className={`bg-white rounded-lg shadow ${embedded ? 'p-4' : 'p-6'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <ChartBarIcon className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Peak Hours Prediction</h2>
            <p className="text-sm text-gray-600">AI-powered demand forecasting with visual analytics</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
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
            onClick={fetchPeakHoursData}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <ArrowPathIcon className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <UsersIcon className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Predicted</p>
              <p className="text-2xl font-bold text-gray-900">{todayStats.totalPredicted || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="w-8 h-8 text-red-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Peak Hour</p>
              <p className="text-2xl font-bold text-gray-900">{todayStats.peakHour || 'N/A'}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <ChartBarIcon className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Confidence</p>
              <p className="text-2xl font-bold text-gray-900">{todayStats.avgConfidence || 0}%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center">
            <UsersIcon className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Max Staff Needed</p>
              <p className="text-2xl font-bold text-gray-900">{todayStats.staffRecommendation || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Patient Volume Chart */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <ChartBarIcon className="w-5 h-5 mr-2 text-blue-600" />
            Patient Volume by Hour
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [value, name === 'patients' ? 'Patients' : name]}
                labelFormatter={(label) => `Time: ${label}`}
              />
              <Legend />
              <Bar dataKey="patients" fill={COLORS[0]} name="Expected Patients" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Wait Time vs Staff Chart */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <ClockIcon className="w-5 h-5 mr-2 text-orange-600" />
            Wait Time vs Staff Requirements
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="waitTime" fill={COLORS[2]} name="Wait Time (min)" />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="staffNeeded" 
                stroke={COLORS[1]} 
                strokeWidth={3}
                name="Staff Needed"
                dot={{ fill: COLORS[1] }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Demand Level Distribution */}
      <div className="bg-gray-50 p-6 rounded-lg mb-8">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <ArrowTrendingUpIcon className="w-5 h-5 mr-2 text-green-600" />
          Hourly Demand Forecast
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip 
              formatter={(value, name) => [
                name === 'patients' ? `${value} patients` : 
                name === 'confidence' ? `${value}%` : value,
                name === 'patients' ? 'Expected Patients' : 
                name === 'confidence' ? 'Confidence' : name
              ]}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="patients" 
              stroke={COLORS[0]} 
              strokeWidth={3}
              name="Expected Patients"
              dot={{ fill: COLORS[0], strokeWidth: 2, r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="confidence" 
              stroke={COLORS[4]} 
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Confidence %"
              dot={{ fill: COLORS[4], strokeWidth: 2, r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Insights Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <InformationCircleIcon className="w-5 h-5 mr-2 text-blue-600" />
          AI Insights & Recommendations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {insights.map((insight, index) => {
            const Icon = insight.icon;
            return (
              <div key={index} className={`p-4 rounded-lg border ${insight.color}`}>
                <div className="flex items-start space-x-3">
                  <Icon className="w-6 h-6 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold mb-1">{insight.title}</h4>
                    <p className="text-sm mb-2">{insight.description}</p>
                    <p className="text-xs font-medium">{insight.recommendation}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Predictions List */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Detailed Predictions</h3>
        <div className="space-y-3">
          {predictions.map((prediction, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center space-x-4">
                <ClockIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-gray-900">{prediction.hour}:00</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(prediction.level)}`}>
                      {prediction.level}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{prediction.reason}</p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <UsersIcon className="w-4 h-4 mr-1" />
                    {prediction.patientCount} patients
                  </div>
                  <div>
                    Confidence: {prediction.confidence}%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {predictions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <ClockIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No predictions available for the selected timeframe.</p>
            <button 
              onClick={fetchPeakHoursData}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Reload Data
            </button>
          </div>
        )}
      </div>

      {/* Footer Info */}
      {refreshTime && (
        <div className="mt-6 pt-4 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            Last updated: {refreshTime.toLocaleString()} • 
            Data refreshes automatically every 15 minutes
          </p>
        </div>
      )}
    </div>
  );
};

export default PeakHoursChartDashboard;
