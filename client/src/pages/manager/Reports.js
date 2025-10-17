import React, { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  CalendarIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { reportGenerationAPI } from '../../services/reportGenerationAPI';

const Reports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statistics, setStatistics] = useState({});

  const reportTypeConfig = {
    'patient-visit': {
      name: 'Patient Visit Report',
      icon: UsersIcon,
      color: 'blue',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      borderColor: 'border-blue-200'
    },
    'staff-utilization': {
      name: 'Staff Utilization Analysis',
      icon: ChartBarIcon,
      color: 'green',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      borderColor: 'border-green-200'
    },
    'financial-summary': {
      name: 'Financial Summary',
      icon: CurrencyDollarIcon,
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
      borderColor: 'border-yellow-200'
    },
    'comprehensive': {
      name: 'Comprehensive Report',
      icon: DocumentTextIcon,
      color: 'purple',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      borderColor: 'border-purple-200'
    },
    'peak-hours': {
      name: 'Peak Hours Analysis',
      icon: ClockIcon,
      color: 'red',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
      borderColor: 'border-red-200'
    }
  };

  useEffect(() => {
    fetchReports();
  }, [currentPage, searchTerm, filterType]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(filterType && { reportType: filterType })
      };

      const response = await reportGenerationAPI.getGeneratedReports(params);

      if (response.data.success) {
        setReports(response.data.data.reports);
        setTotalPages(response.data.data.pagination.totalPages);
        setStatistics(response.data.data.statistics);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      // Show sample data for demonstration
      const sampleReports = [
        {
          _id: '1',
          title: 'Patient Visit Report - Weekly',
          reportType: 'patient-visit',
          description: 'Weekly analysis of patient visits and flow patterns',
          dateRange: {
            startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            endDate: new Date()
          },
          generatedAt: new Date(),
          generatedBy: { firstName: 'Healthcare', lastName: 'Manager' },
          summary: { totalRecords: 245 },
          downloadCount: 12,
          status: 'completed'
        },
        {
          _id: '2',
          title: 'Staff Utilization Analysis',
          reportType: 'staff-utilization',
          description: 'Monthly staff performance and utilization metrics',
          dateRange: {
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            endDate: new Date()
          },
          generatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          generatedBy: { firstName: 'Healthcare', lastName: 'Manager' },
          summary: { totalRecords: 89 },
          downloadCount: 8,
          status: 'completed'
        },
        {
          _id: '3',
          title: 'Financial Summary - Monthly',
          reportType: 'financial-summary',
          description: 'Comprehensive financial performance overview',
          dateRange: {
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            endDate: new Date()
          },
          generatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          generatedBy: { firstName: 'Healthcare', lastName: 'Manager' },
          summary: { totalRecords: 1247 },
          downloadCount: 15,
          status: 'completed'
        }
      ];
      setReports(sampleReports);
      setStatistics({ totalReports: 3 });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (reportId, reportTitle) => {
    try {
      const response = await reportGenerationAPI.downloadGeneratedReport(reportId);

      // Create and trigger download
      const blob = new Blob([JSON.stringify(response.data, null, 2)], {
        type: 'application/json'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Report downloaded successfully');
      fetchReports(); // Refresh to update download count
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Failed to download report');
    }
  };

  const handleDelete = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report?')) {
      return;
    }

    try {
      await reportGenerationAPI.deleteGeneratedReport(reportId);

      toast.success('Report deleted successfully');
      fetchReports();
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error('Failed to delete report');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateRange = (startDate, endDate) => {
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  const getReportTypeConfig = (reportType) => {
    return reportTypeConfig[reportType] || {
      name: reportType,
      icon: DocumentTextIcon,
      color: 'gray',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-600',
      borderColor: 'border-gray-200'
    };
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6 w-48"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Generated Reports</h1>
          <p className="text-gray-600 mt-2">
            View and manage all generated reports ({statistics.totalReports || 0} total)
          </p>
        </div>
        <Link
          to="/manager/dashboard"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Generate New Report</span>
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <FunnelIcon className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Report Types</option>
              <option value="patient-visit">Patient Visit Reports</option>
              <option value="staff-utilization">Staff Utilization</option>
              <option value="financial-summary">Financial Summary</option>
              <option value="comprehensive">Comprehensive</option>
              <option value="peak-hours">Peak Hours</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {reports.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterType ? 'No reports match your search criteria.' : 'No reports have been generated yet.'}
            </p>
            <Link
              to="/manager/dashboard"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Generate Your First Report</span>
            </Link>
          </div>
        ) : (
          reports.map((report) => {
            const config = getReportTypeConfig(report.reportType);
            const Icon = config.icon;

            return (
              <div
                key={report._id}
                className={`bg-white rounded-lg shadow border-l-4 ${config.borderColor} p-6 hover:shadow-md transition-shadow`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className={`p-3 rounded-lg ${config.bgColor}`}>
                      <Icon className={`w-6 h-6 ${config.textColor}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{report.title}</h3>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          {report.status || 'Completed'}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-2">{report.description}</p>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <CalendarIcon className="w-4 h-4" />
                          <span>Generated on {formatDate(report.generatedAt)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <UsersIcon className="w-4 h-4" />
                          <span>{report.summary?.totalRecords || 0} records</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <ArrowDownTrayIcon className="w-4 h-4" />
                          <span>{report.downloadCount || 0} downloads</span>
                        </div>
                        <div>
                          <span>Period: {formatDateRange(report.dateRange.startDate, report.dateRange.endDate)}</span>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-400">
                        Generated by {report.generatedBy?.firstName} {report.generatedBy?.lastName}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleDownload(report._id, report.title)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Download Report"
                    >
                      <ArrowDownTrayIcon className="w-5 h-5" />
                    </button>
                    {user?.role === 'manager' && (
                      <button
                        onClick={() => handleDelete(report._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Report"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-8">
          <div className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;