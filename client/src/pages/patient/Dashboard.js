import React from 'react';
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
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';

const PatientDashboard = () => {
  const { user } = useAuth();

  // Mock data - in real app, this would come from API
  const upcomingAppointments = [
    {
      id: 1,
      doctor: 'Dr. Sarah Johnson',
      specialization: 'Cardiology',
      date: '2025-01-05',
      time: '2:00 PM',
      type: 'Follow-up'
    },
    {
      id: 2,
      doctor: 'Dr. Michael Chen',
      specialization: 'General Medicine',
      date: '2025-01-12',
      time: '10:30 AM',
      type: 'Consultation'
    }
  ];

  // Removed unused recentRecords - data now comes from notifications

  const notifications = [
    {
      id: 1,
      message: 'Your appointment with Dr. Johnson is confirmed for Jan 5, 2025',
      time: '2 hours ago',
      type: 'appointment'
    },
    {
      id: 2,
      message: 'New lab results are available',
      time: '1 day ago',
      type: 'results'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                  <span className="text-blue-100">Health Score: 85/100</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ClockIcon className="w-5 h-5 text-blue-200" />
                  <span className="text-blue-100">Last Visit: Dec 20, 2024</span>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900 mb-1">2</p>
                <p className="text-gray-600 text-sm font-medium">Upcoming Appointments</p>
                <p className="text-xs text-green-600 mt-1">Next: Jan 5</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <CalendarIcon className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900 mb-1">12</p>
                <p className="text-gray-600 text-sm font-medium">Medical Records</p>
                <p className="text-xs text-blue-600 mt-1">2 recent updates</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                <DocumentTextIcon className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-green-600 mb-1">85%</p>
                <p className="text-gray-600 text-sm font-medium">Health Score</p>
                <p className="text-xs text-green-600 mt-1">Excellent</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <HeartIcon className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900 mb-1">3</p>
                <p className="text-gray-600 text-sm font-medium">New Notifications</p>
                <p className="text-xs text-orange-600 mt-1">1 urgent</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                <BellIcon className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>

      </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upcoming Appointments */}
          <div className="lg:col-span-2">
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
                  <a
                    href="/patient/appointment-booking"
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-lg font-medium"
                  >
                    <PlusIcon className="w-4 h-4" />
                    <span>Book New</span>
                  </a>
                </div>
              </div>
              <div className="p-6">
                {upcomingAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingAppointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-6 rounded-2xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                              <HeartIcon className="w-8 h-8 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-900 mb-1">
                                {appointment.doctor}
                              </h3>
                              <p className="text-sm text-blue-700 font-medium mb-1">
                                {appointment.specialization} • {appointment.type}
                              </p>
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                  <CalendarIcon className="w-4 h-4 text-gray-500" />
                                  <span className="text-sm text-gray-600">{appointment.date}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <ClockIcon className="w-4 h-4 text-gray-500" />
                                  <span className="text-sm text-gray-600">{appointment.time}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col space-y-2">
                            <button className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-md">
                              Reschedule
                            </button>
                            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium">
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
                    <a
                      href="/patient/appointment-booking"
                      className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-lg font-medium"
                    >
                      <PlusIcon className="w-5 h-5" />
                      <span>Book Your First Appointment</span>
                    </a>
                  </div>
                )}
              </div>
          </div>
        </div>

          {/* Sidebar */}
          <div className="space-y-6">
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
                    href="/patient/appointment-booking"
                    className="group flex items-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl hover:from-blue-100 hover:to-blue-200 transition-all duration-300 transform hover:scale-105"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                      <CalendarIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="font-semibold text-blue-900">Book Appointment</h3>
                      <p className="text-xs text-blue-700">Schedule with doctors</p>
                    </div>
                    <ArrowRightIcon className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
                  </a>
                  
                  <a
                    href="/patient/medical-records"
                    className="group flex items-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-2xl hover:from-green-100 hover:to-green-200 transition-all duration-300 transform hover:scale-105"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                      <DocumentTextIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="font-semibold text-green-900">Medical Records</h3>
                      <p className="text-xs text-green-700">View health history</p>
                    </div>
                    <ArrowRightIcon className="w-5 h-5 text-green-600 group-hover:translate-x-1 transition-transform" />
                  </a>
                  
                  <a
                    href="/patient/digital-health-card"
                    className="group flex items-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl hover:from-purple-100 hover:to-purple-200 transition-all duration-300 transform hover:scale-105"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                      <HeartIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="font-semibold text-purple-900">Digital Health Card</h3>
                      <p className="text-xs text-purple-700">Access health ID</p>
                    </div>
                    <ArrowRightIcon className="w-5 h-5 text-purple-600 group-hover:translate-x-1 transition-transform" />
                  </a>
                  
                  <a
                    href="/patient/profile"
                    className="group flex items-center p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-2xl hover:from-orange-100 hover:to-orange-200 transition-all duration-300 transform hover:scale-105"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                      <UserIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="font-semibold text-orange-900">Profile Settings</h3>
                      <p className="text-xs text-orange-700">Manage account</p>
                    </div>
                    <ArrowRightIcon className="w-5 h-5 text-orange-600 group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
              </div>
            </div>

            {/* Recent Notifications */}
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
                {notifications.length > 0 ? (
                  <div className="space-y-4">
                    {notifications.map((notification) => (
                      <div key={notification.id} className="flex items-start space-x-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:from-gray-100 hover:to-gray-200 transition-all duration-200">
                        <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${
                          notification.type === 'appointment' ? 'bg-blue-500' :
                          notification.type === 'results' ? 'bg-green-500' : 'bg-orange-500'
                        }`}></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 mb-1">{notification.message}</p>
                          <div className="flex items-center space-x-2">
                            <ClockIcon className="w-3 h-3 text-gray-400" />
                            <p className="text-xs text-gray-500">{notification.time}</p>
                          </div>
                        </div>
                        <button className="text-blue-600 hover:text-blue-700 p-1">
                          <EyeIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BellIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-sm">No new notifications</p>
                  </div>
                )}
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;