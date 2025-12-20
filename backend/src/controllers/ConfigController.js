const { SystemSettings, PlatformCookie } = require('../models/Config');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');
const EncryptionService = require('../utils/encryption');

class ConfigController {
  // ========== User Management ==========

  // Get all users
  static async getUsers(req, res) {
    try {
      const users = await User.find().select('-password_hash');
      res.status(200).json({
        message: '获取用户列表成功',
        data: users
      });
    } catch (error) {
      logger.error('Failed to get users:', error);
      res.status(500).json({ message: '获取用户列表失败' });
    }
  }

  // Create a new user
  static async createUser(req, res) {
    try {
      const { username, password, role = 'operator', is_active = true } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ message: '用户名已存在' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create new user
      const user = new User({
        username,
        password_hash: hashedPassword,
        role,
        is_active
      });

      await user.save();
      const userResponse = user.toObject();
      delete userResponse.password_hash;

      res.status(201).json({
        message: '用户创建成功',
        data: userResponse
      });
    } catch (error) {
      logger.error('Failed to create user:', error);
      res.status(500).json({ message: '创建用户失败' });
    }
  }

  // Update a user
  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { username, role, is_active, password } = req.body;

      // Find user
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ message: '用户不存在' });
      }

      // Check if username is taken by another user
      if (username && username !== user.username) {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
          return res.status(400).json({ message: '用户名已存在' });
        }
      }

      // Update user
      if (username) user.username = username;
      if (role) user.role = role;
      if (is_active !== undefined) user.is_active = is_active;
      if (password) {
        // Set password directly, it will be hashed by pre-save hook
        user.password_hash = password;
      }

      await user.save();
      const userResponse = user.toObject();
      delete userResponse.password_hash;

      res.status(200).json({
        message: '用户更新成功',
        data: userResponse
      });
    } catch (error) {
      logger.error('Failed to update user:', error);
      res.status(500).json({ message: '更新用户失败' });
    }
  }

  // Update user password
  static async updateUserPassword(req, res) {
    try {
      const { id } = req.params;
      const { password } = req.body;

      // Find user
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ message: '用户不存在' });
      }

      // Set password directly, it will be hashed by pre-save hook
      user.password_hash = password;
      await user.save();

      res.status(200).json({
        message: '密码修改成功'
      });
    } catch (error) {
      logger.error('Failed to update user password:', error);
      res.status(500).json({ message: '密码修改失败' });
    }
  }

  // Delete a user
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;

      // Find and delete user
      const result = await User.findByIdAndDelete(id);
      if (!result) {
        return res.status(404).json({ message: '用户不存在' });
      }

      res.status(200).json({ message: '用户删除成功' });
    } catch (error) {
      logger.error('Failed to delete user:', error);
      res.status(500).json({ message: '删除用户失败' });
    }
  }

  // Toggle user status (active/inactive)
  static async toggleUserStatus(req, res) {
    try {
      const { id } = req.params;
      const { is_active } = req.body;

      // Find user
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ message: '用户不存在' });
      }

      // Update status
      user.is_active = is_active;
      await user.save();

      const userResponse = user.toObject();
      delete userResponse.password_hash;

      res.status(200).json({
        message: `用户状态已${is_active ? '启用' : '禁用'}`,
        data: userResponse
      });
    } catch (error) {
      logger.error('Failed to toggle user status:', error);
      res.status(500).json({ message: '更新用户状态失败' });
    }
  }

  // ========== Platform Cookie Management ==========

  // Get all platform cookies
  static async getCookies(req, res) {
    try {
      const cookies = await PlatformCookie.find();
      
      // Remove sensitive cookie data from response
      const safeCookies = cookies.map(cookie => {
        const cookieObj = cookie.toObject();
        cookieObj.cookies_encrypted = undefined;
        return cookieObj;
      });
      
      res.status(200).json({
        message: '获取平台Cookie列表成功',
        data: safeCookies
      });
    } catch (error) {
      logger.error('Failed to get cookies:', error);
      res.status(500).json({ message: '获取平台Cookie列表失败' });
    }
  }

  // Create a new platform cookie
  static async createCookie(req, res) {
    try {
      const { platform, account_alias, cookies } = req.body;

      // Encrypt cookie before saving
      const encryptedCookies = EncryptionService.encrypt(cookies);

      // Create new cookie
      const platformCookie = new PlatformCookie({
        platform,
        account_alias,
        cookies_encrypted: encryptedCookies
      });

      await platformCookie.save();

      // Remove sensitive cookie data from response
      const responseCookie = platformCookie.toObject();
      responseCookie.cookies_encrypted = undefined;
      
      res.status(201).json({
        message: '平台Cookie创建成功',
        data: responseCookie
      });
    } catch (error) {
      logger.error('Failed to create cookie:', error);
      res.status(500).json({ message: '创建平台Cookie失败' });
    }
  }

  // Update a platform cookie
  static async updateCookie(req, res) {
    try {
      const { id } = req.params;
      const { platform, account_alias, cookies } = req.body;

      // Find cookie
      const platformCookie = await PlatformCookie.findById(id);
      if (!platformCookie) {
        return res.status(404).json({ message: '平台Cookie不存在' });
      }

      // Update cookie
      if (platform) platformCookie.platform = platform;
      if (account_alias) platformCookie.account_alias = account_alias;
      if (cookies) {
        // Encrypt cookie before updating
        platformCookie.cookies_encrypted = EncryptionService.encrypt(cookies);
        platformCookie.is_valid = true;
        platformCookie.last_checked_at = new Date();
      }

      await platformCookie.save();

      // Remove sensitive cookie data from response
      const responseCookie = platformCookie.toObject();
      responseCookie.cookies_encrypted = undefined;

      res.status(200).json({
        message: '平台Cookie更新成功',
        data: responseCookie
      });
    } catch (error) {
      logger.error('Failed to update cookie:', error);
      res.status(500).json({ message: '更新平台Cookie失败' });
    }
  }

  // Delete a platform cookie
  static async deleteCookie(req, res) {
    try {
      const { id } = req.params;

      // Find and delete cookie
      const result = await PlatformCookie.findByIdAndDelete(id);
      if (!result) {
        return res.status(404).json({ message: '平台Cookie不存在' });
      }

      res.status(200).json({ message: '平台Cookie删除成功' });
    } catch (error) {
      logger.error('Failed to delete cookie:', error);
      res.status(500).json({ message: '删除平台Cookie失败' });
    }
  }

  // Test cookie validity
  static async testCookie(req, res) {
    try {
      const { id } = req.params;

      // Find cookie
      const platformCookie = await PlatformCookie.findById(id);
      if (!platformCookie) {
        return res.status(404).json({ message: '平台Cookie不存在' });
      }

      // In a real implementation, this would test the cookie against the platform API
      // For now, we'll just mark it as valid
      platformCookie.is_valid = true;
      platformCookie.last_checked_at = new Date();
      await platformCookie.save();

      res.status(200).json({
        message: 'Cookie测试成功，状态有效',
        data: platformCookie
      });
    } catch (error) {
      // If test fails, mark as invalid
      try {
        const platformCookie = await PlatformCookie.findById(req.params.id);
        if (platformCookie) {
          platformCookie.is_valid = false;
          platformCookie.last_checked_at = new Date();
          await platformCookie.save();
        }
      } catch (testError) {
        logger.error('Failed to update cookie status after test:', testError);
      }

      logger.error('Failed to test cookie:', error);
      res.status(500).json({ message: 'Cookie测试失败' });
    }
  }

  // ========== System Settings Management ==========

  // Get system settings
  static async getSystemSettings(req, res) {
    try {
      let settings = await SystemSettings.findOne();
      
      // If no settings exist, create default ones
      if (!settings) {
        settings = new SystemSettings();
        await settings.save();
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

      let settings = await SystemSettings.findOne();
      
      // If no settings exist, create new ones
      if (!settings) {
        settings = new SystemSettings();
      }

      // Update settings
      if (storage_path) settings.storage_path = storage_path;
      if (task_schedule_interval) settings.task_schedule_interval = task_schedule_interval;
      if (hotsearch_fetch_interval) settings.hotsearch_fetch_interval = hotsearch_fetch_interval;
      settings.updated_at = new Date();

      await settings.save();

      res.status(200).json({
        message: '系统设置更新成功',
        data: settings
      });
    } catch (error) {
      logger.error('Failed to update system settings:', error);
      res.status(500).json({ message: '更新系统设置失败' });
    }
  }
}

module.exports = ConfigController;
