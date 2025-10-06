import React, { useState, useEffect } from 'react';
import {
  CalendarIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  PlusIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { appointmentAPI, medicalRecordsAPI } from '../../services/api';
import ChatBot from '../../components/ChatBot/ChatBot';
import toast from 'react-hot-toast';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [stats, setStats] = useState({
    today: 0,
    pending: 0,
    completed: 0,
    total: 0
  });

  useEffect(() => {
    fetchDoctorData();
  }, []);

  const fetchDoctorData = async () => {
    // Get today's date (move outside try block)
    const today = new Date().toISOString().split('T')[0];
    
    try {
      setLoading(true);
      
      // Fetch doctor's appointments
      const response = await appointmentAPI.getDoctorAppointments(user._id);
      
      if (response.data.success) {
        const allAppointments = response.data.data.appointments || [];
        
        // Filter today's appointments
        const todayAppts = allAppointments.filter(apt => {
          const aptDate = new Date(apt.appointmentDate).toISOString().split('T')[0];
          return aptDate === today;
        });
        
        // Filter upcoming appointments (not today)
        const upcomingAppts = allAppointments.filter(apt => {
          const aptDate = new Date(apt.appointmentDate);
          const todayDate = new Date(today);
          return aptDate > todayDate;
        });
        
        setTodayAppointments(todayAppts);
        setUpcomingAppointments(upcomingAppts);
        
        // Calculate stats
        const pending = allAppointments.filter(a => 
          a.status === 'scheduled' || a.status === 'confirmed'
        ).length;
        
        const completed = allAppointments.filter(a => 
          a.status === 'completed'
        ).length;
        
        setStats({
          today: todayAppts.length,
          pending: pending,
          completed: completed,
          total: allAppointments.length
        });
      }
      
    } catch (error) {
      console.error('Error fetching doctor data:', error);
      // Fallback to general appointments if doctor-specific fails
      try {
        const fallbackResponse = await appointmentAPI.getAppointments();
        if (fallbackResponse.data.success) {
          const allAppointments = fallbackResponse.data.data.appointments || [];
          const todayAppts = allAppointments.filter(apt => 
            apt.appointmentDate.startsWith(today)
          );
          setTodayAppointments(todayAppts);
          setStats(prev => ({ ...prev, today: todayAppts.length }));
        }
      } catch (fallbackError) {
        toast.error('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (appointmentId, newStatus) => {
    try {
      await appointmentAPI.updateStatus(appointmentId, newStatus);
      toast.success(`Appointment ${newStatus} successfully`);
      fetchDoctorData(); // Refresh
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update appointment status');
    }
  };

  const handleCreateRecord = (appointment) => {
    navigate(`/doctor/create-record`, { state: { appointment } });
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
            Welcome, Dr. {user?.lastName} 👨‍⚕️
          </h1>
          <p className="text-gray-600 mt-2">
            {user?.specialization} • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.today}</p>
                <p className="text-sm text-gray-600">Today's Appointments</p>
              </div>
              <CalendarIcon className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
              <ClockIcon className="w-10 h-10 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
              <CheckCircleIcon className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-600">Total Patients</p>
              </div>
              <UserIcon className="w-10 h-10 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Today's Appointments */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Today's Appointments</h2>
          </div>
          <div className="p-6">
            {todayAppointments.length > 0 ? (
              <div className="space-y-4">
                {todayAppointments.map((appointment) => (
                  <div
                    key={appointment._id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
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
                            {appointment.appointmentTime || 'Time TBD'} • {appointment.appointmentType || 'Consultation'}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            Chief Complaint: {appointment.chiefComplaint || 'General checkup'}
                          </p>
                          {appointment.patient?.email && (
                            <p className="text-xs text-gray-400 mt-1">
                              📧 {appointment.patient.email}
                            </p>
                          )}
                          {appointment.patient?.phone && (
                            <p className="text-xs text-gray-400">
                              📞 {appointment.patient.phone}
                            </p>
                          )}
                          <div className="mt-2 flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                              appointment.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                              appointment.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {appointment.status}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              appointment.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                              appointment.paymentStatus === 'pay-at-hospital' ? 'bg-orange-100 text-orange-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {appointment.paymentStatus === 'paid' ? '💰 Paid' : 
                               appointment.paymentStatus === 'pay-at-hospital' ? '🏥 Pay at Hospital' : 
                               '⏳ Payment Pending'}
                            </span>
                            {appointment.consultationFee && (
                              <span className="text-xs text-gray-600">
                                ${appointment.consultationFee}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2">
                        {appointment.status === 'scheduled' && (
                          <button
                            onClick={() => handleUpdateStatus(appointment._id, 'confirmed')}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                          >
                            Confirm
                          </button>
                        )}
                        {appointment.status === 'confirmed' && (
                          <button
                            onClick={() => handleUpdateStatus(appointment._id, 'in-progress')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            Start Consultation
                          </button>
                        )}
                        {appointment.status === 'in-progress' && (
                          <>
                            <button
                              onClick={() => handleCreateRecord(appointment)}
                              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                            >
                              <DocumentTextIcon className="w-4 h-4 inline mr-1" />
                              Add Record
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(appointment._id, 'completed')}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                            >
                              Complete
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => navigate(`/doctor/patient/${appointment.patient?._id}`)}
                          className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-sm"
                        >
                          <UserIcon className="w-4 h-4 inline mr-1" />
                          Patient Profile
                        </button>
                        <button
                          onClick={() => navigate(`/appointments/${appointment._id}`)}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                        >
                          <EyeIcon className="w-4 h-4 inline mr-1" />
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
                <p className="text-gray-500">No appointments scheduled for today</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Upcoming Appointments</h2>
          </div>
          <div className="p-6">
            {upcomingAppointments.length > 0 ? (
              <div className="space-y-4">
                {upcomingAppointments.slice(0, 5).map((appointment) => (
                  <div
                    key={appointment._id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {appointment.patient?.firstName} {appointment.patient?.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {formatDate(appointment.appointmentDate)} at {appointment.appointmentTime}
                        </p>
                        <p className="text-sm text-gray-500">
                          {appointment.appointmentType} • {appointment.chiefComplaint?.substring(0, 50)}...
                        </p>
                      </div>
                      <button
                        onClick={() => navigate(`/doctor/appointments/${appointment._id}`)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No upcoming appointments</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ChatBot Component */}
      <ChatBot />
    </div>
  );
};

export default DoctorDashboard;
