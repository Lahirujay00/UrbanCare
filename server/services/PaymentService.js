/**
 * @fileoverview Payment Service implementing payment processing business logic
 * @author UrbanCare Development Team
 * @version 1.0.0
 */

const BaseService = require('../core/BaseService');
const Logger = require('../utils/Logger');
const { ValidationError, BusinessLogicError, ExternalServiceError, NotFoundError } = require('../utils/errors');

/**
 * PaymentService class handling payment-specific business logic
 * Extends BaseService following SOLID principles
 */
class PaymentService extends BaseService {
  /**
   * Creates an instance of PaymentService
   * @param {Object} paymentRepository - Payment repository instance
   */
  constructor(paymentRepository) {
    super(paymentRepository, Logger.getLogger('PaymentService'));
    this.paymentGateway = null; // Will be injected or mocked
    this.fraudDetection = null; // Will be injected or mocked
  }

  /**
   * Processes payment for an appointment
   * @param {Object} paymentData - Payment data
   * @returns {Promise<Object>} Payment result
   */
  async processAppointmentPayment(paymentData) {
    try {
      this.logger.info('Processing appointment payment', { 
        appointmentId: paymentData.appointmentId,
        amount: paymentData.amount 
      });

      // Step 1: Validate payment data
      this.validatePaymentData(paymentData);

      // Step 2: Validate payment method
      this.validatePaymentMethod(paymentData);

      // Step 3: Check for fraud
      await this.checkForFraud(paymentData);

      // Step 4: Process payment with gateway (with retry logic)
      const gatewayResult = await this.processWithGateway(paymentData);

      // Step 5: Save payment record
      const paymentRecord = await this.savePaymentRecord(paymentData, gatewayResult);

      this.logger.info('Payment processed successfully', { 
        paymentId: paymentRecord._id,
        transactionId: gatewayResult.transactionId 
      });

      this.logBusinessEvent('payment_processed', {
        paymentId: paymentRecord._id,
        appointmentId: paymentData.appointmentId,
        amount: paymentData.amount,
        method: paymentData.paymentMethod
      });

      return paymentRecord;
    } catch (error) {
      this.logger.error('Error processing payment:', error);
      
      // Log payment failure for analytics
      this.logBusinessEvent('payment_failed', {
        appointmentId: paymentData.appointmentId,
        amount: paymentData.amount,
        error: error.message
      });

      // Re-throw the original error without wrapping
      throw error;
    }
  }

  /**
   * Processes a refund for a payment
   * @param {string} paymentId - Payment ID
   * @param {number} refundAmount - Amount to refund
   * @param {string} refundReason - Reason for refund
   * @returns {Promise<Object>} Refund result
   */
  async processRefund(paymentId, refundAmount, refundReason) {
    try {
      this.logger.info('Processing refund', { paymentId, refundAmount, refundReason });

      // Step 1: Get original payment
      const originalPayment = await this.repository.findById(paymentId);
      if (!originalPayment) {
        throw new NotFoundError('Payment not found');
      }

      // Step 2: Validate refund eligibility
      this.validateRefundEligibility(originalPayment, refundAmount);

      // Step 3: Process refund with gateway
      const refundResult = await this.processRefundWithGateway(originalPayment, refundAmount);

      // Step 4: Update payment record
      const refundedPayment = await this.repository.processRefund(
        paymentId,
        refundAmount,
        refundReason
      );

      this.logger.info('Refund processed successfully', { 
        paymentId,
        refundId: refundResult.refundId 
      });

      this.logBusinessEvent('refund_processed', {
        paymentId,
        refundAmount,
        reason: refundReason
      });

      return refundedPayment;
    } catch (error) {
      this.logger.error('Error processing refund:', error);
      throw error;
    }
  }

  /**
   * Validates payment data
   * @param {Object} paymentData - Payment data to validate
   * @throws {ValidationError} If validation fails
   * @private
   */
  validatePaymentData(paymentData) {
    const requiredFields = ['appointmentId', 'patientId', 'amount', 'paymentMethod'];
    
    for (const field of requiredFields) {
      if (!paymentData[field]) {
        throw new ValidationError(`${field} is required`);
      }
    }

    // Validate amount
    if (paymentData.amount <= 0) {
      throw new ValidationError('Payment amount must be greater than zero');
    }

    if (paymentData.amount > 10000) {
      throw new ValidationError('Payment amount exceeds maximum limit');
    }

    // Validate ObjectId formats
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    if (!objectIdRegex.test(paymentData.appointmentId)) {
      throw new ValidationError('Invalid appointment ID format');
    }
    if (!objectIdRegex.test(paymentData.patientId)) {
      throw new ValidationError('Invalid patient ID format');
    }
  }

