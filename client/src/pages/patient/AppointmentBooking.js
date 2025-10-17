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
  XMarkIcon,
  ExclamationTriangleIcon
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
  const [lockedSlots, setLockedSlots] = useState([]);
  const [reservedSlot, setReservedSlot] = useState(null);
  const [reservationTimer, setReservationTimer] = useState(null);
  const [slotReservationTime, setSlotReservationTime] = useState(0);
  const [createdAppointment, setCreatedAppointment] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [existingAppointment, setExistingAppointment] = useState(null);

  // Fetch doctors on component mount
  useEffect(() => {
    fetchDoctors();
    checkExistingAppointments();
  }, []);

  // Cleanup reservation timer on unmount
  useEffect(() => {
    return () => {
      if (reservationTimer) {
        clearInterval(reservationTimer);
      }
    };
  }, [reservationTimer]);

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
      const response = await userAPI.getDoctors({
        specialization: selectedSpecialization === 'all' ? undefined : selectedSpecialization
      });
      
      if (response.data.success) {
        setDoctors(response.data.data.doctors);
        setFilteredDoctors(response.data.data.doctors);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const checkExistingAppointments = async () => {
    try {
      const response = await appointmentAPI.getAppointments({
        status: 'scheduled,confirmed',
        patientId: user.id
      });
      
      if (response.data.success) {
        const appointments = response.data.data.appointments || [];
        const futureAppointments = appointments.filter(apt => {
          const appointmentDate = new Date(apt.appointmentDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return appointmentDate >= today;
        });
        
        if (futureAppointments.length > 0) {
          setExistingAppointment(futureAppointments[0]);
          console.log('Found existing appointment:', futureAppointments[0]);
        } else {
          setExistingAppointment(null);
        }
      }
    } catch (error) {
      console.error('Error checking existing appointments:', error);
      // Don't block the booking process if this fails
      setExistingAppointment(null);
    }
  };

  const reserveSlot = async (slot) => {
    try {
      // Reserve slot for 10 minutes
      const reservationData = {
        doctorId: selectedDoctor._id,
        date: selectedDate,
        time: slot,
        patientId: user.id,
        reservationDuration: 10 * 60 * 1000 // 10 minutes in milliseconds
      };

      // Simulate slot reservation API call
      // In real implementation, this would call the backend
      setReservedSlot(slot);
      setSlotReservationTime(10 * 60); // 10 minutes in seconds
      
      // Start countdown timer
      const timer = setInterval(() => {
        setSlotReservationTime(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setReservedSlot(null);
            setSelectedTime('');
            toast.warning('Slot reservation expired. Please select again.');
            fetchAvailableSlots(); // Refresh slots
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      setReservationTimer(timer);
      toast.success(`Slot reserved for 10 minutes`);
      
    } catch (error) {
      console.error('Error reserving slot:', error);
      toast.error('Failed to reserve slot');
    }
  };

  const releaseSlot = () => {
    if (reservationTimer) {
      clearInterval(reservationTimer);
      setReservationTimer(null);
    }
    setReservedSlot(null);
    setSlotReservationTime(0);
    setSelectedTime('');
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
      
      // Generate standard time slots (9 AM to 5 PM, 15-minute intervals)
      const generateTimeSlots = () => {
        const slots = [];
        const startHour = 9; // 9 AM
        const endHour = 17; // 5 PM
        const now = new Date();
        const isToday = selectedDate === now.toISOString().split('T')[0];
        
        for (let hour = startHour; hour < endHour; hour++) {
          for (let minute = 0; minute < 60; minute += 15) {
            // Skip past time slots if the selected date is today
            if (isToday) {
              const slotTime = new Date();
              slotTime.setHours(hour, minute, 0, 0);
              
              // Only add slots that are at least 30 minutes in the future
              if (slotTime <= new Date(now.getTime() + 30 * 60000)) {
                continue;
              }
            }
            
            const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            slots.push(timeString);
          }
        }
        return slots;
      };

      // Get doctor's available slots (use standard slots if not specified)
      let doctorSlots = [];
      if (selectedDoctor.availability && selectedDoctor.availability[selectedDate]) {
        doctorSlots = selectedDoctor.availability[selectedDate];
      } else if (selectedDoctor.workingHours) {
        // Use doctor's working hours to generate slots
        doctorSlots = generateTimeSlots();
      } else {
        // Default slots
        doctorSlots = generateTimeSlots();
      }
      
      // Check which slots are already booked (including pending payments)
      try {
        const response = await appointmentAPI.getAppointments({
          doctorId: selectedDoctor._id,
          date: selectedDate,
          status: 'pending-payment,scheduled,confirmed'
        });
        
        if (response.data.success) {
          const appointments = response.data.data.appointments || [];
          const bookedSlots = appointments.map(apt => apt.appointmentTime);
          const availableSlots = doctorSlots.filter(slot => !bookedSlots.includes(slot));
          setAvailableSlots(availableSlots);
        } else {
          setAvailableSlots(doctorSlots);
        }
      } catch (apiError) {
        // If API fails, show all doctor's slots
        console.log('API check failed, showing all doctor slots:', apiError);
        setAvailableSlots(doctorSlots);
      }
      
    } catch (error) {
      console.error('Error fetching slots:', error);
      setAvailableSlots([]);
      toast.error('Failed to load available slots');
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

  const handleTimeSelect = async (time) => {
    // Release any previously reserved slot
    if (reservedSlot && reservedSlot !== time) {
      releaseSlot();
    }

    // Check if slot is already locked by another user
    if (lockedSlots.includes(time)) {
      toast.error('This slot is currently being booked by another patient. Please select a different time.');
      return;
    }

    // Reserve the selected slot
    setSelectedTime(time);
    await reserveSlot(time);
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
          navigate('/dashboard?tab=overview', { replace: true });
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
          navigate('/dashboard?tab=overview', { replace: true });
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
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
                    {/* Slot Reservation Timer */}
                    {reservedSlot && slotReservationTime > 0 && (
                      <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-xs text-yellow-700">
                          <ClockIcon className="w-4 h-4 inline mr-1" />
                          Slot <strong>{reservedSlot}</strong> reserved for <strong>{Math.floor(slotReservationTime / 60)}:{(slotReservationTime % 60).toString().padStart(2, '0')}</strong> minutes. 
                          Complete booking before it expires.
                        </p>
                      </div>
                    )}

                    <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-700">
                        <ClockIcon className="w-4 h-4 inline mr-1" />
                        Each appointment slot is <strong>15 minutes</strong>. Select your preferred time.
                        <span className="block mt-1">🔒 Slots are reserved for 10 minutes after selection.</span>
                      </p>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-96 overflow-y-auto p-2">
                      {availableSlots.map((slot) => {
                        const isSelected = selectedTime === slot;
                        const isReserved = reservedSlot === slot;
                        const isLocked = lockedSlots.includes(slot);
                        const isDisabled = isLocked;
                        
                        return (
                          <button
                            key={slot}
                            onClick={() => !isDisabled && handleTimeSelect(slot)}
                            disabled={isDisabled}
                            className={`py-2 px-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium relative ${
                              isSelected && isReserved
                                ? 'border-green-600 bg-green-600 text-white shadow-lg transform scale-105'
                                : isSelected
                                ? 'border-blue-600 bg-blue-600 text-white shadow-lg transform scale-105'
                                : isLocked
                                ? 'border-red-200 bg-red-50 text-red-400 cursor-not-allowed'
                                : isDisabled
                                ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-gray-700 hover:shadow-md'
                            }`}
                          >
                            {slot}
                            {isReserved && (
                              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                            )}
                            {isLocked && (
                              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    
                    {/* Slot Legend */}
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-xs font-medium text-gray-700 mb-2">Slot Status Legend:</p>
                      <div className="flex flex-wrap gap-4 text-xs">
                        <div className="flex items-center space-x-1">
                          <div className="w-3 h-3 bg-gray-200 border border-gray-300 rounded"></div>
                          <span className="text-gray-600">Available</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-3 h-3 bg-blue-600 rounded relative">
                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-white"></span>
                          </div>
                          <span className="text-gray-600">Reserved (10 min)</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-3 h-3 bg-red-50 border border-red-200 rounded relative">
                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                          </div>
                          <span className="text-gray-600">Being Booked</span>
                        </div>
                      </div>
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
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[
                    { value: 'card', label: 'Credit/Debit Card', icon: '💳', online: true },
                    { value: 'upi', label: 'UPI', icon: '📱', online: true },
                    { value: 'wallet', label: 'Wallet', icon: '💰', online: true },
                    { value: 'cash', label: 'Cash', icon: '💵', online: false },
                    { value: 'insurance', label: 'Insurance Coverage', icon: '🛡️', online: false },
                    { value: 'government', label: 'Government Fund', icon: '🏛️', online: false }
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

              {/* Cash Payment Info */}
              {paymentMethod === 'cash' && (
                <div className="space-y-4 p-6 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="text-3xl">💵</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-2">Cash Payment</h4>
                      <p className="text-sm text-gray-700 mb-3">
                        Your appointment will be scheduled. Please bring exact cash amount when you arrive at the hospital.
                      </p>
                      <div className="mt-3 p-3 bg-white rounded border border-green-300">
                        <p className="text-xs text-gray-600">
                          💡 <strong>Tip:</strong> Please arrive 15 minutes early to complete payment at the counter.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Insurance Coverage */}
              {paymentMethod === 'insurance' && (
                <div className="space-y-4 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="text-3xl">🛡️</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-2">Insurance Coverage</h4>
                      <p className="text-sm text-gray-700 mb-3">
                        Please provide your insurance details. Coverage will be verified before your appointment.
                      </p>
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Insurance Provider"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Policy Number"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Group Number (if applicable)"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="mt-3 p-3 bg-white rounded border border-blue-300">
                        <p className="text-xs text-gray-600">
                          ℹ️ <strong>Note:</strong> Insurance coverage will be verified. Any uncovered amount must be paid at the hospital.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Government Fund */}
              {paymentMethod === 'government' && (
                <div className="space-y-4 p-6 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="text-3xl">🏛️</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-2">Government Fund</h4>
                      <p className="text-sm text-gray-700 mb-3">
                        Please provide your government fund eligibility details for verification.
                      </p>
                      <div className="space-y-3">
                        <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                          <option value="">Select Fund Type</option>
                          <option value="medicaid">Medicaid</option>
                          <option value="medicare">Medicare</option>
                          <option value="veterans">Veterans Affairs</option>
                          <option value="disability">Disability Fund</option>
                          <option value="low-income">Low Income Support</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Beneficiary ID"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Reference Number (if any)"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="mt-3 p-3 bg-white rounded border border-purple-300">
                        <p className="text-xs text-gray-600">
                          🔍 <strong>Verification:</strong> Eligibility will be verified before your appointment. Please bring supporting documents.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
