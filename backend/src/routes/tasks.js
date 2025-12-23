const express = require('express');
const router = express.Router();
const TaskController = require('../controllers/TaskController');
const { authenticate } = require('../middleware/auth');

// All routes are protected by authentication
router.use(authenticate);

// Create a new task
router.post('/', TaskController.createTask);

// Get task list with pagination and filters
router.get('/', TaskController.getTasks);

// Get task by ID
router.get('/:id', TaskController.getTaskById);

// Update a task
router.put('/:id', TaskController.updateTask);

// Delete a task
router.delete('/:id', TaskController.deleteTask);

// Toggle task status (enable/disable)
router.patch('/:id/status', TaskController.toggleTaskStatus);

// Run task immediately
router.post('/:id/run', TaskController.runTaskImmediately);

// Hotsearch task management routes
router.post('/hotsearch/run', TaskController.runHotsearchTask);
router.get('/hotsearch/logs', TaskController.getHotsearchLogs);

// Task logs management routes
router.get('/:taskId/logs', TaskController.getTaskLogs);
router.get('/logs/all', TaskController.getAllLogs);

module.exports = router;