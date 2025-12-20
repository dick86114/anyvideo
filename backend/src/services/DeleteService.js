const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * DeleteService - A comprehensive service for MongoDB document deletion
 * Provides hard delete, soft delete, and transaction support
 */
class DeleteService {
  /**
   * Delete a single document by ID
   * @param {mongoose.Model} Model - Mongoose model
   * @param {string} id - Document ID
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Deleted document or null if not found
   */
  static async deleteById(Model, id, options = {}) {
    try {
      // Validate ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        const error = new Error('Invalid document ID');
        error.status = 400;
        throw error;
      }

      // Check if document exists
      const document = await Model.findByIdWithDeleted(id);
      if (!document) {
        const error = new Error('Document not found');
        error.status = 404;
        throw error;
      }

      // Check if already deleted
      if (document.deletedAt && !options.force) {
        return document;
      }

      // Perform hard delete
      const deletedDocument = await Model.findByIdAndDelete(id);

      // Log deletion
      logger.info(`Hard deleted document: ${Model.modelName} - ${id}`, {
        collection: Model.modelName,
        documentId: id,
        deletionType: 'hard',
        userId: options.userId || 'system'
      });

      return deletedDocument;
    } catch (error) {
      logger.error(`Failed to hard delete document: ${Model.modelName} - ${id}`, {
        error: error.message,
        collection: Model.modelName,
        documentId: id,
        deletionType: 'hard'
      });
      throw error;
    }
  }

  /**
   * Soft delete a single document by ID
   * @param {mongoose.Model} Model - Mongoose model
   * @param {string} id - Document ID
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Soft deleted document or null if not found
   */
  static async softDeleteById(Model, id, options = {}) {
    try {
      // Validate ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        const error = new Error('Invalid document ID');
        error.status = 400;
        throw error;
      }

      // Check if document exists
      const document = await Model.findByIdWithDeleted(id);
      if (!document) {
        const error = new Error('Document not found');
        error.status = 404;
        throw error;
      }

      // Check if already soft deleted
      if (document.deletedAt) {
        return document;
      }

      // Perform soft delete
      const deletedDocument = await Model.softDeleteById(id);

      // Log deletion
      logger.info(`Soft deleted document: ${Model.modelName} - ${id}`, {
        collection: Model.modelName,
        documentId: id,
        deletionType: 'soft',
        userId: options.userId || 'system'
      });

      return deletedDocument;
    } catch (error) {
      logger.error(`Failed to soft delete document: ${Model.modelName} - ${id}`, {
        error: error.message,
        collection: Model.modelName,
        documentId: id,
        deletionType: 'soft'
      });
      throw error;
    }
  }

  /**
   * Restore a soft deleted document by ID
   * @param {mongoose.Model} Model - Mongoose model
   * @param {string} id - Document ID
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Restored document or null if not found
   */
  static async restoreById(Model, id, options = {}) {
    try {
      // Validate ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        const error = new Error('Invalid document ID');
        error.status = 400;
        throw error;
      }

      // Check if document exists
      const document = await Model.findByIdWithDeleted(id);
      if (!document) {
        const error = new Error('Document not found');
        error.status = 404;
        throw error;
      }

      // Check if already restored
      if (!document.deletedAt) {
        return document;
      }

      // Perform restore
      const restoredDocument = await Model.restoreById(id);

      // Log restoration
      logger.info(`Restored document: ${Model.modelName} - ${id}`, {
        collection: Model.modelName,
        documentId: id,
        restorationType: 'single',
        userId: options.userId || 'system'
      });

      return restoredDocument;
    } catch (error) {
      logger.error(`Failed to restore document: ${Model.modelName} - ${id}`, {
        error: error.message,
        collection: Model.modelName,
        documentId: id,
        restorationType: 'single'
      });
      throw error;
    }
  }

  /**
   * Delete multiple documents based on criteria
   * @param {mongoose.Model} Model - Mongoose model
   * @param {Object} criteria - Deletion criteria
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Deletion result
   */
  static async deleteByCriteria(Model, criteria, options = {}) {
    try {
      // Validate criteria
      if (!criteria || Object.keys(criteria).length === 0) {
        const error = new Error('Deletion criteria must be provided');
        error.status = 400;
        throw error;
      }

      // Prevent accidental deletion of all documents
      if (options.allowEmptyCriteria !== true && Object.keys(criteria).length === 0) {
        const error = new Error('Cannot delete all documents without explicit permission');
        error.status = 403;
        throw error;
      }

      // Count documents to be deleted
      const count = await Model.findWithDeleted(criteria).countDocuments();
      if (count === 0) {
        return { deletedCount: 0 };
      }

      // Log bulk deletion attempt
      logger.warn(`Attempting bulk hard deletion: ${Model.modelName} - ${count} documents`, {
        collection: Model.modelName,
        criteria,
        count,
        deletionType: 'hard',
        userId: options.userId || 'system'
      });

      // Perform bulk delete
      const result = await Model.deleteMany(criteria);

      // Log deletion result
      logger.info(`Bulk hard deletion completed: ${Model.modelName} - ${result.deletedCount} documents`, {
        collection: Model.modelName,
        criteria,
        deletedCount: result.deletedCount,
        deletionType: 'hard',
        userId: options.userId || 'system'
      });

      return result;
    } catch (error) {
      logger.error(`Failed to bulk hard delete documents: ${Model.modelName}`, {
        error: error.message,
        collection: Model.modelName,
        criteria,
        deletionType: 'hard'
      });
      throw error;
    }
  }

  /**
   * Soft delete multiple documents based on criteria
   * @param {mongoose.Model} Model - Mongoose model
   * @param {Object} criteria - Deletion criteria
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Deletion result
   */
  static async softDeleteByCriteria(Model, criteria, options = {}) {
    try {
      // Validate criteria
      if (!criteria || Object.keys(criteria).length === 0) {
        const error = new Error('Deletion criteria must be provided');
        error.status = 400;
        throw error;
      }

      // Prevent accidental deletion of all documents
      if (options.allowEmptyCriteria !== true && Object.keys(criteria).length === 0) {
        const error = new Error('Cannot delete all documents without explicit permission');
        error.status = 403;
        throw error;
      }

      // Count documents to be deleted
      const count = await Model.findWithDeleted(criteria).countDocuments();
      if (count === 0) {
        return { modifiedCount: 0 };
      }

      // Log bulk deletion attempt
      logger.warn(`Attempting bulk soft deletion: ${Model.modelName} - ${count} documents`, {
        collection: Model.modelName,
        criteria,
        count,
        deletionType: 'soft',
        userId: options.userId || 'system'
      });

      // Perform bulk soft delete
      const result = await Model.softDeleteByCriteria(criteria);

      // Log deletion result
      logger.info(`Bulk soft deletion completed: ${Model.modelName} - ${result.modifiedCount} documents`, {
        collection: Model.modelName,
        criteria,
        modifiedCount: result.modifiedCount,
        deletionType: 'soft',
        userId: options.userId || 'system'
      });

      return result;
    } catch (error) {
      logger.error(`Failed to bulk soft delete documents: ${Model.modelName}`, {
        error: error.message,
        collection: Model.modelName,
        criteria,
        deletionType: 'soft'
      });
      throw error;
    }
  }

  /**
   * Restore multiple soft deleted documents based on criteria
   * @param {mongoose.Model} Model - Mongoose model
   * @param {Object} criteria - Restoration criteria
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Restoration result
   */
  static async restoreByCriteria(Model, criteria, options = {}) {
    try {
      // Validate criteria
      if (!criteria || Object.keys(criteria).length === 0) {
        const error = new Error('Restoration criteria must be provided');
        error.status = 400;
        throw error;
      }

      // Count documents to be restored
      const count = await Model.findWithDeleted({ ...criteria, deletedAt: { $ne: null } }).countDocuments();
      if (count === 0) {
        return { modifiedCount: 0 };
      }

      // Log bulk restoration attempt
      logger.warn(`Attempting bulk restoration: ${Model.modelName} - ${count} documents`, {
        collection: Model.modelName,
        criteria,
        count,
        restorationType: 'bulk',
        userId: options.userId || 'system'
      });

      // Perform bulk restore
      const result = await Model.restoreByCriteria(criteria);

      // Log restoration result
      logger.info(`Bulk restoration completed: ${Model.modelName} - ${result.modifiedCount} documents`, {
        collection: Model.modelName,
        criteria,
        modifiedCount: result.modifiedCount,
        restorationType: 'bulk',
        userId: options.userId || 'system'
      });

      return result;
    } catch (error) {
      logger.error(`Failed to bulk restore documents: ${Model.modelName}`, {
        error: error.message,
        collection: Model.modelName,
        criteria,
        restorationType: 'bulk'
      });
      throw error;
    }
  }

  /**
   * Execute delete operations within a transaction
   * @param {Array<Function>} operations - Array of functions to execute within transaction
   * @param {Object} options - Additional options
   * @returns {Promise<Array>} Results of all operations
   */
  static async executeInTransaction(operations, options = {}) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const results = [];

      // Execute all operations with session
      for (const operation of operations) {
        if (typeof operation !== 'function') {
          throw new Error('Transaction operations must be functions');
        }
        
        const result = await operation(session);
        results.push(result);
      }

      // Commit transaction
      await session.commitTransaction();
      logger.info('Transaction committed successfully', {
        operationCount: operations.length,
        userId: options.userId || 'system'
      });

      return results;
    } catch (error) {
      // Rollback transaction on error
      await session.abortTransaction();
      logger.error('Transaction rolled back due to error', {
        error: error.message,
        operationCount: operations.length,
        userId: options.userId || 'system'
      });
      throw error;
    } finally {
      // End session
      session.endSession();
    }
  }

  /**
   * Delete document with related documents in transaction
   * @param {Object} deletionPlan - Plan for deleting related documents
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Deletion results
   */
  static async deleteWithRelatedDocuments(deletionPlan, options = {}) {
    try {
      // Validate deletion plan
      if (!deletionPlan || !Array.isArray(deletionPlan)) {
        const error = new Error('Deletion plan must be an array of operations');
        error.status = 400;
        throw error;
      }

      // Execute operations in transaction
      const results = await this.executeInTransaction(deletionPlan, options);

      return { success: true, results };
    } catch (error) {
      logger.error('Failed to delete related documents in transaction', {
        error: error.message,
        deletionPlanLength: deletionPlan?.length || 0,
        userId: options.userId || 'system'
      });
      throw error;
    }
  }

  /**
   * Check if document is critical and should not be deleted
   * @param {mongoose.Model} Model - Mongoose model
   * @param {Object} document - Document to check
   * @returns {boolean} True if document is critical, false otherwise
   */
  static isCriticalDocument(Model, document) {
    // Critical document checks can be extended here
    // For example: system settings, admin users, etc.
    const modelName = Model.modelName;
    
    // System settings are critical
    if (modelName === 'SystemSettings') {
      return true;
    }
    
    // Admin users might be critical
    if (modelName === 'User' && document.role === 'admin') {
      return true;
    }
    
    return false;
  }
}

module.exports = DeleteService;