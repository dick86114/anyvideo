const mongoose = require('mongoose');
const logger = require('./logger');
require('dotenv').config();

let isMongoConnected = false;

/**
 * Connect to MongoDB
 * @returns {Promise<boolean>} True if connection successful, false otherwise
 */
const connectMongoDB = async () => {
  try {
    if (isMongoConnected) {
      return true;
    }

    const mongodbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/videoAll';
    await mongoose.connect(mongodbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    logger.info('MongoDB connected successfully');
    isMongoConnected = true;
    return true;
  } catch (error) {
    logger.error('MongoDB connection error:', {
      error: error.message,
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/videoAll'
    });
    isMongoConnected = false;
    return false;
  }
};

/**
 * Get MongoDB connection status
 * @returns {boolean} True if connected, false otherwise
 */
const getMongoConnectionStatus = () => isMongoConnected;

/**
 * Get Mongoose connection instance
 * @returns {mongoose.Connection} Mongoose connection instance
 */
const getMongoConnection = () => mongoose.connection;

module.exports = {
  connectMongoDB,
  getMongoConnectionStatus,
  getMongoConnection,
  mongoose
};