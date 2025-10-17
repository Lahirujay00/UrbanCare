/**
 * @fileoverview Base Repository class for UrbanCare Application
 * @author UrbanCare Development Team
 * @version 1.0.0
 */

const Logger = require('../utils/Logger');

/**
 * Base Repository class providing common data access functionality
 * Implements Repository pattern and SOLID principles
 */
class BaseRepository {
  /**
   * Creates an instance of BaseRepository
   * @param {Object} model - Mongoose model
   * @param {Object} logger - Logger instance
   */
  constructor(model, logger = null) {
    if (this.constructor === BaseRepository) {
      throw new Error('BaseRepository is abstract and cannot be instantiated directly');
    }
    
    this.model = model;
    this.modelName = model?.modelName || 'Unknown';
    this.logger = logger || Logger.getLogger(this.constructor.name);
  }

  /**
   * Creates a new document
   * @param {Object} data - Document data
   * @param {Object} options - Creation options
   * @returns {Promise<Object>} Created document
   */
  async create(data, options = {}) {
    try {
      this.logger.debug('Creating document', { modelName: this.modelName });
      const document = new this.model(data);
      return await document.save(options);
    } catch (error) {
      this.logger.error('Error creating document:', error);
      throw error;
    }
  }

  /**
   * Finds a document by ID
   * @param {string} id - Document ID
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>} Found document or null
   */
  async findById(id, options = {}) {
    try {
      this.logger.debug('Finding document by ID', { id, modelName: this.modelName });
      
      let query = this.model.findById(id);
      
      if (options.populate) {
        query = query.populate(options.populate);
      }
      
      if (options.select) {
        query = query.select(options.select);
      }
      
      return await query.exec();
    } catch (error) {
      this.logger.error('Error finding document by ID:', error);
      throw error;
    }
  }

  /**
   * Finds one document matching the query
   * @param {Object} query - Query object
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>} Found document or null
   */
  async findOne(query = {}, options = {}) {
    try {
      this.logger.debug('Finding one document', { query, modelName: this.modelName });
      
      let mongoQuery = this.model.findOne(query);
      
      if (options.populate) {
        mongoQuery = mongoQuery.populate(options.populate);
      }
      
      if (options.select) {
        mongoQuery = mongoQuery.select(options.select);
      }
      
      if (options.sort) {
        mongoQuery = mongoQuery.sort(options.sort);
      }
      
      return await mongoQuery.exec();
    } catch (error) {
      this.logger.error('Error finding one document:', error);
      throw error;
    }
  }

  /**
   * Finds multiple documents with pagination
   * @param {Object} query - Query object
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Result with data and pagination info
   */
  async findMany(query = {}, options = {}) {
    try {
      this.logger.debug('Finding multiple documents', { query, options, modelName: this.modelName });
      
      const {
        page = 1,
        limit = 10,
        sort = { createdAt: -1 },
        populate = null,
        select = null
      } = options;
      
      const skip = (page - 1) * limit;
      
      // Build query
      let mongoQuery = this.model.find(query);
      
      if (populate) {
        mongoQuery = mongoQuery.populate(populate);
      }
      
      if (select) {
        mongoQuery = mongoQuery.select(select);
      }
      
      if (sort) {
        mongoQuery = mongoQuery.sort(sort);
      }
      
      // Execute query with pagination
      const [data, total] = await Promise.all([
        mongoQuery.skip(skip).limit(limit).exec(),
        this.model.countDocuments(query)
      ]);
      
      const totalPages = Math.ceil(total / limit);
      
      return {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };
    } catch (error) {
      this.logger.error('Error finding multiple documents:', error);
      throw error;
    }
  }

  /**
   * Updates a document by ID
   * @param {string} id - Document ID
   * @param {Object} updateData - Update data
   * @param {Object} options - Update options
   * @returns {Promise<Object|null>} Updated document
   */
  async updateById(id, updateData, options = {}) {
    try {
      this.logger.debug('Updating document by ID', { id, modelName: this.modelName });
      
      const defaultOptions = { new: true, runValidators: true };
      const mergedOptions = { ...defaultOptions, ...options };
      
      let query = this.model.findByIdAndUpdate(id, updateData, mergedOptions);
      
      if (options.populate) {
        query = query.populate(options.populate);
      }
      
      return await query.exec();
    } catch (error) {
      this.logger.error('Error updating document by ID:', error);
      throw error;
    }
  }

  /**
   * Updates multiple documents
   * @param {Object} query - Query object
   * @param {Object} updateData - Update data
   * @param {Object} options - Update options
   * @returns {Promise<Object>} Update result
   */
  async updateMany(query, updateData, options = {}) {
    try {
      this.logger.debug('Updating multiple documents', { query, modelName: this.modelName });
      return await this.model.updateMany(query, updateData, options);
    } catch (error) {
      this.logger.error('Error updating multiple documents:', error);
      throw error;
    }
  }

  /**
   * Deletes a document by ID
   * @param {string} id - Document ID
   * @param {Object} options - Delete options
   * @returns {Promise<Object|null>} Deleted document
   */
  async deleteById(id, options = {}) {
    try {
      this.logger.debug('Deleting document by ID', { id, modelName: this.modelName });
      return await this.model.findByIdAndDelete(id, options);
    } catch (error) {
      this.logger.error('Error deleting document by ID:', error);
      throw error;
    }
  }

  /**
   * Deletes multiple documents
   * @param {Object} query - Query object
   * @param {Object} options - Delete options
   * @returns {Promise<Object>} Delete result
   */
  async deleteMany(query, options = {}) {
    try {
      this.logger.debug('Deleting multiple documents', { query, modelName: this.modelName });
      return await this.model.deleteMany(query, options);
    } catch (error) {
      this.logger.error('Error deleting multiple documents:', error);
      throw error;
    }
  }

  /**
   * Counts documents matching the query
   * @param {Object} query - Query object
   * @returns {Promise<number>} Document count
   */
  async count(query = {}) {
    try {
      this.logger.debug('Counting documents', { query, modelName: this.modelName });
      return await this.model.countDocuments(query);
    } catch (error) {
      this.logger.error('Error counting documents:', error);
      throw error;
    }
  }

  /**
   * Performs aggregation query
   * @param {Array} pipeline - Aggregation pipeline
   * @param {Object} options - Aggregation options
   * @returns {Promise<Array>} Aggregation result
   */
  async aggregate(pipeline, options = {}) {
    try {
      this.logger.debug('Performing aggregation', { pipeline, modelName: this.modelName });
      return await this.model.aggregate(pipeline, options);
    } catch (error) {
      this.logger.error('Error performing aggregation:', error);
      throw error;
    }
  }

  /**
   * Checks if document exists
   * @param {Object} query - Query object
   * @returns {Promise<boolean>} True if document exists
   */
  async exists(query) {
    try {
      const count = await this.count(query);
      return count > 0;
    } catch (error) {
      this.logger.error('Error checking document existence:', error);
      throw error;
    }
  }
}

module.exports = BaseRepository;
