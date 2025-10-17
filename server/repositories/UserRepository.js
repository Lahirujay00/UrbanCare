/**
 * @fileoverview User Repository implementing data access for User model
 * @author UrbanCare Development Team
 * @version 1.0.0
 */

const BaseRepository = require('../core/BaseRepository');
const User = require('../models/User');
const Logger = require('../utils/Logger');
const { ConflictError, NotFoundError } = require('../utils/errors');

/**
 * UserRepository class handling User-specific data operations
 * Extends BaseRepository following Repository pattern
 */
class UserRepository extends BaseRepository {
  /**
   * Creates an instance of UserRepository
   */
  constructor() {
    super(User, Logger.getLogger('UserRepository'));
  }

  /**
   * Finds a user by email address
   * @param {string} email - User email
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>} User document or null
   */
  async findByEmail(email, options = {}) {
    try {
      this.logger.debug('Finding user by email', { email });
      
      return await this.findOne({ email: email.toLowerCase() }, options);
    } catch (error) {
      this.logger.error('Error finding user by email:', error);
      throw error;
    }
  }

  /**
   * Finds users by role
   * @param {string} role - User role
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Paginated users result
   */
  async findByRole(role, options = {}) {
    try {
      this.logger.debug('Finding users by role', { role });
      
      return await this.findMany({ role }, options);
    } catch (error) {
      this.logger.error('Error finding users by role:', error);
      throw error;
    }
  }

  /**
   * Finds doctors by specialization
   * @param {string} specialization - Doctor specialization
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Paginated doctors result
   */
  async findDoctorsBySpecialization(specialization, options = {}) {
    try {
      this.logger.debug('Finding doctors by specialization', { specialization });
      
      const query = {
        role: 'doctor',
        specialization: specialization
      };
      
      return await this.findMany(query, options);
    } catch (error) {
      this.logger.error('Error finding doctors by specialization:', error);
      throw error;
    }
  }

  /**
   * Creates a new user with email uniqueness check
   * @param {Object} userData - User data
   * @param {Object} options - Creation options
   * @returns {Promise<Object>} Created user document
   */
  async createUser(userData, options = {}) {
    try {
      this.logger.debug('Creating new user', { email: userData.email });
      
      // Check if user with email already exists
      const existingUser = await this.findByEmail(userData.email);
      if (existingUser) {
        throw new ConflictError('User with this email already exists');
      }
      
      // Normalize email
      const normalizedData = {
        ...userData,
        email: userData.email.toLowerCase()
      };
      
      return await this.create(normalizedData, options);
    } catch (error) {
      this.logger.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Updates user profile information
   * @param {string} userId - User ID
   * @param {Object} updateData - Data to update
   * @param {Object} options - Update options
   * @returns {Promise<Object>} Updated user document
   */
  async updateProfile(userId, updateData, options = {}) {
    try {
      this.logger.debug('Updating user profile', { userId });
      
      // Remove sensitive fields that shouldn't be updated via profile
      const { password, role, ...profileData } = updateData;
      
      // Normalize email if provided
      if (profileData.email) {
        profileData.email = profileData.email.toLowerCase();
        
        // Check for email conflicts
        const existingUser = await this.findOne({
          email: profileData.email,
          _id: { $ne: userId }
        });
        
        if (existingUser) {
          throw new ConflictError('Email already in use by another user');
        }
      }
      
      return await this.updateById(userId, profileData, options);
    } catch (error) {
      this.logger.error('Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Updates user password
   * @param {string} userId - User ID
   * @param {string} hashedPassword - New hashed password
   * @param {Object} options - Update options
   * @returns {Promise<Object>} Updated user document
   */
  async updatePassword(userId, hashedPassword, options = {}) {
    try {
      this.logger.debug('Updating user password', { userId });
      
      return await this.updateById(userId, { password: hashedPassword }, options);
    } catch (error) {
      this.logger.error('Error updating user password:', error);
      throw error;
    }
  }

  /**
   * Activates or deactivates a user account
   * @param {string} userId - User ID
   * @param {boolean} isActive - Active status
   * @param {Object} options - Update options
   * @returns {Promise<Object>} Updated user document
   */
  async setActiveStatus(userId, isActive, options = {}) {
    try {
      this.logger.debug('Setting user active status', { userId, isActive });
      
      return await this.updateById(userId, { isActive }, options);
    } catch (error) {
      this.logger.error('Error setting user active status:', error);
      throw error;
    }
  }

  /**
   * Finds users with search functionality
   * @param {string} searchTerm - Search term
   * @param {Object} filters - Additional filters
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Search results
   */
  async searchUsers(searchTerm, filters = {}, options = {}) {
    try {
      this.logger.debug('Searching users', { searchTerm, filters });
      
      const query = { ...filters };
      
      if (searchTerm) {
        const searchRegex = new RegExp(searchTerm, 'i');
        query.$or = [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { email: searchRegex },
          { phone: searchRegex }
        ];
      }
      
      return await this.findMany(query, options);
    } catch (error) {
      this.logger.error('Error searching users:', error);
      throw error;
    }
  }

  /**
   * Gets user statistics by role
   * @returns {Promise<Object>} User statistics
   */
  async getUserStatistics() {
    try {
      this.logger.debug('Getting user statistics');
      
      const stats = await this.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 },
            active: {
              $sum: {
                $cond: [{ $eq: ['$isActive', true] }, 1, 0]
              }
            }
          }
        },
        {
          $project: {
            role: '$_id',
            count: 1,
            active: 1,
            inactive: { $subtract: ['$count', '$active'] },
            _id: 0
          }
        }
      ]);
      
      return stats;
    } catch (error) {
      this.logger.error('Error getting user statistics:', error);
      throw error;
    }
  }

