const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('./utils/db');
const logger = require('./utils/logger');

// Initialize Express app
const app = express();

// Connect to database
connectDB(); // PostgreSQL connection

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Response compression
app.use(compression());

// HTTP request logging
app.use(morgan('combined', { stream: logger.stream }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    status: 'error',
    message: '请求过于频繁，请稍后重试',
    code: 429
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

// Apply rate limiting to all requests
app.use(limiter);

// Static file serving with caching
app.use('/media', express.static(path.join(__dirname, '../../media'), {
  maxAge: '1d', // Cache static files for 1 day
  etag: true,
  lastModified: true
}));

// Database connection check middleware
const { getDBConnectionStatus } = require('./utils/db');
app.use((req, res, next) => {
  // Skip health check route to always respond
  if (req.path === '/health') {
    return next();
  }
  
  // Check DB connection status for all other API routes
  if (!getDBConnectionStatus()) {
    return res.status(503).json({
      status: 'error',
      message: '数据库连接不可用，请稍后重试',
      code: 503
    });
  }
  next();
});

// API routes
const apiPrefix = process.env.API_PREFIX || '/api/v1';

// Placeholder for routes (will be imported later)
app.use(`${apiPrefix}/auth`, require('./routes/auth'));
app.use(`${apiPrefix}/users`, require('./routes/users'));
app.use(`${apiPrefix}/content`, require('./routes/content'));
app.use(`${apiPrefix}/tasks`, require('./routes/tasks'));
app.use(`${apiPrefix}/hotsearch`, require('./routes/hotsearch'));
app.use(`${apiPrefix}/config`, require('./routes/config'));
app.use(`${apiPrefix}/dashboard`, require('./routes/dashboard'));
app.use(`${apiPrefix}/backup`, require('./routes/backup'));

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

module.exports = app;