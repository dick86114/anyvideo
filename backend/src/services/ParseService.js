const path = require('path');
const { exec } = require('child_process');
const Content = require('../models/Content');
const storageService = require('./StorageService');

class ParseService {
  // Python SDK包装器路径
  static SDK_WRAPPER_PATH = path.join(__dirname, '../../../media_parser_sdk/wrapper.py');

  // Parse link from different platforms using Python SDK
  static async parseLink(link) {
    try {
      // 使用Python SDK解析链接
      const sdkResult = await this.executePythonSDK(['parse', link]);
      
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
    // 平台映射
    const platformMap = {
      'xiaohongshu': 'xiaohongshu',
      'douyin': 'douyin',
      'weibo': 'weibo',
      'bilibili': 'bilibili',
      'unknown': 'unknown'
    };
    
    const platform = platformMap[sdkResult.platform] || 'unknown';
    const mediaType = sdkResult.media_type || 'unknown';
    
    // 生成文件路径
    const cleanedAuthor = this.cleanFilename(sdkResult.author || 'unknown');
    const cleanedTitle = this.cleanFilename(sdkResult.title || 'untitled');
    const fileExt = mediaType === 'video' ? 'mp4' : 'jpg';
    const contentId = sdkResult.note_id || `sdk_${Date.now()}`;
    const filePath = path.join(platform, cleanedAuthor, `${contentId}.${fileExt}`);
    
    // 确定主要媒体URL
    let mediaUrl = '';
    let allImages = [];
    
    if (sdkResult.download_urls) {
      // 视频URL优先
      if (sdkResult.download_urls.video && sdkResult.download_urls.video.length > 0) {
        mediaUrl = sdkResult.download_urls.video[0];
      }
      // 图片URL作为备选，包括普通图片和实况图片
      allImages = [...(sdkResult.download_urls.images || []), ...(sdkResult.download_urls.live || [])];
      if (!mediaUrl && allImages.length > 0) {
        mediaUrl = allImages[0];
      }
    }
    
    // 封面URL处理
    let coverUrl = sdkResult.cover_url || '';
    if (!coverUrl && allImages.length > 0) {
      coverUrl = allImages[0];
    }
    
    return {
      platform,
      content_id: contentId,
      title: sdkResult.title || '未知标题',
      author: sdkResult.author || '未知作者',
      description: sdkResult.description || '',
      media_type: mediaType,
      cover_url: coverUrl,
      media_url: mediaUrl, // 主要媒体URL
      all_images: allImages, // 所有图片URL
      file_path: filePath, // 生成的文件路径
      source_url: originalLink,
      source_type: 1, // 1-单链接解析
      created_at: new Date(),
      // SDK扩展字段
      tags: sdkResult.tags || [],
      like_count: sdkResult.like_count,
      comment_count: sdkResult.comment_count,
      share_count: sdkResult.share_count,
      view_count: sdkResult.view_count,
      has_live_photo: sdkResult.has_live_photo || false
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