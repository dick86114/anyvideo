const { AppDataSource } = require('../utils/db');
const CacheService = require('../services/CacheService');

// Platform name mapping from English to Chinese
const PLATFORM_NAME_MAP = {
  douyin: '抖音',
  xiaohongshu: '小红书',
  weibo: '微博',
  kuaishou: '快手',
  bilibili: 'B站'
};

class DashboardController {
  // Get dashboard statistics
  static async getDashboardStats(req, res) {
    try {
      // Get today's start time (00:00:00)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get repositories from TypeORM
      const contentRepository = AppDataSource.getRepository('Content');
      const crawlTaskRepository = AppDataSource.getRepository('CrawlTask');

      // Total content count
      const total = await contentRepository.count();

      // Video content count
      const videoCount = await contentRepository.count({ where: { media_type: 'video' } });

      // Image content count
      const imageCount = await contentRepository.count({ where: { media_type: 'image' } });

      // Today's added content count
      const todayAdded = await contentRepository.count({ where: { created_at: { $gte: today } } });

      // Active tasks count
      const activeTasks = await crawlTaskRepository.count({ where: { status: 1 } });

      res.status(200).json({
        message: '获取仪表盘统计数据成功',
        data: {
          total,
          videoCount,
          imageCount,
          todayAdded,
          activeTasks
        }
      });
    } catch (error) {
      console.error('Failed to get dashboard stats:', error);
      res.status(500).json({ message: '获取仪表盘统计数据失败' });
    }
  }

  // Get content platform distribution
  static async getContentPlatformDistribution(req, res) {
    try {
      // Get Content repository from TypeORM
      const contentRepository = AppDataSource.getRepository('Content');
      
      // Get platform distribution using query builder
      const distribution = await contentRepository.createQueryBuilder('content')
        .select('content.platform as _id, COUNT(content.id) as count')
        .groupBy('content.platform')
        .orderBy('count', 'DESC')
        .getRawMany();

      // Transform data format for chart with platform name mapping
      const chartData = distribution.map(item => ({
        type: PLATFORM_NAME_MAP[item._id] || item._id || '未知',
        value: parseInt(item.count)
      }));

      res.status(200).json({
        message: '获取内容平台分布数据成功',
        data: chartData
      });
    } catch (error) {
      console.error('Failed to get content platform distribution:', error);
      res.status(500).json({ message: '获取内容平台分布数据失败' });
    }
  }

  // Get content type comparison
  static async getContentTypeComparison(req, res) {
    try {
      // Get Content repository from TypeORM
      const contentRepository = AppDataSource.getRepository('Content');
      
      // Get video count
      const videoCount = await contentRepository.count({ where: { media_type: 'video' } });

      // Get image count
      const imageCount = await contentRepository.count({ where: { media_type: 'image' } });

      const chartData = [
        { type: '视频', value: videoCount },
        { type: '图文', value: imageCount }
      ];

      res.status(200).json({
        message: '获取内容类型对比数据成功',
        data: chartData
      });
    } catch (error) {
      console.error('Failed to get content type comparison:', error);
      res.status(500).json({ message: '获取内容类型对比数据失败' });
    }
  }

