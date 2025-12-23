const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const { AppDataSource } = require('../utils/db');
const logger = require('../utils/logger');

class HotsearchService {
  // Setup puppeteer browser with cookies
  static async setupBrowser(platform, config = {}) {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Set cookies if provided
    if (config.cookies && Object.keys(config.cookies).length > 0) {
      await page.setCookie(...config.cookies);
    }
    
    return { browser, page };
  }

  // Fetch hotsearch data from different platforms
  static async fetchHotsearch(platform, config = {}) {
    try {
      let hotsearchData;
      switch (platform) {
        case 'douyin':
          hotsearchData = await this.fetchDouyinHotsearch(config);
          break;
        case 'xiaohongshu':
          hotsearchData = await this.fetchXiaohongshuHotsearch(config);
          break;
        case 'weibo':
          hotsearchData = await this.fetchWeiboHotsearch(config);
          break;
        case 'kuaishou':
          hotsearchData = await this.fetchKuaishouHotsearch(config);
          break;
        case 'bilibili':
          hotsearchData = await this.fetchBilibiliHotsearch(config);
          break;
        default:
          throw new Error(`暂不支持${platform}平台的热搜抓取`);
      }

      // Save to database using TypeORM
      await this.saveHotsearchSnapshot(platform, hotsearchData);

      return hotsearchData;
    } catch (error) {
      logger.error(`Failed to fetch hotsearch for ${platform}:`, error);
      throw error;
    }
  }

  // Fetch Douyin hotsearch
  static async fetchDouyinHotsearch(config = {}) {
    try {
      // Return mock data since we've disabled hotsearch functionality
      return Array.from({ length: 20 }, (_, i) => ({
        rank: i + 1,
        keyword: `抖音热点${i + 1}`,
        heat: Math.floor(Math.random() * 1000000) + 100000,
        trend: Math.random() > 0.5 ? '上升' : '下降',
        url: 'https://douyin.com/search/'
      }));
    } catch (error) {
      logger.error('Failed to fetch Douyin hotsearch:', error);
      throw error;
    }
  }

  // Fetch Xiaohongshu hotsearch
  static async fetchXiaohongshuHotsearch(config = {}) {
    try {
      // Return mock data since we've disabled hotsearch functionality
      return Array.from({ length: 20 }, (_, i) => ({
        rank: i + 1,
        keyword: `小红书热点${i + 1}`,
        heat: Math.floor(Math.random() * 1000000) + 100000,
        trend: Math.random() > 0.5 ? '上升' : '下降',
        url: 'https://xiaohongshu.com/search_result/'
      }));
    } catch (error) {
      logger.error('Failed to fetch Xiaohongshu hotsearch:', error);
      throw error;
    }
  }

  // Fetch Weibo hotsearch
  static async fetchWeiboHotsearch(config = {}) {
    try {
      // Return mock data since we've disabled hotsearch functionality
      return Array.from({ length: 20 }, (_, i) => ({
        rank: i + 1,
        keyword: `微博热点${i + 1}`,
        heat: Math.floor(Math.random() * 2000000) + 500000,
        trend: Math.random() > 0.5 ? '上升' : '下降',
        url: 'https://s.weibo.com/top/summary'
      }));
    } catch (error) {
      logger.error('Failed to fetch Weibo hotsearch:', error);
      throw error;
    }
  }

  // Fetch Kuaishou hotsearch
  static async fetchKuaishouHotsearch(config = {}) {
    try {
      // Return mock data since we've disabled hotsearch functionality
      return Array.from({ length: 20 }, (_, i) => ({
        rank: i + 1,
        keyword: `快手热点${i + 1}`,
        heat: Math.floor(Math.random() * 800000) + 80000,
        trend: Math.random() > 0.5 ? '上升' : '下降',
        url: 'https://www.kuaishou.com/search/'
      }));
    } catch (error) {
      logger.error('Failed to fetch Kuaishou hotsearch:', error);
      throw error;
    }
  }

  // Fetch Bilibili hotsearch
  static async fetchBilibiliHotsearch(config = {}) {
    try {
      // Return mock data since we've disabled hotsearch functionality
      return Array.from({ length: 20 }, (_, i) => ({
        rank: i + 1,
        keyword: `B站热点${i + 1}`,
        heat: Math.floor(Math.random() * 1500000) + 200000,
        trend: Math.random() > 0.5 ? '上升' : '下降',
        url: 'https://www.bilibili.com/v/popular/rank/all'
      }));
    } catch (error) {
      logger.error('Failed to fetch Bilibili hotsearch:', error);
      throw error;
    }
  }

