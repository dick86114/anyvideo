const { connectMongoDB, getMongoConnectionStatus } = require('../utils/mongoDB');
const DeleteService = require('../services/DeleteService');
const logger = require('../utils/logger');

// Import Mongoose models
const Content = require('../models/Content');
const CrawlTask = require('../models/CrawlTask');
const TaskLog = require('../models/TaskLog');
const PlatformAccount = require('../models/PlatformAccount');
const HotsearchSnapshot = require('../models/HotsearchSnapshot');
const { SystemSettings, PlatformCookie } = require('../models/Config');

/**
 * MongoDeleteController - Controller for MongoDB deletion operations
 * Handles hard delete, soft delete, and restore functionality
 */
class MongoDeleteController {
  // Map collection names to Mongoose models
  static modelMap = {
    contents: Content,
    crawltasks: CrawlTask,
    tasklogs: TaskLog,
    platformaccounts: PlatformAccount,
    hotsearchsnapshots: HotsearchSnapshot,
    systemsettings: SystemSettings,
    platformcookies: PlatformCookie
  };

  /**
   * Delete a single document by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  static async deleteById(req, res) {
    try {
      // Ensure MongoDB is connected
      const isConnected = await connectMongoDB();
      if (!isConnected) {
        return res.status(503).json({ message: 'MongoDB connection unavailable' });
      }

      const { collection, id } = req.params;
      const { force } = req.query;

      // Validate collection name
      const Model = this.modelMap[collection.toLowerCase()];
      if (!Model) {
        return res.status(400).json({ message: 'Invalid collection name' });
      }

      // Perform hard delete
      const deletedDocument = await DeleteService.deleteById(Model, id, {
        force: force === 'true',
        userId: req.user?.id || 'system'
      });

      res.status(200).json({
        message: 'Document deleted successfully',
        data: deletedDocument
      });
    } catch (error) {
      logger.error(`Failed to delete document from ${req.params.collection}`, {
        error: error.message,
        collection: req.params.collection,
        documentId: req.params.id,
        userId: req.user?.id || 'system'
      });

      res.status(error.status || 500).json({
        message: error.message || 'Failed to delete document',
        error: error.message
      });
    }
  }

  /**
   * Soft delete a single document by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  static async softDeleteById(req, res) {
    try {
      // Ensure MongoDB is connected
      const isConnected = await connectMongoDB();
      if (!isConnected) {
        return res.status(503).json({ message: 'MongoDB connection unavailable' });
      }

      const { collection, id } = req.params;

      // Validate collection name
      const Model = this.modelMap[collection.toLowerCase()];
      if (!Model) {
        return res.status(400).json({ message: 'Invalid collection name' });
      }

      // Perform soft delete
      const deletedDocument = await DeleteService.softDeleteById(Model, id, {
        userId: req.user?.id || 'system'
      });

      res.status(200).json({
        message: 'Document soft deleted successfully',
        data: deletedDocument
      });
    } catch (error) {
      logger.error(`Failed to soft delete document from ${req.params.collection}`, {
        error: error.message,
        collection: req.params.collection,
        documentId: req.params.id,
        userId: req.user?.id || 'system'
      });

      res.status(error.status || 500).json({
        message: error.message || 'Failed to soft delete document',
        error: error.message
      });
    }
  }

  /**
   * Restore a soft deleted document by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  static async restoreById(req, res) {
    try {
      // Ensure MongoDB is connected
      const isConnected = await connectMongoDB();
      if (!isConnected) {
        return res.status(503).json({ message: 'MongoDB connection unavailable' });
      }

      const { collection, id } = req.params;

      // Validate collection name
      const Model = this.modelMap[collection.toLowerCase()];
      if (!Model) {
        return res.status(400).json({ message: 'Invalid collection name' });
      }

      // Perform restore
      const restoredDocument = await DeleteService.restoreById(Model, id, {
        userId: req.user?.id || 'system'
      });

      res.status(200).json({
        message: 'Document restored successfully',
        data: restoredDocument
      });
    } catch (error) {
      logger.error(`Failed to restore document from ${req.params.collection}`, {
        error: error.message,
        collection: req.params.collection,
        documentId: req.params.id,
        userId: req.user?.id || 'system'
      });

      res.status(error.status || 500).json({
        message: error.message || 'Failed to restore document',
        error: error.message
      });
    }
  }

  /**
   * Delete multiple documents based on criteria
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  static async deleteByCriteria(req, res) {
    try {
      // Ensure MongoDB is connected
      const isConnected = await connectMongoDB();
      if (!isConnected) {
        return res.status(503).json({ message: 'MongoDB connection unavailable' });
      }

      const { collection } = req.params;
      const { criteria, allowEmptyCriteria } = req.body;

      // Validate collection name
      const Model = this.modelMap[collection.toLowerCase()];
      if (!Model) {
        return res.status(400).json({ message: 'Invalid collection name' });
      }

      // Perform bulk delete
      const result = await DeleteService.deleteByCriteria(Model, criteria, {
        allowEmptyCriteria,
        userId: req.user?.id || 'system'
      });

      res.status(200).json({
        message: `Successfully deleted ${result.deletedCount} documents`,
        data: result
      });
    } catch (error) {
      logger.error(`Failed to delete documents from ${req.params.collection} by criteria`, {
        error: error.message,
        collection: req.params.collection,
        criteria: req.body.criteria,
        userId: req.user?.id || 'system'
      });

      res.status(error.status || 500).json({
        message: error.message || 'Failed to delete documents by criteria',
        error: error.message
      });
    }
  }

  /**
   * Soft delete multiple documents based on criteria
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  static async softDeleteByCriteria(req, res) {
    try {
      // Ensure MongoDB is connected
      const isConnected = await connectMongoDB();
      if (!isConnected) {
        return res.status(503).json({ message: 'MongoDB connection unavailable' });
      }

      const { collection } = req.params;
      const { criteria, allowEmptyCriteria } = req.body;

      // Validate collection name
      const Model = this.modelMap[collection.toLowerCase()];
      if (!Model) {
        return res.status(400).json({ message: 'Invalid collection name' });
      }

      // Perform bulk soft delete
      const result = await DeleteService.softDeleteByCriteria(Model, criteria, {
        allowEmptyCriteria,
        userId: req.user?.id || 'system'
      });

      res.status(200).json({
        message: `Successfully soft deleted ${result.modifiedCount} documents`,
        data: result
      });
    } catch (error) {
      logger.error(`Failed to soft delete documents from ${req.params.collection} by criteria`, {
        error: error.message,
        collection: req.params.collection,
        criteria: req.body.criteria,
        userId: req.user?.id || 'system'
      });

      res.status(error.status || 500).json({
        message: error.message || 'Failed to soft delete documents by criteria',
        error: error.message
      });
    }
  }

  /**
   * Restore multiple soft deleted documents based on criteria
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  static async restoreByCriteria(req, res) {
    try {
      // Ensure MongoDB is connected
      const isConnected = await connectMongoDB();
      if (!isConnected) {
        return res.status(503).json({ message: 'MongoDB connection unavailable' });
      }

      const { collection } = req.params;
      const { criteria } = req.body;

      // Validate collection name
      const Model = this.modelMap[collection.toLowerCase()];
      if (!Model) {
        return res.status(400).json({ message: 'Invalid collection name' });
      }

      // Perform bulk restore
      const result = await DeleteService.restoreByCriteria(Model, criteria, {
        userId: req.user?.id || 'system'
      });

      res.status(200).json({
        message: `Successfully restored ${result.modifiedCount} documents`,
        data: result
      });
    } catch (error) {
      logger.error(`Failed to restore documents from ${req.params.collection} by criteria`, {
        error: error.message,
        collection: req.params.collection,
        criteria: req.body.criteria,
        userId: req.user?.id || 'system'
      });

      res.status(error.status || 500).json({
        message: error.message || 'Failed to restore documents by criteria',
        error: error.message
      });
    }
  }

  /**
   * Delete related documents in transaction
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  static async deleteWithRelatedDocuments(req, res) {
    try {
      // Ensure MongoDB is connected
      const isConnected = await connectMongoDB();
      if (!isConnected) {
        return res.status(503).json({ message: 'MongoDB connection unavailable' });
      }

      const { deletionPlan } = req.body;

      // Validate deletion plan
      if (!Array.isArray(deletionPlan) || deletionPlan.length === 0) {
        return res.status(400).json({ message: 'Deletion plan must be a non-empty array' });
      }

      // Map collection names to models in deletion plan
      const mappedDeletionPlan = deletionPlan.map(step => {
        return async (session) => {
          const Model = this.modelMap[step.collection.toLowerCase()];
          if (!Model) {
            throw new Error(`Invalid collection name: ${step.collection}`);
          }

          // Execute the appropriate delete operation
          switch (step.operation) {
            case 'deleteById':
              return await DeleteService.deleteById(Model, step.id, {
                session,
                userId: req.user?.id || 'system'
              });
            case 'softDeleteById':
              return await DeleteService.softDeleteById(Model, step.id, {
                session,
                userId: req.user?.id || 'system'
              });
            case 'deleteByCriteria':
              return await Model.deleteMany(step.criteria, { session });
            case 'softDeleteByCriteria':
              return await Model.softDeleteByCriteria(step.criteria, { session });
            default:
              throw new Error(`Invalid operation type: ${step.operation}`);
          }
        };
      });

      // Execute deletion plan in transaction
      const result = await DeleteService.deleteWithRelatedDocuments(mappedDeletionPlan, {
        userId: req.user?.id || 'system'
      });

      res.status(200).json({
        message: 'Related documents deleted successfully',
        data: result
      });
    } catch (error) {
      logger.error('Failed to delete related documents in transaction', {
        error: error.message,
        deletionPlanLength: req.body.deletionPlan?.length || 0,
        userId: req.user?.id || 'system'
      });

      res.status(error.status || 500).json({
        message: error.message || 'Failed to delete related documents',
        error: error.message
      });
    }
  }

  /**
   * Get deleted documents (soft deleted)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  static async getDeletedDocuments(req, res) {
    try {
      // Ensure MongoDB is connected
      const isConnected = await connectMongoDB();
      if (!isConnected) {
        return res.status(503).json({ message: 'MongoDB connection unavailable' });
      }

      const { collection } = req.params;
      const { page = 1, page_size = 10, ...criteria } = req.query;

      // Validate collection name
      const Model = this.modelMap[collection.toLowerCase()];
      if (!Model) {
        return res.status(400).json({ message: 'Invalid collection name' });
      }

      // Calculate skip and limit for pagination
      const skip = (page - 1) * page_size;
      const limit = parseInt(page_size);

      // Find deleted documents
      const deletedDocuments = await Model.findWithDeleted({
        ...criteria,
        deletedAt: { $ne: null }
      })
        .skip(skip)
        .limit(limit)
        .sort({ deletedAt: -1 });

      // Count total deleted documents
      const total = await Model.findWithDeleted({
        ...criteria,
        deletedAt: { $ne: null }
      }).countDocuments();

      res.status(200).json({
        message: 'Deleted documents retrieved successfully',
        data: {
          list: deletedDocuments,
          total,
          page: parseInt(page),
          page_size: limit
        }
      });
    } catch (error) {
      logger.error(`Failed to get deleted documents from ${req.params.collection}`, {
        error: error.message,
        collection: req.params.collection,
        criteria: req.query,
        userId: req.user?.id || 'system'
      });

      res.status(error.status || 500).json({
        message: error.message || 'Failed to get deleted documents',
        error: error.message
      });
    }
  }
}

module.exports = MongoDeleteController;