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
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { appointmentAPI, medicalRecordsAPI } from '../../services/api';
import HealthCardDisplay from '../../components/HealthCard/HealthCardDisplay';
import DocumentManager from '../../components/Documents/DocumentManager';
import RefundManager from '../../components/Refunds/RefundManager';
import ChatBot from '../../components/ChatBot/ChatBot';
import toast from 'react-hot-toast';

const PatientDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
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

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Listen for chatbot tab changes
  useEffect(() => {
    const handleChatbotTabChange = (event) => {
      setActiveTab(event.detail);
    };

    window.addEventListener('chatbotTabChange', handleChatbotTabChange);
    return () => {
      window.removeEventListener('chatbotTabChange', handleChatbotTabChange);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch patient's appointments
      const appointmentsRes = await appointmentAPI.getPatientAppointments(user._id, {
        status: 'scheduled,confirmed'
      });
      
      if (appointmentsRes.data.success) {
        const upcomingAppts = appointmentsRes.data.data.appointments || [];
        setAppointments(upcomingAppts);
        
        // Update stats
        setStats(prev => ({
          ...prev,
          upcomingAppointments: upcomingAppts.length
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
      // Fallback to general appointments if patient-specific fails
      try {
        const fallbackRes = await appointmentAPI.getAppointments({
          status: 'scheduled,confirmed'
        });
        if (fallbackRes.data.success) {
          const allAppts = fallbackRes.data.data.appointments || [];
          setAppointments(allAppts);
          setStats(prev => ({ ...prev, upcomingAppointments: allAppts.length }));
        }
      } catch (fallbackError) {
        toast.error('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      await appointmentAPI.updateAppointment(appointmentId, { status: 'cancelled' });
      toast.success('Appointment cancelled successfully');
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.error('Failed to cancel appointment');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Enhanced Welcome Section */}
        <div className="mb-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                Welcome back, {user?.firstName}! 👋
              </h1>
              <p className="text-blue-100 text-lg">
                Your health journey continues here. Today is {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <div className="mt-4 flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <HeartIcon className="w-5 h-5 text-blue-200" />
                  <span className="text-blue-100">Digital Health Card: {user?.digitalHealthCardId}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ClockIcon className="w-5 h-5 text-blue-200" />
                  <span className="text-blue-100">Member Since: {formatDate(user?.createdAt)}</span>
                </div>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                <UserIcon className="w-16 h-16 text-white/80" />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', name: 'Overview', icon: ChartBarIcon },
                { id: 'health-card', name: 'Health Card', icon: QrCodeIcon },
                { id: 'documents', name: 'Documents', icon: DocumentTextIcon },
                { id: 'refunds', name: 'Refunds', icon: CurrencyDollarIcon }
              ].map((tab) => {
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
            {/* Enhanced Quick Stats - REAL DATA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900 mb-1">{stats.upcomingAppointments}</p>
                <p className="text-gray-600 text-sm font-medium">Upcoming Appointments</p>
                {appointments.length > 0 && (
                  <p className="text-xs text-green-600 mt-1">Next: {formatDate(appointments[0].appointmentDate)}</p>
                )}
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
                <p className="text-xs text-blue-600 mt-1">{stats.recentRecords} recent updates</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                <DocumentTextIcon className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-green-600 mb-1">Active</p>
                <p className="text-gray-600 text-sm font-medium">Health Status</p>
                <p className="text-xs text-green-600 mt-1">All systems normal</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <HeartIcon className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900 mb-1">{stats.upcomingAppointments}</p>
                <p className="text-gray-600 text-sm font-medium">Active Notifications</p>
                <p className="text-xs text-orange-600 mt-1">Stay updated</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                <BellIcon className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Upcoming Appointments - REAL DATA */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
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
                    onClick={() => navigate('/appointments/book')}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-lg font-medium"
                  >
                    <PlusIcon className="w-4 h-4" />
                    <span>Book New</span>
                  </button>
                </div>
              </div>
              <div className="p-6">
                {appointments.length > 0 ? (
                  <div className="space-y-4">
                    {appointments.slice(0, 3).map((appointment) => (
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
                                Dr. {appointment.doctor?.firstName} {appointment.doctor?.lastName}
                              </h3>
                              <p className="text-sm text-blue-700 font-medium mb-1">
                                {appointment.doctor?.specialization || 'General Practice'} • {appointment.appointmentType || 'Consultation'}
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
                              <div className="mt-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                  appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {appointment.status}
                                </span>
                                <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  appointment.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {appointment.paymentStatus === 'paid' ? 'Paid' : 'Payment Pending'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col space-y-2">
                            <button 
                              onClick={() => navigate(`/appointments/${appointment._id}`)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-md"
                            >
                              View Details
                            </button>
                            <button 
                              onClick={() => handleCancelAppointment(appointment._id)}
                              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CalendarIcon className="w-12 h-12 text-blue-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No upcoming appointments</h3>
                    <p className="text-gray-500 mb-6">Start your healthcare journey by booking your first appointment</p>
                    <button
                      onClick={() => navigate('/appointments/book')}
                      className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-lg font-medium"
                    >
                      <PlusIcon className="w-5 h-5" />
                      <span>Book Your First Appointment</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 order-1 lg:order-2">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <ChartBarIcon className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <button
                    onClick={() => navigate('/appointments/book')}
                    className="group w-full flex items-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl hover:from-blue-100 hover:to-blue-200 transition-all duration-300 transform hover:scale-105"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                      <CalendarIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="ml-4 flex-1 text-left">
                      <p className="font-semibold text-gray-900">Book Appointment</p>
                      <p className="text-sm text-gray-600">Schedule with a doctor</p>
                    </div>
                    <ArrowRightIcon className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button
                    onClick={() => navigate('/records')}
                    className="group w-full flex items-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-2xl hover:from-green-100 hover:to-green-200 transition-all duration-300 transform hover:scale-105"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                      <DocumentTextIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="ml-4 flex-1 text-left">
                      <p className="font-semibold text-gray-900">Medical Records</p>
                      <p className="text-sm text-gray-600">View your health history</p>
                    </div>
                    <ArrowRightIcon className="w-5 h-5 text-green-600 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button
                    onClick={() => navigate('/health-card')}
                    className="group w-full flex items-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl hover:from-purple-100 hover:to-purple-200 transition-all duration-300 transform hover:scale-105"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                      <EyeIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="ml-4 flex-1 text-left">
                      <p className="font-semibold text-gray-900">Health Card</p>
                      <p className="text-sm text-gray-600">Digital health ID</p>
                    </div>
                    <ArrowRightIcon className="w-5 h-5 text-purple-600 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Medical Records */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <DocumentTextIcon className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Recent Records</h2>
                </div>
              </div>
              <div className="p-6">
                {medicalRecords.length > 0 ? (
                  <div className="space-y-3">
                    {medicalRecords.slice(0, 3).map((record) => (
                      <div
                        key={record._id}
                        className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => navigate(`/records/${record._id}`)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 text-sm">{record.title}</p>
                            <p className="text-xs text-gray-600 mt-1">{record.recordType}</p>
                            <p className="text-xs text-gray-500 mt-1">{formatDate(record.createdAt)}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            record.priority === 'high' ? 'bg-red-100 text-red-700' :
                            record.priority === 'normal' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {record.priority}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No medical records yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
            </div>
          </>
        )}

        {/* Health Card Tab */}
        {activeTab === 'health-card' && <HealthCardDisplay />}

        {/* Documents Tab */}
        {activeTab === 'documents' && <DocumentManager />}

        {/* Refunds Tab */}
        {activeTab === 'refunds' && <RefundManager />}
      </div>

      {/* ChatBot Component */}
      <ChatBot />
    </div>
  );
};

export default PatientDashboard;
