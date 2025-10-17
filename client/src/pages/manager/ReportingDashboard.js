import React, { useState } from 'react';
import { Plus, Calendar, FileText } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import axios from 'axios';

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
      console.log('Generating report:', {
        reportType: selectedReportType,
        dateRange
      });

      const response = await axios.get(`/api/reports/generate/${selectedReportType}`, {
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          department: filters.department,
          staffRole: filters.staffRole
        },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      console.log('Report response:', response.data);

      if (response.data.success) {
        setReportPreview(response.data.data);
        toast.success('Report generated successfully');
      } else {
        toast.error(response.data.message || 'Failed to generate report');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      console.error('Error response:', error.response?.data);
      
      const errorMessage = error.response?.data?.message 
        || error.response?.data?.error 
        || error.message 
        || 'Failed to generate report';
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 p-8">
      {/* Dashboard Border Container */}
      <div className="border-2 border-black rounded-lg p-6 h-full flex flex-col bg-white">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-[18px] mb-1">Reporting Dashboard</h2>
            <p className="text-[12px] text-gray-600">Create, view, and manage all reports and analytics</p>
          </div>
          <p className="text-[10px] text-gray-500 max-w-[200px]">
            Generate or probe our comprehensive repository of key billing trends, and growth
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div 
            onClick={() => setSelectedReportType('custom')}
            className={`border ${selectedReportType === 'custom' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'} rounded-lg p-6 flex flex-col items-center text-center cursor-pointer hover:bg-gray-100 transition-colors`}
          >
            <div className="w-10 h-10 rounded bg-white border border-gray-300 flex items-center justify-center mb-3">
              <Plus className="w-5 h-5 text-[#4169e1]" />
            </div>
            <h3 className="text-[14px] mb-1">Create New Report</h3>
            <p className="text-[11px] text-gray-600">Build a custom report from scratch</p>
            {selectedReportType === 'custom' && (
              <span className="mt-2 text-[10px] text-blue-600 font-medium">✓ Selected</span>
            )}
          </div>
          <div 
            onClick={() => {
              setSelectedReportType('weekly-summary');
              const today = new Date();
              const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
              setDateRange({
                startDate: lastWeek.toISOString().split('T')[0],
                endDate: today.toISOString().split('T')[0]
              });
            }}
            className={`border ${selectedReportType === 'weekly-summary' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'} rounded-lg p-6 flex flex-col items-center text-center cursor-pointer hover:bg-gray-100 transition-colors`}
          >
            <div className="w-10 h-10 rounded bg-white border border-gray-300 flex items-center justify-center mb-3">
              <Calendar className="w-5 h-5 text-[#4169e1]" />
            </div>
            <h3 className="text-[14px] mb-1">Weekly Summary</h3>
            <p className="text-[11px] text-gray-600">Generate last week's patient stats</p>
            {selectedReportType === 'weekly-summary' && (
              <span className="mt-2 text-[10px] text-blue-600 font-medium">✓ Selected</span>
            )}
          </div>
          <div 
            onClick={() => {
              setSelectedReportType('monthly-billing');
              const today = new Date();
              const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
              setDateRange({
                startDate: firstDay.toISOString().split('T')[0],
                endDate: today.toISOString().split('T')[0]
              });
            }}
            className={`border ${selectedReportType === 'monthly-billing' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'} rounded-lg p-6 flex flex-col items-center text-center cursor-pointer hover:bg-gray-100 transition-colors`}
          >
            <div className="w-10 h-10 rounded bg-white border border-gray-300 flex items-center justify-center mb-3">
              <FileText className="w-5 h-5 text-[#4169e1]" />
            </div>
            <h3 className="text-[14px] mb-1">Monthly Billing</h3>
            <p className="text-[11px] text-gray-600">View all billable hours for the month</p>
            {selectedReportType === 'monthly-billing' && (
              <span className="mt-2 text-[10px] text-blue-600 font-medium">✓ Selected</span>
            )}
          </div>
        </div>

        {/* Recent Reports */}
        <div className="mb-6">
          <h3 className="text-[14px] mb-3">📋 Recent Reports</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[12px]">💰</span>
                  <p className="text-[13px]">Q3 Patient Visit Report</p>
                </div>
                <p className="text-[11px] text-gray-500">Generated on 07 Aug 2025</p>
              </div>
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[11px] font-medium">
                Completed
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[12px]">📊</span>
                  <p className="text-[13px]">Staff Utilization Analysis</p>
                </div>
                <p className="text-[11px] text-gray-500">Generated on 20 Aug 2025</p>
              </div>
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[11px] font-medium">
                Completed
              </span>
            </div>
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
                {selectedReportType === 'custom' && 'Custom Report'}
                {selectedReportType === 'weekly-summary' && 'Weekly Summary'}
                {selectedReportType === 'monthly-billing' && 'Monthly Billing'}
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
                  {reportPreview.reportType === 'weekly-summary' && 'Weekly Summary Report'}
                  {reportPreview.reportType === 'monthly-billing' && 'Monthly Billing Report'}
                  {reportPreview.reportType === 'custom' && 'Custom Report'}
                  {reportPreview.reportType === 'patient-visit' && 'Patient Visit Report'}
                  {reportPreview.reportType === 'staff-utilization' && 'Staff Utilization Report'}
                  {' '} • {reportPreview.dateRange?.startDate} to {reportPreview.dateRange?.endDate}
                </p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => window.print()}
                  className="px-4 py-2 border border-gray-300 rounded text-[12px] hover:bg-gray-50 transition-colors"
                >
                  🖨️ Print
                </button>
                <button 
                  onClick={() => {
                    const dataStr = JSON.stringify(reportPreview.preview, null, 2);
                    const dataBlob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${reportPreview.reportType}-${new Date().toISOString().split('T')[0]}.json`;
                    link.click();
                  }}
                  className="px-4 py-2 bg-green-500 text-white rounded text-[12px] hover:bg-green-600 transition-colors"
                >
                  📥 Download
                </button>
                <button 
                  onClick={() => setReportPreview(null)}
                  className="px-4 py-2 bg-red-500 text-white rounded text-[12px] hover:bg-red-600 transition-colors"
                >
                  ✕ Close
                </button>
              </div>
            </div>
            
            {/* Summary Cards for Weekly Summary */}
            {reportPreview.reportType === 'weekly-summary' && reportPreview.preview && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[12px] text-blue-600 font-medium mb-1">Total Appointments</p>
                      <p className="text-[32px] font-bold text-blue-900">{reportPreview.preview.appointments || 0}</p>
                      <p className="text-[11px] text-blue-600 mt-1">Scheduled this week</p>
                    </div>
                    <div className="w-16 h-16 bg-white bg-opacity-50 rounded-full flex items-center justify-center">
                      <span className="text-[32px]">📅</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[12px] text-green-600 font-medium mb-1">Total Revenue</p>
                      <p className="text-[32px] font-bold text-green-900">
                        ${(reportPreview.preview.revenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-[11px] text-green-600 mt-1">Earned this week</p>
                    </div>
                    <div className="w-16 h-16 bg-white bg-opacity-50 rounded-full flex items-center justify-center">
                      <span className="text-[32px]">💰</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Table for Monthly Billing */}
            {reportPreview.reportType === 'monthly-billing' && Array.isArray(reportPreview.preview) && (
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
