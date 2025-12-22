const { AppDataSource } = require('../utils/db');
const EncryptionService = require('../utils/encryption');
const axios = require('axios');

class PlatformCookieController {
  // Get all platform cookies
  static async getPlatformCookies(req, res) {
    try {
      const platformCookieRepository = AppDataSource.getRepository('PlatformCookie');
      
      const cookies = await platformCookieRepository.find({
        order: { created_at: 'DESC' }
      });
      
      // Remove sensitive cookie data from response
      const safeCookies = cookies.map(cookie => ({
        id: cookie.id,
        platform: cookie.platform,
        account_alias: cookie.account_alias,
        is_valid: cookie.is_valid,
        last_checked_at: cookie.last_checked_at,
        created_at: cookie.created_at
      }));
      
      res.status(200).json({
        message: '获取成功',
        data: safeCookies
      });
    } catch (error) {
      console.error('Get platform cookies error:', error);
      res.status(500).json({ message: '获取平台Cookie失败' });
    }
  }

  // Create platform cookie
  static async createPlatformCookie(req, res) {
    try {
      const { platform, account_alias, cookies } = req.body;
      
      if (!platform || !account_alias || !cookies) {
        return res.status(400).json({ message: '请提供完整的平台信息' });
      }
      
      // Encrypt cookies
      const encryptedCookies = EncryptionService.encrypt(cookies);
      
      const platformCookieRepository = AppDataSource.getRepository('PlatformCookie');
      
      // Check if platform + account_alias combination already exists
      const existingCookie = await platformCookieRepository.findOne({
        where: { platform, account_alias }
      });
      
      if (existingCookie) {
        return res.status(400).json({ message: '该平台的账户别名已存在' });
      }
      
      // Create new platform cookie
      const platformCookie = platformCookieRepository.create({
        platform,
        account_alias,
        cookies_encrypted: encryptedCookies,
        is_valid: true, // Will be validated later
        last_checked_at: new Date(),
        created_at: new Date()
      });
      
      await platformCookieRepository.save(platformCookie);
      
      // Test cookie validity
      const isValid = await PlatformCookieController.testCookieValidity(platform, cookies);
      
      // Update validity status
      platformCookie.is_valid = isValid;
      platformCookie.last_checked_at = new Date();
      await platformCookieRepository.save(platformCookie);
      
      res.status(201).json({
        message: '平台Cookie创建成功',
        data: {
          id: platformCookie.id,
          platform: platformCookie.platform,
          account_alias: platformCookie.account_alias,
          is_valid: platformCookie.is_valid,
          last_checked_at: platformCookie.last_checked_at,
          created_at: platformCookie.created_at
        }
      });
    } catch (error) {
      console.error('Create platform cookie error:', error);
      res.status(500).json({ message: '创建平台Cookie失败' });
    }
  }

  // Update platform cookie
  static async updatePlatformCookie(req, res) {
    try {
      const { id } = req.params;
      const { platform, account_alias, cookies } = req.body;
      
      const platformCookieRepository = AppDataSource.getRepository('PlatformCookie');
      
      const platformCookie = await platformCookieRepository.findOne({ where: { id } });
      if (!platformCookie) {
        return res.status(404).json({ message: '平台Cookie不存在' });
      }
      
      // Check if platform + account_alias combination already exists (excluding current record)
      if (platform && account_alias) {
        const existingCookie = await platformCookieRepository.findOne({
          where: { platform, account_alias }
        });
        
        if (existingCookie && existingCookie.id !== id) {
          return res.status(400).json({ message: '该平台的账户别名已存在' });
        }
      }
      
      // Update fields
      if (platform) platformCookie.platform = platform;
      if (account_alias) platformCookie.account_alias = account_alias;
      if (cookies) {
        platformCookie.cookies_encrypted = EncryptionService.encrypt(cookies);
        
        // Test new cookie validity
        const isValid = await PlatformCookieController.testCookieValidity(platform || platformCookie.platform, cookies);
        platformCookie.is_valid = isValid;
        platformCookie.last_checked_at = new Date();
      }
      
      await platformCookieRepository.save(platformCookie);
      
      res.status(200).json({
        message: '平台Cookie更新成功',
        data: {
          id: platformCookie.id,
          platform: platformCookie.platform,
          account_alias: platformCookie.account_alias,
          is_valid: platformCookie.is_valid,
          last_checked_at: platformCookie.last_checked_at,
          created_at: platformCookie.created_at
        }
      });
    } catch (error) {
      console.error('Update platform cookie error:', error);
      res.status(500).json({ message: '更新平台Cookie失败' });
    }
  }

