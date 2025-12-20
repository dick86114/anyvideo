const os = require('os');
const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');

class SystemMonitorController {
  // Get system health status
  static async getSystemHealth(req, res) {
    try {
      // Get system information
      const systemInfo = {
        timestamp: new Date(),
        uptime: os.uptime(),
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        
        // CPU information
        cpu: {
          cores: os.cpus().length,
          model: os.cpus()[0].model,
          speed: os.cpus()[0].speed
        },
        
        // Memory information
        memory: {
          total: os.totalmem(),
          free: os.freemem(),
          used: os.totalmem() - os.freemem()
        },
        
        // Disk information (simplified - only root partition)
        disk: await this.getDiskUsage(),
        
        // Process information
        process: {
          pid: process.pid,
          memoryUsage: process.memoryUsage(),
          cpuUsage: process.cpuUsage()
        },
        
        // Log information
        logs: await this.getLogInfo(),
        
        // Health status
        status: 'ok'
      };
      
      res.status(200).json({
        message: '获取系统健康状态成功',
        data: systemInfo
      });
    } catch (error) {
      logger.error('Failed to get system health:', error);
      res.status(500).json({ message: '获取系统健康状态失败' });
    }
  }
  
  // Get disk usage information
  static async getDiskUsage() {
    try {
      const rootPath = '/';
      const stats = await fs.statvfs(rootPath);
      
      return {
        total: stats.f_blocks * stats.f_bsize,
        free: stats.f_bfree * stats.f_bsize,
        available: stats.f_bavail * stats.f_bsize,
        used: (stats.f_blocks - stats.f_bfree) * stats.f_bsize
      };
    } catch (error) {
      logger.error('Failed to get disk usage:', error);
      return {
        total: 0,
        free: 0,
        available: 0,
        used: 0
      };
    }
  }
  
  // Get log file information
  static async getLogInfo() {
    try {
      const logsDir = path.join(__dirname, '../../logs');
      const logs = {
        directory: logsDir,
        files: []
      };
      
      // Read log files
      const logFiles = await fs.readdir(logsDir);
      
      for (const file of logFiles) {
        const filePath = path.join(logsDir, file);
        const stats = await fs.stat(filePath);
        
        logs.files.push({
          name: file,
          size: stats.size,
          created_at: stats.birthtime,
          modified_at: stats.mtime
        });
      }
      
      return logs;
    } catch (error) {
      logger.error('Failed to get log info:', error);
      return {
        directory: '',
        files: []
      };
    }
  }
  
  // Get system logs with pagination and filtering
  static async getSystemLogs(req, res) {
    try {
      const { level = 'info', limit = 100, offset = 0 } = req.query;
      
      // For simplicity, we'll just return the log files info for now
      // In a real implementation, this would parse log files and return log entries
      const logs = await this.getLogInfo();
      
      res.status(200).json({
        message: '获取系统日志成功',
        data: {
          files: logs.files,
          total: logs.files.length
        }
      });
    } catch (error) {
      logger.error('Failed to get system logs:', error);
      res.status(500).json({ message: '获取系统日志失败' });
    }
  }
  
  // Get real-time metrics (simplified)
  static async getRealTimeMetrics(req, res) {
    try {
      const metrics = {
        timestamp: new Date(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        eventLoopDelay: process.hrtime(),
        activeConnections: 0, // Would be implemented with monitoring middleware
        requestRate: 0 // Would be implemented with monitoring middleware
      };
      
      res.status(200).json({
        message: '获取实时指标成功',
        data: metrics
      });
    } catch (error) {
      logger.error('Failed to get real-time metrics:', error);
      res.status(500).json({ message: '获取实时指标失败' });
    }
  }
  
  // Get application statistics
  static async getApplicationStats(req, res) {
    try {
      // In a real implementation, this would fetch from a metrics database
      // For now, we'll return mock data
      const stats = {
        totalRequests: 0,
        requestsPerMinute: 0,
        errorRate: 0,
        avgResponseTime: 0,
        activeUsers: 0
      };
      
      res.status(200).json({
        message: '获取应用统计信息成功',
        data: stats
      });
    } catch (error) {
      logger.error('Failed to get application stats:', error);
      res.status(500).json({ message: '获取应用统计信息失败' });
    }
  }
  
  // Clear old logs
  static async clearOldLogs(req, res) {
    try {
      const logsDir = path.join(__dirname, '../../logs');
      
      // Get all log files except the latest one for each type
      const logFiles = await fs.readdir(logsDir);
      const logGroups = {};
      
      // Group log files by type
      logFiles.forEach(file => {
        const type = file.split('.')[0];
        if (!logGroups[type]) {
          logGroups[type] = [];
        }
        logGroups[type].push(file);
      });
      
      // Delete all except the latest file for each type
      let deletedCount = 0;
      for (const [type, files] of Object.entries(logGroups)) {
        // Sort by modification time (most recent first)
        files.sort((a, b) => {
          const aStats = fs.statSync(path.join(logsDir, a));
          const bStats = fs.statSync(path.join(logsDir, b));
          return bStats.mtime.getTime() - aStats.mtime.getTime();
        });
        
        // Delete all except the first one
        for (let i = 1; i < files.length; i++) {
          await fs.unlink(path.join(logsDir, files[i]));
          deletedCount++;
        }
      }
      
      res.status(200).json({
        message: `成功清除 ${deletedCount} 个旧日志文件`,
        data: { deletedCount }
      });
    } catch (error) {
      logger.error('Failed to clear old logs:', error);
      res.status(500).json({ message: '清除旧日志文件失败' });
    }
  }
}

module.exports = SystemMonitorController;
