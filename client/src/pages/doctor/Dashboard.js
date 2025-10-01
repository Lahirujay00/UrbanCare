import React, { useState } from 'react';
import { 
  CalendarIcon, 
  UserGroupIcon,
  DocumentTextIcon, 
  ClockIcon,
  BellIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PencilIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  HeartIcon,
  PlusIcon,
  ArrowRightIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Mock data - in real app, this would come from API
  const todayAppointments = [
    {
      id: 1,
      patient: 'Sarah Johnson',
      age: 28,
      time: '9:00 AM',
      type: 'Consultation',
      status: 'confirmed',
      reason: 'Chest pain and shortness of breath',
      phone: '+1 (555) 123-4567',
      bloodType: 'O+',
      allergies: ['Penicillin'],
      lastVisit: '2024-11-15'
    },
    {
      id: 2,
      patient: 'Michael Chen',
      age: 45,
      time: '10:30 AM',
      type: 'Follow-up',
      status: 'in-progress',
      reason: 'Diabetes management review',
      phone: '+1 (555) 987-6543',
      bloodType: 'A+',
      allergies: ['None'],
      lastVisit: '2024-10-20'
    },
    {
      id: 3,
      patient: 'Emily Rodriguez',
      age: 32,
      time: '2:00 PM',
      type: 'Consultation',
      status: 'pending',
      reason: 'Annual health checkup',
      phone: '+1 (555) 456-7890',
      bloodType: 'B-',
      allergies: ['Shellfish', 'Latex'],
      lastVisit: '2023-12-01'
    },
    {
      id: 4,
      patient: 'David Wilson',
      age: 52,
      time: '3:30 PM',
      type: 'Emergency',
      status: 'urgent',
      reason: 'Acute abdominal pain',
      phone: '+1 (555) 321-0987',
      bloodType: 'AB+',
      allergies: ['Aspirin'],
      lastVisit: 'New Patient'
    }
  ];

  const recentPatients = [
    {
      id: 1,
      name: 'John Smith',
      lastVisit: '2025-01-02',
      condition: 'Hypertension',
      status: 'stable',
      nextAppointment: '2025-01-15'
    },
    {
      id: 2,
      name: 'Lisa Anderson',
      lastVisit: '2025-01-01',
      condition: 'Diabetes Type 2',
      status: 'needs-attention',
      nextAppointment: '2025-01-08'
    },
    {
      id: 3,
      name: 'Robert Brown',
      lastVisit: '2024-12-30',
      condition: 'Post-surgical follow-up',
      status: 'recovering',
      nextAppointment: '2025-01-10'
    }
  ];

  const notifications = [
    {
      id: 1,
      message: 'Lab results ready for Sarah Johnson',
      time: '30 minutes ago',
      type: 'lab-results',
      urgent: false
    },
    {
      id: 2,
      message: 'Emergency consultation requested',
      time: '1 hour ago',
      type: 'emergency',
      urgent: true
    },
    {
      id: 3,
      message: 'Patient medication refill approved',
      time: '2 hours ago',
      type: 'medication',
      urgent: false
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPatientStatusColor = (status) => {
    switch (status) {
      case 'stable': return 'text-green-600';
      case 'needs-attention': return 'text-red-600';
      case 'recovering': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        
        {/* Enhanced Welcome Section */}
        <div className="mb-8 bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, Dr. {user?.lastName || 'Doctor'}! 👨‍⚕️
              </h1>
              <p className="text-green-100 text-lg">
                Today is {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <div className="mt-4 flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <UserGroupIcon className="w-5 h-5 text-green-200" />
                  <span className="text-green-100">Patients Today: {todayAppointments.length}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ClockIcon className="w-5 h-5 text-green-200" />
                  <span className="text-green-100">Next: {todayAppointments[0]?.time || 'No appointments'}</span>
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

        {/* Enhanced Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900 mb-1">{todayAppointments.length}</p>
                <p className="text-gray-600 text-sm font-medium">Today's Appointments</p>
                <p className="text-xs text-green-600 mt-1">
                  {todayAppointments.filter(apt => apt.status === 'confirmed').length} confirmed
                </p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                <CalendarIcon className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900 mb-1">{recentPatients.length}</p>
                <p className="text-gray-600 text-sm font-medium">Active Patients</p>
                <p className="text-xs text-blue-600 mt-1">
                  {recentPatients.filter(p => p.status === 'needs-attention').length} need attention
                </p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <UserGroupIcon className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900 mb-1">24</p>
                <p className="text-gray-600 text-sm font-medium">Records Updated</p>
                <p className="text-xs text-purple-600 mt-1">This week</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <DocumentTextIcon className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900 mb-1">{notifications.length}</p>
                <p className="text-gray-600 text-sm font-medium">New Notifications</p>
                <p className="text-xs text-orange-600 mt-1">
                  {notifications.filter(n => n.urgent).length} urgent
                </p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                <BellIcon className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          
          {/* Today's Appointments */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                      <CalendarIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Today's Schedule</h2>
                      <p className="text-sm text-gray-500">
                        {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="p-6">
                {todayAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {todayAppointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="bg-gradient-to-r from-gray-50 to-green-50 border border-gray-200 p-6 rounded-2xl hover:shadow-lg transition-all duration-300"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4 flex-1">
                            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                              <UserIcon className="w-8 h-8 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="text-lg font-bold text-gray-900">{appointment.patient}</h3>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(appointment.status)}`}>
                                  {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <ClockIcon className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm text-gray-600">{appointment.time} • {appointment.type}</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <UserIcon className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm text-gray-600">Age: {appointment.age} • Blood Type: {appointment.bloodType}</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <PhoneIcon className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm text-gray-600">{appointment.phone}</span>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <ExclamationTriangleIcon className="w-4 h-4 text-orange-500" />
                                    <span className="text-sm text-gray-600">
                                      Allergies: {appointment.allergies.join(', ') || 'None'}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <CalendarIcon className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm text-gray-600">Last Visit: {appointment.lastVisit}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="bg-white/70 p-3 rounded-lg mb-3">
                                <p className="text-sm text-gray-700">
                                  <strong>Reason:</strong> {appointment.reason}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col space-y-2 ml-4">
                            <button className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium shadow-md flex items-center space-x-2">
                              <EyeIcon className="w-4 h-4" />
                              <span>View</span>
                            </button>
                            <button className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-md flex items-center space-x-2">
                              <PencilIcon className="w-4 h-4" />
                              <span>Update</span>
                            </button>
                            {appointment.status === 'pending' && (
                              <button className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium shadow-md flex items-center space-x-2">
                                <CheckCircleIcon className="w-4 h-4" />
                                <span>Confirm</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CalendarIcon className="w-12 h-12 text-green-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No appointments today</h3>
                    <p className="text-gray-500">Enjoy your free time or catch up on patient records</p>
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
                  <a
                    href="/doctor/appointments"
                    className="group flex items-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-2xl hover:from-green-100 hover:to-green-200 transition-all duration-300 transform hover:scale-105"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                      <CalendarIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="font-semibold text-green-900">Manage Appointments</h3>
                      <p className="text-xs text-green-700">View and update schedule</p>
                    </div>
                    <ArrowRightIcon className="w-5 h-5 text-green-600 group-hover:translate-x-1 transition-transform" />
                  </a>
                  
                  <a
                    href="/doctor/patient-records"
                    className="group flex items-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl hover:from-blue-100 hover:to-blue-200 transition-all duration-300 transform hover:scale-105"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                      <DocumentTextIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="font-semibold text-blue-900">Patient Records</h3>
                      <p className="text-xs text-blue-700">Access medical histories</p>
                    </div>
                    <ArrowRightIcon className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
                  </a>
                  
                  <button className="group w-full flex items-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl hover:from-purple-100 hover:to-purple-200 transition-all duration-300 transform hover:scale-105">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                      <PlusIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="ml-4 flex-1 text-left">
                      <h3 className="font-semibold text-purple-900">Add Note</h3>
                      <p className="text-xs text-purple-700">Quick patient note</p>
                    </div>
                    <ArrowRightIcon className="w-5 h-5 text-purple-600 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Patients */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center">
                    <UserGroupIcon className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Recent Patients</h2>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentPatients.map((patient) => (
                    <div key={patient.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-teal-50 rounded-xl hover:from-gray-100 hover:to-teal-100 transition-all duration-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center">
                          <UserIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{patient.name}</p>
                          <p className="text-xs text-gray-500">{patient.condition}</p>
                          <p className={`text-xs font-medium ${getPatientStatusColor(patient.status)}`}>
                            {patient.status.replace('-', ' ').toUpperCase()}
                          </p>
                        </div>
                      </div>
                      <button className="text-teal-600 hover:text-teal-700 p-2">
                        <EyeIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                      <BellIcon className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">Notifications</h2>
                  </div>
                  <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded-full">
                    {notifications.length}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="flex items-start space-x-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:from-gray-100 hover:to-gray-200 transition-all duration-200">
                      <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${
                        notification.urgent ? 'bg-red-500' :
                        notification.type === 'lab-results' ? 'bg-green-500' :
                        notification.type === 'medication' ? 'bg-blue-500' : 'bg-orange-500'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 mb-1">{notification.message}</p>
                        <div className="flex items-center space-x-2">
                          <ClockIcon className="w-3 h-3 text-gray-400" />
                          <p className="text-xs text-gray-500">{notification.time}</p>
                          {notification.urgent && (
                            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                              URGENT
                            </span>
                          )}
                        </div>
                      </div>
                      <button className="text-gray-600 hover:text-gray-700 p-1">
                        <EyeIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;