  // Delete platform cookie
  static async deletePlatformCookie(req, res) {
    try {
      const { id } = req.params;
      
      const platformCookieRepository = AppDataSource.getRepository('PlatformCookie');
      
      const platformCookie = await platformCookieRepository.findOne({ where: { id } });
      if (!platformCookie) {
        return res.status(404).json({ message: '平台Cookie不存在' });
      }
      
      await platformCookieRepository.delete(id);
      
      res.status(200).json({ message: '平台Cookie删除成功' });
    } catch (error) {
      console.error('Delete platform cookie error:', error);
      res.status(500).json({ message: '删除平台Cookie失败' });
    }
  }

  // Test platform cookie validity
  static async testPlatformCookieById(req, res) {
    try {
      const { id } = req.params;
      
      const platformCookieRepository = AppDataSource.getRepository('PlatformCookie');
      
      const platformCookie = await platformCookieRepository.findOne({ where: { id } });
      if (!platformCookie) {
        return res.status(404).json({ message: '平台Cookie不存在' });
      }
      
      // Decrypt cookies
      const cookies = EncryptionService.decrypt(platformCookie.cookies_encrypted);
      
      // Test cookie validity
      const isValid = await PlatformCookieController.testCookieValidity(platformCookie.platform, cookies);
      
      // Update validity status
      platformCookie.is_valid = isValid;
      platformCookie.last_checked_at = new Date();
      await platformCookieRepository.save(platformCookie);
      
      res.status(200).json({
        message: isValid ? 'Cookie有效' : 'Cookie无效',
        success: isValid,
        data: {
          id: platformCookie.id,
          platform: platformCookie.platform,
          account_alias: platformCookie.account_alias,
          is_valid: platformCookie.is_valid,
          last_checked_at: platformCookie.last_checked_at
        }
      });
    } catch (error) {
      console.error('Test platform cookie error:', error);
      res.status(500).json({ message: '测试平台Cookie失败' });
    }
  }

  // Test cookie validity for a specific platform
  static async testCookieValidity(platform, cookies) {
    try {
      let testUrl;
      let expectedContent;
      
      // Define test URLs and expected content for each platform
      switch (platform) {
        case 'xiaohongshu':
          testUrl = 'https://www.xiaohongshu.com/api/sns/web/v1/user/selfinfo';
          expectedContent = 'success';
          break;
        case 'douyin':
          testUrl = 'https://www.douyin.com/aweme/v1/web/aweme/personal/';
          expectedContent = 'status_code';
          break;
        case 'bilibili':
          testUrl = 'https://api.bilibili.com/x/web-interface/nav';
          expectedContent = 'isLogin';
          break;
        case 'weibo':
          testUrl = 'https://weibo.com/ajax/config';
          expectedContent = 'data';
          break;
        case 'kuaishou':
          testUrl = 'https://www.kuaishou.com/graphql';
          expectedContent = 'data';
          break;
        default:
          console.warn(`Unknown platform: ${platform}`);
          return false;
      }
      
      // Make test request with cookies
      const response = await axios.get(testUrl, {
        headers: {
          'Cookie': cookies,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        timeout: 10000,
        validateStatus: () => true // Don't throw on HTTP error status
      });
      
      // Check if response indicates successful authentication
      const responseText = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
      const isValid = response.status === 200 && responseText.includes(expectedContent);
      
      console.log(`Cookie test for ${platform}: ${isValid ? 'VALID' : 'INVALID'}`);
      return isValid;
      
    } catch (error) {
      console.error(`Cookie test error for ${platform}:`, error.message);
      return false;
    }
  }

  // Batch test all platform cookies
  static async batchTestPlatformCookies(req, res) {
    try {
      const platformCookieRepository = AppDataSource.getRepository('PlatformCookie');
      
      const cookies = await platformCookieRepository.find();
      const results = [];
      
      for (const cookie of cookies) {
        try {
          const decryptedCookies = EncryptionService.decrypt(cookie.cookies_encrypted);
          const isValid = await PlatformCookieController.testCookieValidity(cookie.platform, decryptedCookies);
          
          // Update validity status
          cookie.is_valid = isValid;
          cookie.last_checked_at = new Date();
          await platformCookieRepository.save(cookie);
          
          results.push({
            id: cookie.id,
            platform: cookie.platform,
            account_alias: cookie.account_alias,
            is_valid: isValid
          });
        } catch (error) {
          console.error(`Error testing cookie ${cookie.id}:`, error);
          results.push({
            id: cookie.id,
            platform: cookie.platform,
            account_alias: cookie.account_alias,
            is_valid: false,
            error: error.message
          });
        }
      }
      
      res.status(200).json({
        message: '批量测试完成',
        data: results
      });
    } catch (error) {
      console.error('Batch test platform cookies error:', error);
      res.status(500).json({ message: '批量测试平台Cookie失败' });
    }
  }
}

module.exports = PlatformCookieController;