const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Current user routes (accessible by all authenticated users)
router.get('/me', UserController.getCurrentUser);
router.put('/me', UserController.updateCurrentUser);
router.put('/me/password', UserController.changeCurrentUserPassword);

// Admin only routes
router.use(authorize(['admin']));

// User management routes (admin only)
router.get('/', UserController.getAllUsers);
router.post('/', UserController.createUser);
router.get('/:id', UserController.getUserById);
router.put('/:id', UserController.updateUser);
router.put('/:id/password', UserController.updateUserPassword);
router.delete('/:id', UserController.deleteUser);

module.exports = router;