const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');

// Public routes
router.post('/login', AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/system-status', AuthController.checkSystemStatus);
router.post('/initial-setup', AuthController.initialSetup);

module.exports = router;