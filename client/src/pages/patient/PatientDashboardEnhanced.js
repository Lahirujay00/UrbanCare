import React, { useState, useEffect } from 'react';
import {
  CalendarIcon,
  DocumentTextIcon,
  HeartIcon,
  BellIcon,
  ClockIcon,
  UserIcon,
  ChartBarIcon,
  PlusIcon,
  EyeIcon,
  ArrowRightIcon,
  ExclamationCircleIcon,
  QrCodeIcon,
  CloudArrowUpIcon,
  CurrencyDollarIcon,
  UserCircleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { appointmentAPI, medicalRecordsAPI } from '../../services/api';
import HealthCardDisplay from '../../components/HealthCard/HealthCardDisplay';
import DocumentManager from '../../components/Documents/DocumentManager';
import RefundManager from '../../components/Refunds/RefundManager';
import ChatBot from '../../components/ChatBot/ChatBot';
import AppointmentBooking from './AppointmentBooking';
import MedicalRecords from './MedicalRecords';
import ProfileEditor from './ProfileEditor';
import NICVerification from '../../components/Patient/NICVerification';
import toast from 'react-hot-toast';

const PatientDashboardEnhanced = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [stats, setStats] = useState({
    upcomingAppointments: 0,
    totalRecords: 0,
    recentRecords: 0,
    notifications: 0
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [isFetching, setIsFetching] = useState(false);

  // Tab configuration
  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'book-appointment', name: 'Book Appointment', icon: CalendarIcon },
    { id: 'appointments', name: 'My Appointments', icon: ClockIcon },
    { id: 'health-card', name: 'Health Card', icon: QrCodeIcon },
    { id: 'documents', name: 'Medical Records', icon: DocumentTextIcon },
    { id: 'profile', name: 'Profile & Verification', icon: UserCircleIcon }
  ];

  // Handle URL parameters for tab navigation
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam && tabs.some(tab => tab.id === tabParam)) {
      setActiveTab(tabParam);
    }
    // Refresh data when navigating to overview from payment
    if (tabParam === 'overview' || !tabParam) {
      fetchDashboardData();
      refreshUser(); // Refresh user data to get updated identity verification status
    }
  }, [location.search]);

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    // Prevent duplicate simultaneous calls
    if (isFetching) return;
    
    try {
      setLoading(true);
      setIsFetching(true);
      
      // Fetch appointments - get all statuses to show both upcoming and history
      const appointmentsRes = await appointmentAPI.getAppointments({
        status: 'pending-payment,scheduled,confirmed,cancelled,completed,no-show'
      });
      
      if (appointmentsRes.data.success) {
        const allAppts = appointmentsRes.data.data.appointments || [];
        setAppointments(allAppts);
        
        console.log('All appointments:', allAppts);
        console.log('Cancelled appointments:', allAppts.filter(apt => apt.status === 'cancelled'));
        
        // Update stats - count only active upcoming appointments (future date/time)
        const now = new Date();
        
        const activeUpcoming = allAppts.filter(apt => {
          // Combine date and time for accurate comparison
          const apptDate = new Date(apt.appointmentDate);
          const [hours, minutes] = apt.appointmentTime.split(':');
          apptDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          
          return apptDate > now && !['cancelled', 'completed', 'no-show'].includes(apt.status);
        }).length;
        
        setStats(prev => ({
          ...prev,
          upcomingAppointments: activeUpcoming
        }));
      }

      // Fetch medical records
      const recordsRes = await medicalRecordsAPI.getRecords();
      
      if (recordsRes.data.success) {
        const records = recordsRes.data.data.records || [];
        setMedicalRecords(records);
        
        // Count recent records (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentCount = records.filter(r => 
          new Date(r.createdAt) > thirtyDaysAgo
        ).length;
        
        setStats(prev => ({
          ...prev,
          totalRecords: records.length,
          recentRecords: recentCount
        }));
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Handle appointment cancellation
  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      await appointmentAPI.cancelAppointment(appointmentId, 'Patient requested cancellation');
      toast.success('Appointment cancelled successfully');
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.error('Failed to cancel appointment');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50  to-indigo-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {user?.firstName}! 👋
              </h1>
              <p className="text-gray-600">
                Your complete healthcare dashboard with all advanced features
              </p>
            </div>
            <button
              onClick={() => setActiveTab('documents')}
              className="hidden sm:flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105 shadow-lg font-medium"
            >
              <DocumentTextIcon className="w-5 h-5" />
              <span>View Medical History</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">{stats.upcomingAppointments}</p>
                    <p className="text-gray-600 text-sm font-medium">Upcoming Appointments</p>
                    <p className="text-xs text-blue-600 mt-1">Next 30 days</p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <CalendarIcon className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">{stats.totalRecords}</p>
                    <p className="text-gray-600 text-sm font-medium">Medical Records</p>
                    <p className="text-xs text-green-600 mt-1">{stats.recentRecords} recent</p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <DocumentTextIcon className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">Active</p>
                    <p className="text-gray-600 text-sm font-medium">Health Card Status</p>
                    <p className="text-xs text-purple-600 mt-1">Digital ID ready</p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <QrCodeIcon className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">
                      {user?.identityVerificationStatus === 'verified' ? 'Verified' : 
                       user?.identityVerificationStatus === 'pending' ? 'Pending' : 
                       user?.identityVerificationStatus === 'rejected' ? 'Rejected' : 'Unverified'}
                    </p>
                    <p className="text-gray-600 text-sm font-medium">Identity Status</p>
                    <p className={`text-xs mt-1 ${
                      user?.identityVerificationStatus === 'verified' ? 'text-green-600' :
                      user?.identityVerificationStatus === 'pending' ? 'text-blue-600' :
                      user?.identityVerificationStatus === 'rejected' ? 'text-red-600' :
                      'text-orange-600'
                    }`}>
                      {user?.identityVerificationStatus === 'verified' ? 'Identity verified ✓' : 
                       user?.identityVerificationStatus === 'pending' ? 'Under review' : 
                       user?.identityVerificationStatus === 'rejected' ? 'Verification rejected' : 'Verification needed'}
                    </p>
                  </div>
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
                    user?.identityVerificationStatus === 'verified' ? 'bg-gradient-to-br from-green-500 to-green-600' :
                    user?.identityVerificationStatus === 'pending' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                    user?.identityVerificationStatus === 'rejected' ? 'bg-gradient-to-br from-red-500 to-red-600' :
                    'bg-gradient-to-br from-orange-500 to-orange-600'
                  }`}>
                    <ShieldCheckIcon className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Appointments */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 mb-8">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                      <CalendarIcon className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Upcoming Appointments
                    </h2>
                  </div>
                  <button
                    onClick={() => setActiveTab('book-appointment')}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-lg font-medium"
                  >
                    <PlusIcon className="w-4 h-4" />
                    <span>Book New</span>
                  </button>
                </div>
              </div>
              <div className="p-6">
                {(() => {
                  const now = new Date();
                  const upcomingAppts = appointments.filter(apt => {
                    // Combine date and time for accurate comparison
                    const apptDate = new Date(apt.appointmentDate);
                    const [hours, minutes] = apt.appointmentTime.split(':');
                    apptDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                    
                    return apptDate > now && !['cancelled', 'completed', 'no-show'].includes(apt.status);
                  });
                  
                  return upcomingAppts.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingAppts.slice(0, 2).map((appointment) => (
                      <div
                        key={appointment._id}
                        className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-6 rounded-2xl hover:shadow-lg transition-all duration-300"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                              <UserIcon className="w-8 h-8 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-900 mb-1">
                                {appointment.doctor?.firstName} {appointment.doctor?.lastName}
                              </h3>
                              <p className="text-sm text-blue-700 font-medium mb-1">
                                {appointment.doctor?.specialization} • {appointment.appointmentType}
                              </p>
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                  <CalendarIcon className="w-4 h-4 text-gray-500" />
                                  <span className="text-sm text-gray-600">{formatDate(appointment.appointmentDate)}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <ClockIcon className="w-4 h-4 text-gray-500" />
                                  <span className="text-sm text-gray-600">{appointment.appointmentTime}</span>
                                </div>
                              </div>
                              <div className="mt-2 flex items-center space-x-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                  appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {appointment.status}
                                </span>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  appointment.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                                  appointment.paymentStatus === 'pay-at-hospital' ? 'bg-orange-100 text-orange-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {appointment.paymentStatus === 'paid' ? '💰 Paid' : 
                                   appointment.paymentStatus === 'pay-at-hospital' ? '🏥 Pay at Hospital' : 
                                   '⏳ Payment Pending'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div>
                            <button 
                              onClick={() => navigate(`/appointments/${appointment._id}`)}
                              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-md"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {upcomingAppts.length > 2 && (
                      <div className="text-center pt-4">
                        <button
                          onClick={() => setActiveTab('appointments')}
                          className="inline-flex items-center space-x-2 px-6 py-3 bg-white text-blue-600 border-2 border-blue-200 rounded-xl hover:bg-blue-50 transition-colors font-medium"
                        >
                          <ClockIcon className="w-5 h-5" />
                          <span>View All Appointments ({upcomingAppts.length})</span>
                          <ArrowRightIcon className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming appointments</h3>
                    <p className="text-gray-500 mb-6">Schedule your next appointment to stay on top of your health</p>
                    <button
                      onClick={() => setActiveTab('book-appointment')}
                      className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                    >
                      <PlusIcon className="w-5 h-5" />
                      <span>Book Your Appointment</span>
                    </button>
                  </div>
                  );
                })()}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button
                onClick={() => setActiveTab('health-card')}
                className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-left"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <QrCodeIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Digital Health Card</h3>
                    <p className="text-sm text-gray-600">View your QR code and medical info</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('documents')}
                className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-left"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                    <DocumentTextIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Medical Records</h3>
                    <p className="text-sm text-gray-600">View and manage your medical history</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('profile')}
                className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-left"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                    <UserCircleIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Update Profile</h3>
                    <p className="text-sm text-gray-600">Manage personal info & verification</p>
                  </div>
                </div>
              </button>
            </div>
          </>
        )}

        {/* Book Appointment Tab */}
        {activeTab === 'book-appointment' && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <AppointmentBooking />
          </div>
        )}

        {/* My Appointments Tab */}
        {activeTab === 'appointments' && (
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <ClockIcon className="w-6 h-6 text-white" />
                  <h2 className="text-2xl font-bold text-white">
                    My Appointments
                  </h2>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-4">Loading appointments...</p>
                </div>
              ) : (
                <>
                  {/* Upcoming Appointments */}
                  <div className="mb-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                      <CalendarIcon className="w-5 h-5 text-blue-600" />
                      <span>Upcoming Appointments</span>
                    </h3>
                    {(() => {
                      const now = new Date();
                      const upcomingAppts = appointments.filter(apt => {
                        // Combine date and time for accurate comparison
                        const apptDate = new Date(apt.appointmentDate);
                        const [hours, minutes] = apt.appointmentTime.split(':');
                        apptDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                        
                        return apptDate > now && !['cancelled', 'completed', 'no-show'].includes(apt.status);
                      });
                      
                      return upcomingAppts.length > 0 ? (
                      <div className="space-y-4">
                        {upcomingAppts.map((appointment) => (
                          <div
                            key={appointment._id}
                            className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-100 p-6 rounded-2xl hover:shadow-lg transition-all duration-300"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4 flex-1">
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                                  <UserIcon className="w-7 h-7 text-white" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="text-lg font-bold text-gray-900 mb-1">
                                    Dr. {appointment.doctor?.firstName} {appointment.doctor?.lastName}
                                  </h4>
                                  <p className="text-sm text-blue-700 font-medium mb-2">
                                    {appointment.doctor?.specialization} • {appointment.appointmentType}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-3">
                                    <div className="flex items-center space-x-1">
                                      <CalendarIcon className="w-4 h-4 text-gray-500" />
                                      <span className="text-sm text-gray-600 font-medium">{formatDate(appointment.appointmentDate)}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <ClockIcon className="w-4 h-4 text-gray-500" />
                                      <span className="text-sm text-gray-600 font-medium">{appointment.appointmentTime}</span>
                                    </div>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                      appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                      appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                      appointment.status === 'pending-payment' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {appointment.status}
                                    </span>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                      appointment.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                                      appointment.paymentStatus === 'pay-at-hospital' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-orange-100 text-orange-800'
                                    }`}>
                                      {appointment.paymentStatus === 'pay-at-hospital' ? 'Pay at Hospital' : appointment.paymentStatus}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => navigate(`/appointments/${appointment._id}`)}
                                className="px-5 py-2.5 bg-white text-blue-600 border-2 border-blue-200 rounded-xl hover:bg-blue-50 transition-colors font-semibold shadow-sm"
                              >
                                View
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-2xl">
                        <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-600">No upcoming appointments</p>
                      </div>
                      );
                    })()}
                  </div>

                  {/* Past Appointments (History) */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                      <ClockIcon className="w-5 h-5 text-gray-600" />
                      <span>Appointment History</span>
                    </h3>
                    {appointments.filter(apt => 
                      new Date(apt.appointmentDate) < new Date() || 
                      ['cancelled', 'completed', 'no-show'].includes(apt.status)
                    ).length > 0 ? (
                      <div className="space-y-4">
                        {appointments.filter(apt => 
                          new Date(apt.appointmentDate) < new Date() || 
                          ['cancelled', 'completed', 'no-show'].includes(apt.status)
                        ).map((appointment) => (
                          <div
                            key={appointment._id}
                            className="bg-gray-50 border border-gray-200 p-6 rounded-2xl hover:shadow-md transition-all duration-300"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4 flex-1">
                                <div className="w-14 h-14 bg-gradient-to-br from-gray-400 to-gray-500 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                                  <UserIcon className="w-7 h-7 text-white" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="text-lg font-bold text-gray-900 mb-1">
                                    Dr. {appointment.doctor?.firstName} {appointment.doctor?.lastName}
                                  </h4>
                                  <p className="text-sm text-gray-700 font-medium mb-2">
                                    {appointment.doctor?.specialization} • {appointment.appointmentType}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-3">
                                    <div className="flex items-center space-x-1">
                                      <CalendarIcon className="w-4 h-4 text-gray-500" />
                                      <span className="text-sm text-gray-600 font-medium">{formatDate(appointment.appointmentDate)}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <ClockIcon className="w-4 h-4 text-gray-500" />
                                      <span className="text-sm text-gray-600 font-medium">{appointment.appointmentTime}</span>
                                    </div>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                      appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                      appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                      appointment.status === 'no-show' ? 'bg-orange-100 text-orange-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {appointment.status}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => navigate(`/appointments/${appointment._id}`)}
                                className="px-5 py-2.5 bg-white text-gray-600 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-semibold shadow-sm"
                              >
                                View
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-2xl">
                        <ClockIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-600">No past appointments</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Health Card Tab */}
        {activeTab === 'health-card' && <HealthCardDisplay />}

        {/* Medical Records Tab */}
        {activeTab === 'documents' && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <MedicalRecords />
          </div>
        )}

        {/* Profile & Verification Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <NICVerification />
          </div>
        )}
      </div>

      {/* ChatBot Component */}
      <ChatBot />
    </div>
  );
};

export default PatientDashboardEnhanced;
