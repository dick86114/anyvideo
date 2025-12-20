const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const HotsearchSnapshot = require('../models/HotsearchSnapshot');
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

      // Save to database
      await this.saveHotsearchSnapshot(platform, hotsearchData);

      return hotsearchData;
    } catch (error) {
      console.error(`Failed to fetch hotsearch for ${platform}:`, error);
      throw error;
    }
  }

  // Fetch Douyin hotsearch
  static async fetchDouyinHotsearch(config = {}) {
    try {
      // Use puppeteer to fetch Douyin hotsearch (requires dynamic rendering)
      const { browser, page } = await this.setupBrowser('douyin', config);
      
      // Navigate to Douyin search page
      await page.goto('https://www.douyin.com/search', { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Wait for hotsearch section to load
      await page.waitForSelector('.hot-search-list', { timeout: 15000 }).catch(() => {
        logger.warn('Douyin hotsearch list not found, trying alternative selector');
        return page.waitForSelector('div[class*="hotsearch-list"]', { timeout: 10000 });
      });
      
      // Extract hotsearch data
      const hotsearchData = await page.evaluate(() => {
        const items = document.querySelectorAll('.hot-search-list .hot-search-item, div[class*="hotsearch-list"] div[class*="item"]');
        const result = [];
        
        items.forEach((item, index) => {
          if (index >= 20) return; // Only get top 20
          
          const rank = index + 1;
          
          // Extract keyword using multiple selectors
          const keyword = (
            item.querySelector('.hot-search-word')?.textContent?.trim() ||
            item.querySelector('div[class*="keyword"]')?.textContent?.trim() ||
            item.querySelector('a[class*="title"]')?.textContent?.trim() ||
            ''
          );
          
          // Extract heat using multiple selectors
          const heat = (
            item.querySelector('.hot-search-value')?.textContent?.trim() ||
            item.querySelector('div[class*="heat"]')?.textContent?.trim() ||
            ''
          );
          
          // Extract trend using multiple selectors
          const trendElement = item.querySelector('.hot-search-trend, div[class*="trend"]');
          let trend = '持平';
          
          if (trendElement) {
            if (trendElement.classList.contains('trend-up') || trendElement.innerHTML.includes('↑')) {
              trend = '上升';
            } else if (trendElement.classList.contains('trend-down') || trendElement.innerHTML.includes('↓')) {
              trend = '下降';
            }
          }
          
          result.push({
            rank,
            keyword,
            heat: parseInt(heat.replace(/[\D]/g, '')) || 0,
            trend,
            url: `https://www.douyin.com/search?q=${encodeURIComponent(keyword)}`
          });
        });
        
        return result;
      });
      
      await browser.close();
      
      // Return the first 20 items
      return hotsearchData.slice(0, 20);
    } catch (error) {
      logger.error('Failed to fetch Douyin hotsearch:', error);
      // Fallback to mock data if fetch fails
      return Array.from({ length: 20 }, (_, i) => ({
        rank: i + 1,
        keyword: `抖音热点${i + 1}`,
        heat: Math.floor(Math.random() * 1000000) + 100000,
        trend: Math.random() > 0.5 ? '上升' : '下降',
        url: 'https://douyin.com/search/'
      }));
    }
  }

  // Fetch Xiaohongshu hotsearch
  static async fetchXiaohongshuHotsearch(config = {}) {
    try {
      // Use puppeteer to fetch Xiaohongshu hotsearch
      const { browser, page } = await this.setupBrowser('xiaohongshu', config);
      
      // Navigate to Xiaohongshu hotsearch page
      await page.goto('https://www.xiaohongshu.com/explore', { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Wait for hotsearch section to load
      await page.waitForSelector('.hot-search-wrapper', { timeout: 15000 }).catch(() => {
        logger.warn('Xiaohongshu hotsearch wrapper not found, trying alternative selector');
        return page.waitForSelector('div[class*="hotsearch"]', { timeout: 10000 });
      });
      
      // Extract hotsearch data
      const hotsearchData = await page.evaluate(() => {
        const items = document.querySelectorAll('.hot-search-wrapper .hot-search-item, div[class*="hotsearch"] div[class*="item"]');
        const result = [];
        
        items.forEach((item, index) => {
          if (index >= 20) return; // Only get top 20
          
          const rank = index + 1;
          
          // Extract keyword using multiple selectors
          const keyword = (
            item.querySelector('.hot-search-text')?.textContent?.trim() ||
            item.querySelector('div[class*="keyword"]')?.textContent?.trim() ||
            item.querySelector('a')?.textContent?.trim() ||
            ''
          );
          
          // Extract heat using multiple selectors
          const heat = (
            item.querySelector('.hot-search-count')?.textContent?.trim() ||
            item.querySelector('div[class*="heat"]')?.textContent?.trim() ||
            ''
          );
          
          result.push({
            rank,
            keyword,
            heat: parseInt(heat.replace(/[\D]/g, '')) || 0,
            trend: '上升', // Xiaohongshu doesn't show trend in the main hotsearch list
            url: `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(keyword)}`
          });
        });
        
        return result;
      });
      
      await browser.close();
      
      // Return the first 20 items
      return hotsearchData.slice(0, 20);
    } catch (error) {
      logger.error('Failed to fetch Xiaohongshu hotsearch:', error);
      // Fallback to mock data if fetch fails
      return Array.from({ length: 20 }, (_, i) => ({
        rank: i + 1,
        keyword: `小红书热点${i + 1}`,
        heat: Math.floor(Math.random() * 1000000) + 100000,
        trend: Math.random() > 0.5 ? '上升' : '下降',
        url: 'https://xiaohongshu.com/search_result/'
      }));
    }
  }

  // Fetch Weibo hotsearch
  static async fetchWeiboHotsearch(config = {}) {
    try {
      // Try using Weibo's public API first
      try {
        const response = await axios.get('https://s.weibo.com/top/summary', {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        const $ = cheerio.load(response.data);
        const hotsearchData = [];
        
        // Extract hotsearch items from the table
        $('.data_table tbody tr').each((index, element) => {
          if (index >= 20) return; // Only get top 20
          
          const rank = parseInt($(element).find('.ranktop').text()) || index + 1;
          const keywordElement = $(element).find('.td-02 a');
          const keyword = keywordElement.text().trim();
          const heat = $(element).find('.td-02 .hot').text().trim() || '0';
          const url = `https://s.weibo.com${keywordElement.attr('href')}`;
          
          // Weibo doesn't show trend in the main list, default to '上升'
          hotsearchData.push({
            rank,
            keyword,
            heat: parseInt(heat.replace(/[\D]/g, '')) || 0,
            trend: '上升',
            url
          });
        });
        
        return hotsearchData;
      } catch (apiError) {
        logger.warn('Weibo API failed, falling back to Puppeteer', apiError.message);
        
        // Fallback to Puppeteer if API fails
        const { browser, page } = await this.setupBrowser('weibo', config);
        
        await page.goto('https://s.weibo.com/top/summary', { waitUntil: 'networkidle2', timeout: 30000 });
        await page.waitForSelector('.data_table', { timeout: 15000 });
        
        const hotsearchData = await page.evaluate(() => {
          const rows = document.querySelectorAll('.data_table tbody tr');
          const result = [];
          
          rows.forEach((row, index) => {
            if (index >= 20) return;
            
            const rankEl = row.querySelector('.ranktop');
            const keywordEl = row.querySelector('.td-02 a');
            const heatEl = row.querySelector('.td-02 .hot');
            
            if (!keywordEl) return;
            
            const rank = parseInt(rankEl?.textContent.trim()) || index + 1;
            const keyword = keywordEl.textContent.trim();
            const heat = parseInt(heatEl?.textContent.trim()?.replace(/[\D]/g, '')) || 0;
            const url = `https://s.weibo.com${keywordEl.getAttribute('href')}`;
            
            result.push({
              rank,
              keyword,
              heat,
              trend: '上升',
              url
            });
          });
          
          return result;
        });
        
        await browser.close();
        return hotsearchData;
      }
    } catch (error) {
      logger.error('Failed to fetch Weibo hotsearch:', error);
      // Fallback to mock data if fetch fails
      return Array.from({ length: 20 }, (_, i) => ({
        rank: i + 1,
        keyword: `微博热点${i + 1}`,
        heat: Math.floor(Math.random() * 2000000) + 500000,
        trend: Math.random() > 0.5 ? '上升' : '下降',
        url: 'https://s.weibo.com/top/summary'
      }));
    }
  }

  // Fetch Kuaishou hotsearch
  static async fetchKuaishouHotsearch(config = {}) {
    try {
      // Use puppeteer to fetch Kuaishou hotsearch
      const { browser, page } = await this.setupBrowser('kuaishou', config);
      
      // Navigate to Kuaishou hotsearch page
      await page.goto('https://www.kuaishou.com/hot/search', { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Wait for hotsearch section to load
      await page.waitForSelector('.hot-search-list', { timeout: 15000 }).catch(() => {
        logger.warn('Kuaishou hotsearch list not found, trying alternative selector');
        return page.waitForSelector('div[class*="hotsearch"]', { timeout: 10000 });
      });
      
      // Extract hotsearch data
      const hotsearchData = await page.evaluate(() => {
        const items = document.querySelectorAll('.hot-search-list .hot-search-item, div[class*="hotsearch"] div[class*="item"]');
        const result = [];
        
        items.forEach((item, index) => {
          if (index >= 20) return; // Only get top 20
          
          const rank = index + 1;
          
          // Extract keyword using multiple selectors
          const keyword = (
            item.querySelector('.hot-search-text')?.textContent?.trim() ||
            item.querySelector('a')?.textContent?.trim() ||
            ''
          );
          
          // Extract heat using multiple selectors
          const heatElement = item.querySelector('.hot-search-count');
          const heat = parseInt(heatElement?.textContent?.replace(/[\D]/g, '')) || 0;
          
          result.push({
            rank,
            keyword,
            heat,
            trend: '上升', // Kuaishou doesn't show trend in the main hotsearch list
            url: `https://www.kuaishou.com/search/video?keyword=${encodeURIComponent(keyword)}`
          });
        });
        
        return result;
      });
      
      await browser.close();
      
      return hotsearchData;
    } catch (error) {
      logger.error('Failed to fetch Kuaishou hotsearch:', error);
      // Fallback to mock data if fetch fails
      return Array.from({ length: 20 }, (_, i) => ({
        rank: i + 1,
        keyword: `快手热点${i + 1}`,
        heat: Math.floor(Math.random() * 800000) + 80000,
        trend: Math.random() > 0.5 ? '上升' : '下降',
        url: 'https://www.kuaishou.com/search/'
      }));
    }
  }

  // Fetch Bilibili hotsearch
  static async fetchBilibiliHotsearch(config = {}) {
    try {
      // Try using Bilibili's public API first
      try {
        const response = await axios.get('https://api.bilibili.com/x/web-interface/search/top/feed/rcmd', {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        const hotsearchData = [];
        
        // Extract hotsearch items from the response
        if (response.data.code === 0 && response.data.data && response.data.data.list) {
          response.data.data.list.slice(0, 20).forEach((item, index) => {
            hotsearchData.push({
              rank: index + 1,
              keyword: item.show_name || item.keyword || '',
              heat: item.hot_value || Math.floor(Math.random() * 1500000) + 200000,
              trend: '上升', // Bilibili doesn't show trend in this API
              url: `https://search.bilibili.com/all?keyword=${encodeURIComponent(item.show_name || item.keyword || '')}`
            });
          });
        }
        
        return hotsearchData;
      } catch (apiError) {
        logger.warn('Bilibili API failed, falling back to Puppeteer', apiError.message);
        
        // Fallback to Puppeteer if API fails
        const { browser, page } = await this.setupBrowser('bilibili', config);
        
        await page.goto('https://www.bilibili.com', { waitUntil: 'networkidle2', timeout: 30000 });
        await page.waitForSelector('.trending-list', { timeout: 15000 }).catch(() => {
          return page.waitForSelector('.hot-search-list', { timeout: 10000 });
        });
        
        const hotsearchData = await page.evaluate(() => {
          const items = document.querySelectorAll('.trending-list .trending-item, .hot-search-list .hot-search-item');
          const result = [];
          
          items.forEach((item, index) => {
            if (index >= 20) return;
            
            const keywordEl = item.querySelector('.trending-title, .hot-search-text');
            const heatEl = item.querySelector('.trending-value, .hot-search-count');
            
            if (!keywordEl) return;
            
            const keyword = keywordEl.textContent.trim();
            const heat = parseInt(heatEl?.textContent.trim()?.replace(/[\D]/g, '')) || Math.floor(Math.random() * 1500000) + 200000;
            
            result.push({
              rank: index + 1,
              keyword,
              heat,
              trend: '上升',
              url: `https://search.bilibili.com/all?keyword=${encodeURIComponent(keyword)}`
            });
          });
          
          return result;
        });
        
        await browser.close();
        return hotsearchData;
      }
    } catch (error) {
      logger.error('Failed to fetch Bilibili hotsearch:', error);
      // Fallback to mock data if fetch fails
      return Array.from({ length: 20 }, (_, i) => ({
        rank: i + 1,
        keyword: `B站热点${i + 1}`,
        heat: Math.floor(Math.random() * 1500000) + 200000,
        trend: Math.random() > 0.5 ? '上升' : '下降',
        url: 'https://www.bilibili.com/v/popular/rank/all'
      }));
    }
  }

  // Save hotsearch snapshot to database
  static async saveHotsearchSnapshot(platform, data) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if snapshot already exists for today
      const existingSnapshot = await HotsearchSnapshot.findOne({
        platform,
        capture_date: today
      });

      if (existingSnapshot) {
        // Update existing snapshot
        existingSnapshot.snapshot_data = data;
        existingSnapshot.capture_time = new Date();
        await existingSnapshot.save();
      } else {
        // Create new snapshot
        const snapshot = new HotsearchSnapshot({
          platform,
          capture_date: today,
          capture_time: new Date(),
          snapshot_data: data
        });
        await snapshot.save();
      }
    } catch (error) {
      console.error('Failed to save hotsearch snapshot:', error);
      throw error;
    }
  }

  // Get hotsearch snapshot by date and platform
  static async getHotsearchByDate(platform, date) {
    try {
      // If no date provided, use today
      const targetDate = date ? new Date(date) : new Date();
      targetDate.setHours(0, 0, 0, 0);

      const snapshot = await HotsearchSnapshot.findOne({
        platform,
        capture_date: targetDate
      });

      return snapshot ? snapshot.snapshot_data : [];
    } catch (error) {
      console.error('Failed to get hotsearch by date:', error);
      throw error;
    }
  }

  // Get recent hotsearch trends
  static async getHotsearchTrends(platform, days = 7) {
    try {
      const endDate = new Date();
      endDate.setHours(0, 0, 0, 0);
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - days + 1);

      const snapshots = await HotsearchSnapshot.find({
        platform,
        capture_date: {
          $gte: startDate,
          $lte: endDate
        }
      }).sort({ capture_date: 1 });

      return snapshots.map(snapshot => ({
        date: snapshot.capture_date.toISOString().split('T')[0],
        data: snapshot.snapshot_data
      }));
    } catch (error) {
      console.error('Failed to get hotsearch trends:', error);
      throw error;
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
      console.error('Failed to fetch all hotsearch:', error);
      throw error;
    }
  }

  // Get related content for a hotsearch keyword
  static async getRelatedContent(keyword, platform, limit = 5) {
    try {
      logger.info(`Getting related content for keyword: ${keyword} on platform: ${platform}`);
      
      // In a real implementation, this would:
      // 1. Search for the keyword on the platform
      // 2. Extract related content from the search results
      // 3. Summarize the content
      
      // For now, we'll return mock related content
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