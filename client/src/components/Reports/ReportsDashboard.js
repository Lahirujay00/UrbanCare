import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ClockIcon,
  BuildingOfficeIcon,
  EyeIcon,
  ShareIcon
} from '@heroicons/react/24/outline';
import { reportAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const ReportsDashboard = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const reportTypes = [
    {
      id: 'patient-visits',
      title: 'Patient Visits Report',
      description: 'Analyze patient visit patterns and trends',
      icon: UsersIcon,
      color: 'blue'
    },
    {
      id: 'staff-utilization',
      title: 'Staff Utilization Report',
      description: 'Track doctor and staff performance metrics',
      icon: BuildingOfficeIcon,
      color: 'green'
    },
    {
      id: 'revenue-analysis',
      title: 'Revenue Analysis',
      description: 'Financial performance and revenue trends',
      icon: CurrencyDollarIcon,
      color: 'purple'
    },
    {
      id: 'appointment-analytics',
      title: 'Appointment Analytics',
      description: 'Appointment booking and completion statistics',
      icon: CalendarIcon,
      color: 'orange'
    },
    {
      id: 'peak-hours',
      title: 'Peak Hours Analysis',
      description: 'Identify busy periods and optimize scheduling',
      icon: ClockIcon,
      color: 'red'
    }
  ];

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await reportAPI.getAppointmentReports();
      
      if (response.data.success) {
        setReports(response.data.data.reports || []);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (reportType) => {
    try {
      setGenerating(true);
      
      // Mock report generation - replace with actual API call
      const mockData = generateMockReportData(reportType);
      setReportData(mockData);
      setSelectedReport(reportType);
      
      toast.success('Report generated successfully');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const generateMockReportData = (reportType) => {
    const { startDate, endDate } = dateRange;
    
    switch (reportType) {
      case 'patient-visits':
        return {
          summary: {
            totalVisits: 1247,
            uniquePatients: 892,
            averageVisitsPerDay: 41,
            growthRate: 12.5
          },
          charts: [
            {
              type: 'line',
              title: 'Daily Patient Visits',
              data: Array.from({ length: 30 }, (_, i) => ({
                date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                visits: Math.floor(Math.random() * 30) + 25
              }))
            },
            {
              type: 'pie',
              title: 'Visits by Department',
              data: [
                { name: 'Cardiology', value: 25, color: '#3B82F6' },
                { name: 'Neurology', value: 20, color: '#10B981' },
                { name: 'Orthopedics', value: 18, color: '#F59E0B' },
                { name: 'Pediatrics', value: 15, color: '#EF4444' },
                { name: 'General', value: 22, color: '#8B5CF6' }
              ]
            }
          ],
          insights: [
            {
              type: 'positive',
              title: 'Growing Patient Base',
              description: '12.5% increase in patient visits compared to last month',
              recommendation: 'Consider expanding staff during peak hours'
            },
            {
              type: 'neutral',
              title: 'Department Distribution',
              description: 'Cardiology and General Medicine see the most patients',
              recommendation: 'Ensure adequate resources for high-volume departments'
            }
          ]
        };

      case 'staff-utilization':
        return {
          summary: {
            totalStaff: 45,
            averageUtilization: 78,
            topPerformer: 'Dr. Sarah Johnson',
            efficiency: 85
          },
          charts: [
            {
              type: 'bar',
              title: 'Doctor Utilization Rate',
              data: [
                { name: 'Dr. Smith', utilization: 85, appointments: 120 },
                { name: 'Dr. Johnson', utilization: 92, appointments: 135 },
                { name: 'Dr. Brown', utilization: 78, appointments: 98 },
                { name: 'Dr. Wilson', utilization: 88, appointments: 115 },
                { name: 'Dr. Davis', utilization: 75, appointments: 89 }
              ]
            }
          ],
          insights: [
            {
              type: 'positive',
              title: 'High Staff Efficiency',
              description: 'Average utilization rate of 78% indicates good resource management',
              recommendation: 'Maintain current staffing levels'
            }
          ]
        };

      case 'peak-hours':
        return {
          summary: {
            peakHour: '10:00 AM',
            peakDay: 'Tuesday',
            averageWaitTime: 15,
            busyPeriods: 3
          },
          charts: [
            {
              type: 'bar',
              title: 'Appointments by Hour',
              data: Array.from({ length: 12 }, (_, i) => ({
                hour: `${i + 8}:00`,
                appointments: Math.floor(Math.random() * 25) + 5
              }))
            },
            {
              type: 'bar',
              title: 'Appointments by Day of Week',
              data: [
                { day: 'Mon', appointments: 45 },
                { day: 'Tue', appointments: 52 },
                { day: 'Wed', appointments: 48 },
                { day: 'Thu', appointments: 50 },
                { day: 'Fri', appointments: 47 },
                { day: 'Sat', appointments: 35 },
                { day: 'Sun', appointments: 28 }
              ]
            }
          ],
          insights: [
            {
              type: 'warning',
              title: 'Peak Hour Congestion',
              description: '10:00 AM shows highest appointment volume',
              recommendation: 'Consider scheduling additional staff during peak hours'
            }
          ]
        };

      default:
        return null;
    }
  };

  const exportReport = async (format) => {
    try {
      toast.success(`Exporting report as ${format.toUpperCase()}...`);
      // Mock export - replace with actual API call
      setTimeout(() => {
        toast.success(`Report exported successfully as ${format.toUpperCase()}`);
      }, 2000);
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    }
  };

  const renderChart = (chart) => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    
    switch (chart.type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="visits" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={chart.data[0].name ? "name" : chart.data[0].hour ? "hour" : "day"} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar 
                dataKey={chart.data[0].utilization ? "utilization" : "appointments"} 
                fill="#3B82F6" 
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chart.data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chart.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
          <p className="text-gray-600">Generate insights and track performance metrics</p>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Parameters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportTypes.map((report) => {
          const IconComponent = report.icon;
          return (
            <div key={report.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className={`w-12 h-12 bg-${report.color}-100 rounded-lg flex items-center justify-center`}>
                  <IconComponent className={`w-6 h-6 text-${report.color}-600`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{report.title}</h3>
                  <p className="text-sm text-gray-500">{report.description}</p>
                </div>
              </div>
              
              <button
                onClick={() => generateReport(report.id)}
                disabled={generating}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {generating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <ChartBarIcon className="w-4 h-4" />
                    <span>Generate Report</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Report Display */}
      {reportData && selectedReport && (
        <div className="bg-white rounded-lg shadow">
          {/* Report Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {reportTypes.find(r => r.id === selectedReport)?.title}
                </h3>
                <p className="text-gray-500">
                  Generated on {new Date().toLocaleDateString()} for period {dateRange.startDate} to {dateRange.endDate}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => exportReport('pdf')}
                  className="flex items-center space-x-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  <DocumentArrowDownIcon className="w-4 h-4" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={() => exportReport('excel')}
                  className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <DocumentArrowDownIcon className="w-4 h-4" />
                  <span>Excel</span>
                </button>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="p-6 border-b border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(reportData.summary).map(([key, value]) => (
                <div key={key} className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {typeof value === 'number' && key.includes('Rate') ? `${value}%` : value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Charts */}
          <div className="p-6 border-b border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Analytics</h4>
            <div className="space-y-8">
              {reportData.charts.map((chart, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-6">
                  <h5 className="text-md font-medium text-gray-900 mb-4">{chart.title}</h5>
                  {renderChart(chart)}
                </div>
              ))}
            </div>
          </div>

          {/* Insights */}
          {reportData.insights && reportData.insights.length > 0 && (
            <div className="p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Insights & Recommendations</h4>
              <div className="space-y-4">
                {reportData.insights.map((insight, index) => (
                  <div key={index} className={`border-l-4 p-4 rounded-r-lg ${
                    insight.type === 'positive' ? 'border-green-500 bg-green-50' :
                    insight.type === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                    insight.type === 'negative' ? 'border-red-500 bg-red-50' :
                    'border-blue-500 bg-blue-50'
                  }`}>
                    <h5 className="font-medium text-gray-900 mb-2">{insight.title}</h5>
                    <p className="text-gray-700 mb-2">{insight.description}</p>
                    <p className="text-sm font-medium text-gray-600">
                      Recommendation: {insight.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportsDashboard;
