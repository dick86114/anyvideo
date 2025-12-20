const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const { authenticate, authorize } = require('../middleware/auth');

// Public routes
router.post('/login', AuthController.login);

// Protected routes
router.use(authenticate);

router.get('/me', AuthController.getCurrentUser);
router.put('/password', AuthController.updatePassword);

// Admin only routes
router.post('/register', authorize(['admin']), AuthController.register);

module.exports = router;