  // Save hotsearch snapshot to database using TypeORM
  static async saveHotsearchSnapshot(platform, data) {
    try {
      const hotsearchRepository = AppDataSource.getRepository('HotsearchSnapshot');
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if snapshot already exists for today
      const existingSnapshot = await hotsearchRepository.findOne({
        where: {
          platform,
          capture_date: today
        }
      });

      if (existingSnapshot) {
        // Update existing snapshot
        existingSnapshot.snapshot_data = data;
        existingSnapshot.capture_time = new Date();
        await hotsearchRepository.save(existingSnapshot);
      } else {
        // Create new snapshot
        const snapshot = hotsearchRepository.create({
          platform,
          capture_date: today,
          capture_time: new Date(),
          snapshot_data: data
        });
        await hotsearchRepository.save(snapshot);
      }
    } catch (error) {
      logger.error('Failed to save hotsearch snapshot:', error);
      // Don't throw error to avoid breaking the main functionality
    }
  }

  // Get hotsearch snapshot by date and platform using TypeORM
  static async getHotsearchByDate(platform, date) {
    try {
      const hotsearchRepository = AppDataSource.getRepository('HotsearchSnapshot');
      const targetDate = date ? new Date(date) : new Date();
      targetDate.setHours(0, 0, 0, 0);

      const snapshot = await hotsearchRepository.findOne({
        where: {
          platform,
          capture_date: targetDate
        }
      });

      return snapshot ? snapshot.snapshot_data : [];
    } catch (error) {
      logger.error('Failed to get hotsearch by date:', error);
      // Return empty array instead of throwing error
      return [];
    }
  }

  // Get recent hotsearch trends using TypeORM
  static async getHotsearchTrends(platform, days = 7) {
    try {
      const hotsearchRepository = AppDataSource.getRepository('HotsearchSnapshot');
      const endDate = new Date();
      endDate.setHours(0, 0, 0, 0);
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - days + 1);

      const snapshots = await hotsearchRepository.find({
        where: {
          platform,
          capture_date: {
            $gte: startDate,
            $lte: endDate
          }
        },
        order: {
          capture_date: 'ASC'
        }
      });

      return snapshots.map(snapshot => ({
        date: snapshot.capture_date.toISOString().split('T')[0],
        data: snapshot.snapshot_data
      }));
    } catch (error) {
      logger.error('Failed to get hotsearch trends:', error);
      // Return empty array instead of throwing error
      return [];
    }
  }

  // Fetch all platforms hotsearch and save
  static async fetchAllHotsearch(config = {}) {
    try {
      const platforms = ['douyin', 'xiaohongshu', 'weibo', 'kuaishou', 'bilibili'];
      const results = [];

      for (const platform of platforms) {
        try {
          const result = await this.fetchHotsearch(platform, config);
          results.push({ platform, success: true, data: result });
        } catch (error) {
          results.push({ platform, success: false, error: error.message });
        }
      }

      return results;
    } catch (error) {
      logger.error('Failed to fetch all hotsearch:', error);
      throw error;
    }
  }

  // Get related content for a hotsearch keyword
  static async getRelatedContent(keyword, platform, limit = 5) {
    try {
      logger.info(`Getting related content for keyword: ${keyword} on platform: ${platform}`);
      
      // Return mock related content
      return Array.from({ length: limit }, (_, index) => ({
        id: `related_${keyword}_${platform}_${index}`,
        title: `${keyword}相关内容${index + 1}`,
        platform: platform,
        summary: `这是关于${keyword}的第${index + 1}条相关内容摘要，提供了该热点话题的详细信息和分析。`,
        source_url: `https://example.com/${platform}/search?q=${encodeURIComponent(keyword)}&related=${index}`,
        heat: Math.floor(Math.random() * 100000) + 10000,
        published_at: new Date(Date.now() - Math.floor(Math.random() * 3600000 * 24)) // Random time in the last 24 hours
      }));
    } catch (error) {
      logger.error(`Failed to get related content for keyword: ${keyword}`, error);
      throw error;
    }
  }
}

module.exports = HotsearchService;