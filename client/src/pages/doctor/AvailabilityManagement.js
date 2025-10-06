import React, { useState, useEffect } from 'react';
import {
  CalendarIcon,
  ClockIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import { userAPI } from '../../services/api';
import toast from 'react-hot-toast';

const AvailabilityManagement = () => {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [availability, setAvailability] = useState({});
  const [selectedDate, setSelectedDate] = useState('');
  const [timeSlots, setTimeSlots] = useState([]);
  const [newSlot, setNewSlot] = useState({ start: '', end: '' });

  useEffect(() => {
    if (user) {
      loadAvailability();
    }
  }, [user]);

  const loadAvailability = () => {
    // Load from user's availability field
    if (user?.availability) {
      setAvailability(user.availability);
    }
  };

  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const h = hour.toString().padStart(2, '0');
        const m = minute.toString().padStart(2, '0');
        times.push(`${h}:${m}`);
      }
    }
    return times;
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setTimeSlots(availability[date] || []);
  };

  const generate15MinSlots = (startTime, endTime) => {
    const slots = [];
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    let currentMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    while (currentMinutes < endMinutes) {
      const hour = Math.floor(currentMinutes / 60);
      const min = currentMinutes % 60;
      const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      slots.push(timeStr);
      currentMinutes += 15;
    }
    
    return slots;
  };

  const handleAddTimeSlot = () => {
    if (!newSlot.start || !newSlot.end) {
      toast.error('Please select both start and end time');
      return;
    }

    if (newSlot.start >= newSlot.end) {
      toast.error('End time must be after start time');
      return;
    }

    // Generate 15-minute slots
    const generatedSlots = generate15MinSlots(newSlot.start, newSlot.end);
    
    if (generatedSlots.length === 0) {
      toast.error('Invalid time range');
      return;
    }
    
    // Check for duplicates
    const existingSlots = new Set(timeSlots);
    const newSlots = generatedSlots.filter(slot => !existingSlots.has(slot));
    
    if (newSlots.length === 0) {
      toast.error('All slots in this range already exist');
      return;
    }
    
    setTimeSlots([...timeSlots, ...newSlots].sort());
    toast.success(`Added ${newSlots.length} slots (15-minute intervals)`);
    setNewSlot({ start: '', end: '' });
  };

  const handleRemoveTimeSlot = (slot) => {
    setTimeSlots(timeSlots.filter(s => s !== slot));
  };

  const handleSaveAvailability = async () => {
    if (!selectedDate) {
      toast.error('Please select a date');
      return;
    }

    try {
      setLoading(true);
      
      const updatedAvailability = {
        ...availability,
        [selectedDate]: timeSlots
      };

      const response = await userAPI.updateProfile({
        availability: updatedAvailability
      });

      if (response.data.success) {
        setAvailability(updatedAvailability);
        toast.success('Availability updated successfully');
      }
    } catch (error) {
      console.error('Error saving availability:', error);
      toast.error('Failed to save availability');
    } finally {
      setLoading(false);
    }
  };

  const handleClearDate = () => {
    if (!selectedDate) return;
    
    const updatedAvailability = { ...availability };
    delete updatedAvailability[selectedDate];
    setAvailability(updatedAvailability);
    setTimeSlots([]);
  };

  const getMinDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 6);
    return maxDate.toISOString().split('T')[0];
  };

  const timeOptions = generateTimeOptions();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manage Availability</h1>
          <p className="text-gray-600 mt-2">Set your available dates and time slots for appointments</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Date Selection & Time Slots */}
          <div className="space-y-6">
            {/* Date Picker */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Date</h2>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateSelect(e.target.value)}
                min={getMinDate()}
                max={getMaxDate()}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Add Time Slot */}
            {selectedDate && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Time Slot</h2>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Time
                      </label>
                      <select
                        value={newSlot.start}
                        onChange={(e) => setNewSlot({ ...newSlot, start: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select</option>
                        {timeOptions.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Time
                      </label>
                      <select
                        value={newSlot.end}
                        onChange={(e) => setNewSlot({ ...newSlot, end: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select</option>
                        {timeOptions.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleAddTimeSlot}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <PlusIcon className="w-5 h-5" />
                    <span>Add Time Slot</span>
                  </button>
                </div>
              </div>
            )}

            {/* Current Time Slots */}
            {selectedDate && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Time Slots for {new Date(selectedDate).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h2>
                  {timeSlots.length > 0 && (
                    <p className="text-sm text-blue-600 mt-1">
                      {timeSlots.length} slots available (15 minutes each)
                    </p>
                  )}
                </div>

                {timeSlots.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-96 overflow-y-auto">
                    {timeSlots.map((slot, index) => (
                      <div
                        key={index}
                        className="relative group flex items-center justify-between p-2 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
                      >
                        <div className="flex items-center space-x-1 flex-1">
                          <ClockIcon className="w-4 h-4 text-blue-600" />
                          <span className="font-medium text-gray-900 text-sm">{slot}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveTimeSlot(slot)}
                          className="text-red-600 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No time slots added yet</p>
                )}

                <div className="mt-6 flex space-x-3">
                  <button
                    onClick={handleSaveAvailability}
                    disabled={loading || timeSlots.length === 0}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="w-5 h-5" />
                        <span>Save Availability</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleClearDate}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Clear Date
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Calendar View */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Availability Calendar</h2>
            
            {Object.keys(availability).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(availability)
                  .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
                  .map(([date, slots]) => (
                    <div
                      key={date}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleDateSelect(date)}
                    >
                      <div className="flex items-start space-x-3">
                        <CalendarIcon className="w-6 h-6 text-blue-600 mt-1" />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">
                            {new Date(date).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {slots.length} time slot{slots.length !== 1 ? 's' : ''}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {slots.map((slot, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                              >
                                {slot}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No availability set yet</p>
                <p className="text-sm text-gray-400 mt-2">Select a date and add time slots to get started</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Presets */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Presets (15-min slots)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => {
                const morning = generate15MinSlots('09:00', '12:00');
                const afternoon = generate15MinSlots('14:00', '17:00');
                setTimeSlots([...morning, ...afternoon]);
              }}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors text-left"
            >
              <p className="font-semibold text-gray-900">Morning & Afternoon</p>
              <p className="text-sm text-gray-600 mt-1">9 AM - 12 PM, 2 PM - 5 PM</p>
              <p className="text-xs text-blue-600 mt-1">24 slots (15-min each)</p>
            </button>

            <button
              onClick={() => {
                const slots = generate15MinSlots('09:00', '17:00');
                setTimeSlots(slots);
              }}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors text-left"
            >
              <p className="font-semibold text-gray-900">Full Day</p>
              <p className="text-sm text-gray-600 mt-1">9 AM - 5 PM</p>
              <p className="text-xs text-blue-600 mt-1">32 slots (15-min each)</p>
            </button>

            <button
              onClick={() => {
                const slots = generate15MinSlots('14:00', '20:00');
                setTimeSlots(slots);
              }}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors text-left"
            >
              <p className="font-semibold text-gray-900">Afternoon/Evening</p>
              <p className="text-sm text-gray-600 mt-1">2 PM - 8 PM</p>
              <p className="text-xs text-blue-600 mt-1">24 slots (15-min each)</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityManagement;
