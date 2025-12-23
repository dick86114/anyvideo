const HotsearchService = require('../services/HotsearchService');
const ParseService = require('../services/ParseService');
const CacheService = require('../services/CacheService');

class HotsearchController {
  // Fetch hotsearch for a specific platform
  static async fetchHotsearch(req, res) {
    try {
      // Temporarily disable hotsearch functionality to avoid MongoDB timeout
      return res.status(503).json({ 
        message: '热搜功能暂时不可用，正在进行系统维护',
        code: 'HOTSEARCH_MAINTENANCE'
      });
      
      const { platform } = req.params;
      if (!platform) {
        return res.status(400).json({ message: '请提供平台名称' });
      }

      const data = await HotsearchService.fetchHotsearch(platform);
      res.status(200).json({
        message: '热搜抓取成功',
        data
      });
    } catch (error) {
      console.error('Fetch hotsearch error:', error);
      res.status(500).json({ message: error.message || '热搜抓取失败' });
    }
  }

  // Fetch hotsearch for all platforms
  static async fetchAllHotsearch(req, res) {
    try {
      // Temporarily disable hotsearch functionality to avoid MongoDB timeout
      return res.status(503).json({ 
        message: '热搜功能暂时不可用，正在进行系统维护',
        code: 'HOTSEARCH_MAINTENANCE'
      });
      
      const results = await HotsearchService.fetchAllHotsearch();
      res.status(200).json({
        message: '所有平台热搜抓取完成',
        data: results
      });
    } catch (error) {
      console.error('Fetch all hotsearch error:', error);
      res.status(500).json({ message: error.message || '热搜抓取失败' });
    }
  }

  // Get hotsearch by date and platform
  static async getHotsearchByDate(req, res) {
    try {
      // Temporarily disable hotsearch functionality to avoid MongoDB timeout
      return res.status(503).json({ 
        message: '热搜功能暂时不可用，正在进行系统维护',
        code: 'HOTSEARCH_MAINTENANCE'
      });
      
      const { platform } = req.params;
      const { date } = req.query;
      
      if (!platform) {
        return res.status(400).json({ message: '请提供平台名称' });
      }

      // Generate cache key
      const cacheKey = CacheService.getHotsearchCacheKey(platform, date);
      
      // Check cache first
      const cachedData = CacheService.get(cacheKey);
      if (cachedData) {
        return res.status(200).json(cachedData);
      }

      const data = await HotsearchService.getHotsearchByDate(platform, date);
      
      // Prepare response data
      const responseData = {
        message: '获取热搜成功',
        data
      };
      
      // Cache the response for 30 minutes (1800 seconds)
      CacheService.set(cacheKey, responseData, 1800);
      
      res.status(200).json(responseData);
    } catch (error) {
      console.error('Get hotsearch by date error:', error);
      res.status(500).json({ message: error.message || '获取热搜失败' });
    }
  }

  // Get hotsearch trends
  static async getHotsearchTrends(req, res) {
    try {
      // Temporarily disable hotsearch functionality to avoid MongoDB timeout
      return res.status(503).json({ 
        message: '热搜功能暂时不可用，正在进行系统维护',
        code: 'HOTSEARCH_MAINTENANCE'
      });
      
      const { platform } = req.params;
      const { days = 7 } = req.query;
      
      if (!platform) {
        return res.status(400).json({ message: '请提供平台名称' });
      }

      // Generate cache key with days parameter
      const cacheKey = `hotsearch:trends:${platform}:${days}`;
      
      // Check cache first
      const cachedData = CacheService.get(cacheKey);
      if (cachedData) {
        return res.status(200).json(cachedData);
      }

      const data = await HotsearchService.getHotsearchTrends(platform, parseInt(days));
      
      // Prepare response data
      const responseData = {
        message: '获取热搜趋势成功',
        data
      };
      
      // Cache the response for 1 hour (3600 seconds)
      CacheService.set(cacheKey, responseData, 3600);
      
      res.status(200).json(responseData);
    } catch (error) {
      console.error('Get hotsearch trends error:', error);
      res.status(500).json({ message: error.message || '获取热搜趋势失败' });
    }
  }

  // Get hotsearch platforms
  static async getHotsearchPlatforms(req, res) {
    try {
      // Return empty platforms list during maintenance
      const platforms = [];
      res.status(200).json({
        message: '热搜功能暂时不可用，正在进行系统维护',
        data: platforms
      });
    } catch (error) {
      console.error('Get hotsearch platforms error:', error);
      res.status(500).json({ message: error.message || '获取平台列表失败' });
    }
  }

  // Parse content from hotsearch keyword
  static async parseHotsearchContent(req, res) {
    try {
      // Temporarily disable hotsearch functionality to avoid MongoDB timeout
      return res.status(503).json({ 
        message: '热搜功能暂时不可用，正在进行系统维护',
        code: 'HOTSEARCH_MAINTENANCE'
      });
      
      const { platform, keyword } = req.body;
      
      if (!platform || !keyword) {
        return res.status(400).json({ message: '请提供平台和关键词' });
      }
      
      // Build search link based on platform
      let searchLink;
      switch (platform) {
        case 'douyin':
          searchLink = `https://www.douyin.com/search/${encodeURIComponent(keyword)}`;
          break;
        case 'xiaohongshu':
          searchLink = `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(keyword)}`;
          break;
        case 'weibo':
          searchLink = `https://s.weibo.com/weibo?q=${encodeURIComponent(keyword)}`;
          break;
        case 'kuaishou':
          searchLink = `https://www.kuaishou.com/search/video?keyword=${encodeURIComponent(keyword)}`;
          break;
        case 'bilibili':
          searchLink = `https://search.bilibili.com/all?keyword=${encodeURIComponent(keyword)}`;
          break;
        default:
          return res.status(400).json({ message: `暂不支持${platform}平台的一键解析` });
      }
      
      // Parse content using ParseService
      const content = await ParseService.parseLink(searchLink);
      
      res.status(200).json({
        message: '一键解析成功',
        data: content
      });
    } catch (error) {
      console.error('Parse hotsearch content error:', error);
      res.status(500).json({ message: error.message || '一键解析失败' });
    }
  }

  // Get related content for a hotsearch keyword
  static async getHotsearchRelatedContent(req, res) {
    try {
      // Temporarily disable hotsearch functionality to avoid MongoDB timeout
      return res.status(503).json({ 
        message: '热搜功能暂时不可用，正在进行系统维护',
        code: 'HOTSEARCH_MAINTENANCE'
      });
      
      const { keyword, platform } = req.query;
      const { limit = 5 } = req.body;
      
      if (!keyword || !platform) {
        return res.status(400).json({ message: '请提供关键词和平台' });
      }
      
      // Get related content
      const relatedContent = await HotsearchService.getRelatedContent(keyword, platform, parseInt(limit));
      
      res.status(200).json({
        message: '获取热搜关联内容成功',
        data: relatedContent
      });
    } catch (error) {
      console.error('Get hotsearch related content error:', error);
      res.status(500).json({ message: error.message || '获取热搜关联内容失败' });
    }
  }
}

module.exports = HotsearchController;