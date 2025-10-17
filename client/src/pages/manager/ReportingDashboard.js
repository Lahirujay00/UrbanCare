import React, { useState } from 'react';
import { Plus, Calendar, FileText, Users, Activity, DollarSign, Download, Printer, Save, TrendingUp } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import ChartComponent from '../../components/ui/ChartComponent';
import { 
  mockPatientVisitData, 
  mockPatientKPIs, 
  mockStaffUtilizationData, 
  mockStaffKPIs, 
  mockFinancialKPIs, 
  mockCostBreakdown,
  mockMonthlyFinancials 
} from '../../data/mockData';
import toast from 'react-hot-toast';
import axios from 'axios';
import { reportGenerationAPI, reportUtils } from '../../services/reportGenerationAPI';

const ReportingDashboard = () => {
  const { user } = useAuth();
  const [selectedReportType, setSelectedReportType] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [filters, setFilters] = useState({
    department: false,
    staffRole: false
  });
  const [reportPreview, setReportPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);
  const [recentReports, setRecentReports] = useState([]);

  // Test API connection and fetch recent reports on component mount
  React.useEffect(() => {
    const initializeComponent = async () => {
      try {
        const response = await reportGenerationAPI.testConnection();
        if (response.data.success) {
          setApiConnected(true);
          console.log('Report generation API connected successfully:', response.data);
          
          // Fetch recent reports
          await fetchRecentReports();
        }
      } catch (error) {
        console.warn('Report generation API not available:', error.message);
        setApiConnected(false);
        // Set fallback mock data for recent reports
        setRecentReports([]);
      }
    };

    initializeComponent();
  }, []);

  const fetchRecentReports = async () => {
    try {
      const response = await reportGenerationAPI.getGeneratedReports({
        limit: 3,
        sortBy: 'generatedAt',
        sortOrder: 'desc'
      });
      
      if (response.data.success && response.data.data.reports) {
        setRecentReports(response.data.data.reports);
      }
    } catch (error) {
      console.warn('Failed to fetch recent reports:', error);
      setRecentReports([]);
    }
  };

  const generateMockData = (reportType, dateRange) => {
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

    const mockPatients = [
      'John Smith', 'Emma Johnson', 'Michael Brown', 'Sarah Davis', 'James Wilson',
      'Emily Anderson', 'David Taylor', 'Jessica Martinez', 'Christopher Lee', 'Ashley Garcia'
    ];

    const mockDoctors = [
      'Dr. Robert Anderson', 'Dr. Lisa Chen', 'Dr. Mark Thompson', 'Dr. Sarah Johnson',
      'Dr. Kevin Martinez', 'Dr. Rachel Smith', 'Dr. Daniel Brown', 'Dr. Amanda Davis'
    ];

    const departments = ['Cardiology', 'Pediatrics', 'Orthopedics', 'General Medicine', 'Emergency'];
    const appointmentReasons = [
      'Routine Checkup', 'Follow-up Visit', 'Annual Physical', 'Chest Pain', 'Back Pain',
      'Headache', 'Flu Symptoms', 'Blood Pressure Check', 'Vaccination', 'Consultation'
    ];

    switch (reportType) {
      case 'patient-visit':
        const patientVisits = Array.from({ length: Math.min(daysDiff * 8, 50) }, (_, i) => ({
          appointmentDate: new Date(startDate.getTime() + Math.random() * (endDate - startDate)).toISOString(),
          patient: {
            firstName: mockPatients[Math.floor(Math.random() * mockPatients.length)].split(' ')[0],
            lastName: mockPatients[Math.floor(Math.random() * mockPatients.length)].split(' ')[1],
            email: `patient${i}@example.com`
          },
          doctor: {
            firstName: mockDoctors[Math.floor(Math.random() * mockDoctors.length)].split(' ')[0],
            lastName: mockDoctors[Math.floor(Math.random() * mockDoctors.length)].split(' ')[1]
          },
          reasonForVisit: appointmentReasons[Math.floor(Math.random() * appointmentReasons.length)],
          status: ['completed', 'scheduled', 'cancelled'][Math.floor(Math.random() * 3)],
          department: departments[Math.floor(Math.random() * departments.length)]
        }));
        return patientVisits;

      case 'staff-utilization':
        const staffMembers = mockDoctors.concat(['Nurse Patricia', 'Nurse Robert', 'Admin Kate', 'Admin Mike']);
        const staffUtilization = staffMembers.map(staff => ({
          staff,
          role: staff.includes('Dr.') ? 'doctor' : staff.includes('Nurse') ? 'nurse' : 'admin',
          appointments: Math.floor(Math.random() * 45) + 5,
          hoursWorked: Math.floor(Math.random() * 40) + 20,
          efficiency: Math.floor(Math.random() * 30) + 70,
          department: departments[Math.floor(Math.random() * departments.length)]
        }));
        return staffUtilization;

      case 'financial-summary':
        const financialData = Array.from({ length: Math.min(daysDiff * 3, 30) }, (_, i) => ({
          createdAt: new Date(startDate.getTime() + Math.random() * (endDate - startDate)).toISOString(),
          amount: Math.floor(Math.random() * 500) + 100,
          paymentMethod: ['Credit Card', 'Insurance', 'Cash', 'Bank Transfer'][Math.floor(Math.random() * 4)],
          patient: {
            firstName: mockPatients[Math.floor(Math.random() * mockPatients.length)].split(' ')[0],
            lastName: mockPatients[Math.floor(Math.random() * mockPatients.length)].split(' ')[1]
          },
          service: appointmentReasons[Math.floor(Math.random() * appointmentReasons.length)],
          status: 'completed'
        }));
        return financialData;

      case 'comprehensive':
        return {
          patientData: mockPatientVisitData.slice(0, 10),
          staffData: mockStaffUtilizationData.slice(0, 6),
          financialData: mockFinancialKPIs
        };

      default:
        return {};
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedReportType) {
      toast.error('Please select a report type');
      return;
    }
    if (!dateRange.startDate || !dateRange.endDate) {
      toast.error('Please select a date range');
      return;
    }

    try {
      setLoading(true);
      console.log('Starting report generation...', { selectedReportType, dateRange, filters });
      
      // Generate descriptive title
      const reportTypeNames = {
        'patient-visit': 'Patient Visit Report',
        'staff-utilization': 'Staff Utilization Analysis',
        'financial-summary': 'Financial Summary',
        'comprehensive': 'Comprehensive Report'
      };

      // Map frontend report types to backend expected format
      const reportTypeMapping = {
        'patient-visit': 'patient-visits',
        'staff-utilization': 'staff-utilization',
        'financial-summary': 'financial-summary',
        'comprehensive': 'comprehensive'
      };
      
      const title = `${reportTypeNames[selectedReportType]} - ${new Date().toLocaleDateString()}`;
      
      // Prepare request data
      const requestData = {
        reportType: reportTypeMapping[selectedReportType] || selectedReportType,
        title,
        description: `Generated ${reportTypeNames[selectedReportType]} for analysis`,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        ...filters
      };

      console.log('Calling API with data:', requestData);
      
      // Call the comprehensive report generation API
      const response = await reportGenerationAPI.generateAndSaveReport(requestData);
      
      console.log('API Response received:', response);

      if (response.data.success) {
        const { report, reportData } = response.data.data;
        
        console.log('Backend report data structure:', reportData);
        console.log('Report summary:', report.summary);
        
        // Set the report preview with actual data
        const previewData = {
          reportType: selectedReportType,
          dateRange,
          totalRecords: report.summary.totalRecords,
          preview: reportData,
          generatedAt: report.generatedAt,
          filters: report.filters,
          reportId: report._id
        };

        setReportPreview(previewData);
        toast.success(`Report generated successfully with ${report.summary.totalRecords} records`);
        
        // Refresh recent reports list
        await fetchRecentReports();
      } else {
        throw new Error(response.data.message || 'Failed to generate report');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config
      });
      
      // Fallback to mock data if API fails
      const mockData = generateMockData(selectedReportType, dateRange);
      const totalRecords = Array.isArray(mockData) ? mockData.length : 
        (mockData.patientVisits?.length || 0) + (mockData.staffUtilization?.length || 0) + (mockData.financial?.length || 0);

      const reportData = {
        reportType: selectedReportType,
        dateRange,
        totalRecords,
        preview: mockData,
        generatedAt: new Date(),
        filters: filters
      };

      setReportPreview(reportData);
      
      // Show more specific error message
      if (error.response?.status === 404) {
        toast.error('Report generation endpoint not found - using sample data');
      } else if (error.response?.status === 401) {
        toast.error('Authentication failed - please login again');
      } else if (error.response?.status === 400) {
        toast.error('Invalid request parameters - using sample data');
      } else if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        toast.error('Server not available - using sample data');
      } else {
        toast.error(`API error (${error.response?.status || 'Unknown'}) - using sample data`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!reportPreview) return;
    
    let csvContent = '';
    const reportType = reportPreview.reportType;
    
    // Add headers based on report type
    if (reportType === 'patient-visit') {
      csvContent += 'Date,Patient,Doctor,Department,Reason\n';
      reportPreview.preview.forEach(visit => {
        csvContent += `${new Date(visit.appointmentDate).toLocaleDateString()},${visit.patient.firstName} ${visit.patient.lastName},${visit.doctor.name},${visit.department},${visit.reason}\n`;
      });
    } else if (reportType === 'staff-utilization') {
      csvContent += 'Staff Member,Role,Department,Hours Worked,Utilization %\n';
      reportPreview.preview.forEach(staff => {
        csvContent += `${staff.staffMember},${staff.role},${staff.department},${staff.hoursWorked},${staff.utilizationRate}%\n`;
      });
    } else if (reportType === 'financial-summary') {
      csvContent += 'Transaction Date,Type,Amount,Payment Method,Status\n';
      reportPreview.preview.forEach(transaction => {
        csvContent += `${transaction.transactionDate},${transaction.transactionType},${transaction.amount},${transaction.paymentMethod},${transaction.status}\n`;
      });
    }

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${reportType}-report-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Report exported successfully');
  };

  const handlePrint = () => {
    window.print();
    toast.success('Report sent to printer');
  };

  const handleSaveReport = async () => {
    if (!reportPreview) return;
    
    try {
      const token = localStorage.getItem('token');
      
      // Generate a descriptive title
      const reportTypeNames = {
        'patient-visit': 'Patient Visit Report',
        'staff-utilization': 'Staff Utilization Analysis',
        'financial-summary': 'Financial Summary',
        'comprehensive': 'Comprehensive Report'
      };
      
      const reportTitle = `${reportTypeNames[reportPreview.reportType] || reportPreview.reportType} - ${new Date().toLocaleDateString()}`;
      
      const reportData = {
        title: reportTitle,
        reportType: reportPreview.reportType,
        description: `Generated report for ${reportTypeNames[reportPreview.reportType] || reportPreview.reportType}`,
        dateRange: {
          startDate: reportPreview.dateRange.startDate,
          endDate: reportPreview.dateRange.endDate
        },
        filters: reportPreview.filters,
        summary: {
          totalRecords: reportPreview.totalRecords,
          keyMetrics: {
            generatedAt: reportPreview.generatedAt,
            reportType: reportPreview.reportType
          }
        },
        data: reportPreview.preview,
        tags: [reportPreview.reportType, 'auto-generated']
      };

      const response = await reportGenerationAPI.generateAndSaveReport(reportData);

      if (response.data.success) {
        toast.success('Report saved successfully');
      } else {
        throw new Error('Failed to save report');
      }
    } catch (error) {
      console.error('Error saving report:', error);
      toast.error('Failed to save report');
    }
  };

  return (
    <div className="flex-1 p-8">
      {/* Dashboard Border Container */}
      <div className="border-2 border-black rounded-lg p-6 h-full flex flex-col bg-white">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Reporting Dashboard</h1>
            <p className="text-gray-600 text-sm">Create, view, and manage all reports and analytics</p>
            <p className="text-gray-500 text-xs mt-1">Generate or probe our comprehensive repository of key billing trends, and growth</p>
            <div className="flex items-center mt-2">
              <div className={`w-2 h-2 rounded-full mr-2 ${apiConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={`text-xs ${apiConnected ? 'text-green-600' : 'text-red-600'}`}>
                {apiConnected ? 'Backend API Connected' : 'Using Sample Data (Backend Unavailable)'}
              </span>
            </div>
          </div>
          <p className="text-[10px] text-gray-500 max-w-[200px]">
            Generate or probe our comprehensive repository of key billing trends, and growth
          </p>
        </div>

        {/* Report Type Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div 
            onClick={() => {
              setSelectedReportType('patient-visit');
              const today = new Date();
              const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
              setDateRange({
                startDate: lastWeek.toISOString().split('T')[0],
                endDate: today.toISOString().split('T')[0]
              });
            }}
            className={`border ${selectedReportType === 'patient-visit' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'} rounded-lg p-6 flex flex-col items-center text-center cursor-pointer hover:bg-gray-100 transition-colors`}
          >
            <div className="w-12 h-12 rounded bg-white border border-gray-300 flex items-center justify-center mb-3">
              <Users className="w-6 h-6 text-[#4169e1]" />
            </div>
            <h3 className="text-[14px] mb-1 font-semibold">Patient Visit Report</h3>
            <p className="text-[11px] text-gray-600">Analyze patient flow and visit patterns</p>
            {selectedReportType === 'patient-visit' && (
              <span className="mt-2 text-[10px] text-blue-600 font-medium">Selected</span>
            )}
          </div>

          <div 
            onClick={() => {
              setSelectedReportType('staff-utilization');
              const today = new Date();
              const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
              setDateRange({
                startDate: lastWeek.toISOString().split('T')[0],
                endDate: today.toISOString().split('T')[0]
              });
            }}
            className={`border ${selectedReportType === 'staff-utilization' ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'} rounded-lg p-6 flex flex-col items-center text-center cursor-pointer hover:bg-gray-100 transition-colors`}
          >
            <div className="w-12 h-12 rounded bg-white border border-gray-300 flex items-center justify-center mb-3">
              <Activity className="w-6 h-6 text-[#10b981]" />
            </div>
            <h3 className="text-[14px] mb-1 font-semibold">Staff Utilization Report</h3>
            <p className="text-[11px] text-gray-600">Monitor staff productivity and scheduling</p>
            {selectedReportType === 'staff-utilization' && (
              <span className="mt-2 text-[10px] text-green-600 font-medium">Selected</span>
            )}
          </div>

          <div 
            onClick={() => {
              setSelectedReportType('financial-summary');
              const today = new Date();
              const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
              setDateRange({
                startDate: firstDay.toISOString().split('T')[0],
                endDate: today.toISOString().split('T')[0]
              });
            }}
            className={`border ${selectedReportType === 'financial-summary' ? 'border-orange-500 bg-orange-50' : 'border-gray-300 bg-gray-50'} rounded-lg p-6 flex flex-col items-center text-center cursor-pointer hover:bg-gray-100 transition-colors`}
          >
            <div className="w-12 h-12 rounded bg-white border border-gray-300 flex items-center justify-center mb-3">
              <DollarSign className="w-6 h-6 text-[#f59e0b]" />
            </div>
            <h3 className="text-[14px] mb-1 font-semibold">Financial Summary</h3>
            <p className="text-[11px] text-gray-600">High-level financial performance overview</p>
            {selectedReportType === 'financial-summary' && (
              <span className="mt-2 text-[10px] text-orange-600 font-medium">Selected</span>
            )}
          </div>

          <div 
            onClick={() => {
              setSelectedReportType('comprehensive');
              const today = new Date();
              const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
              setDateRange({
                startDate: lastWeek.toISOString().split('T')[0],
                endDate: today.toISOString().split('T')[0]
              });
            }}
            className={`border ${selectedReportType === 'comprehensive' ? 'border-purple-500 bg-purple-50' : 'border-gray-300 bg-gray-50'} rounded-lg p-6 flex flex-col items-center text-center cursor-pointer hover:bg-gray-100 transition-colors`}
          >
            <div className="w-12 h-12 rounded bg-white border border-gray-300 flex items-center justify-center mb-3">
              <TrendingUp className="w-6 h-6 text-[#8b5cf6]" />
            </div>
            <h3 className="text-[14px] mb-1 font-semibold">Comprehensive Report</h3>
            <p className="text-[11px] text-gray-600">All reports with peak hours analysis</p>
            {selectedReportType === 'comprehensive' && (
              <span className="mt-2 text-[10px] text-purple-600 font-medium">Selected</span>
            )}
          </div>
        </div>

        {/* Report Generation Instructions */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-2 text-blue-800">How to Generate Reports</h3>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Select report type and date range</li>
            <li>• Configure any additional filters</li>
            <li>• Click "Generate Report" to create your report</li>
            <li>• Use export options to save as PDF or Excel</li>
          </ul>
        </div>

        {/* Recent Reports */}
        <div className="mb-6">
          <h3 className="text-[14px] mb-3">📋 Recent Reports</h3>
          <div className="space-y-2">
            {recentReports.length > 0 ? (
              recentReports.map((report, index) => {
                const getReportIcon = (reportType) => {
                  switch (reportType) {
                    case 'patient-visits':
                    case 'patient-visit':
                      return <Users className="w-4 h-4 text-blue-600" />;
                    case 'staff-utilization':
                      return <Activity className="w-4 h-4 text-green-600" />;
                    case 'financial-summary':
                      return <DollarSign className="w-4 h-4 text-orange-600" />;
                    case 'comprehensive':
                      return <TrendingUp className="w-4 h-4 text-purple-600" />;
                    default:
                      return <FileText className="w-4 h-4 text-gray-600" />;
                  }
                };

                return (
                  <div key={report._id || index} className="flex items-center justify-between py-3 border-b border-gray-200">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {getReportIcon(report.reportType)}
                        <p className="text-[13px]">{report.title}</p>
                      </div>
                      <p className="text-[11px] text-gray-500">
                        Generated on {new Date(report.createdAt || report.generatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[11px] font-medium">
                      Completed
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-gray-500">
                <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-[12px]">No recent reports found</p>
                <p className="text-[11px] text-gray-400">Generate your first report to see it here</p>
              </div>
            )}
          </div>
        </div>

        {/* Edit Report Parameters */}
        <div className="flex-1 flex flex-col">
          <h3 className="text-[14px] mb-3">▼ Set Report Parameters</h3>
          <p className="text-[11px] text-gray-500 mb-4">Define the scope and filters for your custom reports</p>

          {/* Selected Report Type Indicator */}
          {selectedReportType && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-[12px] text-blue-800">
                <span className="font-semibold">Selected Report:</span> {' '}
                {selectedReportType === 'patient-visit' && 'Patient Visit Report'}
                {selectedReportType === 'staff-utilization' && 'Staff Utilization Report'}
                {selectedReportType === 'financial-summary' && 'Financial Summary Report'}
                {selectedReportType === 'comprehensive' && 'Comprehensive Report (All Reports)'}
              </p>
              <p className="text-[12px] text-gray-500">
                Generate detailed reports with real-time data and analytics
              </p>
            </div>
          )}

          {/* Parameters Box */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            {/* Select Date Range */}
            <div className="mb-4">
              <label className="text-[12px] block mb-2">Select Date Range</label>
              <div className="flex items-center gap-2">
                <input 
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  className="flex-1 border border-gray-300 rounded px-3 py-2 text-[12px] bg-white"
                />
                <span className="text-[12px]">to</span>
                <input 
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  className="flex-1 border border-gray-300 rounded px-3 py-2 text-[12px] bg-white"
                />
                <button className="px-3 py-2 border border-gray-300 rounded text-[12px] bg-white hover:bg-gray-50">
                  Sub-Sects
                </button>
              </div>
            </div>

            {/* Advanced Filters */}
            <div className="mb-6">
              <label className="text-[12px] block mb-3">Advanced Filters</label>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-[10px]">✓</span>
                    </div>
                    <span className="text-[12px]">Filter by Department</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={filters.department}
                      onChange={(e) => setFilters({ ...filters, department: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center">
                      <span className="text-[10px]">✓</span>
                    </div>
                    <span className="text-[12px]">Filter by Staff Role</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={filters.staffRole}
                      onChange={(e) => setFilters({ ...filters, staffRole: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mt-auto pt-4">
              <button 
                onClick={() => {
                  setSelectedReportType('');
                  setReportPreview(null);
                  setDateRange({ startDate: '', endDate: '' });
                }}
                className="text-[12px] text-gray-600 hover:text-gray-800"
              >
                ← Back
              </button>
              <button 
                onClick={handleGenerateReport}
                disabled={loading || !selectedReportType}
                className="bg-[#4169e1] hover:bg-[#3155c6] text-white rounded-full px-6 py-2 text-[12px] font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? 'Generating...' : 'Generate Report 🎯'}
              </button>
            </div>
          </div>
        </div>

        {/* Report Preview Section */}
        {reportPreview && (
          <div className="mt-6 bg-white border-2 border-blue-500 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[16px] font-bold text-gray-900">Report Preview 📊</h3>
                <p className="text-[12px] text-gray-600">
                  {reportPreview.reportType === 'patient-visit' && 'Patient Visit Report'}
                  {reportPreview.reportType === 'staff-utilization' && 'Staff Utilization Report'}
                  {reportPreview.reportType === 'financial-summary' && 'Financial Summary Report'}
                  {reportPreview.reportType === 'comprehensive' && 'Comprehensive Report - All Analytics'}
                  {' '} • {reportPreview.dateRange?.startDate} to {reportPreview.dateRange?.endDate}
                </p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleSaveReport}
                  className="px-4 py-2 border border-gray-300 rounded text-[12px] hover:bg-gray-50 transition-colors flex items-center gap-1"
                >
                  <Save className="w-3 h-3" />
                  Save
                </button>
                <button 
                  onClick={handlePrint}
                  className="px-4 py-2 border border-gray-300 rounded text-[12px] hover:bg-gray-50 transition-colors flex items-center gap-1"
                >
                  <Printer className="w-3 h-3" />
                  Print
                </button>
                <button 
                  onClick={handleExportCSV}
                  className="px-4 py-2 bg-green-500 text-white rounded text-[12px] hover:bg-green-600 transition-colors flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  CSV
                </button>
                <button 
                  onClick={() => setReportPreview(null)}
                  className="px-4 py-2 bg-red-500 text-white rounded text-[12px] hover:bg-red-600 transition-colors"
                >
                  ✕ Close
                </button>
              </div>
            </div>
            
            {/* Report Summary Section */}
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="text-[14px] font-semibold mb-2 flex items-center text-green-800">
                <FileText className="w-4 h-4 mr-2 text-green-600" />
                Report Generated Successfully
              </h4>
              <p className="text-xs text-green-700">
                Date Range: {new Date(reportPreview?.dateRange?.startDate).toLocaleDateString()} - {new Date(reportPreview?.dateRange?.endDate).toLocaleDateString()}
              </p>
            </div>

            {/* Summary Cards based on report type */}
            {reportPreview.preview && (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {/* Patient Visit Report Cards */}
                {reportPreview.reportType === 'patient-visit' && (
                  <>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[12px] text-blue-600 font-medium mb-1">Total Visits</p>
                          <p className="text-[32px] font-bold text-blue-900">{Array.isArray(reportPreview.preview) ? reportPreview.preview.length : 0}</p>
                          <p className="text-[11px] text-blue-600 mt-1">Patient visits</p>
                        </div>
                        <Users className="w-12 h-12 text-blue-400" />
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[12px] text-green-600 font-medium mb-1">Completed</p>
                          <p className="text-[32px] font-bold text-green-900">
                            {Array.isArray(reportPreview.preview) ? reportPreview.preview.filter(a => a.status === 'completed').length : 0}
                          </p>
                          <p className="text-[11px] text-green-600 mt-1">Appointments</p>
                        </div>
                        <Calendar className="w-12 h-12 text-green-400" />
                      </div>
                    </div>
                  </>
                )}

                {/* Staff Utilization Report Cards */}
                {reportPreview.reportType === 'staff-utilization' && (
                  <>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[12px] text-green-600 font-medium mb-1">Staff Members</p>
                          <p className="text-[32px] font-bold text-green-900">{Array.isArray(reportPreview.preview) ? reportPreview.preview.length : 0}</p>
                          <p className="text-[11px] text-green-600 mt-1">Active staff</p>
                        </div>
                        <Activity className="w-12 h-12 text-green-400" />
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[12px] text-blue-600 font-medium mb-1">Avg Utilization</p>
                          <p className="text-[32px] font-bold text-blue-900">
                            {Array.isArray(reportPreview.preview) && reportPreview.preview.length > 0 
                              ? Math.round(reportPreview.preview.reduce((acc, staff) => acc + staff.appointments, 0) / reportPreview.preview.length)
                              : 0}%
                          </p>
                          <p className="text-[11px] text-blue-600 mt-1">Efficiency rate</p>
                        </div>
                        <TrendingUp className="w-12 h-12 text-blue-400" />
                      </div>
                    </div>
                  </>
                )}

                {/* Financial Summary Cards */}
                {reportPreview.reportType === 'financial-summary' && (
                  <>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[12px] text-orange-600 font-medium mb-1">Total Revenue</p>
                          <p className="text-[32px] font-bold text-orange-900">
                            ${Array.isArray(reportPreview.preview) 
                              ? reportPreview.preview.reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()
                              : '0'}
                          </p>
                          <p className="text-[11px] text-orange-600 mt-1">Period revenue</p>
                        </div>
                        <DollarSign className="w-12 h-12 text-orange-400" />
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[12px] text-green-600 font-medium mb-1">Transactions</p>
                          <p className="text-[32px] font-bold text-green-900">{Array.isArray(reportPreview.preview) ? reportPreview.preview.length : 0}</p>
                          <p className="text-[11px] text-green-600 mt-1">Payment records</p>
                        </div>
                        <FileText className="w-12 h-12 text-green-400" />
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Table for Financial Summary */}
            {reportPreview.reportType === 'financial-summary' && Array.isArray(reportPreview.preview) && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden mb-4">
                <div className="overflow-x-auto max-h-96">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-700 uppercase tracking-wider">Patient</th>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-700 uppercase tracking-wider">Amount</th>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-700 uppercase tracking-wider">Method</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportPreview.preview.map((payment, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-[12px] text-gray-900">
                            {new Date(payment.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-[12px] text-gray-900">
                            {payment.patient?.firstName} {payment.patient?.lastName}
                          </td>
                          <td className="px-4 py-3 text-[12px] font-semibold text-green-600">
                            ${payment.amount.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-[12px] text-gray-600">
                            {payment.paymentMethod}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {reportPreview.preview.length === 0 && (
                    <div className="text-center py-8 text-gray-500 text-[12px]">
                      No billing records found for this period
                    </div>
                  )}
                </div>
                {reportPreview.preview.length > 0 && (
                  <div className="bg-gray-100 px-4 py-3 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <p className="text-[12px] font-semibold text-gray-700">Total Amount:</p>
                      <p className="text-[16px] font-bold text-green-600">
                        ${reportPreview.preview.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Charts Section */}
            <div className="mb-8">
              {/* Patient Visit Charts */}
              {reportPreview.reportType === 'patient-visit' && (
                <div className="space-y-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Patient Volume by Hour</h4>
                    <ChartComponent 
                      type="line" 
                      data={mockPatientVisitData} 
                      config={{ height: 300, showGrid: true, showLegend: true }} 
                    />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Hourly Patient Load vs Wait Times</h4>
                    <ChartComponent 
                      type="bar" 
                      data={mockPatientVisitData} 
                      config={{ height: 300, colors: ['#3B82F6', '#10B981'] }} 
                    />
                  </div>
                </div>
              )}

              {/* Staff Utilization Charts */}
              {reportPreview.reportType === 'staff-utilization' && (
                <div className="space-y-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Patient Load vs Staff Coverage</h4>
                    <ChartComponent 
                      type="combo" 
                      data={mockStaffUtilizationData} 
                      config={{ height: 350, showGrid: true, showLegend: true }} 
                    />
                  </div>
                </div>
              )}

              {/* Financial Summary Charts */}
              {reportPreview.reportType === 'financial-summary' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Cost Breakdown</h4>
                      <ChartComponent 
                        type="pie" 
                        data={mockCostBreakdown} 
                        config={{ height: 300, showLegend: true }} 
                      />
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Monthly Financial Trends</h4>
                      <ChartComponent 
                        type="financial" 
                        data={mockMonthlyFinancials} 
                        config={{ height: 300, showGrid: true, showLegend: true }} 
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Table for Patient Visit Report */}
            {reportPreview.reportType === 'patient-visit' && Array.isArray(reportPreview.preview) && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden mb-4">
                <div className="overflow-x-auto max-h-96">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-700 uppercase tracking-wider">Patient</th>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-700 uppercase tracking-wider">Doctor</th>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-700 uppercase tracking-wider">Reason</th>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportPreview.preview.map((appointment, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-[12px] text-gray-900">
                            {new Date(appointment.appointmentDate).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-[12px] text-gray-900">
                            {appointment.patient?.firstName} {appointment.patient?.lastName}
                          </td>
                          <td className="px-4 py-3 text-[12px] text-gray-600">
                            Dr. {appointment.doctor?.firstName} {appointment.doctor?.lastName}
                          </td>
                          <td className="px-4 py-3 text-[12px] text-gray-600">
                            {appointment.reasonForVisit || 'N/A'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-[10px] font-medium rounded-full ${
                              appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                              appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                              appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {appointment.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Table for Staff Utilization */}
            {reportPreview.reportType === 'staff-utilization' && Array.isArray(reportPreview.preview) && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden mb-4">
                <div className="overflow-x-auto max-h-96">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-700 uppercase tracking-wider">Staff Member</th>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-700 uppercase tracking-wider">Role</th>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-700 uppercase tracking-wider">Appointments</th>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-700 uppercase tracking-wider">Utilization</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportPreview.preview.map((staff, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-[12px] font-medium text-gray-900">
                            {staff.staff}
                          </td>
                          <td className="px-4 py-3 text-[12px] text-gray-600 capitalize">
                            {staff.role}
                          </td>
                          <td className="px-4 py-3 text-[12px] text-gray-900">
                            {staff.appointments}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full" 
                                  style={{ width: `${Math.min((staff.appointments / 50) * 100, 100)}%` }}
                                ></div>
                              </div>
                              <span className="text-[11px] text-gray-600">{staff.appointments}/50</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Comprehensive Report Display */}
            {reportPreview.reportType === 'comprehensive' && reportPreview.preview && (
              <div className="space-y-6">
                {/* Patient Visit Section */}
                {(reportPreview.preview.patientVisits || reportPreview.preview.patientData) && (
                  <div>
                    <h4 className="text-[14px] font-semibold mb-3 flex items-center">
                      <Users className="w-4 h-4 mr-2 text-blue-600" />
                      Patient Visit Analysis
                    </h4>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                      <div className="overflow-x-auto max-h-64">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-700">Date</th>
                              <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-700">Patient</th>
                              <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-700">Status</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {(() => {
                              const appointments = reportPreview.preview.patientVisits?.appointments || 
                                                 reportPreview.preview.patientData?.appointments || 
                                                 reportPreview.preview.patientVisits || 
                                                 [];
                              return Array.isArray(appointments) ? appointments.slice(0, 5).map((appointment, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-[12px] text-gray-900">
                                    {new Date(appointment.appointmentDate).toLocaleDateString()}
                                  </td>
                                  <td className="px-4 py-3 text-[12px] text-gray-900">
                                    {appointment.patient?.firstName} {appointment.patient?.lastName}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={`px-2 py-1 text-[10px] font-medium rounded-full ${
                                      appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                      appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {appointment.status}
                                    </span>
                                  </td>
                                </tr>
                              )) : [];
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Staff Utilization Section */}
                {(reportPreview.preview.staffUtilization || reportPreview.preview.staffData) && (
                  <div>
                    <h4 className="text-[14px] font-semibold mb-3 flex items-center">
                      <Activity className="w-4 h-4 mr-2 text-green-600" />
                      Staff Utilization Summary
                    </h4>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {(() => {
                        const staffData = reportPreview.preview.staffUtilization?.staffUtilization || 
                                         reportPreview.preview.staffData?.staff || 
                                         reportPreview.preview.staffUtilization || 
                                         [];
                        return Array.isArray(staffData) ? staffData.slice(0, 4).map((staff, idx) => (
                        <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4">
                          <p className="text-[12px] font-medium text-gray-900">{staff.staff}</p>
                          <p className="text-[10px] text-gray-600 mb-2">{staff.role}</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full" 
                                style={{ width: `${Math.min((staff.appointments / 50) * 100, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-[10px] text-gray-600">{staff.appointments}</span>
                          </div>
                        </div>
                        )) : [];
                      })()}
                    </div>
                  </div>
                )}

                {/* Financial Summary Section */}
                {(reportPreview.preview.financial || reportPreview.preview.financialData) && (
                  <div>
                    <h4 className="text-[14px] font-semibold mb-3 flex items-center">
                      <DollarSign className="w-4 h-4 mr-2 text-orange-600" />
                      Financial Performance
                    </h4>
                    <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-4">
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="text-center">
                          <p className="text-[12px] text-orange-600 font-medium">Total Revenue</p>
                          <p className="text-[20px] font-bold text-orange-900">
                            ${(reportPreview.preview.financial?.transactions || reportPreview.preview.financialData || []).reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-[12px] text-orange-600 font-medium">Transactions</p>
                          <p className="text-[20px] font-bold text-orange-900">{(reportPreview.preview.financial?.transactions || reportPreview.preview.financialData || []).length}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[12px] text-orange-600 font-medium">Avg Transaction</p>
                          <p className="text-[20px] font-bold text-orange-900">
                            ${(reportPreview.preview.financial?.transactions || reportPreview.preview.financialData || []).length > 0 
                              ? Math.round((reportPreview.preview.financial?.transactions || reportPreview.preview.financialData || []).reduce((sum, p) => sum + (p.amount || 0), 0) / (reportPreview.preview.financial?.transactions || reportPreview.preview.financialData || []).length)
                              : 0}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-[12px] text-orange-600 font-medium">Payment Methods</p>
                          <p className="text-[20px] font-bold text-orange-900">
                            {[...new Set((reportPreview.preview.financial?.transactions || reportPreview.preview.financialData || []).map(p => p.paymentMethod))].length}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Summary Stats */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-gray-600 mb-1">Report Generated</p>
                  <p className="text-[13px] font-semibold text-gray-900">
                    {new Date().toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-gray-600 mb-1">Total Records</p>
                  <p className="text-[20px] font-bold text-blue-600">{reportPreview.totalRecords}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportingDashboard;
