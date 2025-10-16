import React, { useState, useEffect } from 'react';
import { 
  CalendarIcon, 
  ClockIcon,
  UserIcon,
  PhoneIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  EyeIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import { appointmentAPI } from '../../services/api';
import toast from 'react-hot-toast';

const Appointments = () => {
  const { user } = useAuth();
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'week', 'specific'
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [appointmentNotes, setAppointmentNotes] = useState('');
  const [prescription, setPrescription] = useState({ medications: [], instructions: '' });
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?._id) {
      fetchAppointments();
    }
  }, [user]);

  const fetchAppointments = async () => {
    if (!user?._id) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch doctor's appointments using the same API as dashboard
      const response = await appointmentAPI.getDoctorAppointments(user._id);
      
      if (response.data.success) {
        const allAppointments = response.data.data?.appointments || [];
        setAppointments(allAppointments);
      } else {
        setError('Failed to fetch appointments');
        setAppointments([]); // Ensure appointments is always an array
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError('Failed to fetch appointments');
      setAppointments([]); // Ensure appointments is always an array
      toast.error('Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };


  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredAppointments = (appointments || []).filter(appointment => {
    const appointmentDate = new Date(appointment.appointmentDate);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const appointmentDateStr = appointmentDate.toISOString().split('T')[0];
    
    // Date filtering logic - now includes past appointments
    let matchesDate = true;
    if (dateFilter === 'today') {
      matchesDate = appointmentDateStr === todayStr;
    } else if (dateFilter === 'week') {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay()); // Start of current week
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6); // End of current week
      matchesDate = appointmentDate >= weekStart && appointmentDate <= weekEnd;
    } else if (dateFilter === 'specific') {
      matchesDate = appointmentDateStr === selectedDate;
    }
    // If dateFilter === 'all', matchesDate remains true (shows ALL appointments including past ones)
    
    const matchesStatus = filterStatus === 'all' || appointment.status === filterStatus;
    
    // Get patient name from populated patient field
    const patientName = appointment.patient ? 
      `${appointment.patient.firstName} ${appointment.patient.lastName}` : 
      'Unknown Patient';
    
    const matchesSearch = patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (appointment.chiefComplaint && appointment.chiefComplaint.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesDate && matchesStatus && matchesSearch;
  }).sort((a, b) => {
    // Sort by date and time, most recent first
    const dateA = new Date(a.appointmentDate + 'T' + a.appointmentTime);
    const dateB = new Date(b.appointmentDate + 'T' + b.appointmentTime);
    return dateB - dateA;
  });

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      // Update appointment status via API
      const response = await appointmentAPI.updateStatus(appointmentId, newStatus);
      if (response.data.success) {
        toast.success(`Appointment ${newStatus} successfully`);
        fetchAppointments(); // Refresh the list
      }
    } catch (error) {
      console.error('Error updating appointment status:', error);
      toast.error('Failed to update appointment status');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Appointment Management</h1>
          <p className="text-gray-600">Manage your patient appointments and schedule</p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            
            {/* Date Filter Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="all">All Appointments (including past)</option>
                  <option value="today">Today Only</option>
                  <option value="week">This Week</option>
                  <option value="specific">Specific Date</option>
                </select>
              </div>
            </div>

            {/* Specific Date Picker (only show when specific date is selected) */}
            {dateFilter === 'specific' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            )}

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
              <div className="relative">
                <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Patients</label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by patient name or reason..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Refresh Button */}
            <div className="flex items-end">
              <button
                onClick={fetchAppointments}
                disabled={loading}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Results Summary */}
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing {filteredAppointments.length} of {appointments.length} appointments
              {dateFilter === 'today' && ' for today'}
              {dateFilter === 'week' && ' for this week'}
              {dateFilter === 'specific' && ` for ${new Date(selectedDate).toLocaleDateString()}`}
              {dateFilter === 'all' && ' (all dates)'}
            </span>
            <button
              onClick={() => {
                setDateFilter('all');
                setSelectedDate(new Date().toISOString().split('T')[0]);
                setFilterStatus('all');
                setSearchTerm('');
              }}
              className="text-green-600 hover:text-green-700 font-medium"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
            <div className="animate-pulse">
              <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-48 mx-auto mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
            <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Appointments</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchAppointments}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Appointments List */}
        {!loading && !error && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
            {filteredAppointments.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {filteredAppointments.map((appointment, index) => {
                  const patientName = appointment.patient ? 
                    `${appointment.patient.firstName} ${appointment.patient.lastName}` : 
                    'Unknown Patient';
                  
                  return (
                    <div key={appointment._id} className={`p-6 ${index === 0 ? 'rounded-t-2xl' : ''} ${index === filteredAppointments.length - 1 ? 'rounded-b-2xl' : ''} hover:bg-gray-50 transition-colors duration-200`}>
                      <div className="flex items-start justify-between">
                    
                    {/* Patient Info */}
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <UserIcon className="w-8 h-8 text-white" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="text-xl font-bold text-gray-900">{patientName}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(appointment.status)}`}>
                            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <ClockIcon className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-600">
                                {new Date(appointment.appointmentDate).toLocaleDateString()} at {appointment.appointmentTime}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <UserIcon className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-600">
                                Type: {appointment.appointmentType || 'Consultation'}
                              </span>
                            </div>
                            {appointment.patient?.phone && (
                              <div className="flex items-center space-x-2">
                                <PhoneIcon className="w-4 h-4 text-gray-500" />
                                <span className="text-sm text-gray-600">{appointment.patient.phone}</span>
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-700">Fee:</span>
                              <span className="text-sm text-green-600 font-semibold">
                                ${appointment.consultationFee || 0}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-700">Payment:</span>
                              <span className={`text-sm font-medium ${
                                appointment.paymentStatus === 'paid' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {appointment.paymentStatus || 'pending'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {appointment.chiefComplaint && (
                          <div className="bg-gradient-to-r from-gray-50 to-green-50 p-4 rounded-xl mb-4">
                            <p className="text-sm text-gray-700 mb-2">
                              <strong>Chief Complaint:</strong>
                            </p>
                            <p className="text-sm text-gray-800">{appointment.chiefComplaint}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                        {/* Action Buttons */}
                        <div className="flex flex-col space-y-2 ml-4">
                          <button
                            onClick={() => {
                              setSelectedAppointment(appointment);
                              setShowDetailModal(true);
                              setAppointmentNotes(appointment.notes || '');
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <EyeIcon className="w-5 h-5" />
                          </button>
                          
                          {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(appointment._id, 'confirmed')}
                                className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                                title="Confirm"
                              >
                                <CheckCircleIcon className="w-5 h-5" />
                              </button>
                              
                              <button
                                onClick={() => handleStatusChange(appointment._id, 'cancelled')}
                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                title="Cancel"
                              >
                                <XCircleIcon className="w-5 h-5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CalendarIcon className="w-12 h-12 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No appointments found</h3>
                <p className="text-gray-500 mb-6">No appointments match your current filters for the selected date.</p>
                <button 
                  onClick={() => {
                    setSelectedDate(new Date().toISOString().split('T')[0]);
                    setFilterStatus('all');
                    setSearchTerm('');
                  }}
                  className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Appointment Detail Modal */}
        {showDetailModal && selectedAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedAppointment.patient ? 
                        `${selectedAppointment.patient.firstName} ${selectedAppointment.patient.lastName}` : 
                        'Unknown Patient'}
                    </h2>
                    <p className="text-gray-600">
                      {new Date(selectedAppointment.appointmentDate).toLocaleDateString()} at {selectedAppointment.appointmentTime}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XCircleIcon className="w-6 h-6 text-gray-500" />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Patient Information */}
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl">
                      <h3 className="font-semibold text-blue-900 mb-3">Patient Details</h3>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium">Age:</span> {selectedAppointment.patient?.age || 'N/A'}</p>
                        <p><span className="font-medium">Blood Type:</span> {selectedAppointment.patient?.bloodType || 'N/A'}</p>
                        <p><span className="font-medium">Phone:</span> {selectedAppointment.patient?.phone || 'N/A'}</p>
                        <p><span className="font-medium">Insurance:</span> {selectedAppointment.patient?.insurance || 'N/A'}</p>
                        <p><span className="font-medium">Emergency Contact:</span> {selectedAppointment.patient?.emergencyContact || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-xl">
                      <h3 className="font-semibold text-red-900 mb-3">Allergies & Warnings</h3>
                      <div className="flex flex-wrap gap-2">
                        {(selectedAppointment.patient?.allergies || []).map((allergy, index) => (
                          <span key={index} className="px-3 py-1 bg-red-200 text-red-800 text-sm font-medium rounded-full">
                            {allergy}
                          </span>
                        ))}
                        {(!selectedAppointment.patient?.allergies || selectedAppointment.patient.allergies.length === 0) && (
                          <span className="text-sm text-gray-500 italic">No known allergies</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl">
                      <h3 className="font-semibold text-green-900 mb-3">Current Vitals</h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="text-center p-2 bg-white rounded-lg">
                          <div className="font-bold text-red-600">{selectedAppointment.vitals?.bp}</div>
                          <div className="text-xs text-gray-600">Blood Pressure</div>
                        </div>
                        <div className="text-center p-2 bg-white rounded-lg">
                          <div className="font-bold text-blue-600">{selectedAppointment.vitals?.hr}</div>
                          <div className="text-xs text-gray-600">Heart Rate</div>
                        </div>
                        <div className="text-center p-2 bg-white rounded-lg">
                          <div className="font-bold text-yellow-600">{selectedAppointment.vitals?.temp}</div>
                          <div className="text-xs text-gray-600">Temperature</div>
                        </div>
                        <div className="text-center p-2 bg-white rounded-lg">
                          <div className="font-bold text-green-600">{selectedAppointment.vitals?.weight}</div>
                          <div className="text-xs text-gray-600">Weight</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Medical Information */}
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl">
                      <h3 className="font-semibold text-purple-900 mb-3">Appointment Details</h3>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium">Type:</span> {selectedAppointment.appointmentType || 'Consultation'}</p>
                        <p><span className="font-medium">Reason:</span> {selectedAppointment.chiefComplaint || 'N/A'}</p>
                        <p><span className="font-medium">Status:</span> 
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusColor(selectedAppointment.status)}`}>
                            {selectedAppointment.status.replace('-', ' ').toUpperCase()}
                          </span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-xl">
                      <h3 className="font-semibold text-orange-900 mb-3">Current Medications</h3>
                      <div className="space-y-1">
                        {selectedAppointment.patient?.currentMedications?.map((med, index) => (
                          <div key={index} className="text-sm bg-white p-2 rounded-lg">{med}</div>
                        )) || <div className="text-sm text-gray-500 italic">No current medications</div>}
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-teal-50 to-teal-100 p-4 rounded-xl">
                      <h3 className="font-semibold text-teal-900 mb-3">Recent Lab Results</h3>
                      <div className="space-y-1">
                        {selectedAppointment.patient?.labResults?.map((result, index) => (
                          <div key={index} className="text-sm bg-white p-2 rounded-lg">{result}</div>
                        )) || <div className="text-sm text-gray-500 italic">No recent lab results</div>}
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl">
                      <h3 className="font-semibold text-gray-900 mb-3">Appointment Notes</h3>
                      <textarea
                        value={appointmentNotes}
                        onChange={(e) => setAppointmentNotes(e.target.value)}
                        placeholder="Add notes for this appointment..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                        rows={4}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="px-6 py-2 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors font-medium"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setShowPrescriptionModal(true);
                      setShowDetailModal(false);
                    }}
                    className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                  >
                    Add Prescription
                  </button>
                  <button
                    onClick={() => {
                      console.log('Saving appointment notes:', appointmentNotes);
                      setShowDetailModal(false);
                    }}
                    className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
                  >
                    Save Notes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Prescription Modal */}
        {showPrescriptionModal && selectedAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">
                    New Prescription - {selectedAppointment.patient ? 
                      `${selectedAppointment.patient.firstName} ${selectedAppointment.patient.lastName}` : 
                      'Unknown Patient'}
                  </h2>
                  <button
                    onClick={() => setShowPrescriptionModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XCircleIcon className="w-6 h-6 text-gray-500" />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Medications</label>
                    <div className="space-y-3">
                      <div className="flex space-x-3">
                        <input
                          type="text"
                          placeholder="Medication name"
                          className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                        <input
                          type="text"
                          placeholder="Dosage"
                          className="w-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                        <input
                          type="text"
                          placeholder="Frequency"
                          className="w-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                          <PlusIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Special Instructions</label>
                    <textarea
                      value={prescription.instructions}
                      onChange={(e) => setPrescription({...prescription, instructions: e.target.value})}
                      placeholder="Enter special instructions for the patient..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                      rows={4}
                    />
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-800">Patient Allergies</h4>
                        <p className="text-sm text-yellow-700 mt-1">
                          {selectedAppointment.patient?.allergies?.join(', ') || 'No known allergies'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowPrescriptionModal(false)}
                    className="px-6 py-2 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      console.log('Saving prescription:', prescription);
                      setShowPrescriptionModal(false);
                    }}
                    className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
                  >
                    Save Prescription
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        {filteredAppointments.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {filteredAppointments.filter(apt => apt.status === 'confirmed').length}
              </div>
              <div className="text-sm text-gray-600">Confirmed</div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 text-center">
              <div className="text-2xl font-bold text-yellow-600 mb-1">
                {filteredAppointments.filter(apt => apt.status === 'pending').length}
              </div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {filteredAppointments.filter(apt => apt.status === 'in-progress').length}
              </div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 text-center">
              <div className="text-2xl font-bold text-red-600 mb-1">
                {filteredAppointments.filter(apt => apt.status === 'urgent').length}
              </div>
              <div className="text-sm text-gray-600">Urgent</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Appointments;