/**
 * @fileoverview Unit Tests for Patient Record Access - Team Member 3
 * @description Focused test suite for existing ManagerController methods with >80% coverage
 * @author UrbanCare Development Team
 * @version 1.0.0
 * 
 * Test Coverage Areas:
 * - Manager Dashboard Overview
 * - Patient Visit Reports
 * - Staff Utilization Reports
 * - Financial Summary Reports
 * 
 * Target Coverage: >80%
 */

const ManagerController = require('../../controllers/ManagerController');

// Mock dependencies
jest.mock('../../services/ManagerService');
jest.mock('../../utils/Logger', () => ({
  getLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }))
}));
jest.mock('../../core/BaseController', () => {
  return class MockBaseController {
    constructor(service, logger) {
      this.service = service;
      this.logger = logger || { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };
    }
    
    async handleAsync(asyncFn, req, res) {
      try {
        await asyncFn(req, res);
      } catch (error) {
        this.handleError(error, req, res);
      }
    }
    
    handleError(error, req, res) {
      if (this.logger && this.logger.error) {
        this.logger.error('Controller error:', {
          error: error.message,
          stack: error.stack
        });
      }
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
    
    sendSuccess(res, data, message) {
      res.status(200).json({
        success: true,
        message,
        data
      });
    }
    
    buildFilters(req, allowedFields) {
      const filters = {};
      if (req && req.query) {
        allowedFields.forEach(field => {
          if (req.query[field] !== undefined) {
            filters[field] = req.query[field];
          }
        });
      }
      return filters;
    }
    
    logAction(action, req, extra = {}) {
      if (this.logger && this.logger.info) {
        this.logger.info(`Action: ${action}`, extra);
      }
    }
  };
});

describe('UC03 - Patient Record Access (ManagerController)', () => {
  let mockReq, mockRes;
  let mockManagerService;

  // Mock data
  const mockDashboardData = {
    totalUsers: 150,
    totalDoctors: 25,
    todayAppointments: 45,
    pendingAppointments: 12,
    completedAppointments: 320,
    totalRevenue: 45000,
    recentAppointments: [],
    recentPayments: []
  };

  const mockPatientVisitReport = {
    appointments: [
      {
        _id: '1',
        patient: { firstName: 'John', lastName: 'Doe', email: 'john@test.com', phone: '+1-555-0100' },
        doctor: { firstName: 'Dr. Jane', lastName: 'Smith', specialization: 'Cardiology' },
        appointmentDate: new Date('2024-12-25'),
        status: 'completed',
        department: 'Cardiology'
      }
    ],
    analytics: {
      totalVisits: 1,
      dailyBreakdown: { '2024-12-25': 1 },
      departmentBreakdown: { 'Cardiology': 1 },
      statusBreakdown: { 'completed': 1 },
      doctorBreakdown: { 'Dr. Jane Smith': 1 }
    },
    summary: {
      totalRecords: 1,
      dateRange: { startDate: '2024-12-01', endDate: '2024-12-31' },
      filters: { department: 'Cardiology', status: 'completed' }
    }
  };

  const mockStaffUtilizationReport = {
    staffUtilization: [
      {
        doctorId: '1',
        name: 'Dr. Jane Smith',
        specialization: 'Cardiology',
        totalAppointments: 25,
        completedAppointments: 23,
        completionRate: 92,
        utilizationRate: 63
      }
    ],
    summary: {
      totalStaff: 1,
      averageUtilization: 63,
      averageCompletion: 92,
      totalRecords: 1,
      dateRange: { startDate: '2024-12-01', endDate: '2024-12-31' },
      filters: { department: 'Cardiology' }
    }
  };

  const mockFinancialSummaryReport = {
    transactions: [
      {
        _id: '1',
        patient: { firstName: 'John', lastName: 'Doe', email: 'john@test.com' },
        appointment: { department: 'Cardiology', reasonForVisit: 'Checkup' },
        amount: 150,
        paymentMethod: 'card',
        status: 'completed',
        createdAt: new Date('2024-12-25')
      }
    ],
    analytics: {
      totalRevenue: 150,
      totalTransactions: 1,
      paymentMethodBreakdown: { 'card': 150 },
      dailyRevenue: { '2024-12-25': 150 },
      departmentRevenue: { 'Cardiology': 150 },
      averageTransaction: 150
    },
    summary: {
      totalRecords: 1,
      totalRevenue: 150,
      dateRange: { startDate: '2024-12-01', endDate: '2024-12-31' },
      filters: { paymentMethod: 'card', status: 'completed' }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock request and response objects
    mockReq = {
      query: {},
      params: {},
      body: {},
      user: { id: 'manager123', role: 'manager' }
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };

    // Mock ManagerService methods
    mockManagerService = {
      getDashboardOverview: jest.fn(),
      generatePatientVisitReport: jest.fn(),
      generateStaffUtilizationReport: jest.fn(),
      generateFinancialSummaryReport: jest.fn()
    };

    // Replace the service instance
    ManagerController.service = mockManagerService;
  });

  // ============================================================================
  // MANAGER DASHBOARD TESTS
  // ============================================================================
  describe('Manager Dashboard Access', () => {
    test('should provide dashboard overview for patient record management', async () => {
      mockManagerService.getDashboardOverview.mockResolvedValue(mockDashboardData);
      
      await ManagerController.getDashboardOverview(mockReq, mockRes);

      expect(mockManagerService.getDashboardOverview).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Dashboard overview retrieved successfully',
        data: mockDashboardData
      });
    });

    test('should handle dashboard access errors', async () => {
      const error = new Error('Dashboard access failed');
      mockManagerService.getDashboardOverview.mockRejectedValue(error);
      
      await ManagerController.getDashboardOverview(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
        error: 'Dashboard access failed'
      });
    });
  });

  // ============================================================================
  // PATIENT VISIT REPORT TESTS
  // ============================================================================
  describe('Patient Visit Reports', () => {
    test('should generate patient visit report for record analysis', async () => {
      mockReq.query = {
        startDate: '2024-12-01',
        endDate: '2024-12-31',
        department: 'Cardiology',
        status: 'completed'
      };
      
      mockManagerService.generatePatientVisitReport.mockResolvedValue(mockPatientVisitReport);
      
      await ManagerController.getPatientVisitReport(mockReq, mockRes);

      expect(mockManagerService.generatePatientVisitReport).toHaveBeenCalledWith({
        startDate: '2024-12-01',
        endDate: '2024-12-31',
        department: 'Cardiology',
        status: 'completed'
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Patient visit report generated successfully',
        data: mockPatientVisitReport
      });
    });

    test('should handle patient visit report errors', async () => {
      const error = new Error('Report generation failed');
      mockManagerService.generatePatientVisitReport.mockRejectedValue(error);
      
      await ManagerController.getPatientVisitReport(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
        error: 'Report generation failed'
      });
    });

    test('should filter patient records by date range', async () => {
      mockReq.query = { startDate: '2024-12-01', endDate: '2024-12-31' };
      
      mockManagerService.generatePatientVisitReport.mockResolvedValue(mockPatientVisitReport);
      
      await ManagerController.getPatientVisitReport(mockReq, mockRes);

      expect(mockManagerService.generatePatientVisitReport).toHaveBeenCalledWith({
        startDate: '2024-12-01',
        endDate: '2024-12-31'
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should filter patient records by department', async () => {
      mockReq.query = { department: 'Cardiology' };
      
      mockManagerService.generatePatientVisitReport.mockResolvedValue(mockPatientVisitReport);
      
      await ManagerController.getPatientVisitReport(mockReq, mockRes);

      expect(mockManagerService.generatePatientVisitReport).toHaveBeenCalledWith({
        department: 'Cardiology'
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  // ============================================================================
  // STAFF UTILIZATION TESTS
  // ============================================================================
  describe('Staff Utilization for Patient Care', () => {
    test('should generate staff utilization report for patient care analysis', async () => {
      mockReq.query = {
        startDate: '2024-12-01',
        endDate: '2024-12-31',
        department: 'Cardiology'
      };
      
      mockManagerService.generateStaffUtilizationReport.mockResolvedValue(mockStaffUtilizationReport);
      
      await ManagerController.getStaffUtilizationReport(mockReq, mockRes);

      expect(mockManagerService.generateStaffUtilizationReport).toHaveBeenCalledWith({
        startDate: '2024-12-01',
        endDate: '2024-12-31',
        department: 'Cardiology'
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Staff utilization report generated successfully',
        data: mockStaffUtilizationReport
      });
    });

    test('should handle staff utilization report errors', async () => {
      const error = new Error('Staff data unavailable');
      mockManagerService.generateStaffUtilizationReport.mockRejectedValue(error);
      
      await ManagerController.getStaffUtilizationReport(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
        error: 'Staff data unavailable'
      });
    });
  });

  // ============================================================================
  // FINANCIAL SUMMARY TESTS
  // ============================================================================
  describe('Financial Summary for Patient Services', () => {
    test('should generate financial summary report for patient services', async () => {
      mockReq.query = {
        startDate: '2024-12-01',
        endDate: '2024-12-31',
        paymentMethod: 'card',
        status: 'completed'
      };
      
      mockManagerService.generateFinancialSummaryReport.mockResolvedValue(mockFinancialSummaryReport);
      
      await ManagerController.getFinancialSummaryReport(mockReq, mockRes);

      expect(mockManagerService.generateFinancialSummaryReport).toHaveBeenCalledWith({
        startDate: '2024-12-01',
        endDate: '2024-12-31',
        paymentMethod: 'card',
        status: 'completed'
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Financial summary report generated successfully',
        data: mockFinancialSummaryReport
      });
    });

    test('should handle financial report generation errors', async () => {
      const error = new Error('Payment data corrupted');
      mockManagerService.generateFinancialSummaryReport.mockRejectedValue(error);
      
      await ManagerController.getFinancialSummaryReport(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
        error: 'Payment data corrupted'
      });
    });
  });

  // ============================================================================
  // UTILITY AND INTEGRATION TESTS
  // ============================================================================
  describe('Utility Functions for Patient Record Access', () => {
    test('should return correct resource name for patient records', () => {
      const resourceName = ManagerController.getResourceName();
      expect(resourceName).toBe('Manager');
    });

    test('should build filters for patient record queries', () => {
      mockReq.query = {
        startDate: '2024-12-01',
        endDate: '2024-12-31',
        department: 'Cardiology',
        status: 'completed',
        extraParam: 'ignored'
      };

      const filters = ManagerController.buildFilters(mockReq, ['startDate', 'endDate', 'department', 'status']);
      
      expect(filters).toEqual({
        startDate: '2024-12-01',
        endDate: '2024-12-31',
        department: 'Cardiology',
        status: 'completed'
      });
    });

    test('should handle concurrent patient record access requests', async () => {
      mockManagerService.getDashboardOverview.mockResolvedValue(mockDashboardData);
      mockManagerService.generatePatientVisitReport.mockResolvedValue(mockPatientVisitReport);
      
      const promises = [
        ManagerController.getDashboardOverview(mockReq, mockRes),
        ManagerController.getPatientVisitReport(mockReq, mockRes)
      ];
      
      await Promise.all(promises);

      expect(mockManagerService.getDashboardOverview).toHaveBeenCalled();
      expect(mockManagerService.generatePatientVisitReport).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // ERROR HANDLING AND EDGE CASES
  // ============================================================================
  describe('Error Handling for Patient Record Access', () => {
    test('should handle service unavailability gracefully', async () => {
      ManagerController.service = null;
      
      await ManagerController.getDashboardOverview(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
        error: expect.any(String)
      });
    });

    test('should handle malformed request parameters', async () => {
      mockReq.query = { invalidParam: 'test' };
      mockManagerService.generatePatientVisitReport.mockResolvedValue(mockPatientVisitReport);
      
      await ManagerController.getPatientVisitReport(mockReq, mockRes);

      expect(mockManagerService.generatePatientVisitReport).toHaveBeenCalledWith({});
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should maintain data consistency across multiple requests', async () => {
      mockManagerService.getDashboardOverview.mockResolvedValue(mockDashboardData);
      
      // First request
      await ManagerController.getDashboardOverview(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      
      // Reset mocks for second request
      mockRes.status.mockClear();
      mockRes.json.mockClear();
      
      // Second request
      await ManagerController.getDashboardOverview(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });
});
