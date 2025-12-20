const express = require('express');
const router = express.Router();
const MongoDeleteController = require('../controllers/MongoDeleteController');
// const { authenticate } = require('../middleware/auth');

// All routes are protected by authentication
// router.use(authenticate);

// Delete a single document by ID (hard delete)
router.delete('/:collection/:id', MongoDeleteController.deleteById);

// Soft delete a single document by ID
router.post('/:collection/:id/soft-delete', MongoDeleteController.softDeleteById);

// Restore a soft deleted document by ID
router.post('/:collection/:id/restore', MongoDeleteController.restoreById);

// Delete multiple documents by criteria (hard delete)
router.post('/:collection/delete-by-criteria', MongoDeleteController.deleteByCriteria);

// Soft delete multiple documents by criteria
router.post('/:collection/soft-delete-by-criteria', MongoDeleteController.softDeleteByCriteria);

// Restore multiple documents by criteria
router.post('/:collection/restore-by-criteria', MongoDeleteController.restoreByCriteria);

// Delete related documents in transaction
router.post('/transaction', MongoDeleteController.deleteWithRelatedDocuments);

// Get deleted documents (soft deleted)
router.get('/:collection/deleted', MongoDeleteController.getDeletedDocuments);

module.exports = router;