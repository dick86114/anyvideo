const express = require('express');
const router = express.Router();
const ConfigController = require('../controllers/ConfigController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes are protected by authentication
router.use(authenticate);

// ========== User Management Routes ==========
// Get all users (admin only)
router.get('/users', authorize(['admin']), ConfigController.getUsers);

// Create a new user (admin only)
router.post('/users', authorize(['admin']), ConfigController.createUser);

// Update a user (admin only)
router.put('/users/:id', authorize(['admin']), ConfigController.updateUser);

// Update user password (admin only)
router.patch('/users/:id/password', authorize(['admin']), ConfigController.updateUserPassword);

// Delete a user (admin only)
router.delete('/users/:id', authorize(['admin']), ConfigController.deleteUser);

// Toggle user status (admin only)
router.patch('/users/:id/status', authorize(['admin']), ConfigController.toggleUserStatus);

// ========== Platform Cookie Management Routes ==========
// Get all platform cookies
router.get('/cookies', ConfigController.getCookies);

// Create a new platform cookie (admin only)
router.post('/cookies', authorize(['admin']), ConfigController.createCookie);

// Update a platform cookie (admin only)
router.put('/cookies/:id', authorize(['admin']), ConfigController.updateCookie);

// Delete a platform cookie (admin only)
router.delete('/cookies/:id', authorize(['admin']), ConfigController.deleteCookie);

// Test cookie validity
router.post('/cookies/:id/test', ConfigController.testCookie);

// ========== System Settings Routes ==========
// Get system settings
router.get('/system', ConfigController.getSystemSettings);

// Update system settings (admin only)
router.put('/system', authorize(['admin']), ConfigController.updateSystemSettings);

module.exports = router;
