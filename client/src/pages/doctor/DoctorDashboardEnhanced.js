import React, { useState, useEffect } from 'react';
import {
  CalendarIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  PlusIcon,
  EyeIcon,
  ChartBarIcon,
  CogIcon,
  BellIcon,
  PhoneIcon,
  VideoCameraIcon,
  PencilSquareIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { appointmentAPI, medicalRecordsAPI, userAPI } from '../../services/api';
import ChatBot from '../../components/ChatBot/ChatBot';
import toast from 'react-hot-toast';

const DoctorDashboardEnhanced = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [allAppointments, setAllAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientRecords, setPatientRecords] = useState([]);
  const [availability, setAvailability] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [stats, setStats] = useState({
    today: 0,
    pending: 0,
    completed: 0,
    total: 0,
    thisWeek: 0,
    thisMonth: 0,
    totalPatients: 0,
    newPatients: 0
  });

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'appointments', name: 'Appointments', icon: CalendarIcon },
    { id: 'patients', name: 'Patients', icon: UserIcon },
    { id: 'records', name: 'Medical Records', icon: DocumentTextIcon },
    { id: 'availability', name: 'Availability', icon: ClockIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon }
  ];

  useEffect(() => {
    fetchDoctorData();
    fetchPatients();
    fetchAvailability();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = patients.filter(patient => 
        `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.phone.includes(searchQuery)
      );
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients(patients);
    }
  }, [searchQuery, patients]);

  const fetchDoctorData = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    try {
      setLoading(true);
      
      // Fetch doctor's appointments
      const response = await appointmentAPI.getDoctorAppointments(user._id);
      
      if (response.data.success) {
        const allAppointments = response.data.data.appointments || [];
        
        // Filter appointments by date
        const todayAppts = allAppointments.filter(apt => {
          const aptDate = new Date(apt.appointmentDate).toISOString().split('T')[0];
          return aptDate === today;
        });
        
        const upcomingAppts = allAppointments.filter(apt => {
          const aptDate = new Date(apt.appointmentDate);
          const todayDate = new Date(today);
          return aptDate > todayDate;
        });
        
        setTodayAppointments(todayAppts);
        setUpcomingAppointments(upcomingAppts.slice(0, 5));
        setAllAppointments(allAppointments);
        
        setStats(prevStats => ({
          ...prevStats,
          today: todayAppts.length,
          pending: allAppointments.filter(apt => apt.status === 'scheduled').length,
          completed: allAppointments.filter(apt => apt.status === 'completed').length,
          total: allAppointments.length,
          thisWeek: allAppointments.length,
          thisMonth: allAppointments.length
        }));
      }
    } catch (error) {
      console.error('Error fetching doctor data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      // Fetch all patients who have appointments with this doctor
      const response = await appointmentAPI.getDoctorAppointments(user._id);
      if (response.data.success) {
        const appointments = response.data.data.appointments || [];
        const uniquePatients = [];
        const patientIds = new Set();
        
        appointments.forEach(apt => {
          if (apt.patient && !patientIds.has(apt.patient._id)) {
            patientIds.add(apt.patient._id);
            uniquePatients.push(apt.patient);
          }
        });
        
        setPatients(uniquePatients);
        setFilteredPatients(uniquePatients);
        
        setStats(prevStats => ({
          ...prevStats,
          totalPatients: uniquePatients.length,
          newPatients: uniquePatients.filter(p => {
            const createdDate = new Date(p.createdAt);
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return createdDate > monthAgo;
          }).length
        }));
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Failed to load patients');
    }
  };

  const fetchPatientRecords = async (patientId) => {
    try {
      const response = await medicalRecordsAPI.getRecords(patientId);
      if (response.data.success) {
        setPatientRecords(response.data.data.records || []);
      }
    } catch (error) {
      console.error('Error fetching patient records:', error);
      toast.error('Failed to load patient records');
    }
  };

  const fetchAvailability = async () => {
    try {
      // For now, use local storage or default availability
      const savedAvailability = localStorage.getItem(`doctor_availability_${user._id}`);
      if (savedAvailability) {
        setAvailability(JSON.parse(savedAvailability));
      } else {
        // Set default availability
        const defaultAvailability = {
          monday: { enabled: true, startTime: '09:00', endTime: '17:00' },
          tuesday: { enabled: true, startTime: '09:00', endTime: '17:00' },
          wednesday: { enabled: true, startTime: '09:00', endTime: '17:00' },
          thursday: { enabled: true, startTime: '09:00', endTime: '17:00' },
          friday: { enabled: true, startTime: '09:00', endTime: '17:00' },
          saturday: { enabled: false, startTime: '09:00', endTime: '13:00' },
          sunday: { enabled: false, startTime: '09:00', endTime: '13:00' }
        };
        setAvailability(defaultAvailability);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
    }
  };

  const updateAvailability = async (newAvailability) => {
    try {
      // Save to local storage for now
      localStorage.setItem(`doctor_availability_${user._id}`, JSON.stringify(newAvailability));
      setAvailability(newAvailability);
      toast.success('Availability updated successfully');
      
      // TODO: Integrate with backend API when available
      // const response = await userAPI.updateProfile(user._id, { availability: newAvailability });
    } catch (error) {
      console.error('Error updating availability:', error);
      toast.error('Failed to update availability');
    }
  };

  const createMedicalRecord = async (patientId, recordData) => {
    try {
      const response = await medicalRecordsAPI.createRecord({
        patient: patientId,
        doctor: user._id,
        ...recordData
      });
      if (response.data.success) {
        toast.success('Medical record created successfully');
        fetchPatientRecords(patientId);
      }
    } catch (error) {
      console.error('Error creating medical record:', error);
      toast.error('Failed to create medical record');
    }
  };
  
  const updateAppointmentStatus = async (appointmentId, status) => {
    try {
      const response = await appointmentAPI.updateStatus(appointmentId, status);
      if (response.data.success) {
        toast.success(`Appointment ${status} successfully`);
        fetchDoctorData();
      }
    } catch (error) {
      console.error('Error updating appointment status:', error);
      toast.error('Failed to update appointment status');
    }
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <UserIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Dr. {user?.firstName} {user?.lastName}
                </h1>
                <p className="text-gray-600">{user?.specialization || 'General Medicine'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => fetchDoctorData()}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowPathIcon className="w-5 h-5" />
              </button>
              <div className="text-right">
                <p className="text-sm text-gray-500">Today</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <CalendarIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Today's Appointments</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.today}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                    <ClockIcon className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Pending</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <CheckCircleIcon className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Completed</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <ChartBarIcon className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Today's Schedule */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Today's Schedule</h2>
                  <span className="text-sm text-gray-500">{todayAppointments.length} appointments</span>
                </div>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {todayAppointments.length > 0 ? (
                    todayAppointments.map((appointment) => (
                      <div key={appointment._id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <UserIcon className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {appointment.patient?.firstName} {appointment.patient?.lastName}
                              </p>
                              <p className="text-sm text-gray-500">{formatTime(appointment.appointmentTime)}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                              {appointment.status}
                            </span>
                            <div className="flex space-x-1">
                              {appointment.status === 'scheduled' && (
                                <button
                                  onClick={() => updateAppointmentStatus(appointment._id, 'confirmed')}
                                  className="p-1 text-green-600 hover:bg-green-100 rounded"
                                  title="Confirm Appointment"
                                >
                                  <CheckCircleIcon className="w-4 h-4" />
                                </button>
                              )}
                              {appointment.status !== 'completed' && (
                                <button
                                  onClick={() => updateAppointmentStatus(appointment._id, 'completed')}
                                  className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                  title="Mark as Completed"
                                >
                                  <DocumentTextIcon className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                        {appointment.chiefComplaint && (
                          <p className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            <strong>Reason:</strong> {appointment.chiefComplaint}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">No appointments scheduled for today</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Upcoming Appointments */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Upcoming Appointments</h2>
                  <button
                    onClick={() => setActiveTab('appointments')}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View All
                  </button>
                </div>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {upcomingAppointments.length > 0 ? (
                    upcomingAppointments.map((appointment) => (
                      <div key={appointment._id} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">
                              {appointment.patient?.firstName} {appointment.patient?.lastName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(appointment.appointmentDate).toLocaleDateString()} at {formatTime(appointment.appointmentTime)}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                            {appointment.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <ClockIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">No upcoming appointments</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">All Appointments</h2>
                <div className="flex space-x-2">
                  <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option value="all">All Status</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <button
                    onClick={() => fetchDoctorData()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <ArrowPathIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {allAppointments.length > 0 ? (
                  allAppointments.map((appointment) => (
                    <div key={appointment._id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <UserIcon className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {appointment.patient?.firstName} {appointment.patient?.lastName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(appointment.appointmentDate).toLocaleDateString()} at {formatTime(appointment.appointmentTime)}
                            </p>
                            <p className="text-xs text-gray-400">{appointment.appointmentType}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                            {appointment.status}
                          </span>
                          <div className="flex space-x-1">
                            {appointment.status === 'scheduled' && (
                              <button
                                onClick={() => updateAppointmentStatus(appointment._id, 'confirmed')}
                                className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                                title="Confirm Appointment"
                              >
                                <CheckCircleIcon className="w-4 h-4" />
                              </button>
                            )}
                            {appointment.status !== 'completed' && (
                              <button
                                onClick={() => updateAppointmentStatus(appointment._id, 'completed')}
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                title="Mark as Completed"
                              >
                                <DocumentTextIcon className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setSelectedPatient(appointment.patient);
                                fetchPatientRecords(appointment.patient._id);
                                setActiveTab('records');
                              }}
                              className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                              title="View Patient Records"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                      {appointment.chiefComplaint && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">
                            <strong>Chief Complaint:</strong> {appointment.chiefComplaint}
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No appointments found</p>
                    <p className="text-gray-400">Appointments will appear here once scheduled</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Patients Tab */}
        {activeTab === 'patients' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Patient Management</h2>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search patients..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                      <UserIcon className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {filteredPatients.length} patients
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((patient) => (
                    <div key={patient._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold">
                            {patient.firstName?.charAt(0)}{patient.lastName?.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {patient.firstName} {patient.lastName}
                          </h3>
                          <p className="text-sm text-gray-500">{patient.email}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex justify-between">
                          <span>Phone:</span>
                          <span>{patient.phone || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Age:</span>
                          <span>
                            {patient.dateOfBirth 
                              ? new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()
                              : 'N/A'
                            }
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Gender:</span>
                          <span className="capitalize">{patient.gender || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedPatient(patient);
                            fetchPatientRecords(patient._id);
                            setActiveTab('records');
                          }}
                          className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          View Records
                        </button>
                        <button
                          onClick={() => {
                            // Navigate to create appointment for this patient
                            navigate('/appointments/book', { state: { selectedPatient: patient } });
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Book Appointment
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <UserIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No patients found</p>
                    <p className="text-gray-400">Patients will appear here after appointments</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Medical Records Tab */}
        {activeTab === 'records' && (
          <div className="space-y-6">
            {selectedPatient ? (
              <>
                {/* Patient Header */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xl font-bold">
                          {selectedPatient.firstName?.charAt(0)}{selectedPatient.lastName?.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                          {selectedPatient.firstName} {selectedPatient.lastName}
                        </h2>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>📧 {selectedPatient.email}</span>
                          <span>📞 {selectedPatient.phone || 'N/A'}</span>
                          <span>🎂 {selectedPatient.dateOfBirth 
                            ? new Date(selectedPatient.dateOfBirth).toLocaleDateString()
                            : 'N/A'
                          }</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('patients')}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      ← Back to Patients
                    </button>
                  </div>
                </div>

                {/* Medical Records */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Medical Records</h3>
                    <button
                      onClick={() => {
                        // Open create record modal
                        const diagnosis = prompt('Enter diagnosis:');
                        const treatment = prompt('Enter treatment:');
                        const notes = prompt('Enter notes:');
                        
                        if (diagnosis && treatment) {
                          createMedicalRecord(selectedPatient._id, {
                            diagnosis,
                            treatment,
                            notes,
                            visitDate: new Date().toISOString()
                          });
                        }
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <PlusIcon className="w-4 h-4 inline mr-2" />
                      Add Record
                    </button>
                  </div>

                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {patientRecords.length > 0 ? (
                      patientRecords.map((record) => (
                        <div key={record._id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <DocumentTextIcon className="w-5 h-5 text-green-600" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">
                                  Dr. {record.doctor?.firstName} {record.doctor?.lastName}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {new Date(record.visitDate || record.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {record.recordType || 'General'}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="font-medium text-gray-700 mb-1">Diagnosis:</p>
                              <p className="text-gray-600">{record.diagnosis || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-700 mb-1">Treatment:</p>
                              <p className="text-gray-600">{record.treatment || 'N/A'}</p>
                            </div>
                          </div>
                          
                          {record.notes && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="font-medium text-gray-700 mb-1">Notes:</p>
                              <p className="text-gray-600 text-sm">{record.notes}</p>
                            </div>
                          )}
                          
                          {record.medications && record.medications.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="font-medium text-gray-700 mb-2">Medications:</p>
                              <div className="flex flex-wrap gap-2">
                                {record.medications.map((med, index) => (
                                  <span key={index} className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                    {med.name} - {med.dosage}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">No medical records found</p>
                        <p className="text-gray-400">Create the first medical record for this patient</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
                <UserIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Select a patient to view medical records</p>
                <button
                  onClick={() => setActiveTab('patients')}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Go to Patients
                </button>
              </div>
            )}
          </div>
        )}

        {/* Availability Tab */}
        {activeTab === 'availability' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Manage Availability</h2>
                <button
                  onClick={() => {
                    const defaultAvailability = {
                      monday: { enabled: true, startTime: '09:00', endTime: '17:00' },
                      tuesday: { enabled: true, startTime: '09:00', endTime: '17:00' },
                      wednesday: { enabled: true, startTime: '09:00', endTime: '17:00' },
                      thursday: { enabled: true, startTime: '09:00', endTime: '17:00' },
                      friday: { enabled: true, startTime: '09:00', endTime: '17:00' },
                      saturday: { enabled: false, startTime: '09:00', endTime: '13:00' },
                      sunday: { enabled: false, startTime: '09:00', endTime: '13:00' }
                    };
                    updateAvailability(defaultAvailability);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Set Default Hours
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Weekly Schedule */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Schedule</h3>
                  <div className="space-y-4">
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                      const dayAvailability = availability[day] || { enabled: false, startTime: '09:00', endTime: '17:00' };
                      return (
                        <div key={day} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={dayAvailability.enabled}
                              onChange={(e) => {
                                const newAvailability = {
                                  ...availability,
                                  [day]: { ...dayAvailability, enabled: e.target.checked }
                                };
                                setAvailability(newAvailability);
                              }}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="font-medium text-gray-900 capitalize w-20">
                              {day}
                            </span>
                          </div>
                          
                          {dayAvailability.enabled && (
                            <div className="flex items-center space-x-2">
                              <input
                                type="time"
                                value={dayAvailability.startTime}
                                onChange={(e) => {
                                  const newAvailability = {
                                    ...availability,
                                    [day]: { ...dayAvailability, startTime: e.target.value }
                                  };
                                  setAvailability(newAvailability);
                                }}
                                className="px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                              <span className="text-gray-500">to</span>
                              <input
                                type="time"
                                value={dayAvailability.endTime}
                                onChange={(e) => {
                                  const newAvailability = {
                                    ...availability,
                                    [day]: { ...dayAvailability, endTime: e.target.value }
                                  };
                                  setAvailability(newAvailability);
                                }}
                                className="px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            </div>
                          )}
                          
                          {!dayAvailability.enabled && (
                            <span className="text-gray-400 text-sm">Not Available</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => updateAvailability(availability)}
                    className="mt-6 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Save Availability
                  </button>
                </div>

                {/* Current Week Overview */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">This Week's Schedule</h3>
                  <div className="space-y-3">
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day, index) => {
                      const dayAvailability = availability[day] || { enabled: false };
                      const dayAppointments = todayAppointments.filter(apt => {
                        const aptDay = new Date(apt.appointmentDate).getDay();
                        return aptDay === (index + 1) % 7;
                      });
                      
                      return (
                        <div key={day} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900 capitalize">{day}</span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              dayAvailability.enabled 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {dayAvailability.enabled ? 'Available' : 'Off'}
                            </span>
                          </div>
                          
                          {dayAvailability.enabled && (
                            <div className="text-sm text-gray-600">
                              <p>Hours: {dayAvailability.startTime} - {dayAvailability.endTime}</p>
                              <p>Appointments: {dayAppointments.length}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Appointment Slots Preview */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Time Slots (Today)</h3>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {(() => {
                  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                  const todayAvailability = availability[today];
                  
                  if (!todayAvailability?.enabled) {
                    return (
                      <div className="col-span-full text-center py-8 text-gray-500">
                        No availability set for today
                      </div>
                    );
                  }
                  
                  const slots = [];
                  const startHour = parseInt(todayAvailability.startTime.split(':')[0]);
                  const endHour = parseInt(todayAvailability.endTime.split(':')[0]);
                  
                  for (let hour = startHour; hour < endHour; hour++) {
                    for (let minute = 0; minute < 60; minute += 15) {
                      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                      const isBooked = todayAppointments.some(apt => apt.appointmentTime === timeString);
                      
                      slots.push(
                        <div
                          key={timeString}
                          className={`p-2 text-xs text-center rounded border ${
                            isBooked 
                              ? 'bg-red-100 border-red-300 text-red-700' 
                              : 'bg-green-100 border-green-300 text-green-700'
                          }`}
                        >
                          {timeString}
                        </div>
                      );
                    }
                  }
                  
                  return slots;
                })()}
              </div>
              
              <div className="mt-4 flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                  <span className="text-gray-600">Available</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
                  <span className="text-gray-600">Booked</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
                <button
                  onClick={() => {
                    // Mark all as read
                    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                    toast.success('All notifications marked as read');
                  }}
                  className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Mark All Read
                </button>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {/* Mock notifications for demonstration */}
                {[
                  {
                    id: 1,
                    type: 'appointment',
                    title: 'New Appointment Booked',
                    message: 'John Doe has booked an appointment for tomorrow at 2:00 PM',
                    time: '2 minutes ago',
                    read: false
                  },
                  {
                    id: 2,
                    type: 'cancellation',
                    title: 'Appointment Cancelled',
                    message: 'Sarah Smith cancelled her appointment scheduled for today',
                    time: '1 hour ago',
                    read: false
                  },
                  {
                    id: 3,
                    type: 'reminder',
                    title: 'Schedule Reminder',
                    message: 'You have 3 appointments scheduled for tomorrow',
                    time: '3 hours ago',
                    read: true
                  },
                  {
                    id: 4,
                    type: 'system',
                    title: 'System Update',
                    message: 'New features have been added to the patient management system',
                    time: '1 day ago',
                    read: true
                  }
                ].map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border rounded-lg transition-colors ${
                      notification.read 
                        ? 'border-gray-200 bg-white' 
                        : 'border-blue-200 bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          notification.type === 'appointment' ? 'bg-green-100' :
                          notification.type === 'cancellation' ? 'bg-red-100' :
                          notification.type === 'reminder' ? 'bg-yellow-100' :
                          'bg-blue-100'
                        }`}>
                          {notification.type === 'appointment' && <CalendarIcon className="w-5 h-5 text-green-600" />}
                          {notification.type === 'cancellation' && <XCircleIcon className="w-5 h-5 text-red-600" />}
                          {notification.type === 'reminder' && <ClockIcon className="w-5 h-5 text-yellow-600" />}
                          {notification.type === 'system' && <BellIcon className="w-5 h-5 text-blue-600" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold text-gray-900">{notification.title}</h4>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm mt-1">{notification.message}</p>
                          <p className="text-gray-400 text-xs mt-2">{notification.time}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {!notification.read && (
                          <button
                            onClick={() => {
                              // Mark as read
                              toast.success('Notification marked as read');
                            }}
                            className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                            title="Mark as read"
                          >
                            <CheckCircleIcon className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                          title="Delete notification"
                        >
                          <XCircleIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Notification Settings */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">New Appointments</span>
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Appointment Cancellations</span>
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Schedule Reminders</span>
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">System Updates</span>
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ChatBot */}
      <ChatBot />
    </div>
  );
};

export default DoctorDashboardEnhanced;
