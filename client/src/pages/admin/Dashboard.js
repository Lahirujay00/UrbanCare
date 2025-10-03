import React, { useState } from 'react';
import {
  UserIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  CogIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  UsersIcon,
  DocumentTextIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data for demonstration
  const stats = [
    {
      title: 'Total Users',
      value: '2,847',
      change: '+12.5%',
      changeType: 'increase',
      icon: UsersIcon,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Active Appointments',
      value: '156',
      change: '+8.2%',
      changeType: 'increase',
      icon: CalendarIcon,
      color: 'from-green-500 to-teal-600'
    },
    {
      title: 'Monthly Revenue',
      value: '$24,580',
      change: '+15.3%',
      changeType: 'increase',
      icon: CurrencyDollarIcon,
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'System Health',
      value: '98.5%',
      change: '+0.2%',
      changeType: 'increase',
      icon: ShieldCheckIcon,
      color: 'from-emerald-500 to-emerald-600'
    }
  ];

  const recentActivities = [
    {
      id: 1,
      type: 'user_registration',
      message: 'New patient registered: Sarah Johnson',
      time: '2 minutes ago',
      icon: UserIcon,
      color: 'text-blue-600'
    },
    {
      id: 2,
      type: 'appointment_booked',
      message: 'Appointment scheduled for Dr. Smith',
      time: '15 minutes ago',
      icon: CalendarIcon,
      color: 'text-green-600'
    },
    {
      id: 3,
      type: 'system_update',
      message: 'System backup completed successfully',
      time: '1 hour ago',
      icon: ShieldCheckIcon,
      color: 'text-purple-600'
    },
    {
      id: 4,
      type: 'payment_processed',
      message: 'Payment of $150 processed',
      time: '2 hours ago',
      icon: CurrencyDollarIcon,
      color: 'text-emerald-600'
    }
  ];

  const systemAlerts = [
    {
      id: 1,
      type: 'warning',
      message: 'Server CPU usage above 80%',
      time: '5 minutes ago',
      severity: 'medium'
    },
    {
      id: 2,
      type: 'info',
      message: 'Database maintenance scheduled for tonight',
      time: '1 hour ago',
      severity: 'low'
    }
  ];

  const recentUsers = [
    {
      id: 1,
      name: 'Dr. Michael Chen',
      role: 'Doctor',
      email: 'm.chen@urbancare.com',
      status: 'active',
      joinDate: '2024-01-15'
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      role: 'Patient',
      email: 'sarah.j@email.com',
      status: 'active',
      joinDate: '2024-01-14'
    },
    {
      id: 3,
      name: 'Admin User',
      role: 'Administrator',
      email: 'admin@urbancare.com',
      status: 'active',
      joinDate: '2024-01-10'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role) => {
    switch (role.toLowerCase()) {
      case 'administrator':
        return 'bg-purple-100 text-purple-800';
      case 'doctor':
        return 'bg-blue-100 text-blue-800';
      case 'patient':
        return 'bg-green-100 text-green-800';
      case 'staff':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Monitor and manage your healthcare system</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    <div className="flex items-center mt-2">
                      {stat.changeType === 'increase' ? (
                        <ArrowUpIcon className="w-4 h-4 text-green-500 mr-1" />
                      ) : (
                        <ArrowDownIcon className="w-4 h-4 text-red-500 mr-1" />
                      )}
                      <span className={`text-sm font-medium ${
                        stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stat.change}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">vs last month</span>
                    </div>
                  </div>
                  <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column - Activities & Users */}
          <div className="lg:col-span-2 space-y-8">

            {/* Recent Activities */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900">Recent Activities</h2>
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    View All
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentActivities.map((activity) => {
                    const Icon = activity.icon;
                    return (
                      <div key={activity.id} className="flex items-start space-x-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.color.replace('text-', 'bg-').replace('-600', '-100')}`}>
                          <Icon className={`w-5 h-5 ${activity.color}`} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Recent Users */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900">Recent Users</h2>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm">
                    Manage Users
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <UserIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{user.name}</h3>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                              {user.role}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                              {user.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors">
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors">
                          <PencilIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - System Status & Quick Actions */}
          <div className="space-y-8">

            {/* System Status */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">System Status</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Database</span>
                    <div className="flex items-center space-x-2">
                      <CheckCircleIcon className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600">Healthy</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">API Server</span>
                    <div className="flex items-center space-x-2">
                      <CheckCircleIcon className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600">Online</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Email Service</span>
                    <div className="flex items-center space-x-2">
                      <CheckCircleIcon className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600">Active</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Backup Status</span>
                    <div className="flex items-center space-x-2">
                      <ClockIcon className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-yellow-600">In Progress</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* System Alerts */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">System Alerts</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {systemAlerts.map((alert) => (
                    <div key={alert.id} className="p-4 rounded-xl border border-gray-100">
                      <div className="flex items-start space-x-3">
                        <ExclamationTriangleIcon className={`w-5 h-5 mt-0.5 ${
                          alert.severity === 'high' ? 'text-red-500' :
                          alert.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{alert.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium">
                    <UserIcon className="w-4 h-4 mr-2" />
                    Add New User
                  </button>
                  <button className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium">
                    <CogIcon className="w-4 h-4 mr-2" />
                    System Settings
                  </button>
                  <button className="w-full flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium">
                    <ChartBarIcon className="w-4 h-4 mr-2" />
                    Generate Report
                  </button>
                  <button className="w-full flex items-center justify-center px-4 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors font-medium">
                    <ShieldCheckIcon className="w-4 h-4 mr-2" />
                    Security Audit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;