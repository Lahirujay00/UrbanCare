/**
 * @fileoverview Unit Tests for ManagerService - Team Member 3
 * @description Comprehensive test suite for ManagerService with >80% coverage
 * @author UrbanCare Development Team
 * @version 1.0.0
 * 
 * Test Coverage Areas:
 * - Dashboard Overview Statistics
 * - Patient Visit Report Generation
 * - Staff Utilization Analytics
 * - Financial Summary Reports
 * - Private Helper Methods
 * - Error Handling and Edge Cases
 * 
 * Target Coverage: >80%
 */

const ManagerService = require('../../services/ManagerService');
const UserRepository = require('../../repositories/UserRepository');
const AppointmentRepository = require('../../repositories/AppointmentRepository');
const PaymentRepository = require('../../repositories/PaymentRepository');

// Mock dependencies
jest.mock('../../repositories/UserRepository');
jest.mock('../../repositories/AppointmentRepository');
jest.mock('../../repositories/PaymentRepository');
jest.mock('../../utils/Logger', () => ({
  getLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }))
}));

describe('ManagerService - >80% Coverage Tests', () => {
  let managerService;
  let mockUserRepository, mockAppointmentRepository, mockPaymentRepository;

  // Mock data
  const mockUsers = {
    data: [
      { _id: '1', firstName: 'John', lastName: 'Doe', role: 'patient' },
      { _id: '2', firstName: 'Jane', lastName: 'Smith', role: 'doctor', specialization: 'Cardiology' }
    ]
  };

  const mockAppointments = {
    data: [
      {
        _id: '1',
        patient: { _id: '1', firstName: 'John', lastName: 'Doe', email: 'john@test.com', phone: '+1-555-0100' },
        doctor: { _id: '2', firstName: 'Jane', lastName: 'Smith', specialization: 'Cardiology' },
        appointmentDate: new Date('2024-12-25'),
        appointmentTime: '10:00',
        status: 'completed',
        department: 'Cardiology',
        createdAt: new Date('2024-12-20')
      }
    ]
  };

  const mockPayments = {
    data: [
      {
        _id: '1',
        patient: { _id: '1', firstName: 'John', lastName: 'Doe', email: 'john@test.com' },
        appointment: { department: 'Cardiology', reasonForVisit: 'Checkup' },
        amount: 150,
        paymentMethod: 'card',
        status: 'completed',
        createdAt: new Date('2024-12-25')
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock repositories
    mockUserRepository = {
      count: jest.fn(),
      findMany: jest.fn()
    };
    
    mockAppointmentRepository = {
      count: jest.fn(),
      findMany: jest.fn()
    };
    
    mockPaymentRepository = {
      count: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn()
    };

    // Create service instance
    managerService = new ManagerService(
      mockUserRepository,
      mockAppointmentRepository,
      mockPaymentRepository
    );

    // Mock emit method
    managerService.emit = jest.fn();
  });

  // ============================================================================
  // DASHBOARD OVERVIEW TESTS
  // ============================================================================
  describe('getDashboardOverview', () => {
    beforeEach(() => {
      // Setup default mocks for dashboard
      mockUserRepository.count
        .mockResolvedValueOnce(150) // totalUsers
        .mockResolvedValueOnce(25); // totalDoctors
      
      mockAppointmentRepository.count
        .mockResolvedValueOnce(45) // todayAppointments
        .mockResolvedValueOnce(12) // pendingAppointments
        .mockResolvedValueOnce(320); // completedAppointments
      
      mockAppointmentRepository.findMany.mockResolvedValue(mockAppointments);
      mockPaymentRepository.findMany.mockResolvedValue(mockPayments);
      mockPaymentRepository.aggregate.mockResolvedValue([{ _id: null, total: 45000 }]);
    });

    // POSITIVE CASES
    test('should get dashboard overview successfully', async () => {
      const result = await managerService.getDashboardOverview();

      expect(result).toEqual({
        totalUsers: 150,
        totalDoctors: 25,
        todayAppointments: 45,
        pendingAppointments: 12,
        completedAppointments: 320,
        totalRevenue: 45000,
        recentAppointments: mockAppointments.data,
        recentPayments: mockPayments.data
      });

      expect(managerService.emit).toHaveBeenCalledWith('dashboardAccessed', {
        statistics: expect.any(Object)
      });
    });

    test('should handle zero revenue case', async () => {
      mockPaymentRepository.aggregate.mockResolvedValue([]);
      
      const result = await managerService.getDashboardOverview();
      
      expect(result.totalRevenue).toBe(0);
    });

    // NEGATIVE CASES - Covered in other error handling tests

    test('should handle revenue calculation errors', async () => {
      mockPaymentRepository.aggregate.mockRejectedValue(new Error('Aggregate failed'));
      
      const result = await managerService.getDashboardOverview();
      
      expect(result.totalRevenue).toBe(0);
    });
  });

  // ============================================================================
  // PATIENT VISIT REPORT TESTS
  // ============================================================================
  describe('generatePatientVisitReport', () => {
    beforeEach(() => {
      mockAppointmentRepository.findMany.mockResolvedValue(mockAppointments);
    });

    // POSITIVE CASES
    test('should generate patient visit report with filters', async () => {
      const filters = {
        startDate: '2024-12-01',
        endDate: '2024-12-31',
        department: 'Cardiology',
        status: 'completed'
      };

      const result = await managerService.generatePatientVisitReport(filters);

      expect(result).toEqual({
        appointments: mockAppointments.data,
        analytics: expect.objectContaining({
          totalVisits: 1,
          dailyBreakdown: { '2024-12-25': 1 },
          departmentBreakdown: { 'Cardiology': 1 },
          statusBreakdown: { 'completed': 1 },
          doctorBreakdown: { 'Jane Smith': 1 }
        }),
        summary: {
          totalRecords: 1,
          dateRange: { startDate: '2024-12-01', endDate: '2024-12-31' },
          filters: { department: 'Cardiology', status: 'completed' }
        }
      });

      expect(mockAppointmentRepository.findMany).toHaveBeenCalledWith(
        {
          appointmentDate: {
            $gte: new Date('2024-12-01'),
            $lte: new Date('2024-12-31')
          },
          department: 'Cardiology',
          status: 'completed'
        },
        expect.any(Object)
      );

      expect(managerService.emit).toHaveBeenCalledWith('reportGenerated', {
        type: 'patient-visit',
        recordCount: 1,
        filters
      });
    });

    test('should generate report without filters', async () => {
      const result = await managerService.generatePatientVisitReport();

      expect(result.appointments).toEqual(mockAppointments.data);
      expect(result.analytics.totalVisits).toBe(1);
      expect(mockAppointmentRepository.findMany).toHaveBeenCalledWith({}, expect.any(Object));
    });

    test('should handle empty appointments', async () => {
      mockAppointmentRepository.findMany.mockResolvedValue({ data: [] });

      const result = await managerService.generatePatientVisitReport();

      expect(result.appointments).toEqual([]);
      expect(result.analytics.totalVisits).toBe(0);
    });

    // NEGATIVE CASES
    test('should handle repository errors', async () => {
      mockAppointmentRepository.findMany.mockRejectedValue(new Error('Repository error'));

      await expect(managerService.generatePatientVisitReport()).rejects.toThrow();
    });
  });

  // ============================================================================
  // STAFF UTILIZATION REPORT TESTS
  // ============================================================================
  describe('generateStaffUtilizationReport', () => {
    beforeEach(() => {
      mockUserRepository.findMany.mockResolvedValue(mockUsers);
      mockAppointmentRepository.findMany.mockResolvedValue(mockAppointments);
    });

    // POSITIVE CASES
    test('should generate staff utilization report with filters', async () => {
      const filters = {
        startDate: '2024-12-01',
        endDate: '2024-12-31',
        department: 'Cardiology'
      };

      const result = await managerService.generateStaffUtilizationReport(filters);

      expect(result).toEqual({
        staffUtilization: expect.arrayContaining([
          expect.objectContaining({
            name: 'John Doe',
            totalAppointments: expect.any(Number),
            completedAppointments: expect.any(Number),
            completionRate: expect.any(Number),
            utilizationRate: expect.any(Number)
          })
        ]),
        summary: expect.objectContaining({
          totalStaff: expect.any(Number),
          averageUtilization: expect.any(Number),
          averageCompletion: expect.any(Number),
          totalRecords: expect.any(Number),
          dateRange: { startDate: '2024-12-01', endDate: '2024-12-31' },
          filters: { department: 'Cardiology' }
        })
      });

      expect(managerService.emit).toHaveBeenCalledWith('reportGenerated', {
        type: 'staff-utilization',
        staffCount: 2,
        filters
      });
    });

    test('should handle empty staff data', async () => {
      mockUserRepository.findMany.mockResolvedValue({ data: [] });

      const result = await managerService.generateStaffUtilizationReport();

      expect(result.staffUtilization).toEqual([]);
      expect(result.summary.totalStaff).toBe(0);
      expect(result.summary.averageUtilization).toBe(0);
      expect(result.summary.averageCompletion).toBe(0);
    });

    // NEGATIVE CASES
    test('should handle repository errors', async () => {
      mockUserRepository.findMany.mockRejectedValue(new Error('Repository error'));

      await expect(managerService.generateStaffUtilizationReport()).rejects.toThrow();
    });
  });

  // ============================================================================
  // FINANCIAL SUMMARY REPORT TESTS
  // ============================================================================
  describe('generateFinancialSummaryReport', () => {
    beforeEach(() => {
      mockPaymentRepository.findMany.mockResolvedValue(mockPayments);
    });

    // POSITIVE CASES
    test('should generate financial summary report with filters', async () => {
      const filters = {
        startDate: '2024-12-01',
        endDate: '2024-12-31',
        paymentMethod: 'card',
        status: 'completed'
      };

      const result = await managerService.generateFinancialSummaryReport(filters);

      expect(result).toEqual({
        transactions: mockPayments.data,
        analytics: expect.objectContaining({
          totalRevenue: 150,
          totalTransactions: 1,
          paymentMethodBreakdown: { 'card': 150 },
          dailyRevenue: { '2024-12-25': 150 },
          departmentRevenue: { 'Cardiology': 150 },
          averageTransaction: 150
        }),
        summary: {
          totalRecords: 1,
          totalRevenue: 150,
          dateRange: { startDate: '2024-12-01', endDate: '2024-12-31' },
          filters: { paymentMethod: 'card', status: 'completed' }
        }
      });

      expect(managerService.emit).toHaveBeenCalledWith('reportGenerated', {
        type: 'financial-summary',
        transactionCount: 1,
        totalRevenue: 150,
        filters
      });
    });

    test('should handle empty payments', async () => {
      mockPaymentRepository.findMany.mockResolvedValue({ data: [] });

      const result = await managerService.generateFinancialSummaryReport();

      expect(result.transactions).toEqual([]);
      expect(result.analytics.totalRevenue).toBe(0);
      expect(result.analytics.averageTransaction).toBe(0);
    });

    // NEGATIVE CASES
    test('should handle repository errors', async () => {
      mockPaymentRepository.findMany.mockRejectedValue(new Error('Repository error'));

      await expect(managerService.generateFinancialSummaryReport()).rejects.toThrow();
    });
  });

  // ============================================================================
  // PRIVATE HELPER METHOD TESTS
  // ============================================================================
  describe('Private Helper Methods', () => {
    test('should calculate total revenue correctly', async () => {
      mockPaymentRepository.aggregate.mockResolvedValue([{ _id: null, total: 1000 }]);

      const result = await managerService.calculateTotalRevenue();

      expect(result).toBe(1000);
      expect(mockPaymentRepository.aggregate).toHaveBeenCalledWith([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
    });

    test('should return 0 when no revenue data', async () => {
      mockPaymentRepository.aggregate.mockResolvedValue([]);

      const result = await managerService.calculateTotalRevenue();

      expect(result).toBe(0);
    });

    test('should handle revenue calculation errors', async () => {
      mockPaymentRepository.aggregate.mockRejectedValue(new Error('Aggregate error'));

      const result = await managerService.calculateTotalRevenue();

      expect(result).toBe(0);
    });

    test('should generate visit analytics correctly', () => {
      const appointments = [
        {
          appointmentDate: new Date('2024-12-25'),
          department: 'Cardiology',
          status: 'completed',
          doctor: { firstName: 'Jane', lastName: 'Smith' }
        },
        {
          appointmentDate: new Date('2024-12-25'),
          department: 'Neurology',
          status: 'scheduled',
          doctor: { firstName: 'John', lastName: 'Doe' }
        }
      ];

      const result = managerService.generateVisitAnalytics(appointments);

      expect(result).toEqual({
        totalVisits: 2,
        dailyBreakdown: { '2024-12-25': 2 },
        departmentBreakdown: { 'Cardiology': 1, 'Neurology': 1 },
        statusBreakdown: { 'completed': 1, 'scheduled': 1 },
        doctorBreakdown: { 'Jane Smith': 1, 'John Doe': 1 }
      });
    });

    test('should calculate staff utilization correctly', () => {
      const doctors = [
        { _id: '1', firstName: 'Jane', lastName: 'Smith', specialization: 'Cardiology' }
      ];
      
      const appointments = [
        { doctor: { _id: '1' }, status: 'completed' },
        { doctor: { _id: '1' }, status: 'completed' },
        { doctor: { _id: '1' }, status: 'scheduled' }
      ];

      const result = managerService.calculateStaffUtilization(doctors, appointments);

      expect(result).toEqual([{
        doctorId: '1',
        name: 'Jane Smith',
        specialization: 'Cardiology',
        totalAppointments: 3,
        completedAppointments: 2,
        completionRate: 67,
        utilizationRate: 8 // 3/40 * 100 rounded
      }]);
    });

    test('should calculate utilization summary correctly', () => {
      const staffUtilization = [
        { utilizationRate: 80, completionRate: 90 },
        { utilizationRate: 60, completionRate: 85 }
      ];

      const result = managerService.calculateUtilizationSummary(staffUtilization);

      expect(result).toEqual({
        totalStaff: 2,
        averageUtilization: 70,
        averageCompletion: 88
      });
    });

    test('should handle empty staff utilization', () => {
      const result = managerService.calculateUtilizationSummary([]);

      expect(result).toEqual({
        totalStaff: 0,
        averageUtilization: 0,
        averageCompletion: 0
      });
    });

    test('should generate financial analytics correctly', () => {
      const payments = [
        {
          amount: 100,
          status: 'completed',
          paymentMethod: 'card',
          createdAt: new Date('2024-12-25'),
          appointment: { department: 'Cardiology' }
        },
        {
          amount: 50,
          status: 'completed',
          paymentMethod: 'cash',
          createdAt: new Date('2024-12-25'),
          appointment: { department: 'Neurology' }
        }
      ];

      const result = managerService.generateFinancialAnalytics(payments);

      expect(result).toEqual({
        totalRevenue: 150,
        totalTransactions: 2,
        paymentMethodBreakdown: { 'card': 100, 'cash': 50 },
        dailyRevenue: { '2024-12-25': 150 },
        departmentRevenue: { 'Cardiology': 100, 'Neurology': 50 },
        averageTransaction: 75
      });
    });
  });

  // ============================================================================
  // UTILITY METHOD TESTS
  // ============================================================================
  describe('Utility Methods', () => {
    test('should return correct resource name', () => {
      const resourceName = managerService.getResourceName();
      expect(resourceName).toBe('Manager');
    });
  });

  // ============================================================================
  // ERROR HANDLING TESTS
  // ============================================================================
  describe('Error Handling', () => {
    test('should handle service errors in dashboard overview', async () => {
      mockUserRepository.count.mockRejectedValue(new Error('Database connection failed'));

      await expect(managerService.getDashboardOverview()).rejects.toThrow('Database connection failed');
    });

    test('should handle service errors in patient visit report', async () => {
      mockAppointmentRepository.findMany.mockRejectedValue(new Error('Query failed'));

      await expect(managerService.generatePatientVisitReport()).rejects.toThrow('Query failed');
    });

    test('should handle service errors in staff utilization report', async () => {
      mockUserRepository.findMany.mockRejectedValue(new Error('User query failed'));

      await expect(managerService.generateStaffUtilizationReport()).rejects.toThrow('User query failed');
    });

    test('should handle service errors in financial summary report', async () => {
      mockPaymentRepository.findMany.mockRejectedValue(new Error('Payment query failed'));

      await expect(managerService.generateFinancialSummaryReport()).rejects.toThrow('Payment query failed');
    });
  });
});
