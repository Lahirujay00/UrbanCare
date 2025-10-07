import React, { useState, useEffect } from 'react';
import {
  ClockIcon,
  ChartBarIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  ArrowTrendingUpIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { reportAPI } from '../../services/api';
import toast from 'react-hot-toast';

const PeakHoursPrediction = () => {
  const [loading, setLoading] = useState(true);
  const [peakData, setPeakData] = useState(null);
  const [selectedDay, setSelectedDay] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [predictionPeriod, setPredictionPeriod] = useState('week');

  const daysOfWeek = [
    { value: 'all', label: 'All Days' },
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' }
  ];

  const departments = [
    { value: 'all', label: 'All Departments' },
    { value: 'general', label: 'General Medicine' },
    { value: 'cardiology', label: 'Cardiology' },
    { value: 'orthopedics', label: 'Orthopedics' },
    { value: 'pediatrics', label: 'Pediatrics' },
    { value: 'emergency', label: 'Emergency' }
  ];

  useEffect(() => {
    fetchPeakHoursData();
  }, [selectedDay, selectedDepartment, predictionPeriod]);

  const fetchPeakHoursData = async () => {
    try {
      setLoading(true);
      
      // Mock data for peak hours prediction
      const mockData = {
        hourlyData: [
          { hour: '6:00', appointments: 2, predicted: 3, capacity: 10 },
          { hour: '7:00', appointments: 5, predicted: 7, capacity: 10 },
          { hour: '8:00', appointments: 12, predicted: 15, capacity: 15 },
          { hour: '9:00', appointments: 18, predicted: 22, capacity: 20 },
          { hour: '10:00', appointments: 25, predicted: 28, capacity: 25 },
          { hour: '11:00', appointments: 22, predicted: 25, capacity: 25 },
          { hour: '12:00', appointments: 15, predicted: 18, capacity: 20 },
          { hour: '13:00', appointments: 10, predicted: 12, capacity: 15 },
          { hour: '14:00', appointments: 20, predicted: 24, capacity: 25 },
          { hour: '15:00', appointments: 28, predicted: 32, capacity: 30 },
          { hour: '16:00', appointments: 30, predicted: 35, capacity: 30 },
          { hour: '17:00', appointments: 25, predicted: 28, capacity: 25 },
          { hour: '18:00', appointments: 15, predicted: 18, capacity: 20 },
          { hour: '19:00', appointments: 8, predicted: 10, capacity: 15 },
          { hour: '20:00', appointments: 5, predicted: 6, capacity: 10 }
        ],
        weeklyTrends: [
          { day: 'Mon', current: 180, predicted: 195, capacity: 200 },
          { day: 'Tue', current: 165, predicted: 175, capacity: 200 },
          { day: 'Wed', current: 190, predicted: 205, capacity: 200 },
          { day: 'Thu', current: 175, predicted: 185, capacity: 200 },
          { day: 'Fri', current: 200, predicted: 220, capacity: 200 },
          { day: 'Sat', current: 120, predicted: 130, capacity: 150 },
          { day: 'Sun', current: 80, predicted: 85, capacity: 100 }
        ],
        peakHours: [
          { time: '9:00-11:00 AM', utilization: 95, status: 'critical' },
          { time: '3:00-5:00 PM', utilization: 90, status: 'high' },
          { time: '2:00-3:00 PM', utilization: 75, status: 'moderate' }
        ],
        recommendations: [
          {
            type: 'staffing',
            title: 'Increase Staff During Peak Hours',
            description: 'Add 2 additional doctors during 9-11 AM and 3-5 PM',
            priority: 'high',
            impact: 'Reduce wait times by 25%'
          },
          {
            type: 'scheduling',
            title: 'Optimize Appointment Slots',
            description: 'Redistribute some Friday appointments to Tuesday/Thursday',
            priority: 'medium',
            impact: 'Better resource utilization'
          },
          {
            type: 'capacity',
            title: 'Emergency Overflow Protocol',
            description: 'Prepare overflow rooms for Monday and Friday peaks',
            priority: 'high',
            impact: 'Handle 15% more patients'
          }
        ],
        insights: {
          busiest_day: 'Friday',
          busiest_hour: '4:00 PM',
          average_utilization: 78,
          predicted_growth: 12,
          seasonal_factor: 'High flu season increases demand by 20%'
        }
      };

      setPeakData(mockData);
      
    } catch (error) {
      console.error('Error fetching peak hours data:', error);
      toast.error('Failed to load peak hours data');
    } finally {
      setLoading(false);
    }
  };

  const getUtilizationColor = (utilization) => {
    if (utilization >= 90) return '#EF4444'; // Red
    if (utilization >= 75) return '#F59E0B'; // Yellow
    if (utilization >= 50) return '#10B981'; // Green
    return '#6B7280'; // Gray
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
              <ClockIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Peak Hours Prediction</h2>
              <p className="text-gray-600">AI-powered demand forecasting and capacity planning</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Day of Week</label>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {daysOfWeek.map(day => (
                <option key={day.value} value={day.value}>{day.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {departments.map(dept => (
                <option key={dept.value} value={dept.value}>{dept.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Prediction Period</label>
            <select
              value={predictionPeriod}
              onChange={(e) => setPredictionPeriod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="week">Next Week</option>
              <option value="month">Next Month</option>
              <option value="quarter">Next Quarter</option>
            </select>
          </div>
        </div>

        {/* Key Insights */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <CalendarIcon className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-blue-600 font-medium">Busiest Day</p>
                <p className="text-lg font-bold text-blue-900">{peakData?.insights.busiest_day}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <ClockIcon className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-sm text-red-600 font-medium">Peak Hour</p>
                <p className="text-lg font-bold text-red-900">{peakData?.insights.busiest_hour}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <ChartBarIcon className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-green-600 font-medium">Avg Utilization</p>
                <p className="text-lg font-bold text-green-900">{peakData?.insights.average_utilization}%</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <ArrowTrendingUpIcon className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-purple-600 font-medium">Growth Trend</p>
                <p className="text-lg font-bold text-purple-900">+{peakData?.insights.predicted_growth}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hourly Demand Chart */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Hourly Demand Prediction</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={peakData?.hourlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="appointments" stroke="#3B82F6" name="Current" strokeWidth={2} />
              <Line type="monotone" dataKey="predicted" stroke="#10B981" name="Predicted" strokeWidth={2} strokeDasharray="5 5" />
              <Line type="monotone" dataKey="capacity" stroke="#EF4444" name="Capacity" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weekly Trends */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Weekly Demand Trends</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={peakData?.weeklyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="current" fill="#3B82F6" name="Current Week" />
              <Bar dataKey="predicted" fill="#10B981" name="Predicted" />
              <Bar dataKey="capacity" fill="#EF4444" name="Capacity" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Peak Hours Alert & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peak Hours Alert */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Peak Hours Alert</h3>
          <div className="space-y-3">
            {peakData?.peakHours.map((peak, index) => (
              <div key={index} className={`p-4 rounded-lg border-l-4 ${
                peak.status === 'critical' ? 'bg-red-50 border-red-400' :
                peak.status === 'high' ? 'bg-yellow-50 border-yellow-400' :
                'bg-blue-50 border-blue-400'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{peak.time}</p>
                    <p className="text-sm text-gray-600">Utilization: {peak.utilization}%</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    peak.status === 'critical' ? 'bg-red-100 text-red-800' :
                    peak.status === 'high' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {peak.status.toUpperCase()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">AI Recommendations</h3>
          <div className="space-y-4">
            {peakData?.recommendations.map((rec, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start space-x-3">
                  <LightBulbIcon className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                        rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {rec.priority.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                    <p className="text-xs text-blue-600 font-medium">Impact: {rec.impact}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Seasonal Insights */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <ExclamationTriangleIcon className="w-6 h-6 text-orange-500" />
          <h3 className="text-lg font-bold text-gray-900">Seasonal Insights</h3>
        </div>
        <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
          <p className="text-orange-800">{peakData?.insights.seasonal_factor}</p>
        </div>
      </div>
    </div>
  );
};

export default PeakHoursPrediction;