  /**
   * Validates payment method and associated details
   * @param {Object} paymentData - Payment data
   * @throws {ValidationError} If validation fails
   */
  validatePaymentMethod(paymentData) {
    const validMethods = ['card', 'digital_wallet', 'insurance', 'cash', 'bank_transfer'];
    
    if (!validMethods.includes(paymentData.paymentMethod)) {
      throw new ValidationError('Invalid payment method');
    }

    switch (paymentData.paymentMethod) {
      case 'card':
        this.validateCardDetails(paymentData.cardDetails);
        break;
      case 'digital_wallet':
        this.validateWalletDetails(paymentData.walletDetails);
        break;
      case 'insurance':
        this.validateInsuranceDetails(paymentData.insuranceDetails);
        break;
    }
  }

  /**
   * Validates credit card details
   * @param {Object} cardDetails - Card details
   * @throws {ValidationError} If validation fails
   * @private
   */
  validateCardDetails(cardDetails) {
    if (!cardDetails) {
      throw new ValidationError('Card details are required for card payments');
    }

    const { cardNumber, expiryMonth, expiryYear, cvv } = cardDetails;

    // Validate card number (basic Luhn algorithm check)
    if (!this.isValidCardNumber(cardNumber)) {
      throw new ValidationError('Invalid card number');
    }

    // Validate expiry date
    const currentDate = new Date();
    const expiryDate = new Date(parseInt(expiryYear), parseInt(expiryMonth) - 1);
    if (expiryDate <= currentDate) {
      throw new ValidationError('Card has expired');
    }

    // Validate CVV
    if (!cvv || cvv.length < 3 || cvv.length > 4) {
      throw new ValidationError('Invalid CVV');
    }
  }

  /**
   * Validates digital wallet details
   * @param {Object} walletDetails - Wallet details
   * @throws {ValidationError} If validation fails
   * @private
   */
  validateWalletDetails(walletDetails) {
    if (!walletDetails) {
      throw new ValidationError('Wallet details are required for digital wallet payments');
    }

    const { walletType, walletId } = walletDetails;
    const validWalletTypes = ['paypal', 'apple_pay', 'google_pay'];

    if (!validWalletTypes.includes(walletType)) {
      throw new ValidationError('Invalid wallet type');
    }

    if (!walletId) {
      throw new ValidationError('Wallet ID is required');
    }
  }

  /**
   * Validates insurance details
   * @param {Object} insuranceDetails - Insurance details
   * @throws {ValidationError} If validation fails
   * @private
   */
  validateInsuranceDetails(insuranceDetails) {
    if (!insuranceDetails) {
      throw new ValidationError('Insurance details are required for insurance payments');
    }

    const { policyNumber, providerName } = insuranceDetails;

    if (!policyNumber) {
      throw new ValidationError('Policy number is required');
    }

    if (!providerName) {
      throw new ValidationError('Insurance provider name is required');
    }
  }

  /**
   * Checks for potentially fraudulent transactions
   * @param {Object} paymentData - Payment data
   * @throws {BusinessLogicError} If fraud is detected
   * @private
   */
  async checkForFraud(paymentData) {
    if (!this.fraudDetection) {
      return; // Skip fraud detection if not configured
    }

    try {
      const fraudResult = await this.fraudDetection.checkTransaction(paymentData);
      
      if (fraudResult.riskScore > 80 || fraudResult.recommendation === 'BLOCK') {
        throw new BusinessLogicError('Transaction blocked due to high fraud risk');
      }

      if (fraudResult.riskScore > 60) {
        this.logger.warn('High risk transaction detected', {
          appointmentId: paymentData.appointmentId,
          riskScore: fraudResult.riskScore
        });
      }
    } catch (error) {
      if (error instanceof BusinessLogicError) {
        throw error;
      }
      // Log fraud detection errors but don't block payment
      this.logger.error('Fraud detection error:', error);
    }
  }