  /**
   * Gets recently registered users
   * @param {number} limit - Number of users to return
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Recent users
   */
  async getRecentUsers(limit = 10, options = {}) {
    try {
      this.logger.debug('Getting recent users', { limit });
      
      const result = await this.findMany({}, {
        ...options,
        limit,
        sort: { createdAt: -1 },
        select: 'firstName lastName email role createdAt isActive'
      });
      
      return result.data;
    } catch (error) {
      this.logger.error('Error getting recent users:', error);
      throw error;
    }
  }

  /**
   * Finds users by multiple IDs
   * @param {Array} userIds - Array of user IDs
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Users array
   */
  async findByIds(userIds, options = {}) {
    try {
      this.logger.debug('Finding users by IDs', { count: userIds.length });
      
      const result = await this.findMany(
        { _id: { $in: userIds } },
        options
      );
      
      return result.data;
    } catch (error) {
      this.logger.error('Error finding users by IDs:', error);
      throw error;
    }
  }

  /**
   * Counts users by role and active status
   * @param {string} role - User role (optional)
   * @param {boolean} isActive - Active status (optional)
   * @returns {Promise<number>} User count
   */
  async countByRoleAndStatus(role = null, isActive = null) {
    try {
      const query = {};
      if (role) query.role = role;
      if (isActive !== null) query.isActive = isActive;
      
      this.logger.debug('Counting users by role and status', query);
      
      return await this.count(query);
    } catch (error) {
      this.logger.error('Error counting users by role and status:', error);
      throw error;
    }
  }

  /**
   * Soft deletes a user (marks as inactive)
   * @param {string} userId - User ID
   * @param {Object} options - Update options
   * @returns {Promise<Object>} Updated user document
   */
  async softDelete(userId, options = {}) {
    try {
      this.logger.debug('Soft deleting user', { userId });
      
      return await this.updateById(userId, { 
        isActive: false,
        deletedAt: new Date()
      }, options);
    } catch (error) {
      this.logger.error('Error soft deleting user:', error);
      throw error;
    }
  }

  /**
   * Restores a soft-deleted user
   * @param {string} userId - User ID
   * @param {Object} options - Update options
   * @returns {Promise<Object>} Updated user document
   */
  async restore(userId, options = {}) {
    try {
      this.logger.debug('Restoring user', { userId });
      
      return await this.updateById(userId, { 
        isActive: true,
        $unset: { deletedAt: 1 }
      }, options);
    } catch (error) {
      this.logger.error('Error restoring user:', error);
      throw error;
    }
  }
}

module.exports = UserRepository;
