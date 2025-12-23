const path = require('path');
const { exec } = require('child_process');
const { AppDataSource } = require('../utils/db');
const storageService = require('./StorageService');

class ParseService {
  // Python SDK包装器路径
  static SDK_WRAPPER_PATH = path.join(__dirname, '../../../media_parser_sdk/wrapper.py');

  // Parse link from different platforms using Python SDK
  static async parseLink(link) {
    try {
      // 检测平台并选择合适的SDK命令
      let sdkCommand = ['parse', link];
      
      // 对小红书使用增强解析器
      if (link.includes('xiaohongshu.com') || link.includes('xhslink.com')) {
        sdkCommand = ['xiaohongshu_note', link];
      }
      
      // 使用Python SDK解析链接
      const sdkResult = await this.executePythonSDK(sdkCommand);
      
      // 检查解析结果是否包含错误
      if (sdkResult.error) {
        throw new Error(sdkResult.error);
      }
      
      // 映射SDK结果到现有数据格式
      const parsedData = this.mapSdkResultToExistingFormat(sdkResult, link);
      
      return parsedData;
    } catch (error) {
      console.error('Parse link error:', error);
      throw error;
    }
  }

  // 执行Python SDK包装器
  static executePythonSDK(args) {
    return new Promise((resolve, reject) => {
      const command = `python3 ${this.SDK_WRAPPER_PATH} ${args.join(' ')}`;
      console.log(`执行SDK命令: ${command}`);
      
      exec(command, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
        if (error) {
          console.error('SDK执行错误:', stderr || error.message);
          reject(new Error(stderr || error.message));
          return;
        }
        
        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (parseError) {
          console.error('JSON解析失败:', stdout);
          reject(new Error(`JSON解析失败: ${stdout}`));
        }
      });
    });
  }

  // 映射SDK结果到现有格式
  static mapSdkResultToExistingFormat(sdkResult, originalLink) {
    // 处理增强解析器的响应格式
    let actualResult = sdkResult;
    if (sdkResult.success && sdkResult.data) {
      // 这是增强解析器的响应格式
      actualResult = sdkResult.data;
      
      // 转换videos数组格式
      if (actualResult.videos && Array.isArray(actualResult.videos)) {
        actualResult.download_urls = actualResult.download_urls || {};
        actualResult.download_urls.video = actualResult.videos.map(v => v.url);
      }
      
      // 转换images数组格式
      if (actualResult.images && Array.isArray(actualResult.images)) {
        actualResult.download_urls = actualResult.download_urls || {};
        actualResult.download_urls.images = actualResult.images.map(i => i.url);
      }
      
      // 映射其他字段
      actualResult.platform = 'xiaohongshu';
      actualResult.author = actualResult.author?.nickname || actualResult.author || '未知作者';
      actualResult.like_count = actualResult.interaction_stats?.like_count;
      actualResult.comment_count = actualResult.interaction_stats?.comment_count;
      actualResult.share_count = actualResult.interaction_stats?.share_count;
    }
    
    // 平台映射
    const platformMap = {
      'xiaohongshu': 'xiaohongshu',
      'douyin': 'douyin',
      'weibo': 'weibo',
      'bilibili': 'bilibili',
      'unknown': 'unknown'
    };
    
    const platform = platformMap[actualResult.platform] || 'unknown';
    const mediaType = actualResult.media_type || 'unknown';
    
    // 生成文件路径
    const cleanedAuthor = this.cleanFilename(actualResult.author || 'unknown');
    const cleanedTitle = this.cleanFilename(actualResult.title || 'untitled');
    const fileExt = mediaType === 'video' ? 'mp4' : 'jpg';
    const contentId = actualResult.note_id || `sdk_${Date.now()}`;
    const filePath = path.join(platform, cleanedAuthor, `${contentId}.${fileExt}`);
    
    // 确定主要媒体URL和所有媒体URL
    let mediaUrl = '';
    let allImages = [];
    let allVideos = [];
    
    if (actualResult.download_urls) {
      // 提取所有视频URL
      allVideos = actualResult.download_urls.video || [];
      
      // 视频URL优先作为主媒体URL
      if (allVideos.length > 0) {
        mediaUrl = allVideos[0];
      }
      
      // 图片URL处理，包括普通图片和实况图片
      allImages = [...(actualResult.download_urls.images || []), ...(actualResult.download_urls.live || [])];
      
      // 如果没有视频，使用图片作为主媒体URL
      if (!mediaUrl && allImages.length > 0) {
        mediaUrl = allImages[0];
      }
    }
    
    // 封面URL处理
    let coverUrl = actualResult.cover_url || '';
    if (!coverUrl && allImages.length > 0) {
      coverUrl = allImages[0];
    }
    
    return {
      platform,
      content_id: contentId,
      title: actualResult.title || '未知标题',
      author: actualResult.author || '未知作者',
      description: actualResult.description || '',
      media_type: mediaType,
      cover_url: coverUrl,
      media_url: mediaUrl, // 主要媒体URL
      all_images: allImages, // 所有图片URL
      all_videos: allVideos, // 所有视频URL - 新增字段
      file_path: filePath, // 生成的文件路径
      source_url: originalLink,
      source_type: 1, // 1-单链接解析
      created_at: new Date(),
      // SDK扩展字段
      tags: actualResult.tags || [],
      like_count: actualResult.like_count,
      comment_count: actualResult.comment_count,
      share_count: actualResult.share_count,
      view_count: actualResult.view_count,
      has_live_photo: actualResult.has_live_photo || false
    };
  }

  // 清理文件名，移除特殊字符
  static cleanFilename(filename) {
    return filename.replace(/[\\/:*?"<>|]/g, '_').substring(0, 50);
  }

  // Detect platform from URL (保持API兼容性)
  static detectPlatform(url) {
    if (url.includes('douyin.com') || url.includes('tiktok.com')) {
      return 'douyin';
    } else if (url.includes('xiaohongshu.com')) {
      return 'xiaohongshu';
    } else if (url.includes('kuaishou.com')) {
      return 'kuaishou';
    } else if (url.includes('bilibili.com')) {
      return 'bilibili';
    } else if (url.includes('weibo.com')) {
      return 'weibo';
    }
    return null;
  }

  // 下载所有媒体文件 (保持API兼容性)
  static async downloadAllMedia(parsedData, platform, sourceType = 1, taskId = null) {
    try {
      console.log('处理媒体文件信息:', parsedData.content_id);
      
      // 不实际下载文件，只返回文件信息用于数据库保存
      // 实际的文件下载由前端的代理服务处理
      
      const allImages = parsedData.all_images || [];
      const hasLivePhoto = parsedData.has_live_photo || false;
      
      // 构建返回结果
      return {
        mainImagePath: parsedData.file_path || `${platform}/${parsedData.content_id || Date.now()}.jpg`,
        downloadedFiles: allImages.map((url, index) => ({
          originalUrl: url,
          watermarkFreeUrl: url, // SDK已处理水印
          filePath: `${platform}/${parsedData.content_id || Date.now()}_${index + 1}.jpg`,
          isLivePhoto: hasLivePhoto,
          index: index
        })),
        totalFiles: allImages.length || 1,
        hasLivePhoto: hasLivePhoto
      };
    } catch (error) {
      console.error('处理媒体文件信息失败:', error);
      throw error;
    }
  }
}

module.exports = ParseService;