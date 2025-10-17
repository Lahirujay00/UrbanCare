/**
 * @fileoverview Unit Tests for Patient Account Management Use Case - FIXED VERSION
 * @description Comprehensive test suite achieving >80% coverage
 * @author UrbanCare Development Team
 * @version 2.0.0
 * 
 * Target Coverage: >80%
 * Focus: Meaningful assertions, positive/negative/edge/error cases
 */

const PatientManagementService = require('../../services/PatientManagementService');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock all dependencies
jest.mock('../../models/User');
jest.mock('../../models/MedicalRecord');
jest.mock('../../models/Appointment');
jest.mock('../../models/AuditLog');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('UC01 - Patient Account Management (>80% Coverage)', () => {
  let mockUser;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUser = {
      _id: '507f1f77bcf86cd799439011',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@test.com',
      phone: '+1-555-0100',
      role: 'patient',
      isActive: true,
      dateOfBirth: new Date('1990-01-15'),
      address: { street: '123 Main St' },
      emergencyContact: { name: 'Jane Doe' },
      toJSON: jest.fn().mockReturnValue({
        _id: '507f1f77bcf86cd799439011',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@test.com',
        role: 'patient'
      }),
      save: jest.fn().mockResolvedValue(true),
      comparePassword: jest.fn()
    };
  });

  describe('Patient Registration', () => {
    test('should successfully register patient with valid data', async () => {
      const registrationData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@test.com',
        password: 'SecurePass123!',
        phone: '+1-555-0100'
      };

      User.findOne.mockResolvedValue(null); // Email not exists
      bcrypt.hash.mockResolvedValue('hashedPassword');
      
      // Mock the User constructor and save
      const mockSave = jest.fn().mockResolvedValue(mockUser);
      User.mockImplementation(() => ({
        ...mockUser,
        save: mockSave
      }));

      const result = await PatientManagementService.registerPatient(registrationData);

      expect(User.findOne).toHaveBeenCalledWith({ email: registrationData.email });
      expect(bcrypt.hash).toHaveBeenCalledWith(registrationData.password, 12);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Patient registered successfully');
      expect(result.user).toBeDefined();
    });

    test('should reject registration with duplicate email', async () => {
      const registrationData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'existing@test.com',
        password: 'SecurePass123!',
        phone: '+1-555-0100'
      };

      User.findOne.mockResolvedValue(mockUser); // Email exists

      const result = await PatientManagementService.registerPatient(registrationData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Email already registered');
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    test('should reject registration with invalid email format', async () => {
      const registrationData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email',
        password: 'SecurePass123!',
        phone: '+1-555-0100'
      };

      const result = await PatientManagementService.registerPatient(registrationData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid email format');
    });

    test('should reject registration with weak password', async () => {
      const registrationData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@test.com',
        password: '123', // Too short
        phone: '+1-555-0100'
      };

      const result = await PatientManagementService.registerPatient(registrationData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Password must be at least 8 characters long');
    });

    test('should reject registration with invalid phone format', async () => {
      const registrationData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@test.com',
        password: 'SecurePass123!',
        phone: '123' // Invalid format
      };

      const result = await PatientManagementService.registerPatient(registrationData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid phone number format');
    });

    test('should reject registration with missing required fields', async () => {
      const incompleteData = {
        firstName: 'John'
        // Missing required fields
      };

      const result = await PatientManagementService.registerPatient(incompleteData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Missing required fields');
    });

    test('should reject registration with excessively long field values', async () => {
      const registrationData = {
        firstName: 'a'.repeat(200), // Too long
        lastName: 'Doe',
        email: 'john.doe@test.com',
        password: 'SecurePass123!',
        phone: '+1-555-0100'
      };

      const result = await PatientManagementService.registerPatient(registrationData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Field length exceeds maximum allowed');
    });

    test('should handle database errors during registration', async () => {
      const registrationData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@test.com',
        password: 'SecurePass123!',
        phone: '+1-555-0100'
      };

      User.findOne.mockRejectedValue(new Error('Database error'));

      const result = await PatientManagementService.registerPatient(registrationData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Registration failed due to server error');
    });

    test('should handle concurrent registration attempts', async () => {
      const registrationData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@test.com',
        password: 'SecurePass123!',
        phone: '+1-555-0100'
      };

      User.findOne.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashedPassword');
      
      // Mock duplicate key error
      User.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue({ code: 11000 })
      }));

      const result = await PatientManagementService.registerPatient(registrationData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Email already registered');
    });
  });

  describe('Patient Authentication', () => {
    test('should successfully authenticate patient with valid credentials', async () => {
      const loginData = {
        email: 'john.doe@test.com',
        password: 'SecurePass123!'
      };

      mockUser.comparePassword.mockResolvedValue(true);
      User.findOne.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValue('mock.jwt.token');

      const result = await PatientManagementService.authenticatePatient(loginData);

      expect(User.findOne).toHaveBeenCalledWith({
        email: loginData.email,
        role: 'patient',
        isActive: true
      });
      expect(result.success).toBe(true);
      expect(result.message).toBe('Authentication successful');
      expect(result.token).toBe('mock.jwt.token');
    });

    test('should handle remember me functionality', async () => {
      const loginData = {
        email: 'john.doe@test.com',
        password: 'SecurePass123!',
        rememberMe: true
      };

      mockUser.comparePassword.mockResolvedValue(true);
      User.findOne.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValue('mock.jwt.token');

      const result = await PatientManagementService.authenticatePatient(loginData);

      expect(jwt.sign).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(String),
        { expiresIn: '30d' }
      );
      expect(result.success).toBe(true);
    });

    test('should reject authentication with invalid email', async () => {
      const loginData = {
        email: 'nonexistent@test.com',
        password: 'SecurePass123!'
      };

      User.findOne.mockResolvedValue(null);

      const result = await PatientManagementService.authenticatePatient(loginData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid credentials');
    });

    test('should reject authentication with incorrect password', async () => {
      const loginData = {
        email: 'john.doe@test.com',
        password: 'WrongPassword'
      };

      mockUser.comparePassword.mockResolvedValue(false);
      User.findOne.mockResolvedValue(mockUser);

      const result = await PatientManagementService.authenticatePatient(loginData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid credentials');
    });

    test('should reject authentication with missing credentials', async () => {
      const result = await PatientManagementService.authenticatePatient({});

      expect(result.success).toBe(false);
      expect(result.message).toBe('Email and password are required');
    });

    test('should handle authentication server errors', async () => {
      const loginData = {
        email: 'john.doe@test.com',
        password: 'SecurePass123!'
      };

      User.findOne.mockRejectedValue(new Error('Server error'));

      const result = await PatientManagementService.authenticatePatient(loginData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Authentication failed due to server error');
    });
  });

  describe('Profile Management', () => {
    test('should successfully retrieve patient profile', async () => {
      User.findById.mockResolvedValue(mockUser);

      const result = await PatientManagementService.getPatientProfile(mockUser._id);

      expect(User.findById).toHaveBeenCalledWith(mockUser._id);
      expect(result.success).toBe(true);
      expect(result.profile).toBeDefined();
    });

    test('should successfully update patient profile', async () => {
      const updateData = {
        firstName: 'Jane',
        phone: '+1-555-0200'
      };

      const updatedUser = { ...mockUser, ...updateData };
      User.findOne.mockResolvedValue(null); // No duplicate email
      User.findByIdAndUpdate.mockResolvedValue(updatedUser);

      const result = await PatientManagementService.updatePatientProfile(mockUser._id, updateData);

      expect(result.success).toBe(true);
      expect(result.profile).toBeDefined();
    });

    test('should reject profile update with invalid email', async () => {
      const updateData = {
        email: 'invalid-email-format'
      };

      const result = await PatientManagementService.updatePatientProfile(mockUser._id, updateData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid email format');
    });

    test('should reject profile update with duplicate email', async () => {
      const updateData = {
        email: 'existing@test.com'
      };

      User.findOne.mockResolvedValue({ _id: 'different-id' });

      const result = await PatientManagementService.updatePatientProfile(mockUser._id, updateData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Email already in use by another account');
    });

    test('should reject profile update with invalid phone', async () => {
      const updateData = {
        phone: 'invalid-phone'
      };

      const result = await PatientManagementService.updatePatientProfile(mockUser._id, updateData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid phone number format');
    });

    test('should handle non-existent patient profile update', async () => {
      const updateData = { firstName: 'Updated' };

      User.findByIdAndUpdate.mockResolvedValue(null);

      const result = await PatientManagementService.updatePatientProfile('nonexistent-id', updateData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Patient not found');
    });

    test('should handle empty update data', async () => {
      const result = await PatientManagementService.updatePatientProfile(mockUser._id, {});

      expect(result.success).toBe(false);
      expect(result.message).toBe('No update data provided');
    });

    test('should handle profile update server errors', async () => {
      const updateData = { firstName: 'Updated' };

      User.findByIdAndUpdate.mockRejectedValue(new Error('Server error'));

      const result = await PatientManagementService.updatePatientProfile(mockUser._id, updateData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Profile update failed due to server error');
    });
  });

  describe('Dashboard Data Retrieval', () => {
    test('should successfully retrieve dashboard data', async () => {
      User.findById.mockResolvedValue(mockUser);

      const result = await PatientManagementService.getDashboardData(mockUser._id);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('upcomingAppointments');
      expect(result.data).toHaveProperty('recentMedicalRecords');
      expect(result.data).toHaveProperty('profileCompleteness');
      expect(typeof result.data.profileCompleteness).toBe('number');
    });

    test('should calculate profile completeness correctly', async () => {
      const incompleteUser = {
        ...mockUser,
        dateOfBirth: null,
        address: null,
        emergencyContact: null
      };

      User.findById.mockResolvedValue(incompleteUser);

      const result = await PatientManagementService.getDashboardData(mockUser._id);

      expect(result.success).toBe(true);
      expect(result.data.profileCompleteness).toBeLessThan(100);
    });

    test('should handle non-existent patient dashboard request', async () => {
      User.findById.mockResolvedValue(null);

      const result = await PatientManagementService.getDashboardData('nonexistent-id');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Patient not found');
    });

    test('should handle dashboard data retrieval errors', async () => {
      User.findById.mockRejectedValue(new Error('Database error'));

      const result = await PatientManagementService.getDashboardData(mockUser._id);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to retrieve dashboard data due to server error');
    });
  });

  describe('JWT Token Validation', () => {
    test('should successfully validate valid JWT token', async () => {
      const tokenPayload = {
        userId: mockUser._id,
        role: 'patient',
        email: mockUser.email
      };

      jwt.verify.mockReturnValue(tokenPayload);
      User.findById.mockResolvedValue(mockUser);

      const result = await PatientManagementService.validateToken('valid.jwt.token');

      expect(jwt.verify).toHaveBeenCalledWith('valid.jwt.token', process.env.JWT_SECRET);
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
    });

    test('should reject invalid JWT token', async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = await PatientManagementService.validateToken('invalid.token');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid token');
    });

    test('should reject expired JWT token', async () => {
      jwt.verify.mockImplementation(() => {
        const error = new Error('Token expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      const result = await PatientManagementService.validateToken('expired.token');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Token expired');
    });

    test('should reject token for non-existent user', async () => {
      const tokenPayload = {
        userId: 'nonexistent-id',
        role: 'patient'
      };

      jwt.verify.mockReturnValue(tokenPayload);
      User.findById.mockResolvedValue(null);

      const result = await PatientManagementService.validateToken('valid.token');

      expect(result.success).toBe(false);
      expect(result.message).toBe('User not found');
    });

    test('should handle malformed JWT token', async () => {
      const result = await PatientManagementService.validateToken('malformed.token');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid token format');
    });

    test('should handle missing JWT token', async () => {
      const result = await PatientManagementService.validateToken();

      expect(result.success).toBe(false);
      expect(result.message).toBe('Token is required');
    });
  });
});
