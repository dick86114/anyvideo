const express = require('express');
const router = express.Router();
const PlatformCookieController = require('../controllers/PlatformCookieController');
const SystemSettingsController = require('../controllers/SystemSettingsController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes are protected by authentication
router.use(authenticate);

// ========== Platform Cookie Management Routes (TypeORM) ==========
// Get all platform cookies
router.get('/cookies', PlatformCookieController.getPlatformCookies);
router.get('/platform-cookies', PlatformCookieController.getPlatformCookies);

// Create a new platform cookie (admin only)
router.post('/cookies', authorize(['admin']), PlatformCookieController.createPlatformCookie);
router.post('/platform-cookies', authorize(['admin']), PlatformCookieController.createPlatformCookie);

// Update a platform cookie (admin only)
router.put('/cookies/:id', authorize(['admin']), PlatformCookieController.updatePlatformCookie);
router.put('/platform-cookies/:id', authorize(['admin']), PlatformCookieController.updatePlatformCookie);

// Delete a platform cookie (admin only)
router.delete('/cookies/:id', authorize(['admin']), PlatformCookieController.deletePlatformCookie);
router.delete('/platform-cookies/:id', authorize(['admin']), PlatformCookieController.deletePlatformCookie);

// Test platform cookie validity
router.post('/cookies/:id/test', PlatformCookieController.testPlatformCookieById);
router.post('/platform-cookies/:id/test', PlatformCookieController.testPlatformCookieById);

// Batch test all platform cookies
router.post('/platform-cookies/batch-test', authorize(['admin']), PlatformCookieController.batchTestPlatformCookies);

// ========== System Settings Routes (TypeORM) ==========
// Get system settings
router.get('/system', SystemSettingsController.getSystemSettings);

// Update system settings (admin only)
router.put('/system', authorize(['admin']), SystemSettingsController.updateSystemSettings);

module.exports = router;
