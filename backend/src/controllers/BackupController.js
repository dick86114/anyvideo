const BackupService = require('../services/BackupService');
const logger = require('../utils/logger');

class BackupController {
  /**
   * Trigger manual backup
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  static async createBackup(req, res) {
    try {
      logger.info('Manual backup triggered by user:', req.user?.username || 'unknown');
      const backupPath = await BackupService.backupDatabase();
      
      res.status(200).json({
        message: '备份成功',
        data: {
          backup_path: backupPath
        }
      });
    } catch (error) {
      logger.error('Failed to create backup:', error);
      res.status(500).json({ message: '备份失败', error: error.message });
    }
  }

  /**
   * Get list of backups
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  static async getBackupList(req, res) {
    try {
      const backupList = await BackupService.getBackupList();
      
      res.status(200).json({
        message: '获取备份列表成功',
        data: backupList
      });
    } catch (error) {
      logger.error('Failed to get backup list:', error);
      res.status(500).json({ message: '获取备份列表失败', error: error.message });
    }
  }

  /**
   * Delete a backup
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  static async deleteBackup(req, res) {
    try {
      const { filename } = req.params;
      
      if (!filename) {
        return res.status(400).json({ message: '请提供备份文件名' });
      }
      
      const success = await BackupService.deleteBackup(filename);
      
      if (success) {
        res.status(200).json({ message: '删除备份成功' });
      } else {
        res.status(500).json({ message: '删除备份失败' });
      }
    } catch (error) {
      logger.error('Failed to delete backup:', error);
      res.status(500).json({ message: '删除备份失败', error: error.message });
    }
  }
}

module.exports = BackupController;
