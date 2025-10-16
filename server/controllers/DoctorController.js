const DoctorService = require('../services/DoctorService');
const SlotManagementService = require('../services/SlotManagementService');
const PatientManagementService = require('../services/PatientManagementService');
const { validationResult } = require('express-validator');

/**
 * DoctorController - Handles HTTP requests for doctor operations
 * Follows Single Responsibility Principle - Only handles request/response logic
 * Delegates business logic to DoctorService
 */
class DoctorController {

  /**
   * Enhanced patient search with filters
   * GET /api/doctor/patients/search?q=searchQuery&gender=male&bloodType=O+&page=1&limit=20
   */
  async searchPatients(req, res) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { q: searchQuery, ...filterParams } = req.query;
      const doctorId = req.user.id;
      
      // Build filters object
      const filters = {};
      
      if (filterParams.gender) filters.gender = filterParams.gender;
      if (filterParams.bloodType) filters.bloodType = filterParams.bloodType;
      if (filterParams.sortBy) filters.sortBy = filterParams.sortBy;
      if (filterParams.page) filters.page = parseInt(filterParams.page);
      if (filterParams.limit) filters.limit = parseInt(filterParams.limit);
      
      // Age range filter
      if (filterParams.minAge || filterParams.maxAge) {
        filters.ageRange = {};
        if (filterParams.minAge) filters.ageRange.min = parseInt(filterParams.minAge);
        if (filterParams.maxAge) filters.ageRange.max = parseInt(filterParams.maxAge);
      }
      
      // Boolean filters
      if (filterParams.hasAllergies === 'true') filters.hasAllergies = true;
      if (filterParams.hasChronicConditions === 'true') filters.hasChronicConditions = true;
      
      // Last visit filter
      if (filterParams.lastVisitStart && filterParams.lastVisitEnd) {
        filters.lastVisit = {
          startDate: filterParams.lastVisitStart,
          endDate: filterParams.lastVisitEnd
        };
      }
      
      // Extract request info for audit logging
      const requestInfo = {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent') || 'Unknown'
      };

      const result = await DoctorService.searchPatients(searchQuery, filters, doctorId, requestInfo);
      
