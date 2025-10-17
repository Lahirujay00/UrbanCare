/**
 * @fileoverview Patient Service handling patient-specific business logic
 * @author UrbanCare Development Team
 * @version 1.0.0
 */

import BaseService from './BaseService';
import ApiService from './ApiService';

/**
 * PatientService class handling patient-specific operations
 * Extends BaseService following SOLID principles
 */
class PatientService extends BaseService {
  /**
   * Creates an instance of PatientService
   */
  constructor() {
    super(ApiService.getInstance());
    this.endpoints = {
      dashboard: '/dashboard/stats',
      appointments: '/appointments',
      medicalRecords: '/medical-records',
      profile: '/users/profile',
      healthCard: '/health-cards',
      documents: '/documents'
    };
  }

  /**
   * Gets comprehensive dashboard data for patient
   * @returns {Promise<Object>} Dashboard data
   */
  async getDashboardData() {
    const cacheKey = 'patient_dashboard';
    
    return this.handleApiCall(
      async () => {
        // Fetch all dashboard data in parallel
        const [stats, appointments, medicalRecords, recentActivity] = await Promise.all([
          this.getPatientStats(),
          this.getRecentAppointments(5),
          this.getRecentMedicalRecords(5),
          this.getRecentActivity(10)
        ]);

        return {
          stats,
          appointments,
          medicalRecords,
          recentActivity,
          lastUpdated: new Date().toISOString()
        };
      },
      cacheKey,
      { useCache: true, cacheTTL: 300000 } // 5 minutes cache
    );
  }

  /**
   * Gets patient statistics
   * @returns {Promise<Object>} Patient statistics
   */
  async getPatientStats() {
    return this.handleApiCall(
      () => this.api.get(this.endpoints.dashboard),
      'patient_stats',
      { useCache: true, cacheTTL: 600000 } // 10 minutes cache
    );
  }

  /**
   * Gets patient appointments with filtering options
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Appointments array
   */
  async getAppointments(options = {}) {
    const {
      limit = 10,
      status = null,
      startDate = null,
      endDate = null,
      doctorId = null
    } = options;

    const params = { limit };
    if (status) params.status = status;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (doctorId) params.doctorId = doctorId;

    return this.handleApiCall(
      () => this.api.get(this.endpoints.appointments, params),
      `appointments_${JSON.stringify(params)}`,
      { useCache: true, cacheTTL: 180000 } // 3 minutes cache
    );
  }

  /**
   * Gets recent appointments
   * @param {number} limit - Number of appointments to fetch
   * @returns {Promise<Array>} Recent appointments
   */
  async getRecentAppointments(limit = 5) {
    return this.getAppointments({ limit, status: null });
  }

  /**
   * Gets upcoming appointments
   * @param {number} limit - Number of appointments to fetch
   * @returns {Promise<Array>} Upcoming appointments
   */
  async getUpcomingAppointments(limit = 5) {
    const today = new Date().toISOString().split('T')[0];
    return this.getAppointments({ 
      limit, 
      startDate: today,
      status: 'scheduled,confirmed' 
    });
  }

  /**
   * Books a new appointment
   * @param {Object} appointmentData - Appointment data
   * @returns {Promise<Object>} Created appointment
   */
  async bookAppointment(appointmentData) {
    // Validate appointment data
    this.validateData(appointmentData, {
      doctorId: { required: true, type: 'string' },
      appointmentDate: { required: true, type: 'string' },
      reasonForVisit: { required: true, type: 'string', minLength: 5, maxLength: 500 },
      duration: { type: 'number' }
    });

    const transformedData = this.transformForApi(appointmentData);
    
    const result = await this.handleApiCall(
      () => this.api.post(this.endpoints.appointments, transformedData)
    );

    // Clear related caches
    this.clearCache('patient_dashboard');
    this.clearCache('patient_stats');
    
    return result;
  }

  /**
   * Cancels an appointment
   * @param {string} appointmentId - Appointment ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>} Updated appointment
   */
  async cancelAppointment(appointmentId, reason) {
    const result = await this.handleApiCall(
      () => this.api.put(`${this.endpoints.appointments}/${appointmentId}/cancel`, { reason })
    );

    // Clear related caches
    this.clearCache('patient_dashboard');
    this.clearCache('patient_stats');
    
    return result;
  }

  /**
   * Gets medical records
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Medical records
   */
  async getMedicalRecords(options = {}) {
    const { limit = 10, recordType = null } = options;
    const params = { limit };
    if (recordType) params.recordType = recordType;

    return this.handleApiCall(
      () => this.api.get(this.endpoints.medicalRecords, params),
      `medical_records_${JSON.stringify(params)}`,
      { useCache: true, cacheTTL: 300000 } // 5 minutes cache
    );
  }

