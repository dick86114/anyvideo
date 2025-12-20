const express = require('express');
const router = express.Router();
const ContentController = require('../controllers/ContentController');
// const { authenticate } = require('../middleware/auth');

// All routes are protected by authentication
// router.use(authenticate);

// Parse content from link
router.post('/parse', ContentController.parseContent);

// Get content list with pagination and filters
router.get('/', ContentController.getContentList);

// Get content by ID
router.get('/:id', ContentController.getContentById);

// Delete content by ID
router.delete('/:id', ContentController.deleteContent);

// Batch delete contents
router.post('/batch-delete', ContentController.batchDeleteContents);

// Batch export contents
router.post('/export', ContentController.batchExportContents);

// Download exported Excel file
router.get('/download-export', ContentController.downloadExport);

// Download single content file
router.post('/download', ContentController.downloadContent);

// Proxy download for external media files
router.get('/proxy-download', ContentController.proxyDownload);

// Proxy image for frontend display (bypass CORS)
router.get('/proxy-image', ContentController.proxyImage);

// Save content to both database and project root directory
router.post('/save', ContentController.saveContent);

module.exports = router;