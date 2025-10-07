import React, { useState, useEffect } from 'react';
import {
  QrCodeIcon,
  UserIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import { appointmentAPI, userAPI } from '../../services/api';
import InsuranceVerification from '../../components/Insurance/InsuranceVerification';
import toast from 'react-hot-toast';

const StaffDashboard = () => {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    pending: 0,
    checkedIn: 0,
    completed: 0
  });

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'patient-search', name: 'Patient Search', icon: MagnifyingGlassIcon },
    { id: 'insurance', name: 'Insurance Verification', icon: ShieldCheckIcon }
  ];

  useEffect(() => {
    fetchStaffData();
  }, []);

  const fetchStaffData = async () => {
    try {
      setLoading(true);
      
      const today = new Date().toISOString().split('T')[0];
      const response = await appointmentAPI.getAppointments({ date: today });
      
      if (response.data.success) {
        const appointments = response.data.data.appointments || [];
        setTodayAppointments(appointments);
        
        const pending = appointments.filter(a => a.status === 'scheduled').length;
        const checkedIn = appointments.filter(a => a.status === 'confirmed').length;
        const completed = appointments.filter(a => a.status === 'completed').length;
        
        setStats({ pending, checkedIn, completed });
      }
      
    } catch (error) {
      console.error('Error fetching staff data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (appointmentId) => {
    try {
      await appointmentAPI.checkIn(appointmentId, 'manual');
      toast.success('Patient checked in successfully');
      fetchStaffData(); // Refresh
    } catch (error) {
      console.error('Error checking in:', error);
      toast.error(error.response?.data?.message || 'Failed to check in patient');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await userAPI.searchUsers(searchQuery);
      if (response.data.success) {
        setSearchResults(response.data.data.users || []);
      }
    } catch (error) {
      console.error('Error searching:', error);
      toast.error('Search failed');
    }
  };

  const formatTime = (timeString) => {
    return timeString;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
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
            Welcome, {user?.firstName} 👋
          </h1>
          <p className="text-gray-600 mt-2">
            Staff Dashboard • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                <p className="text-sm text-gray-600">Pending Check-in</p>
              </div>
              <ClockIcon className="w-10 h-10 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.checkedIn}</p>
                <p className="text-sm text-gray-600">Checked In</p>
              </div>
              <CheckCircleIcon className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
              <CalendarIcon className="w-10 h-10 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Patient Search */}
        <div className="bg-white rounded-lg shadow mb-8 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Patient Search</h2>
          <div className="flex space-x-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search by name, email, or health card ID..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <MagnifyingGlassIcon className="w-5 h-5 inline mr-2" />
              Search
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2">
              {searchResults.map((patient) => (
                <div key={patient._id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{patient.firstName} {patient.lastName}</p>
                      <p className="text-sm text-gray-600">{patient.email}</p>
                      <p className="text-sm text-gray-500">ID: {patient.digitalHealthCardId}</p>
                    </div>
                    <button
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today's Appointments */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Today's Appointments</h2>
          </div>
          <div className="p-6">
            {todayAppointments.length > 0 ? (
              <div className="space-y-4">
                {todayAppointments.map((appointment) => (
                  <div
                    key={appointment._id}
                    className="border border-gray-200 rounded-lg p-6"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <UserIcon className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {appointment.patient?.firstName} {appointment.patient?.lastName}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Dr. {appointment.doctor?.firstName} {appointment.doctor?.lastName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatTime(appointment.appointmentTime)} • {appointment.appointmentType}
                          </p>
                          <div className="mt-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                              appointment.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                              appointment.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {appointment.status}
                            </span>
                            {appointment.paymentStatus === 'paid' ? (
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Paid
                              </span>
                            ) : (
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Payment Pending
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2">
                        {appointment.status === 'scheduled' && appointment.paymentStatus === 'paid' && (
                          <button
                            onClick={() => handleCheckIn(appointment._id)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                          >
                            <CheckCircleIcon className="w-4 h-4 inline mr-1" />
                            Check In
                          </button>
                        )}
                        {appointment.paymentStatus !== 'paid' && (
                          <button
                            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                            disabled
                          >
                            Awaiting Payment
                          </button>
                        )}
                        <button
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No appointments for today</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