      res.status(200).json(result);

    } catch (error) {
      console.error('Enhanced search patients error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to search patients',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * Get recent patients for quick access
   * GET /api/doctor/patients/recent?limit=10
   */
  async getRecentPatients(req, res) {
    try {
      const { limit = 10 } = req.query;
      const doctorId = req.user.id;
      
      const requestInfo = {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent') || 'Unknown'
      };

      const result = await DoctorService.getRecentPatients(doctorId, parseInt(limit), requestInfo);
      
      res.status(200).json(result);

    } catch (error) {
      console.error('Get recent patients error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get recent patients',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * Get patient's complete medical history
   * GET /api/doctor/patients/:patientId/medical-history
   * User Story 3: View patient's complete medical history
   */
  async getPatientMedicalHistory(req, res) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { patientId } = req.params;
      const doctorId = req.user.id;
      
      const requestInfo = {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent') || 'Unknown'
      };

      const result = await DoctorService.getPatientMedicalHistory(patientId, doctorId, requestInfo);
      
      res.status(200).json(result);

    } catch (error) {
      console.error('Get patient medical history error:', error);
      
      // Return appropriate status code based on error type
      const statusCode = error.message.includes('not found') ? 404 : 500;
      
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to retrieve patient medical history',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * Add treatment notes to patient record
   * POST /api/doctor/patients/:patientId/treatment-notes
   * User Story 4: Add new treatment notes during/after consultation
   */
  async addTreatmentNote(req, res) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { patientId } = req.params;
      const treatmentData = req.body;
      const doctorId = req.user.id;
      
      const requestInfo = {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent') || 'Unknown'
      };

      const result = await DoctorService.addTreatmentNote(patientId, treatmentData, doctorId, requestInfo);
      
      res.status(201).json(result);

    } catch (error) {
      console.error('Add treatment note error:', error);
      
      const statusCode = error.message.includes('not found') ? 404 : 500;
      
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to add treatment note',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * Update existing treatment note
   * PUT /api/doctor/treatment-notes/:recordId
   * User Story 5: Update patient records with secure logging
   */
  async updateTreatmentNote(req, res) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { recordId } = req.params;
      const updateData = req.body;
      const doctorId = req.user.id;
      
      const requestInfo = {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent') || 'Unknown'
      };

      const result = await DoctorService.updateTreatmentNote(recordId, updateData, doctorId, requestInfo);
      
      res.status(200).json(result);

    } catch (error) {
      console.error('Update treatment note error:', error);
      
      let statusCode = 500;
      if (error.message.includes('not found')) statusCode = 404;
      if (error.message.includes('Unauthorized')) statusCode = 403;
      
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update treatment note',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * Get doctor's schedule and upcoming appointments
   * GET /api/doctor/schedule
   * User Story 6 & 7: View schedule and available slots
   */
  async getSchedule(req, res) {
    try {
      const doctorId = req.user.id;
      
      const requestInfo = {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent') || 'Unknown'
      };

      const result = await DoctorService.getDoctorSchedule(doctorId, requestInfo);
      
      res.status(200).json(result);

    } catch (error) {
      console.error('Get schedule error:', error);
      
      const statusCode = error.message.includes('not found') ? 404 : 500;
      
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to retrieve schedule',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * Update doctor's availability
   * PUT /api/doctor/availability
   * User Story 6: Manage schedule and block specific times
   */
  async updateAvailability(req, res) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const availabilityData = req.body;
      const doctorId = req.user.id;
      
      const requestInfo = {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent') || 'Unknown'
      };

      const result = await DoctorService.updateAvailability(doctorId, availabilityData, requestInfo);
      
      res.status(200).json(result);

    } catch (error) {
      console.error('Update availability error:', error);
      
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update availability',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * Get doctor's dashboard summary
   * GET /api/doctor/dashboard
   */
  async getDashboard(req, res) {
    try {
      const doctorId = req.user.id;
      
      // This could be expanded to include dashboard-specific data
      const requestInfo = {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent') || 'Unknown'
      };

      const scheduleResult = await DoctorService.getDoctorSchedule(doctorId, requestInfo);
      
      // Add dashboard-specific summary data
      const dashboardData = {
        ...scheduleResult.data,
        summary: {
          todaysAppointments: scheduleResult.data.upcomingAppointments.filter(apt => {
            const today = new Date();
            const aptDate = new Date(apt.appointmentDate);
            return aptDate.toDateString() === today.toDateString();
          }).length,
          totalUpcoming: scheduleResult.data.upcomingAppointments.length,
          lastLogin: req.user.lastLogin
        }
      };

      res.status(200).json({
        success: true,
        data: dashboardData,
        message: 'Dashboard data retrieved successfully'
      });

    } catch (error) {
      console.error('Get dashboard error:', error);
      
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve dashboard data',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  // ==================== SLOT MANAGEMENT METHODS ====================

  /**
   * Get doctor's slots for a specific date or date range
   * GET /api/doctor/slots?startDate=2024-01-15&endDate=2024-01-15
   */
  async getSlots(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const doctorId = req.user.id;
      
      if (!startDate) {
        return res.status(400).json({
          success: false,
          message: 'Start date is required'
        });
      }

      const requestInfo = {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent') || 'Unknown'
      };

      const result = await SlotManagementService.getDoctorSlots(doctorId, startDate, endDate, requestInfo);
      
      res.status(200).json(result);

    } catch (error) {
      console.error('Get slots error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve slots',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * Create new time slots
   * POST /api/doctor/slots
   */
  async createSlots(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const doctorId = req.user.id;
      const slotData = req.body;
      
      const requestInfo = {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent') || 'Unknown'
      };

      const result = await SlotManagementService.createSlots(doctorId, slotData, requestInfo);
      
      res.status(201).json(result);

    } catch (error) {
      console.error('Create slots error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create slots',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * Block specific time slots (make unavailable)
   * POST /api/doctor/slots/block
   */
  async blockSlots(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { slotIds, reason, description } = req.body;
      const doctorId = req.user.id;
      
      const requestInfo = {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent') || 'Unknown'
      };

      const result = await SlotManagementService.blockSlots(
        doctorId, 
        slotIds, 
        { reason, description }, 
        requestInfo
      );
      
      res.status(200).json(result);

    } catch (error) {
      console.error('Block slots error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to block slots',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * Unblock previously blocked slots (make available again)
   * POST /api/doctor/slots/unblock
   */
  async unblockSlots(req, res) {
    try {
      const { slotIds } = req.body;
      const doctorId = req.user.id;
      
      if (!slotIds || !Array.isArray(slotIds) || slotIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Slot IDs array is required'
        });
      }

      const requestInfo = {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent') || 'Unknown'
      };

      const result = await SlotManagementService.unblockSlots(doctorId, slotIds, requestInfo);
      
      res.status(200).json(result);

    } catch (error) {
      console.error('Unblock slots error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to unblock slots',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * Quick block slots for a time range (emergency blocking)
   * POST /api/doctor/slots/quick-block
   */
  async quickBlockSlots(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const doctorId = req.user.id;
      const blockData = req.body;
      
      const requestInfo = {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent') || 'Unknown'
      };

      const result = await SlotManagementService.quickBlockSlots(doctorId, blockData, requestInfo);
      
      res.status(200).json(result);

    } catch (error) {
      console.error('Quick block slots error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to quick block slots',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * Get today's schedule with slot details
   * GET /api/doctor/slots/today
   */
  async getTodaySchedule(req, res) {
    try {
      const doctorId = req.user.id;
      
      const requestInfo = {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent') || 'Unknown'
      };

      const result = await SlotManagementService.getTodaySchedule(doctorId, requestInfo);
      
      res.status(200).json(result);

    } catch (error) {
      console.error('Get today schedule error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get today\'s schedule',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * Get available slots for patient booking (public endpoint)
   * GET /api/doctor/slots/available?doctorId=123&date=2024-01-15
   */
  async getAvailableSlots(req, res) {
    try {
      const { doctorId, date } = req.query;
      
      if (!doctorId || !date) {
        return res.status(400).json({
          success: false,
          message: 'Doctor ID and date are required'
        });
      }

      const result = await SlotManagementService.getAvailableSlots(doctorId, date);
      
      res.status(200).json(result);

    } catch (error) {
      console.error('Get available slots error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get available slots',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  // ==================== PATIENT MANAGEMENT METHODS ====================

  /**
   * Get patient management dashboard
   * GET /api/doctor/patients/dashboard
   */
  async getPatientDashboard(req, res) {
    try {
      const doctorId = req.user.id;
      
      const requestInfo = {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent') || 'Unknown'
      };

      const result = await PatientManagementService.getPatientDashboard(doctorId, requestInfo);
      
      res.status(200).json(result);

    } catch (error) {
      console.error('Get patient dashboard error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get patient dashboard',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * Get comprehensive patient profile (replaces separate medical records tab)
   * GET /api/doctor/patients/:patientId/profile
   */
  async getPatientProfile(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { patientId } = req.params;
      const doctorId = req.user.id;
      
      const requestInfo = {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent') || 'Unknown'
      };

      const result = await PatientManagementService.getPatientProfile(patientId, doctorId, requestInfo);
      
      res.status(200).json(result);

    } catch (error) {
      console.error('Get patient profile error:', error);
      
      const statusCode = error.message.includes('not found') ? 404 : 500;
      
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to get patient profile',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * Get patient list with enhanced filtering
   * GET /api/doctor/patients/list?searchQuery=John&gender=male&page=1&limit=25
   */
  async getPatientList(req, res) {
    try {
      const doctorId = req.user.id;
      const filters = {
        searchQuery: req.query.q || req.query.searchQuery,
        gender: req.query.gender,
        bloodType: req.query.bloodType,
        sortBy: req.query.sortBy,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 25
      };
      
      const requestInfo = {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent') || 'Unknown'
      };

      const result = await PatientManagementService.getPatientList(filters, doctorId, requestInfo);
      
      res.status(200).json(result);

    } catch (error) {
      console.error('Get patient list error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get patient list',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
}

module.exports = new DoctorController();
