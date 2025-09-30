import React, { useState } from 'react';
import { 
  CalendarIcon, 
  ClockIcon, 
  UserIcon, 
  MagnifyingGlassIcon,
  MapPinIcon,
  StarIcon,
  CheckCircleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const AppointmentBooking = () => {
  const [selectedStep, setSelectedStep] = useState(1);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [appointmentType, setAppointmentType] = useState('');

  // Mock data for doctors
  const doctors = [
    {
      id: 1,
      name: 'Dr. Sarah Johnson',
      specialization: 'Cardiology',
      experience: '15 years',
      rating: 4.9,
      reviews: 248,
      consultationFee: 150,
      location: 'Main Hospital - Building A',
      image: '👩‍⚕️',
      nextAvailable: 'Today',
      bio: 'Specialized in heart diseases and cardiovascular surgery'
    },
    {
      id: 2,
      name: 'Dr. Michael Chen',
      specialization: 'General Medicine',
      experience: '12 years',
      rating: 4.8,
      reviews: 186,
      consultationFee: 120,
      location: 'Main Hospital - Building B',
      image: '👨‍⚕️',
      nextAvailable: 'Tomorrow',
      bio: 'Family medicine practitioner with focus on preventive care'
    },
    {
      id: 3,
      name: 'Dr. Emily Rodriguez',
      specialization: 'Dermatology',
      experience: '10 years',
      rating: 4.9,
      reviews: 312,
      consultationFee: 180,
      location: 'Specialty Clinic',
      image: '👩‍⚕️',
      nextAvailable: 'Jan 6',
      bio: 'Expert in skin conditions and cosmetic dermatology'
    }
  ];

  const timeSlots = ['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM'];
  const appointmentTypes = ['Consultation', 'Follow-up', 'Check-up', 'Emergency'];

  const handleBookAppointment = () => {
    // Handle appointment booking logic
    alert('Appointment booked successfully!');
  };

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
          <div className="flex items-center justify-center space-x-8">
            {[
              { step: 1, title: 'Choose Doctor', icon: UserIcon },
              { step: 2, title: 'Select Date & Time', icon: CalendarIcon },
              { step: 3, title: 'Confirm Details', icon: CheckCircleIcon }
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
                  <ArrowRightIcon className={`w-6 h-6 ml-8 ${selectedStep > step ? 'text-blue-600' : 'text-gray-300'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {selectedStep === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Choose Your Doctor</h2>
              
              {/* Search and Filter */}
              <div className="mb-6 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search doctors by name or specialization..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <select className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option>All Specializations</option>
                  <option>Cardiology</option>
                  <option>General Medicine</option>
                  <option>Dermatology</option>
                </select>
              </div>

              {/* Doctors Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {doctors.map((doctor) => (
                  <div
                    key={doctor.id}
                    className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                      selectedDoctor?.id === doctor.id
                        ? 'border-blue-500 bg-blue-50 shadow-lg'
                        : 'border-gray-200 bg-white hover:shadow-lg'
                    }`}
                    onClick={() => setSelectedDoctor(doctor)}
                  >
                    <div className="text-center mb-4">
                      <div className="text-4xl mb-2">{doctor.image}</div>
                      <h3 className="text-lg font-bold text-gray-900">{doctor.name}</h3>
                      <p className="text-blue-600 font-semibold">{doctor.specialization}</p>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Experience:</span>
                        <span className="font-semibold">{doctor.experience}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Rating:</span>
                        <div className="flex items-center space-x-1">
                          <StarIcon className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="font-semibold">{doctor.rating}</span>
                          <span className="text-gray-500">({doctor.reviews})</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Fee:</span>
                        <span className="font-semibold text-green-600">${doctor.consultationFee}</span>
                      </div>
                    </div>
                    
                    <div className="border-t pt-3">
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <MapPinIcon className="w-4 h-4 mr-1" />
                        {doctor.location}
                      </div>
                      <div className="flex items-center text-sm text-green-600">
                        <ClockIcon className="w-4 h-4 mr-1" />
                        Next available: {doctor.nextAvailable}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => selectedDoctor && setSelectedStep(2)}
                  disabled={!selectedDoctor}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg font-semibold"
                >
                  Continue to Date & Time
                </button>
              </div>
            </div>
          )}

          {selectedStep === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Date & Time</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Date Selection */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Date</h3>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                {/* Time Selection */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Time</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {timeSlots.map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                          selectedTime === time
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Appointment Type */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointment Type</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {appointmentTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => setAppointmentType(type)}
                      className={`px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                        appointmentType === type
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex justify-between">
                <button
                  onClick={() => setSelectedStep(1)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
                >
                  Back
                </button>
                <button
                  onClick={() => selectedDate && selectedTime && appointmentType && setSelectedStep(3)}
                  disabled={!selectedDate || !selectedTime || !appointmentType}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg font-semibold"
                >
                  Continue to Confirmation
                </button>
              </div>
            </div>
          )}

          {selectedStep === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Confirm Your Appointment</h2>
              
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Appointment Summary</h3>
                
                {selectedDoctor && (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Doctor:</span>
                      <span className="font-semibold">{selectedDoctor.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Specialization:</span>
                      <span className="font-semibold">{selectedDoctor.specialization}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-semibold">{selectedDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time:</span>
                      <span className="font-semibold">{selectedTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-semibold">{appointmentType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location:</span>
                      <span className="font-semibold">{selectedDoctor.location}</span>
                    </div>
                    <div className="flex justify-between border-t pt-3">
                      <span className="text-gray-600">Consultation Fee:</span>
                      <span className="font-bold text-green-600 text-lg">${selectedDoctor.consultationFee}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 flex justify-between">
                <button
                  onClick={() => setSelectedStep(2)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
                >
                  Back
                </button>
                <button
                  onClick={handleBookAppointment}
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105 shadow-lg font-semibold"
                >
                  Book Appointment
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentBooking;