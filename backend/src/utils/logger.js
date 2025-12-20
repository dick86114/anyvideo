const winston = require('winston');
const path = require('path');

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6
};

// Define log formats
const logFormats = {
  file: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  console: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.printf(({ timestamp, level, message, stack }) => {
      return `${timestamp} ${level}: ${message} ${stack || ''}`;
    })
  )
};

// Define transports
const transports = [
  // Error logs transport
  new winston.transports.File({
    filename: path.join(__dirname, '../../logs/error.log'),
    level: 'error',
    format: logFormats.file,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    zippedArchive: true
  }),
  
  // Combined logs transport
  new winston.transports.File({
    filename: path.join(__dirname, '../../logs/combined.log'),
    format: logFormats.file,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    zippedArchive: true
  }),
  
  // Console transport (development only)
  new winston.transports.Console({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: logFormats.console
  })
];

// Create logger instance
const logger = winston.createLogger({
  levels: logLevels,
  transports,
  exitOnError: false
});

// Create stream for morgan integration
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

module.exports = logger;