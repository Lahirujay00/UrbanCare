/**
 * @fileoverview Custom hook for patient dashboard business logic
 * @author UrbanCare Development Team
 * @version 1.0.0
 */

import { useState, useEffect, useCallback } from 'react';
import { useService } from './useService';
import toast from 'react-hot-toast';

/**
 * Custom hook for patient dashboard data and operations
 * Separates business logic from UI components
 * @returns {Object} Dashboard data and operations
 */
export const usePatientDashboard = () => {
  const patientService = useService('patient');
  
  // State management
  const [data, setData] = useState({
    stats: {},
    appointments: [],
    medicalRecords: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * Fetches all dashboard data
   */
  const fetchDashboardData = useCallback(async () => {
    if (!patientService) return;

    try {
      setLoading(true);
      setError(null);
      
      const dashboardData = await patientService.getDashboardData();
      setData(dashboardData);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [patientService]);

  /**
   * Refreshes dashboard data
   */
  const refreshData = useCallback(async () => {
    if (!patientService) return;

    try {
      setRefreshing(true);
      setError(null);
      
      // Clear cache to get fresh data
      patientService.clearCache('patient_dashboard');
      
      const dashboardData = await patientService.getDashboardData();
      setData(dashboardData);
      toast.success('Dashboard refreshed');
    } catch (err) {
      setError(err.message);
      toast.error('Failed to refresh dashboard');
    } finally {
      setRefreshing(false);
    }
  }, [patientService]);

  /**
   * Books a new appointment
   * @param {Object} appointmentData - Appointment data
   */
  const bookAppointment = useCallback(async (appointmentData) => {
    if (!patientService) return;

    try {
      const newAppointment = await patientService.bookAppointment(appointmentData);
      
      // Update local state
      setData(prevData => ({
        ...prevData,
        appointments: [newAppointment, ...prevData.appointments]
      }));
      
      toast.success('Appointment booked successfully');
      return newAppointment;
    } catch (err) {
      toast.error(err.message || 'Failed to book appointment');
      throw err;
    }
  }, [patientService]);

  /**
   * Cancels an appointment
   * @param {string} appointmentId - Appointment ID
   * @param {string} reason - Cancellation reason
   */
  const cancelAppointment = useCallback(async (appointmentId, reason) => {
    if (!patientService) return;

    try {
      await patientService.cancelAppointment(appointmentId, reason);
      
      // Update local state
      setData(prevData => ({
        ...prevData,
        appointments: prevData.appointments.map(apt => 
          apt.id === appointmentId 
            ? { ...apt, status: 'cancelled' }
            : apt
        )
      }));
      
      toast.success('Appointment cancelled successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to cancel appointment');
      throw err;
    }
  }, [patientService]);

  /**
   * Gets upcoming appointments
   */
  const getUpcomingAppointments = useCallback(async () => {
    if (!patientService) return [];

    try {
      return await patientService.getUpcomingAppointments();
    } catch (err) {
      toast.error('Failed to load upcoming appointments');
      return [];
    }
  }, [patientService]);

  // Load data on mount and when service becomes available
  useEffect(() => {
    if (patientService) {
      fetchDashboardData();
    }
  }, [patientService, fetchDashboardData]);

  // Subscribe to service events
  useEffect(() => {
    if (!patientService) return;

    const unsubscribe = patientService.subscribe((event, eventData) => {
      if (event === 'data_updated') {
        // Refresh relevant data when service cache is updated
        if (eventData.cacheKey === 'patient_dashboard') {
          setData(eventData.data);
        }
      } else if (event === 'error') {
        setError(eventData.error.message);
      }
    });

    return unsubscribe;
  }, [patientService]);

  return {
    // Data
    data,
    loading,
    error,
    refreshing,
    
    // Operations
    refreshData,
    bookAppointment,
    cancelAppointment,
    getUpcomingAppointments,
    
    // Computed values
    hasAppointments: data.appointments.length > 0,
    hasMedicalRecords: data.medicalRecords.length > 0,
    upcomingAppointmentsCount: data.appointments.filter(apt => 
      apt.status === 'scheduled' || apt.status === 'confirmed'
    ).length,
    
    // Helper functions
    getAppointmentById: (id) => data.appointments.find(apt => apt.id === id),
    getMedicalRecordById: (id) => data.medicalRecords.find(record => record.id === id)
  };
};

export default usePatientDashboard;
