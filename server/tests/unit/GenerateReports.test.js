/**
 * @fileoverview Unit Tests for Generate Reports Use Case
 * @description Comprehensive test suite covering report generation functionality
 * @author UrbanCare Development Team
 * @version 1.0.0
 * 
 * Test Coverage Areas:
 * - Patient Visit Reports
 * - Staff Utilization Reports  
 * - Financial Summary Reports
 * - Peak Hours Analytics
 * - Report Export and Formatting
 * - Data Aggregation and Calculations
 * 
 * Target Coverage: >80%
 */

const ReportGenerationController = require('../../controllers/ReportGenerationController');
const ManagerController = require('../../controllers/ManagerController');
const User = require('../../models/User');
const Appointment = require('../../models/Appointment');
const Payment = require('../../models/Payment');
const GeneratedReport = require('../../models/GeneratedReport');

// Mock dependencies
jest.mock('../../models/User');
jest.mock('../../models/Appointment');
jest.mock('../../models/Payment');
jest.mock('../../models/GeneratedReport');

describe('UC04 - Generate Reports', () => {
  let mockManager, mockDoctor, mockPatient, mockAppointments, mockPayments;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockManager = {
      _id: '507f1f77bcf86cd799439013',
      firstName: 'Manager',
      lastName: 'Admin',
      email: 'manager@test.com',
      role: 'manager'
    };

    mockDoctor = {
      _id: '507f1f77bcf86cd799439012',
      firstName: 'Dr. Jane',
      lastName: 'Doctor',
      email: 'doctor@test.com',
      role: 'doctor',
      specialization: 'Cardiology'
    };

    mockPatient = {
      _id: '507f1f77bcf86cd799439011',
      firstName: 'John',
      lastName: 'Patient',
      role: 'patient'
    };

    mockAppointments = [
      {
        _id: 'apt1',
        patient: mockPatient._id,
        doctor: mockDoctor._id,
        appointmentDate: new Date('2024-01-15T09:00:00Z'),
        status: 'completed',
        department: 'Cardiology',
        consultationFee: 150
      },
      {
        _id: 'apt2',
        patient: mockPatient._id,
        doctor: mockDoctor._id,
        appointmentDate: new Date('2024-01-15T14:00:00Z'),
        status: 'scheduled',
        department: 'Cardiology',
        consultationFee: 150
      }
    ];

    mockPayments = [
      {
        _id: 'pay1',
        appointment: 'apt1',
        amount: 150,
        paymentMethod: 'card',
        status: 'completed',
        createdAt: new Date('2024-01-15')
      }
    ];
  });

  describe('Patient Visit Reports', () => {
    describe('Positive Cases', () => {
      test('should generate patient visit report with correct data', async () => {
        const mockReq = {
          query: {
            startDate: '2024-01-01',
            endDate: '2024-01-31',
            reportType: 'detailed'
          },
          user: mockManager
        };
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };

        Appointment.find.mockResolvedValue(mockAppointments);
        Appointment.aggregate.mockResolvedValue([
          { _id: 'Cardiology', count: 2, totalRevenue: 300 }
        ]);

        await ManagerController.getPatientVisitReport(mockReq, mockRes);

        expect(Appointment.find).toHaveBeenCalledWith({
          appointmentDate: {
            $gte: new Date('2024-01-01'),
            $lte: new Date('2024-01-31')
          }
        });
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          report: expect.objectContaining({
            totalVisits: 2,
            departmentBreakdown: expect.any(Array),
            peakHours: expect.any(Object)
          })
        });
      });

      test('should generate summary patient visit report', async () => {
        const mockReq = {
          query: {
            startDate: '2024-01-01',
            endDate: '2024-01-31',
            reportType: 'summary'
          },
          user: mockManager
        };
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };

        Appointment.countDocuments.mockResolvedValue(2);
        Appointment.aggregate.mockResolvedValue([
          { _id: 'completed', count: 1 },
          { _id: 'scheduled', count: 1 }
        ]);

        await ManagerController.getPatientVisitReport(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          report: expect.objectContaining({
            totalVisits: 2,
            statusBreakdown: expect.any(Array)
          })
        });
      });
    });

    describe('Negative Cases', () => {
      test('should reject report generation for unauthorized user', async () => {
        const mockReq = {
          query: { startDate: '2024-01-01', endDate: '2024-01-31' },
          user: { ...mockPatient, role: 'patient' }
        };
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };

        await ManagerController.getPatientVisitReport(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          message: 'Access denied. Manager role required.'
        });
      });

      test('should handle invalid date range', async () => {
        const mockReq = {
          query: {
            startDate: '2024-01-31',
            endDate: '2024-01-01' // End before start
          },
          user: mockManager
        };
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };

        await ManagerController.getPatientVisitReport(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          message: 'Invalid date range. End date must be after start date.'
        });
      });
    });

    describe('Edge Cases', () => {
      test('should handle empty data set', async () => {
        const mockReq = {
          query: { startDate: '2024-01-01', endDate: '2024-01-31' },
          user: mockManager
        };
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };

        Appointment.find.mockResolvedValue([]);
        Appointment.aggregate.mockResolvedValue([]);

        await ManagerController.getPatientVisitReport(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          report: expect.objectContaining({
            totalVisits: 0,
            message: 'No visits found for the specified period'
          })
        });
      });

      test('should handle database errors', async () => {
        const mockReq = {
          query: { startDate: '2024-01-01', endDate: '2024-01-31' },
          user: mockManager
        };
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };

        Appointment.find.mockRejectedValue(new Error('Database error'));

        await ManagerController.getPatientVisitReport(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          message: 'Report generation failed due to server error'
        });
      });
    });
  });

  describe('Staff Utilization Reports', () => {
    describe('Positive Cases', () => {
      test('should generate staff utilization report', async () => {
        const mockReq = {
          query: { startDate: '2024-01-01', endDate: '2024-01-31' },
          user: mockManager
        };
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };

        User.find.mockResolvedValue([mockDoctor]);
        Appointment.aggregate.mockResolvedValue([
          {
            _id: mockDoctor._id,
            totalAppointments: 10,
            completedAppointments: 8,
            totalRevenue: 1500,
            avgRating: 4.5
          }
        ]);

        await ManagerController.getStaffUtilizationReport(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          report: expect.objectContaining({
            staffMetrics: expect.arrayContaining([
              expect.objectContaining({
                doctor: expect.any(Object),
                utilizationRate: expect.any(Number),
                completionRate: expect.any(Number)
              })
            ])
          })
        });
      });
    });

    describe('Negative Cases', () => {
      test('should handle no staff data', async () => {
        const mockReq = {
          query: { startDate: '2024-01-01', endDate: '2024-01-31' },
          user: mockManager
        };
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };

        User.find.mockResolvedValue([]);

        await ManagerController.getStaffUtilizationReport(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          report: expect.objectContaining({
            staffMetrics: [],
            message: 'No staff data found for the specified period'
          })
        });
      });
    });
  });

  describe('Financial Summary Reports', () => {
    describe('Positive Cases', () => {
      test('should generate financial summary report', async () => {
        const mockReq = {
          query: { startDate: '2024-01-01', endDate: '2024-01-31' },
          user: mockManager
        };
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };

        Payment.aggregate.mockResolvedValue([
          {
            _id: 'card',
            totalAmount: 1200,
            count: 8
          },
          {
            _id: 'cash',
            totalAmount: 300,
            count: 2
          }
        ]);

        await ManagerController.getFinancialSummaryReport(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          report: expect.objectContaining({
            totalRevenue: 1500,
            paymentMethodBreakdown: expect.any(Array),
            averageTransactionValue: 150
          })
        });
      });
    });

    describe('Negative Cases', () => {
      test('should handle no financial data', async () => {
        const mockReq = {
          query: { startDate: '2024-01-01', endDate: '2024-01-31' },
          user: mockManager
        };
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };

        Payment.aggregate.mockResolvedValue([]);

        await ManagerController.getFinancialSummaryReport(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          report: expect.objectContaining({
            totalRevenue: 0,
            message: 'No financial data found for the specified period'
          })
        });
      });
    });
  });

  describe('Peak Hours Analytics', () => {
    describe('Positive Cases', () => {
      test('should generate peak hours analytics', async () => {
        const mockReq = {
          query: { startDate: '2024-01-01', endDate: '2024-01-31' },
          user: mockManager
        };
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };

        Appointment.aggregate.mockResolvedValue([
          { _id: { hour: 9, dayOfWeek: 1 }, count: 5 },
          { _id: { hour: 14, dayOfWeek: 1 }, count: 3 },
          { _id: { hour: 10, dayOfWeek: 2 }, count: 4 }
        ]);

        await ManagerController.getPeakHoursAnalytics(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          analytics: expect.objectContaining({
            peakHours: expect.any(Array),
            recommendations: expect.any(Array),
            efficiencyScore: expect.any(Number)
          })
        });
      });
    });
  });

  describe('Report Export and Formatting', () => {
    describe('Positive Cases', () => {
      test('should export report in PDF format', async () => {
        const mockReq = {
          params: { reportId: 'report123' },
          query: { format: 'pdf' },
          user: mockManager
        };
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          setHeader: jest.fn(),
          send: jest.fn()
        };

        const mockReport = {
          _id: 'report123',
          reportType: 'patient-visits',
          data: { totalVisits: 100 },
          generatedBy: mockManager._id
        };

        GeneratedReport.findById.mockResolvedValue(mockReport);

        await ReportGenerationController.exportReport(mockReq, mockRes);

        expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
        expect(mockRes.status).toHaveBeenCalledWith(200);
      });

      test('should export report in Excel format', async () => {
        const mockReq = {
          params: { reportId: 'report123' },
          query: { format: 'excel' },
          user: mockManager
        };
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          setHeader: jest.fn(),
          send: jest.fn()
        };

        const mockReport = {
          _id: 'report123',
          reportType: 'financial-summary',
          data: { totalRevenue: 50000 },
          generatedBy: mockManager._id
        };

        GeneratedReport.findById.mockResolvedValue(mockReport);

        await ReportGenerationController.exportReport(mockReq, mockRes);

        expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        expect(mockRes.status).toHaveBeenCalledWith(200);
      });
    });

    describe('Negative Cases', () => {
      test('should handle non-existent report export', async () => {
        const mockReq = {
          params: { reportId: 'nonexistent' },
          query: { format: 'pdf' },
          user: mockManager
        };
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };

        GeneratedReport.findById.mockResolvedValue(null);

        await ReportGenerationController.exportReport(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(404);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          message: 'Report not found'
        });
      });

      test('should handle unsupported export format', async () => {
        const mockReq = {
          params: { reportId: 'report123' },
          query: { format: 'unsupported' },
          user: mockManager
        };
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };

        await ReportGenerationController.exportReport(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          message: 'Unsupported export format. Supported formats: pdf, excel, csv'
        });
      });
    });
  });

  describe('Data Aggregation and Calculations', () => {
    describe('Positive Cases', () => {
      test('should correctly calculate utilization rates', async () => {
        const appointments = [
          { doctor: 'doc1', status: 'completed' },
          { doctor: 'doc1', status: 'completed' },
          { doctor: 'doc1', status: 'cancelled' },
          { doctor: 'doc1', status: 'no-show' }
        ];

        const utilizationRate = ReportGenerationController.calculateUtilizationRate(appointments);

        expect(utilizationRate).toBe(50); // 2 completed out of 4 total
      });

      test('should correctly calculate revenue metrics', async () => {
        const payments = [
          { amount: 100, paymentMethod: 'card' },
          { amount: 150, paymentMethod: 'card' },
          { amount: 75, paymentMethod: 'cash' }
        ];

        const metrics = ReportGenerationController.calculateRevenueMetrics(payments);

        expect(metrics.totalRevenue).toBe(325);
        expect(metrics.averageTransaction).toBe(108.33);
        expect(metrics.paymentMethodBreakdown).toEqual({
          card: { total: 250, count: 2 },
          cash: { total: 75, count: 1 }
        });
      });
    });

    describe('Edge Cases', () => {
      test('should handle empty data sets in calculations', () => {
        const utilizationRate = ReportGenerationController.calculateUtilizationRate([]);
        expect(utilizationRate).toBe(0);

        const metrics = ReportGenerationController.calculateRevenueMetrics([]);
        expect(metrics.totalRevenue).toBe(0);
        expect(metrics.averageTransaction).toBe(0);
      });

      test('should handle division by zero in calculations', () => {
        const appointments = [
          { doctor: 'doc1', status: 'cancelled' },
          { doctor: 'doc1', status: 'no-show' }
        ];

        const utilizationRate = ReportGenerationController.calculateUtilizationRate(appointments);
        expect(utilizationRate).toBe(0);
      });
    });
  });
});
