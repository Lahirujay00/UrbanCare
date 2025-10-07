import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  UsersIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import { reportsAPI, appointmentAPI, paymentAPI } from '../../services/api';
import PeakHoursPrediction from '../../components/Analytics/PeakHoursPrediction';
import ReportsDashboard from '../../components/Reports/ReportsDashboard';
import toast from 'react-hot-toast';

const ManagerDashboard = () => {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    appointmentsToday: 0,
    revenue: 0,
    pendingAppointments: 0,
    completedAppointments: 0
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'reports', name: 'Reports', icon: DocumentTextIcon },
    { id: 'peak-hours', name: 'Peak Hours', icon: ClockIcon }
  ];

  useEffect(() => {
    fetchManagerData();
  }, []);

  const fetchManagerData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard stats
      const dashboardRes = await reportsAPI.getDashboardStats();
      if (dashboardRes.data.success) {
        setStats(prev => ({
          ...prev,
          ...dashboardRes.data.data
        }));
      }

      // Fetch recent appointments
      const appointmentsRes = await appointmentAPI.getAppointments();
      if (appointmentsRes.data.success) {
        const appointments = appointmentsRes.data.data.appointments || [];
        setRecentAppointments(appointments.slice(0, 5));
        
        const today = new Date().toISOString().split('T')[0];
        const todayAppts = appointments.filter(a => 
          a.appointmentDate.startsWith(today)
        ).length;
        
        setStats(prev => ({
          ...prev,
          appointmentsToday: todayAppts,
          pendingAppointments: appointments.filter(a => 
            a.status === 'scheduled' || a.status === 'confirmed'
          ).length,
          completedAppointments: appointments.filter(a => 
            a.status === 'completed'
          ).length
        }));
      }

      // Fetch recent payments
      const paymentsRes = await paymentAPI.getPaymentHistory();
      if (paymentsRes.data.success) {
        const payments = paymentsRes.data.data.payments || [];
        setRecentPayments(payments.slice(0, 5));
        
        const totalRevenue = payments
          .filter(p => p.status === 'completed')
          .reduce((sum, p) => sum + (p.amount || 0), 0);
        
        setStats(prev => ({
          ...prev,
          revenue: totalRevenue
        }));
      }
      
    } catch (error) {
      console.error('Error fetching manager data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Manager Dashboard 📊
          </h1>
          <p className="text-gray-600 mt-2">
            {user?.firstName} {user?.lastName} • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Patients</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalPatients}</p>
                <div className="flex items-center mt-2">
                  <ArrowUpIcon className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">12% this month</span>
                </div>
              </div>
              <UsersIcon className="w-12 h-12 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Today's Appointments</p>
                <p className="text-3xl font-bold text-gray-900">{stats.appointmentsToday}</p>
                <div className="flex items-center mt-2">
                  <span className="text-sm text-gray-600">
                    {stats.pendingAppointments} pending
                  </span>
                </div>
              </div>
              <CalendarIcon className="w-12 h-12 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.revenue)}</p>
                <div className="flex items-center mt-2">
                  <ArrowUpIcon className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">8% increase</span>
                </div>
              </div>
              <CurrencyDollarIcon className="w-12 h-12 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Doctors</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalDoctors}</p>
                <div className="flex items-center mt-2">
                  <span className="text-sm text-gray-600">Active staff</span>
                </div>
              </div>
              <ChartBarIcon className="w-12 h-12 text-purple-500" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Appointments */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Recent Appointments</h2>
            </div>
            <div className="p-6">
              {recentAppointments.length > 0 ? (
                <div className="space-y-4">
                  {recentAppointments.map((appointment) => (
                    <div
                      key={appointment._id}
                      className="border-b border-gray-100 pb-4 last:border-0"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">
                            {appointment.patient?.firstName} {appointment.patient?.lastName}
                          </p>
                          <p className="text-sm text-gray-600">
                            Dr. {appointment.doctor?.firstName} {appointment.doctor?.lastName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(appointment.appointmentDate)} • {appointment.appointmentTime}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                          appointment.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {appointment.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No recent appointments</p>
              )}
            </div>
          </div>

          {/* Recent Payments */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Recent Payments</h2>
            </div>
            <div className="p-6">
              {recentPayments.length > 0 ? (
                <div className="space-y-4">
                  {recentPayments.map((payment) => (
                    <div
                      key={payment._id}
                      className="border-b border-gray-100 pb-4 last:border-0"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">
                            {payment.patient?.firstName} {payment.patient?.lastName}
                          </p>
                          <p className="text-sm text-gray-600">
                            {payment.paymentMethod} • {formatDate(payment.paymentDate || payment.createdAt)}
                          </p>
                          <p className="text-sm text-gray-500">
                            Transaction ID: {payment.transactionId.substring(0, 20)}...
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">{formatCurrency(payment.amount)}</p>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                            payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {payment.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No recent payments</p>
              )}
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">System Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.completedAppointments}</p>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingAppointments}</p>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{recentPayments.filter(p => p.status === 'completed').length}</p>
              <p className="text-sm text-gray-600">Paid</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.totalDoctors}</p>
              <p className="text-sm text-gray-600">Active Doctors</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
