/**
 * @fileoverview Unit Tests for PaymentService - Payment Integration Testing
 * @author UrbanCare Development Team
 * @version 1.0.0
 */

const PaymentService = require('../../../services/PaymentService');
const PaymentRepository = require('../../../repositories/PaymentRepository');
const { ValidationError, BusinessLogicError, ExternalServiceError } = require('../../../utils/errors');

// Mock dependencies
jest.mock('../../../repositories/PaymentRepository');

describe('PaymentService - Payment Integration Tests (UC02)', () => {
  let paymentService;
  let mockPaymentRepo;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPaymentRepo = new PaymentRepository();
    paymentService = new PaymentService(mockPaymentRepo);
  });

  describe('processAppointmentPayment - Step 6 of UC02', () => {
    const validPaymentData = {
      appointmentId: '507f1f77bcf86cd799439012',
      patientId: '507f1f77bcf86cd799439011',
      amount: 100,
      paymentMethod: 'card',
      cardDetails: {
        cardNumber: '4111111111111111',
        expiryMonth: '12',
        expiryYear: '2025',
        cvv: '123'
      }
    };

    test('should successfully process payment with valid card details', async () => {
      // Arrange
      const mockPayment = testUtils.createMockPayment({
        ...validPaymentData,
        status: 'completed',
        transactionId: 'txn_123456789'
      });

      mockPaymentRepo.createPayment.mockResolvedValue(mockPayment);
      
      // Mock external payment gateway
      paymentService.paymentGateway = {
        processPayment: jest.fn().mockResolvedValue({
          success: true,
          transactionId: 'txn_123456789',
          status: 'completed'
        })
      };

      // Act
      const result = await paymentService.processAppointmentPayment(validPaymentData);

      // Assert
      expect(result.status).toBe('completed');
      expect(result.transactionId).toBe('txn_123456789');
      expect(mockPaymentRepo.createPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          appointment: validPaymentData.appointmentId,
          amount: validPaymentData.amount,
          status: 'completed'
        })
      );
    });

    test('should handle payment failure (6a. Payment Failure)', async () => {
      // Arrange
      paymentService.paymentGateway = {
        processPayment: jest.fn().mockResolvedValue({
          success: false,
          error: 'Insufficient funds',
          errorCode: 'INSUFFICIENT_FUNDS'
        })
      };

      const mockFailedPayment = testUtils.createMockPayment({
        ...validPaymentData,
        status: 'failed',
        failureReason: 'Insufficient funds'
      });

      mockPaymentRepo.createPayment.mockResolvedValue(mockFailedPayment);

      // Act & Assert
      await expect(paymentService.processAppointmentPayment(validPaymentData))
        .rejects
        .toThrow(BusinessLogicError);
    });

    test('should validate payment amount is positive', async () => {
      // Arrange
      const invalidPaymentData = {
        ...validPaymentData,
        amount: -50 // Negative amount
      };

      // Act & Assert
      await expect(paymentService.processAppointmentPayment(invalidPaymentData))
        .rejects
        .toThrow(ValidationError);
    });

    test('should validate required payment fields', async () => {
      // Arrange
      const incompletePaymentData = {
        appointmentId: '507f1f77bcf86cd799439012',
        // Missing required fields
      };

      // Act & Assert
      await expect(paymentService.processAppointmentPayment(incompletePaymentData))
        .rejects
        .toThrow(ValidationError);
    });

    test('should handle invalid card number', async () => {
      // Arrange
      const invalidCardData = {
        ...validPaymentData,
        cardDetails: {
          ...validPaymentData.cardDetails,
          cardNumber: '1234567890123456' // Invalid card number
        }
      };

      // Act & Assert
      await expect(paymentService.processAppointmentPayment(invalidCardData))
        .rejects
        .toThrow(ValidationError);
    });

    test('should handle expired card', async () => {
      // Arrange
      const expiredCardData = {
        ...validPaymentData,
        cardDetails: {
          ...validPaymentData.cardDetails,
          expiryMonth: '01',
          expiryYear: '2020' // Expired
        }
      };

      // Act & Assert
      await expect(paymentService.processAppointmentPayment(expiredCardData))
        .rejects
        .toThrow(ValidationError);
    });

    test('should handle payment gateway timeout', async () => {
      // Arrange
      paymentService.paymentGateway = {
        processPayment: jest.fn().mockRejectedValue(new Error('Gateway timeout'))
      };

      // Act & Assert
      await expect(paymentService.processAppointmentPayment(validPaymentData))
        .rejects
        .toThrow(ExternalServiceError);
    });

    test('should retry failed payments up to 3 times', async () => {
      // Arrange
      let attemptCount = 0;
      paymentService.paymentGateway = {
        processPayment: jest.fn().mockImplementation(() => {
          attemptCount++;
          if (attemptCount < 3) {
            return Promise.reject(new Error('Temporary failure'));
          }
          return Promise.resolve({
            success: true,
            transactionId: 'txn_retry_success',
            status: 'completed'
          });
        })
      };

      const mockPayment = testUtils.createMockPayment({
        ...validPaymentData,
        status: 'completed'
      });

      mockPaymentRepo.createPayment.mockResolvedValue(mockPayment);

      // Act
      const result = await paymentService.processAppointmentPayment(validPaymentData);

      // Assert
      expect(result.status).toBe('completed');
      expect(paymentService.paymentGateway.processPayment).toHaveBeenCalledTimes(3);
    });
  });

  describe('processRefund - Exception Flow: Appointment Cancellation', () => {
    test('should successfully process refund for cancelled appointment', async () => {
      // Arrange
      const paymentId = '507f1f77bcf86cd799439014';
      const refundAmount = 100;
      const refundReason = 'Appointment cancelled by patient';

      const mockOriginalPayment = testUtils.createMockPayment({
        _id: paymentId,
        status: 'completed',
        amount: 100
      });

      const mockRefundedPayment = {
        ...mockOriginalPayment,
        status: 'refunded',
        refundAmount,
        refundReason
      };

      mockPaymentRepo.findById.mockResolvedValue(mockOriginalPayment);
      mockPaymentRepo.processRefund.mockResolvedValue(mockRefundedPayment);

      // Mock external refund processing
      paymentService.paymentGateway = {
        processRefund: jest.fn().mockResolvedValue({
          success: true,
          refundId: 'ref_123456789'
        })
      };

      // Act
      const result = await paymentService.processRefund(paymentId, refundAmount, refundReason);

      // Assert
      expect(result.status).toBe('refunded');
      expect(result.refundAmount).toBe(refundAmount);
      expect(paymentService.paymentGateway.processRefund).toHaveBeenCalled();
    });

    test('should handle partial refunds correctly', async () => {
      // Arrange
      const paymentId = '507f1f77bcf86cd799439014';
      const originalAmount = 100;
      const refundAmount = 50; // Partial refund
      const refundReason = 'Partial service cancellation';

      const mockOriginalPayment = testUtils.createMockPayment({
        _id: paymentId,
        status: 'completed',
        amount: originalAmount
      });

      mockPaymentRepo.findById.mockResolvedValue(mockOriginalPayment);
      mockPaymentRepo.processRefund.mockResolvedValue({
        ...mockOriginalPayment,
        refundAmount
      });

      paymentService.paymentGateway = {
        processRefund: jest.fn().mockResolvedValue({
          success: true,
          refundId: 'ref_partial_123'
        })
      };

      // Act
      const result = await paymentService.processRefund(paymentId, refundAmount, refundReason);

      // Assert
      expect(result.refundAmount).toBe(refundAmount);
      expect(paymentService.paymentGateway.processRefund).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: refundAmount
        })
      );
    });

    test('should reject refund for already refunded payment', async () => {
      // Arrange
      const paymentId = '507f1f77bcf86cd799439014';
      const mockRefundedPayment = testUtils.createMockPayment({
        _id: paymentId,
        status: 'refunded'
      });

      mockPaymentRepo.findById.mockResolvedValue(mockRefundedPayment);

      // Act & Assert
      await expect(paymentService.processRefund(paymentId, 100, 'Test refund'))
        .rejects
        .toThrow(BusinessLogicError);
    });

    test('should reject refund amount greater than original payment', async () => {
      // Arrange
      const paymentId = '507f1f77bcf86cd799439014';
      const mockOriginalPayment = testUtils.createMockPayment({
        _id: paymentId,
        status: 'completed',
        amount: 100
      });

      mockPaymentRepo.findById.mockResolvedValue(mockOriginalPayment);

      // Act & Assert
      await expect(paymentService.processRefund(paymentId, 150, 'Test refund'))
        .rejects
        .toThrow(ValidationError);
    });

    test('should handle refund gateway failures', async () => {
      // Arrange
      const paymentId = '507f1f77bcf86cd799439014';
      const mockOriginalPayment = testUtils.createMockPayment({
        _id: paymentId,
        status: 'completed',
        amount: 100
      });

      mockPaymentRepo.findById.mockResolvedValue(mockOriginalPayment);

      paymentService.paymentGateway = {
        processRefund: jest.fn().mockRejectedValue(new Error('Refund gateway error'))
      };

      // Act & Assert
      await expect(paymentService.processRefund(paymentId, 100, 'Test refund'))
        .rejects
        .toThrow(ExternalServiceError);
    });
  });

  describe('validatePaymentMethod', () => {
    test('should validate credit card payments', async () => {
      // Arrange
      const cardPaymentData = {
        paymentMethod: 'card',
        cardDetails: {
          cardNumber: '4111111111111111',
          expiryMonth: '12',
          expiryYear: '2025',
          cvv: '123'
        }
      };

      // Act & Assert
      expect(() => paymentService.validatePaymentMethod(cardPaymentData)).not.toThrow();
    });

    test('should validate digital wallet payments', async () => {
      // Arrange
      const walletPaymentData = {
        paymentMethod: 'digital_wallet',
        walletDetails: {
          walletType: 'paypal',
          walletId: 'user@example.com'
        }
      };

      // Act & Assert
      expect(() => paymentService.validatePaymentMethod(walletPaymentData)).not.toThrow();
    });

    test('should validate insurance payments', async () => {
      // Arrange
      const insurancePaymentData = {
        paymentMethod: 'insurance',
        insuranceDetails: {
          policyNumber: 'POL123456789',
          providerName: 'HealthCare Insurance Co.',
          copayAmount: 25
        }
      };

      // Act & Assert
      expect(() => paymentService.validatePaymentMethod(insurancePaymentData)).not.toThrow();
    });

    test('should reject unsupported payment methods', async () => {
      // Arrange
      const invalidPaymentData = {
        paymentMethod: 'cryptocurrency'
      };

      // Act & Assert
      expect(() => paymentService.validatePaymentMethod(invalidPaymentData))
        .toThrow(ValidationError);
    });
  });

  describe('Payment Security', () => {
    const validPaymentData = {
      appointmentId: '507f1f77bcf86cd799439012',
      patientId: '507f1f77bcf86cd799439011',
      amount: 100,
      paymentMethod: 'card',
      cardDetails: {
        cardNumber: '4111111111111111',
        expiryMonth: '12',
        expiryYear: '2025',
        cvv: '123'
      }
    };

    test('should mask sensitive card details in logs', async () => {
      // Arrange
      const sensitivePaymentData = {
        ...validPaymentData,
        cardDetails: {
          cardNumber: '4111111111111111',
          cvv: '123'
        }
      };

      const logSpy = jest.spyOn(paymentService.logger, 'info');

      // Act
      paymentService.logPaymentAttempt(sensitivePaymentData);

      // Assert
      expect(logSpy).toHaveBeenCalledWith(
        'Payment attempt logged',
        expect.objectContaining({
          cardDetails: expect.objectContaining({
            cardNumber: '****-****-****-1111',
            cvv: '***'
          })
        })
      );
    });

    test('should validate CVV format', async () => {
      // Arrange
      const invalidCvvData = {
        ...validPaymentData,
        cardDetails: {
          ...validPaymentData.cardDetails,
          cvv: '12' // Too short
        }
      };

      // Act & Assert
      await expect(paymentService.processAppointmentPayment(invalidCvvData))
        .rejects
        .toThrow(ValidationError);
    });

    test('should detect potentially fraudulent transactions', async () => {
      // Arrange
      const suspiciousPaymentData = {
        ...validPaymentData,
        amount: 5000, // High but valid amount
        patientId: '507f1f77bcf86cd799439099' // New patient with high payment
      };

      // Mock fraud detection
      paymentService.fraudDetection = {
        checkTransaction: jest.fn().mockResolvedValue({
          riskScore: 85, // High risk
          recommendation: 'BLOCK'
        })
      };

      // Act & Assert
      await expect(paymentService.processAppointmentPayment(suspiciousPaymentData))
        .rejects
        .toThrow(BusinessLogicError);
    });
  });

  describe('Payment Analytics and Reporting', () => {
    test('should track payment success rates', async () => {
      // Arrange
      const mockPaymentStats = {
        totalPayments: 100,
        successfulPayments: 95,
        failedPayments: 5,
        successRate: 95
      };

      mockPaymentRepo.getPaymentStatistics.mockResolvedValue(mockPaymentStats);

      // Act
      const stats = await paymentService.getPaymentAnalytics();

      // Assert
      expect(stats.successRate).toBe(95);
      expect(stats.totalPayments).toBe(100);
    });

    test('should generate revenue reports by payment method', async () => {
      // Arrange
      const mockRevenueData = [
        { paymentMethod: 'card', totalAmount: 50000, count: 200 },
        { paymentMethod: 'insurance', totalAmount: 30000, count: 150 },
        { paymentMethod: 'cash', totalAmount: 10000, count: 50 }
      ];

      mockPaymentRepo.getRevenueByPaymentMethod.mockResolvedValue(mockRevenueData);

      // Act
      const revenueReport = await paymentService.getRevenueByPaymentMethod();

      // Assert
      expect(revenueReport).toHaveLength(3);
      expect(revenueReport[0].paymentMethod).toBe('card');
      expect(revenueReport[0].totalAmount).toBe(50000);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    const validPaymentData = {
      appointmentId: '507f1f77bcf86cd799439012',
      patientId: '507f1f77bcf86cd799439011',
      amount: 100,
      paymentMethod: 'card',
      cardDetails: {
        cardNumber: '4111111111111111',
        expiryMonth: '12',
        expiryYear: '2025',
        cvv: '123'
      }
    };

    test('should handle network timeouts gracefully', async () => {
      // Arrange
      paymentService.paymentGateway = {
        processPayment: jest.fn().mockImplementation(() => {
          return new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Network timeout')), 100);
          });
        })
      };

      // Act & Assert
      await expect(paymentService.processAppointmentPayment(validPaymentData))
        .rejects
        .toThrow(ExternalServiceError);
    });

    test('should handle concurrent payment attempts for same appointment', async () => {
      // Arrange
      mockPaymentRepo.createPayment
        .mockRejectedValueOnce(new Error('Duplicate payment attempt'))
        .mockResolvedValueOnce(testUtils.createMockPayment());

      paymentService.paymentGateway = {
        processPayment: jest.fn().mockResolvedValue({
          success: true,
          transactionId: 'txn_concurrent_test'
        })
      };

      // Act & Assert
      await expect(paymentService.processAppointmentPayment(validPaymentData))
        .rejects
        .toThrow(Error);
    });

    test('should handle payment gateway maintenance mode', async () => {
      // Arrange
      paymentService.paymentGateway = {
        processPayment: jest.fn().mockRejectedValue({
          error: 'Service temporarily unavailable',
          code: 'MAINTENANCE_MODE'
        })
      };

      // Act & Assert
      await expect(paymentService.processAppointmentPayment(validPaymentData))
        .rejects
        .toThrow(ExternalServiceError);
    });
  });
});