  /**
   * Processes payment with gateway including retry logic
   * @param {Object} paymentData - Payment data
   * @returns {Promise<Object>} Gateway result
   * @throws {ExternalServiceError} If payment fails
   * @private
   */
  async processWithGateway(paymentData, maxRetries = 3) {
    if (!this.paymentGateway) {
      throw new ExternalServiceError('Payment gateway not configured');
    }

    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.debug(`Payment gateway attempt ${attempt}`, {
          appointmentId: paymentData.appointmentId
        });

        const result = await this.paymentGateway.processPayment(paymentData);
        
        if (!result.success) {
          // Payment gateway responded but payment failed - this is a business logic error, not a retry-able error
          throw new BusinessLogicError(result.error || 'Payment failed');
        }

        return result;
      } catch (error) {
        lastError = error;
        
        // Don't retry business logic errors (like payment declined)
        if (error instanceof BusinessLogicError) {
          throw error;
        }
        
        if (attempt === maxRetries) {
          break;
        }

        // Wait before retry (exponential backoff)
        await this.wait(Math.pow(2, attempt) * 1000);
      }
    }

    throw new ExternalServiceError(`Payment gateway failed after ${maxRetries} attempts: ${lastError.message}`);
  }

  /**
   * Processes refund with gateway
   * @param {Object} originalPayment - Original payment
   * @param {number} refundAmount - Refund amount
   * @returns {Promise<Object>} Refund result
   * @throws {ExternalServiceError} If refund fails
   * @private
   */
  async processRefundWithGateway(originalPayment, refundAmount) {
    if (!this.paymentGateway) {
      throw new ExternalServiceError('Payment gateway not configured');
    }

    try {
      const refundResult = await this.paymentGateway.processRefund({
        transactionId: originalPayment.transactionId,
        amount: refundAmount,
        reason: 'Appointment cancellation'
      });

      if (!refundResult.success) {
        throw new ExternalServiceError(refundResult.error || 'Refund failed');
      }

      return refundResult;
    } catch (error) {
      throw new ExternalServiceError(`Refund gateway error: ${error.message}`);
    }
  }

  /**
   * Saves payment record to database
   * @param {Object} paymentData - Payment data
   * @param {Object} gatewayResult - Gateway result
   * @returns {Promise<Object>} Saved payment record
   * @private
   */
  async savePaymentRecord(paymentData, gatewayResult) {
    const paymentRecord = {
      appointment: paymentData.appointmentId,
      patient: paymentData.patientId,
      amount: paymentData.amount,
      paymentMethod: paymentData.paymentMethod,
      status: gatewayResult.status,
      transactionId: gatewayResult.transactionId,
      currency: paymentData.currency || 'USD'
    };

    return await this.repository.createPayment(paymentRecord);
  }

  /**
   * Validates refund eligibility
   * @param {Object} payment - Original payment
   * @param {number} refundAmount - Requested refund amount
   * @throws {BusinessLogicError|ValidationError} If refund is not allowed
   * @private
   */
  validateRefundEligibility(payment, refundAmount) {
    if (payment.status !== 'completed') {
      throw new BusinessLogicError('Can only refund completed payments');
    }

    if (payment.status === 'refunded') {
      throw new BusinessLogicError('Payment has already been refunded');
    }

    if (refundAmount > payment.amount) {
      throw new ValidationError('Refund amount cannot exceed original payment amount');
    }

    if (refundAmount <= 0) {
      throw new ValidationError('Refund amount must be greater than zero');
    }
  }

  /**
   * Validates card number using Luhn algorithm
   * @param {string} cardNumber - Card number
   * @returns {boolean} True if valid
   * @private
   */
  isValidCardNumber(cardNumber) {
    if (!cardNumber || typeof cardNumber !== 'string') {
      return false;
    }

    // Remove spaces and dashes
    const cleanNumber = cardNumber.replace(/[\s-]/g, '');
    
    // Check if all digits
    if (!/^\d+$/.test(cleanNumber)) {
      return false;
    }

    // Check length
    if (cleanNumber.length < 13 || cleanNumber.length > 19) {
      return false;
    }

    // Luhn algorithm
    let sum = 0;
    let isEven = false;
    
    for (let i = cleanNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanNumber[i]);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  }

  /**
   * Logs payment attempt with masked sensitive data
   * @param {Object} paymentData - Payment data
   */
  logPaymentAttempt(paymentData) {
    const maskedData = { ...paymentData };
    
    if (maskedData.cardDetails) {
      maskedData.cardDetails = {
        ...maskedData.cardDetails,
        cardNumber: this.maskCardNumber(maskedData.cardDetails.cardNumber),
        cvv: '***'
      };
    }
    
    this.logger.info('Payment attempt logged', maskedData);
  }

  /**
   * Masks card number for logging
   * @param {string} cardNumber - Card number
   * @returns {string} Masked card number
   * @private
   */
  maskCardNumber(cardNumber) {
    if (!cardNumber || cardNumber.length < 4) {
      return '****-****-****-****';
    }
    
    const last4 = cardNumber.slice(-4);
    return `****-****-****-${last4}`;
  }

  /**
   * Gets payment analytics
   * @returns {Promise<Object>} Payment analytics
   */
  async getPaymentAnalytics() {
    return await this.repository.getPaymentStatistics();
  }

  /**
   * Gets revenue by payment method
   * @returns {Promise<Array>} Revenue breakdown
   */
  async getRevenueByPaymentMethod() {
    return await this.repository.getRevenueByPaymentMethod();
  }

  /**
   * Waits for specified milliseconds
   * @param {number} ms - Milliseconds to wait
   * @returns {Promise} Promise that resolves after wait
   * @private
   */
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Gets resource name for base service
   * @returns {string} Resource name
   */
  getResourceName() {
    return 'Payment';
  }
}

module.exports = PaymentService;
