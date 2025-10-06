import React, { useState, useEffect } from 'react';
import { 
  CalendarIcon, 
  ClockIcon, 
  UserIcon, 
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CurrencyDollarIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { userAPI, appointmentAPI } from '../../services/api';
import toast from 'react-hot-toast';

const AppointmentBooking = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State management
  const [loading, setLoading] = useState(false);
  const [selectedStep, setSelectedStep] = useState(1);
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('all');
  
  // Booking details
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [appointmentType, setAppointmentType] = useState('consultation');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [createdAppointment, setCreatedAppointment] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card');

  // Fetch doctors on component mount
  useEffect(() => {
    fetchDoctors();
  }, []);

  // Filter doctors when search or specialization changes
  useEffect(() => {
    filterDoctors();
  }, [doctors, searchQuery, selectedSpecialization]);

  // Fetch available slots when doctor and date are selected
  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedDoctor, selectedDate]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getDoctors();
      
      if (response.data.success) {
        const doctorsList = response.data.data.doctors || [];
        setDoctors(doctorsList);
        setFilteredDoctors(doctorsList);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const filterDoctors = () => {
    let filtered = doctors;
    
    if (selectedSpecialization !== 'all') {
      filtered = filtered.filter(doc => 
        doc.specialization?.toLowerCase() === selectedSpecialization.toLowerCase()
      );
    }
    
    if (searchQuery.trim()) {
      filtered = filtered.filter(doc =>
        doc.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.specialization?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredDoctors(filtered);
  };

  const fetchAvailableSlots = async () => {
    try {
      setLoadingSlots(true);
      
      // Get doctor's availability for the selected date
      if (selectedDoctor.availability && selectedDoctor.availability[selectedDate]) {
        const doctorSlots = selectedDoctor.availability[selectedDate] || [];
        
        // If API is available, check which slots are already booked
        try {
          const response = await appointmentAPI.checkAvailability(
            selectedDoctor._id,
            selectedDate
          );
          
          if (response.data.success) {
            const bookedSlots = response.data.data.bookedSlots || [];
            const availableSlots = doctorSlots.filter(slot => !bookedSlots.includes(slot));
            setAvailableSlots(availableSlots);
          } else {
            setAvailableSlots(doctorSlots);
          }
        } catch (apiError) {
          // If API fails, show all doctor's slots
          console.log('API check failed, showing all doctor slots');
          setAvailableSlots(doctorSlots);
        }
      } else {
        // No availability set for this date
        setAvailableSlots([]);
        toast.info('Doctor has no availability set for this date');
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleDoctorSelect = (doctor) => {
    setSelectedDoctor(doctor);
    setSelectedStep(2);
    setSelectedTime(''); // Reset time when doctor changes
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTime(''); // Reset time when date changes
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
  };

  const handleContinueToConfirm = () => {
    if (!selectedDate) {
      toast.error('Please select a date');
      return;
    }
    if (!selectedTime) {
      toast.error('Please select a time slot');
      return;
    }
    if (!appointmentType) {
      toast.error('Please select appointment type');
      return;
    }
    if (!chiefComplaint.trim()) {
      toast.error('Please describe your reason for visit');
      return;
    }
    // Validate chief complaint length
    if (chiefComplaint.trim().length < 10) {
      toast.error('Please provide at least 10 characters for your reason (currently: ' + chiefComplaint.trim().length + ')');
      return;
    }
    if (chiefComplaint.trim().length > 500) {
      toast.error('Reason for visit is too long. Maximum 500 characters allowed.');
      return;
    }
    setSelectedStep(3);
  };

  const handleContinueToPayment = () => {
    setSelectedStep(4);
  };

  const handleBookAppointment = async () => {
    try {
      setLoading(true);
      
      // Final validation check before submitting
      if (chiefComplaint.trim().length < 10) {
        toast.error('Reason for visit must be at least 10 characters. Please provide more details.');
        setLoading(false);
        return;
      }
      
      if (chiefComplaint.trim().length > 500) {
        toast.error('Reason for visit is too long. Maximum 500 characters allowed.');
        setLoading(false);
        return;
      }
      
      const appointmentData = {
        doctor: selectedDoctor._id,
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        duration: 15, // 15-minute slots
        appointmentType,
        chiefComplaint: chiefComplaint.trim()
      };

      console.log('Sending appointment data:', appointmentData);
      console.log('Stringified data:', JSON.stringify(appointmentData, null, 2));

      const response = await appointmentAPI.createAppointment(appointmentData);
      
      if (response.data.success) {
        setCreatedAppointment(response.data.data.appointment);
        toast.success('Appointment created! Please proceed to payment.');
        handleContinueToPayment();
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      console.error('Error details:', error.response?.data);
      console.error('Error message:', error.response?.data?.message);
      console.error('Error errors:', JSON.stringify(error.response?.data?.errors, null, 2));
      
      // Show validation errors if available
      if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors.map(err => `${err.param}: ${err.msg}`).join(' | ');
        toast.error(`Validation error: ${errorMessages}`);
      } else {
        toast.error(error.response?.data?.message || 'Failed to create appointment');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayment = async () => {
    try {
      setLoading(true);
      
      const paymentData = {
        paymentMethod,
        transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };

      const response = await appointmentAPI.confirmPayment(createdAppointment._id, paymentData);
      
      if (response.data.success) {
        toast.success('Payment successful! Appointment confirmed!');
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      console.error('Payment error response:', error.response?.data);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Payment failed';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePayLater = async () => {
    try {
      setLoading(true);
      
      // Schedule appointment without payment - payment will be done at hospital
      const response = await appointmentAPI.scheduleWithoutPayment(createdAppointment._id);
      
      if (response.data.success) {
        toast.success('Appointment scheduled! Pay when you arrive at the hospital.');
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (error) {
      console.error('Error scheduling appointment:', error);
      toast.error(error.response?.data?.message || 'Failed to schedule appointment');
    } finally {
      setLoading(false);
    }
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    return maxDate.toISOString().split('T')[0];
  };

  // Get unique specializations for filter
  const specializations = [...new Set(doctors.map(d => d.specialization).filter(Boolean))];

  const appointmentTypes = [
    { value: 'consultation', label: 'Consultation' },
    { value: 'follow-up', label: 'Follow-up' },
    { value: 'check-up', label: 'Check-up' },
    { value: 'emergency', label: 'Emergency' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
            <h1 className="text-4xl font-bold mb-2">Book Your Appointment</h1>
            <p className="text-blue-100 text-lg">Find the right doctor and schedule your visit</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[
              { step: 1, title: 'Choose Doctor', icon: UserIcon },
              { step: 2, title: 'Select Date & Time', icon: CalendarIcon },
              { step: 3, title: 'Confirm Details', icon: CheckCircleIcon },
              { step: 4, title: 'Payment', icon: CurrencyDollarIcon }
            ].map(({ step, title, icon: Icon }) => (
              <div key={step} className="flex items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  selectedStep >= step 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-400'
                }`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className={`ml-3 ${selectedStep >= step ? 'text-blue-600' : 'text-gray-400'}`}>
                  <p className="text-sm font-semibold">{title}</p>
                </div>
                {step < 3 && (
                  <ArrowRightIcon className="w-5 h-5 ml-8 text-gray-300" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Choose Doctor */}
        {selectedStep === 1 && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Choose Your Doctor</h2>
            
            {/* Search and Filter */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or specialization..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={selectedSpecialization}
                onChange={(e) => setSelectedSpecialization(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Specializations</option>
                {specializations.map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>

            {/* Doctors List */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading doctors...</p>
              </div>
            ) : filteredDoctors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredDoctors.map((doctor) => (
                  <div
                    key={doctor._id}
                    onClick={() => handleDoctorSelect(doctor)}
                    className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer hover:border-blue-500 transform hover:-translate-y-1"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                        {doctor.firstName?.charAt(0)}{doctor.lastName?.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900">
                          Dr. {doctor.firstName} {doctor.lastName}
                        </h3>
                        <p className="text-blue-600 font-medium">{doctor.specialization}</p>
                        <p className="text-sm text-gray-600 mt-1">{doctor.experience || 'Experienced'}</p>
                        
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
                            <span className="text-gray-900 font-semibold">
                              ${doctor.consultationFee || 100}
                            </span>
                          </div>
                          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                            Select Doctor
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <UserIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No doctors found</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedSpecialization('all');
                  }}
                  className="mt-4 text-blue-600 hover:text-blue-700"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Date & Time */}
        {selectedStep === 2 && selectedDoctor && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Select Date & Time</h2>
              <button
                onClick={() => setSelectedStep(1)}
                className="text-blue-600 hover:text-blue-700 flex items-center space-x-2"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                <span>Change Doctor</span>
              </button>
            </div>

            {/* Selected Doctor Info */}
            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  {selectedDoctor.firstName?.charAt(0)}{selectedDoctor.lastName?.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}
                  </p>
                  <p className="text-sm text-blue-600">{selectedDoctor.specialization}</p>
                </div>
              </div>
            </div>

            {/* Date Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateSelect(e.target.value)}
                min={getMinDate()}
                max={getMaxDate()}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Time Slots */}
            {selectedDate && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Select Time Slot
                  </label>
                  {availableSlots.length > 0 && (
                    <span className="text-xs text-blue-600 font-medium">
                      {availableSlots.length} slots available (15 min each)
                    </span>
                  )}
                </div>
                {loadingSlots ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-2 text-sm">Loading available slots...</p>
                  </div>
                ) : availableSlots.length > 0 ? (
                  <>
                    <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-700">
                        <ClockIcon className="w-4 h-4 inline mr-1" />
                        Each appointment slot is <strong>15 minutes</strong>. Select your preferred time.
                      </p>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-96 overflow-y-auto p-2">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot}
                          onClick={() => handleTimeSelect(slot)}
                          className={`py-2 px-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium ${
                            selectedTime === slot
                              ? 'border-blue-600 bg-blue-600 text-white shadow-lg transform scale-105'
                              : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-gray-700'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                    <ClockIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No available slots for this date</p>
                    <p className="text-sm text-gray-400 mt-1">Please select a different date</p>
                  </div>
                )}
              </div>
            )}

            {/* Appointment Type */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Appointment Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {appointmentTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setAppointmentType(type.value)}
                    className={`py-3 px-4 rounded-lg border-2 transition-all duration-200 ${
                      appointmentType === type.value
                        ? 'border-blue-600 bg-blue-50 text-blue-600 font-semibold'
                        : 'border-gray-200 hover:border-blue-300 text-gray-700'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Chief Complaint */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Visit * <span className="text-red-600">(Required - Min 10 chars)</span>
              </label>
              <div className={`mb-2 p-3 rounded-lg border ${
                chiefComplaint.trim().length > 0 && chiefComplaint.trim().length < 10
                  ? 'bg-red-50 border-red-300'
                  : chiefComplaint.trim().length >= 10
                  ? 'bg-green-50 border-green-300'
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <p className={`text-sm font-medium ${
                  chiefComplaint.trim().length > 0 && chiefComplaint.trim().length < 10
                    ? 'text-red-700'
                    : chiefComplaint.trim().length >= 10
                    ? 'text-green-700'
                    : 'text-blue-700'
                }`}>
                  {chiefComplaint.trim().length > 0 && chiefComplaint.trim().length < 10
                    ? '❌ Description too short - please add more details'
                    : chiefComplaint.trim().length >= 10
                    ? '✅ Good! Your description meets the requirement'
                    : '📝 Please provide a detailed description (minimum 10 characters, maximum 500 characters)'
                  }
                </p>
              </div>
              <textarea
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                placeholder="Example: I've been experiencing severe headaches for the past 3 days, accompanied by nausea and sensitivity to light..."
                rows={5}
                maxLength={500}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors ${
                  chiefComplaint.trim().length > 0 && chiefComplaint.trim().length < 10
                    ? 'border-red-400 bg-red-50'
                    : chiefComplaint.trim().length >= 10
                    ? 'border-green-400 bg-green-50'
                    : 'border-gray-300'
                }`}
              />
              <div className="mt-2 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <div className={`text-sm font-semibold ${
                    chiefComplaint.trim().length < 10 
                      ? 'text-red-600' 
                      : chiefComplaint.trim().length > 450 
                      ? 'text-orange-600' 
                      : 'text-green-600'
                  }`}>
                    {chiefComplaint.trim().length < 10 
                      ? `⚠️ Need ${10 - chiefComplaint.trim().length} more characters` 
                      : `✓ Valid (${chiefComplaint.trim().length} characters)`
                    }
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-600">{chiefComplaint.length}/500</p>
              </div>
            </div>

            {/* Continue Button */}
            <button
              onClick={handleContinueToConfirm}
              disabled={!selectedDate || !selectedTime || !appointmentType || !chiefComplaint.trim() || chiefComplaint.trim().length < 10}
              className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Confirm
            </button>
          </div>
        )}

        {/* Step 3: Confirm Details */}
        {selectedStep === 3 && selectedDoctor && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Confirm Appointment</h2>
              <button
                onClick={() => setSelectedStep(2)}
                className="text-blue-600 hover:text-blue-700 flex items-center space-x-2"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                <span>Edit Details</span>
              </button>
            </div>

            {/* Summary */}
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Appointment Summary</h3>
                
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <UserIcon className="w-5 h-5 text-blue-600 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">Doctor</p>
                      <p className="font-semibold text-gray-900">
                        Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}
                      </p>
                      <p className="text-sm text-blue-600">{selectedDoctor.specialization}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <CalendarIcon className="w-5 h-5 text-blue-600 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">Date & Time</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(selectedDate).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                      <p className="text-sm text-gray-700">{selectedTime} <span className="text-xs text-gray-500">(15 min slot)</span></p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <ClockIcon className="w-5 h-5 text-blue-600 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">Appointment Type</p>
                      <p className="font-semibold text-gray-900 capitalize">{appointmentType}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <CurrencyDollarIcon className="w-5 h-5 text-blue-600 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">Consultation Fee</p>
                      <p className="font-semibold text-gray-900">
                        ${selectedDoctor.consultationFee || 100}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Reason for Visit</p>
                    <p className="text-gray-900">{chiefComplaint}</p>
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Please arrive 15 minutes before your scheduled time. 
                  Cancellations must be made at least 24 hours in advance.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  onClick={() => setSelectedStep(2)}
                  className="flex-1 py-3 px-6 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  Back
                </button>
                <button
                  onClick={handleBookAppointment}
                  disabled={loading}
                  className="flex-1 py-3 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Booking...</span>
                    </>
                  ) : (
                    <>
                      <ArrowRightIcon className="w-5 h-5" />
                      <span>Proceed to Payment</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Payment */}
        {selectedStep === 4 && createdAppointment && selectedDoctor && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Payment</h2>
              <button
                onClick={() => setSelectedStep(3)}
                className="text-blue-600 hover:text-blue-700 flex items-center space-x-2"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                <span>Back</span>
              </button>
            </div>

            {/* Payment Summary */}
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Payment Summary</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Consultation Fee</span>
                    <span className="font-semibold text-gray-900">${createdAppointment.consultationFee}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Service Charge</span>
                    <span className="font-semibold text-gray-900">$0</span>
                  </div>
                  <div className="border-t border-gray-300 pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">Total Amount</span>
                      <span className="text-2xl font-bold text-blue-600">${createdAppointment.consultationFee}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Options Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">💡 Payment Options</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>Pay Now:</strong> Pay online with Card/UPI/Wallet</li>
                  <li>• <strong>Pay at Hospital:</strong> Pay when you arrive (Cash/Card/Insurance)</li>
                </ul>
              </div>

              {/* Payment Method Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Payment Option
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { value: 'card', label: 'Credit/Debit Card', icon: '💳', online: true },
                    { value: 'upi', label: 'UPI', icon: '📱', online: true },
                    { value: 'wallet', label: 'Wallet', icon: '💰', online: true },
                    { value: 'pay-later', label: 'Pay at Hospital', icon: '🏥', online: false }
                  ].map((method) => (
                    <button
                      key={method.value}
                      onClick={() => setPaymentMethod(method.value)}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 text-center ${
                        paymentMethod === method.value
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="text-3xl mb-2">{method.icon}</div>
                      <div className="font-semibold text-gray-900 text-sm">{method.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pay Later Info */}
              {paymentMethod === 'pay-later' && (
                <div className="space-y-4 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="text-3xl">🏥</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-2">Pay at Hospital</h4>
                      <p className="text-sm text-gray-700 mb-3">
                        Your appointment will be scheduled. You can pay when you arrive at the hospital using:
                      </p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• <strong>Cash</strong> - Pay at the counter</li>
                        <li>• <strong>Credit/Debit Card</strong> - At the counter</li>
                        <li>• <strong>Insurance</strong> - If you have coverage</li>
                        <li>• <strong>Government Fund</strong> - For eligible patients</li>
                      </ul>
                      <div className="mt-3 p-3 bg-white rounded border border-yellow-300">
                        <p className="text-xs text-gray-600">
                          ⚠️ <strong>Note:</strong> Please arrive 15 minutes early to complete payment before your appointment.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Details */}
              {paymentMethod === 'card' && (
                <div className="space-y-4 p-6 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900">Card Details</h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Card Number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="MM/YY"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="CVV"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Cardholder Name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Security Notice */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
                <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-green-800">
                    <strong>Secure Payment:</strong> Your payment information is encrypted and secure. 
                    We never store your card details.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  onClick={() => setSelectedStep(3)}
                  className="flex-1 py-3 px-6 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  Back
                </button>
                <button
                  onClick={paymentMethod === 'pay-later' ? handlePayLater : handleProcessPayment}
                  disabled={loading}
                  className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-5 h-5" />
                      <span>
                        {paymentMethod === 'pay-later' 
                          ? 'Confirm Appointment' 
                          : `Pay $${createdAppointment.consultationFee}`
                        }
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentBooking;
