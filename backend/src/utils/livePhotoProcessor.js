/**
 * Live Photo 处理工具
 * 专门处理实况图片的检测、解析和下载
 */

const path = require('path');

class LivePhotoProcessor {
  
  /**
   * 检测URL是否为Live Photo
   * @param {string} url - 图片URL
   * @returns {boolean} - 是否为Live Photo
   */
  static isLivePhoto(url) {
    if (!url || typeof url !== 'string') {
      return false;
    }
    
    const livePhotoIndicators = [
      'live_photo',
      'livephoto', 
      'live_image',
      'motion_photo',
      'burst',
      'sequence',
      '.heic', // HEIC格式常用于Live Photo
      '.mov', // 动态组件通常是MOV格式
      'live', // 通用live标识
    ];
    
    return livePhotoIndicators.some(indicator => 
      url.toLowerCase().includes(indicator.toLowerCase())
    );
  }
  
  /**
   * 从Live Photo URL中提取静态图片和动态视频URL
   * @param {string} url - Live Photo URL
   * @returns {Object} - 包含静态和动态URL的对象
   */
  static extractLivePhotoUrls(url) {
    const result = {
      static: null,
      motion: null,
      isLivePhoto: false
    };
    
    if (!this.isLivePhoto(url)) {
      return result;
    }
    
    result.isLivePhoto = true;
    
    try {
      // 如果是动态视频URL，尝试推导静态图片URL
      if (url.includes('.mov') || url.includes('.mp4')) {
        result.motion = url;
        // 尝试将视频扩展名替换为图片扩展名
        result.static = url
          .replace(/\.(mov|mp4)$/i, '.jpg')
          .replace(/motion/gi, 'static')
          .replace(/live_video/gi, 'live_image');
      }
      // 如果是静态图片URL，尝试推导动态视频URL
      else if (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') || url.includes('.heic')) {
        result.static = url;
        // 尝试将图片扩展名替换为视频扩展名
        result.motion = url
          .replace(/\.(jpg|jpeg|png|heic)$/i, '.mov')
          .replace(/static/gi, 'motion')
          .replace(/live_image/gi, 'live_video');
      }
      // 如果URL中包含live_photo但没有明确的扩展名
      else if (url.includes('live_photo')) {
        // 假设原URL是静态图片
        result.static = url.includes('.') ? url : `${url}.jpg`;
        result.motion = url.includes('.') ? 
          url.replace(/(\.[^.]+)$/, '.mov') : 
          `${url}.mov`;
      }
      
      console.log(`Live Photo URL解析: ${url}`);
      console.log(`  静态图片: ${result.static}`);
      console.log(`  动态视频: ${result.motion}`);
      
    } catch (error) {
      console.error('Live Photo URL解析失败:', error);
    }
    
    return result;
  }
  
  /**
   * 生成Live Photo文件信息
   * @param {string} originalUrl - 原始URL
   * @param {number} index - 图片索引
   * @param {string} contentId - 内容ID
   * @param {number} timestamp - 时间戳
   * @param {string} baseDir - 基础目录
   * @returns {Array} - Live Photo文件信息数组
   */
  static generateLivePhotoFiles(originalUrl, index, contentId, timestamp, baseDir) {
    const files = [];
    
    if (!this.isLivePhoto(originalUrl)) {
      // 不是Live Photo，返回普通图片文件信息
      const filename = `${contentId}_${timestamp}_${String(index + 1).padStart(3, '0')}.jpg`;
      files.push({
        type: 'image',
        originalUrl: originalUrl,
        filename: filename,
        relativePath: path.join(baseDir, filename),
        isLivePhoto: false,
        component: 'image'
      });
      return files;
    }
    
    // 解析Live Photo URLs
    const liveUrls = this.extractLivePhotoUrls(originalUrl);
    
    if (liveUrls.static) {
      const staticFilename = `${contentId}_${timestamp}_${String(index + 1).padStart(3, '0')}_static.jpg`;
      files.push({
        type: 'live_photo_static',
        originalUrl: liveUrls.static,
        filename: staticFilename,
        relativePath: path.join(baseDir, staticFilename),
        isLivePhoto: true,
        component: 'static'
      });
    }
    
    if (liveUrls.motion) {
      const motionFilename = `${contentId}_${timestamp}_${String(index + 1).padStart(3, '0')}_motion.mov`;
      files.push({
        type: 'live_photo_motion',
        originalUrl: liveUrls.motion,
        filename: motionFilename,
        relativePath: path.join(baseDir, motionFilename),
        isLivePhoto: true,
        component: 'motion'
      });
    }
    
    console.log(`生成Live Photo文件信息，共${files.length}个文件`);
    
    return files;
  }
  
  /**
   * 批量处理Live Photo URLs
   * @param {string[]} urls - URL数组
   * @returns {Array} - 处理后的文件信息数组
   */
  static processLivePhotoUrls(urls) {
    if (!Array.isArray(urls)) {
      return [];
    }
    
    const processedFiles = [];
    
    urls.forEach((url, index) => {
      if (this.isLivePhoto(url)) {
        const liveUrls = this.extractLivePhotoUrls(url);
        
        if (liveUrls.static) {
          processedFiles.push({
            index: index,
            type: 'live_photo_static',
            url: liveUrls.static,
            component: 'static'
          });
        }
        
        if (liveUrls.motion) {
          processedFiles.push({
            index: index,
            type: 'live_photo_motion', 
            url: liveUrls.motion,
            component: 'motion'
          });
        }
      } else {
        processedFiles.push({
          index: index,
          type: 'image',
          url: url,
          component: 'image'
        });
      }
    });
    
    return processedFiles;
  }
  
  /**
   * 验证Live Photo文件完整性
   * @param {Array} downloadedFiles - 已下载的文件列表
   * @returns {Object} - 验证结果
   */
  static validateLivePhotoFiles(downloadedFiles) {
    const validation = {
      totalFiles: downloadedFiles.length,
      livePhotoCount: 0,
      regularImageCount: 0,
      completeLivePhotos: 0,
      incompleteLivePhotos: 0,
      issues: []
    };
    
    // 按索引分组Live Photo文件
    const livePhotoGroups = {};
    
    downloadedFiles.forEach(file => {
      if (file.isLivePhoto) {
        validation.livePhotoCount++;
        
        if (!livePhotoGroups[file.index]) {
          livePhotoGroups[file.index] = {};
        }
        livePhotoGroups[file.index][file.livePhotoComponent] = file;
      } else {
        validation.regularImageCount++;
      }
    });
    
    // 检查Live Photo完整性
    Object.keys(livePhotoGroups).forEach(index => {
      const group = livePhotoGroups[index];
      
      if (group.static && group.motion) {
        validation.completeLivePhotos++;
      } else {
        validation.incompleteLivePhotos++;
        
        const missing = [];
        if (!group.static) missing.push('静态图片');
        if (!group.motion) missing.push('动态视频');
        
        validation.issues.push({
          index: parseInt(index),
          type: 'incomplete_live_photo',
          message: `Live Photo ${index} 缺少: ${missing.join(', ')}`
        });
      }
    });
    
    console.log('Live Photo文件验证结果:', validation);
    
    return validation;
  }
}

module.exports = LivePhotoProcessor;