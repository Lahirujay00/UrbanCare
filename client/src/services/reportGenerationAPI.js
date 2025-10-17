import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 30000, // 30 seconds for report generation
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const reportGenerationAPI = {
  // Test API connectivity
  testConnection: () => api.get('/report-generation/test'),

  // Get available report types
  getReportTypes: () => api.get('/report-generation/types'),

  // Generate Patient Visit Report
  generatePatientVisitReport: (data) => 
    api.post('/report-generation/patient-visits', data),

  // Generate Staff Utilization Report
  generateStaffUtilizationReport: (data) => 
    api.post('/report-generation/staff-utilization', data),

  // Generate Financial Summary Report
  generateFinancialSummaryReport: (data) => 
    api.post('/report-generation/financial-summary', data),

  // Generate Comprehensive Report
  generateComprehensiveReport: (data) => 
    api.post('/report-generation/comprehensive', data),

  // Generate and Save Report (all-in-one)
  generateAndSaveReport: (data) => 
    api.post('/report-generation/generate-and-save', data),

  // Get Generated Reports
  getGeneratedReports: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/generated-reports${queryString ? `?${queryString}` : ''}`);
  },

  // Get Single Generated Report
  getGeneratedReport: (reportId) => 
    api.get(`/generated-reports/${reportId}`),

  // Download Generated Report
  downloadGeneratedReport: (reportId) => 
    api.get(`/generated-reports/${reportId}/download`),

  // Delete Generated Report
  deleteGeneratedReport: (reportId) => 
    api.delete(`/generated-reports/${reportId}`),

  // Update Generated Report
  updateGeneratedReport: (reportId, data) => 
    api.put(`/generated-reports/${reportId}`, data),

  // Get Report Statistics
  getReportStatistics: () => 
    api.get('/generated-reports/stats/overview')
};

// Export utility functions for report handling
export const reportUtils = {
  // Format report data for display
  formatReportData: (reportData, reportType) => {
    switch (reportType) {
      case 'patient-visit':
        return {
          title: 'Patient Visit Analysis',
          summary: reportData.analytics || {},
          data: reportData.appointments || [],
          charts: [
            {
              type: 'bar',
              title: 'Daily Visit Count',
              data: Object.entries(reportData.analytics?.dailyBreakdown || {}).map(([date, count]) => ({
                date,
                visits: count
              }))
            },
            {
              type: 'pie',
              title: 'Department Distribution',
              data: Object.entries(reportData.analytics?.departmentBreakdown || {}).map(([dept, count]) => ({
                name: dept,
                value: count
              }))
            }
          ]
        };

      case 'staff-utilization':
        return {
          title: 'Staff Utilization Analysis',
          summary: reportData.summary || {},
          data: reportData.staffUtilization || [],
          charts: [
            {
              type: 'bar',
              title: 'Staff Utilization Rates',
              data: (reportData.staffUtilization || []).map(staff => ({
                name: staff.name,
                utilization: staff.utilizationRate,
                completion: staff.completionRate
              }))
            }
          ]
        };

      case 'financial-summary':
        return {
          title: 'Financial Summary',
          summary: reportData.summary || {},
          data: reportData.transactions || [],
          charts: [
            {
              type: 'line',
              title: 'Daily Revenue',
              data: Object.entries(reportData.analytics?.dailyRevenue || {}).map(([date, revenue]) => ({
                date,
                revenue
              }))
            },
            {
              type: 'pie',
              title: 'Payment Methods',
              data: Object.entries(reportData.analytics?.paymentMethodBreakdown || {}).map(([method, data]) => ({
                name: method,
                value: data.amount
              }))
            }
          ]
        };

      case 'comprehensive':
        return {
          title: 'Comprehensive Report',
          summary: reportData.summary || {},
          sections: [
            {
              title: 'Patient Visits',
              data: reportData.patientVisits || {}
            },
            {
              title: 'Staff Utilization',
              data: reportData.staffUtilization || {}
            },
            {
              title: 'Financial Performance',
              data: reportData.financial || {}
            }
          ]
        };

      default:
        return {
          title: 'Report Data',
          summary: {},
          data: reportData
        };
    }
  },

  // Export report to CSV
  exportToCSV: (reportData, reportType, filename) => {
    let csvContent = '';
    
    switch (reportType) {
      case 'patient-visit':
        csvContent = 'Date,Patient,Doctor,Department,Status,Reason\n';
        (reportData.appointments || []).forEach(apt => {
          csvContent += `${new Date(apt.appointmentDate).toLocaleDateString()},${apt.patientName},${apt.doctorName},${apt.department},${apt.status},${apt.reasonForVisit || ''}\n`;
        });
        break;

      case 'staff-utilization':
        csvContent = 'Staff Member,Role,Department,Total Appointments,Completion Rate,Utilization Rate\n';
        (reportData.staffUtilization || []).forEach(staff => {
          csvContent += `${staff.name},${staff.role},${staff.specialization},${staff.totalAppointments},${staff.completionRate}%,${staff.utilizationRate}%\n`;
        });
        break;

      case 'financial-summary':
        csvContent = 'Date,Patient,Amount,Payment Method,Status,Department\n';
        (reportData.transactions || []).forEach(txn => {
          csvContent += `${new Date(txn.date).toLocaleDateString()},${txn.patientName},${txn.amount},${txn.paymentMethod},${txn.status},${txn.department}\n`;
        });
        break;

      default:
        csvContent = 'Data\n' + JSON.stringify(reportData, null, 2);
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename || `${reportType}-report-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  // Validate report parameters
  validateReportParams: (reportType, params) => {
    const errors = [];

    if (!params.startDate) {
      errors.push('Start date is required');
    }

    if (!params.endDate) {
      errors.push('End date is required');
    }

    if (params.startDate && params.endDate) {
      const start = new Date(params.startDate);
      const end = new Date(params.endDate);
      
      if (start > end) {
        errors.push('Start date must be before end date');
      }

      const daysDiff = (end - start) / (1000 * 60 * 60 * 24);
      if (daysDiff > 365) {
        errors.push('Date range cannot exceed 365 days');
      }
    }

    return errors;
  },

  // Get report type configuration
  getReportTypeConfig: (reportType) => {
    const configs = {
      'patient-visit': {
        name: 'Patient Visit Report',
        description: 'Analyze patient visit patterns and appointment statistics',
        requiredFields: ['startDate', 'endDate'],
        optionalFields: ['department', 'status'],
        estimatedTime: '2-5 minutes'
      },
      'staff-utilization': {
        name: 'Staff Utilization Report',
        description: 'Track staff performance and utilization metrics',
        requiredFields: ['startDate', 'endDate'],
        optionalFields: ['department'],
        estimatedTime: '3-7 minutes'
      },
      'financial-summary': {
        name: 'Financial Summary Report',
        description: 'Financial performance and revenue analysis',
        requiredFields: ['startDate', 'endDate'],
        optionalFields: ['paymentMethod', 'status'],
        estimatedTime: '2-4 minutes'
      },
      'comprehensive': {
        name: 'Comprehensive Report',
        description: 'Complete overview of all metrics',
        requiredFields: ['startDate', 'endDate'],
        optionalFields: [],
        estimatedTime: '5-10 minutes'
      }
    };

    return configs[reportType] || null;
  }
};

export default reportGenerationAPI;