  // Get recent content trend
  static async getRecentContentTrend(req, res) {
    try {
      // Get Content repository from TypeORM
      const contentRepository = AppDataSource.getRepository('Content');
      
      // Calculate dates for the last 7 days
      const trendData = [];
      const today = new Date();

      // Generate data for each of the last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);

        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        // Count content added on this date
        const count = await contentRepository.count({
          where: {
            created_at: {
              gte: date,
              lt: nextDate
            }
          }
        });

        // Format date as MM-DD
        const dateStr = `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
        trendData.push({ date: dateStr, count });
      }

      res.status(200).json({
        message: '获取近期内容趋势数据成功',
        data: trendData
      });
    } catch (error) {
      console.error('Failed to get recent content trend:', error);
      res.status(500).json({ message: '获取近期内容趋势数据失败' });
    }
  }

  // Get all dashboard data in one call
  static async getAllDashboardData(req, res) {
    try {
      // Check cache first
      const cacheKey = CacheService.getDashboardCacheKey();
      const cachedData = CacheService.get(cacheKey);
      if (cachedData) {
        return res.status(200).json(cachedData);
      }

      // Parallel requests for better performance
      const [
        statsResponse,
        platformDistributionResponse,
        contentTypeComparisonResponse,
        recentTrendResponse
      ] = await Promise.all([
        DashboardController.getDashboardStatsInternal(),
        DashboardController.getContentPlatformDistributionInternal(),
        DashboardController.getContentTypeComparisonInternal(),
        DashboardController.getRecentContentTrendInternal()
      ]);

      // Prepare response data
      const responseData = {
        message: '获取所有仪表盘数据成功',
        data: {
          stats: statsResponse,
          platformDistribution: platformDistributionResponse,
          contentTypeComparison: contentTypeComparisonResponse,
          recentTrend: recentTrendResponse
        }
      };

      // Cache the response for 5 minutes
      CacheService.set(cacheKey, responseData, 300);

      res.status(200).json(responseData);
    } catch (error) {
      console.error('Failed to get all dashboard data:', error);
      res.status(500).json({ message: '获取所有仪表盘数据失败' });
    }
  }

  // Internal method to get dashboard stats (without response handling)
  static async getDashboardStatsInternal() {
    // Get today's start time (00:00:00)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get repositories from TypeORM
    const contentRepository = AppDataSource.getRepository('Content');
    const crawlTaskRepository = AppDataSource.getRepository('CrawlTask');
    
    // Total content count
    const total = await contentRepository.count();

    // Video content count
    const videoCount = await contentRepository.count({ where: { media_type: 'video' } });

    // Image content count
    const imageCount = await contentRepository.count({ where: { media_type: 'image' } });

    // Today's added content count
    const todayAdded = await contentRepository.count({
      where: {
        created_at: {
          gte: today
        }
      }
    });

    // Active tasks count
    const activeTasks = await crawlTaskRepository.count({ where: { status: 1 } });

    return { total, videoCount, imageCount, todayAdded, activeTasks };
  }

  // Internal method to get content platform distribution (without response handling)
  static async getContentPlatformDistributionInternal() {
    // Get Content repository from TypeORM
    const contentRepository = AppDataSource.getRepository('Content');
    
    // Get platform distribution using query builder
    const distribution = await contentRepository.createQueryBuilder('content')
      .select('content.platform as _id, COUNT(content.id) as count')
      .groupBy('content.platform')
      .orderBy('count', 'DESC')
      .getRawMany();

    // Transform data format for chart with platform name mapping
    return distribution.map(item => ({
      type: PLATFORM_NAME_MAP[item._id] || item._id || '未知',
      value: parseInt(item.count)
    }));
  }

  // Internal method to get content type comparison (without response handling)
  static async getContentTypeComparisonInternal() {
    // Get Content repository from TypeORM
    const contentRepository = AppDataSource.getRepository('Content');
    
    // Get video count
    const videoCount = await contentRepository.count({ where: { media_type: 'video' } });

    // Get image count
    const imageCount = await contentRepository.count({ where: { media_type: 'image' } });

    return [
      { type: '视频', value: videoCount },
      { type: '图文', value: imageCount }
    ];
  }

  // Internal method to get recent content trend (without response handling)
  static async getRecentContentTrendInternal() {
    // Get Content repository from TypeORM
    const contentRepository = AppDataSource.getRepository('Content');
    
    // Calculate dates for the last 7 days
    const trendData = [];
    const today = new Date();

    // Generate data for each of the last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      // Count content added on this date
        const count = await contentRepository.count({
          where: {
            created_at: {
              gte: date,
              lt: nextDate
            }
          }
        });

      // Format date as MM-DD
      const dateStr = `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      trendData.push({ date: dateStr, count });
    }

    return trendData;
  }
}

module.exports = DashboardController;