  /**
   * Gets recent medical records
   * @param {number} limit - Number of records to fetch
   * @returns {Promise<Array>} Recent medical records
   */
  async getRecentMedicalRecords(limit = 5) {
    return this.getMedicalRecords({ limit });
  }

  /**
   * Gets patient profile
   * @returns {Promise<Object>} Patient profile
   */
  async getProfile() {
    return this.handleApiCall(
      () => this.api.get(this.endpoints.profile),
      'patient_profile',
      { useCache: true, cacheTTL: 600000 } // 10 minutes cache
    );
  }

  /**
   * Updates patient profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} Updated profile
   */
  async updateProfile(profileData) {
    // Validate profile data
    this.validateData(profileData, {
      firstName: { type: 'string', minLength: 2, maxLength: 50 },
      lastName: { type: 'string', minLength: 2, maxLength: 50 },
      email: { type: 'string' },
      phone: { type: 'string' }
    });

    const result = await this.handleApiCall(
      () => this.api.put(this.endpoints.profile, profileData)
    );

    // Clear profile cache
    this.clearCache('patient_profile');
    
    return result;
  }

  /**
   * Gets health card information
   * @returns {Promise<Object>} Health card data
   */
  async getHealthCard() {
    return this.handleApiCall(
      () => this.api.get(this.endpoints.healthCard),
      'health_card',
      { useCache: true, cacheTTL: 3600000 } // 1 hour cache
    );
  }

  /**
   * Gets patient documents
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Documents array
   */
  async getDocuments(options = {}) {
    const { limit = 20, documentType = null } = options;
    const params = { limit };
    if (documentType) params.documentType = documentType;

    return this.handleApiCall(
      () => this.api.get(this.endpoints.documents, params),
      `documents_${JSON.stringify(params)}`,
      { useCache: true, cacheTTL: 300000 } // 5 minutes cache
    );
  }

  /**
   * Uploads a document
   * @param {File} file - File to upload
   * @param {Object} metadata - Document metadata
   * @param {Function} onProgress - Upload progress callback
   * @returns {Promise<Object>} Upload result
   */
  async uploadDocument(file, metadata = {}, onProgress = null) {
    const formData = new FormData();
    formData.append('document', file);
    
    Object.entries(metadata).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const result = await this.handleApiCall(
      () => this.api.uploadFile(this.endpoints.documents, formData, onProgress)
    );

    // Clear documents cache
    this.clearCache('documents');
    
    return result;
  }

  /**
   * Gets recent activity for the patient
   * @param {number} limit - Number of activities to fetch
   * @returns {Promise<Array>} Recent activities
   */
  async getRecentActivity(limit = 10) {
    // This would typically come from a dedicated activity endpoint
    // For now, we'll aggregate from appointments and medical records
    const [appointments, records] = await Promise.all([
      this.getRecentAppointments(limit / 2),
      this.getRecentMedicalRecords(limit / 2)
    ]);

    // Combine and sort by date
    const activities = [
      ...appointments.map(apt => ({
        id: apt.id,
        type: 'appointment',
        title: `Appointment with Dr. ${apt.doctor?.firstName} ${apt.doctor?.lastName}`,
        date: apt.appointmentDate,
        status: apt.status,
        data: apt
      })),
      ...records.map(record => ({
        id: record.id,
        type: 'medical_record',
        title: record.recordType || 'Medical Record',
        date: record.createdAt,
        status: 'completed',
        data: record
      }))
    ];

    return activities
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);
  }

  /**
   * Transforms data for API consumption
   * @param {Object} data - Data to transform
   * @returns {Object} Transformed data
   */
  transformForApi(data) {
    // Convert date strings to proper format
    if (data.appointmentDate && typeof data.appointmentDate === 'string') {
      data.appointmentDate = new Date(data.appointmentDate).toISOString();
    }
    
    return data;
  }

  /**
   * Transforms data from API response
   * @param {Object} data - API response data
   * @returns {Object} Transformed data
   */
  transformFromApi(data) {
    // Convert ISO date strings to Date objects for easier handling
    if (data.appointmentDate) {
      data.appointmentDate = new Date(data.appointmentDate);
    }
    
    if (data.createdAt) {
      data.createdAt = new Date(data.createdAt);
    }
    
    return data;
  }

  /**
   * Gets service name
   * @returns {string} Service name
   */
  getServiceName() {
    return 'PatientService';
  }

  /**
   * Clears all patient-related caches
   */
  clearAllCaches() {
    this.clearCache();
  }
}

export default PatientService;
