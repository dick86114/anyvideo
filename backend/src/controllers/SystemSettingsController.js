const { AppDataSource } = require('../utils/db');
const logger = require('../utils/logger');

class SystemSettingsController {
  // Get system settings
  static async getSystemSettings(req, res) {
    try {
      const systemSettingsRepository = AppDataSource.getRepository('SystemSettings');
      
      // Try to find existing settings
      const settingsList = await systemSettingsRepository.find({
        order: { updated_at: 'DESC' },
        take: 1
      });
      
      let settings = settingsList.length > 0 ? settingsList[0] : null;
      
      // If no settings exist, create default ones
      if (!settings) {
        settings = systemSettingsRepository.create({
          storage_path: '/data/media/',
          task_schedule_interval: 3600,
          hotsearch_fetch_interval: 3600
        });
        
        await systemSettingsRepository.save(settings);
      }
      
      res.status(200).json({
        message: '获取系统设置成功',
        data: settings
      });
    } catch (error) {
      logger.error('Failed to get system settings:', error);
      res.status(500).json({ message: '获取系统设置失败' });
    }
  }

  // Update system settings
  static async updateSystemSettings(req, res) {
    try {
      const { storage_path, task_schedule_interval, hotsearch_fetch_interval } = req.body;
      
      const systemSettingsRepository = AppDataSource.getRepository('SystemSettings');
      
      // Try to find existing settings
      const settingsList = await systemSettingsRepository.find({
        order: { updated_at: 'DESC' },
        take: 1
      });
      
      let settings = settingsList.length > 0 ? settingsList[0] : null;
      
      // If no settings exist, create new ones
      if (!settings) {
        settings = systemSettingsRepository.create({
          storage_path: storage_path || '/data/media/',
          task_schedule_interval: task_schedule_interval || 3600,
          hotsearch_fetch_interval: hotsearch_fetch_interval || 3600
        });
      } else {
        // Update existing settings
        if (storage_path !== undefined) settings.storage_path = storage_path;
        if (task_schedule_interval !== undefined) settings.task_schedule_interval = task_schedule_interval;
        if (hotsearch_fetch_interval !== undefined) settings.hotsearch_fetch_interval = hotsearch_fetch_interval;
        settings.updated_at = new Date();
      }
      
      await systemSettingsRepository.save(settings);
      
      res.status(200).json({
        message: '系统设置更新成功',
        data: settings
      });
    } catch (error) {
      logger.error('Failed to update system settings:', error);
      res.status(500).json({ message: '系统设置更新失败' });
    }
  }
}

module.exports = SystemSettingsController;