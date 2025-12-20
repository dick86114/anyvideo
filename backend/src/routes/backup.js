const express = require('express');
const router = express.Router();
const BackupController = require('../controllers/BackupController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes are protected by authentication
router.use(authenticate);

// All backup operations require admin role
router.use(authorize(['admin']));

// Trigger manual backup
router.post('/', BackupController.createBackup);

// Get list of backups
router.get('/', BackupController.getBackupList);

// Delete a backup
router.delete('/:filename', BackupController.deleteBackup);

module.exports = router;
