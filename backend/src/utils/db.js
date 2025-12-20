const { AppDataSource } = require('../data-source');
const taskScheduler = require('../services/TaskSchedulerService');
require('dotenv').config();

let isConnected = false;

const connectDB = async () => {
  try {
    await AppDataSource.initialize();
    console.log('PostgreSQL connected successfully');
    isConnected = true;
    
    // Initialize task scheduler after database connection is established
    await taskScheduler.init();
    console.log('Task scheduler initialized with 0 enabled tasks');
  } catch (error) {
    console.error('PostgreSQL connection error:', error);
    console.log('Continuing without PostgreSQL connection...');
    isConnected = false;
    // Try to reconnect every 5 seconds
    setTimeout(connectDB, 5000);
  }
};

const getDBConnectionStatus = () => isConnected;

module.exports = {
  connectDB,
  getDBConnectionStatus,
  AppDataSource
};