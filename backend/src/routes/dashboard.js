const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/DashboardController');
const { authenticate } = require('../middleware/auth');

// All routes are protected by authentication
router.use(authenticate);

// Get all dashboard data in one call
router.get('/', DashboardController.getAllDashboardData);

// Get dashboard statistics
router.get('/stats', DashboardController.getDashboardStats);

// Get content platform distribution
router.get('/platform-distribution', DashboardController.getContentPlatformDistribution);

// Get content type comparison
router.get('/content-type-comparison', DashboardController.getContentTypeComparison);

// Get recent content trend
router.get('/recent-trend', DashboardController.getRecentContentTrend);

module.exports = router;
