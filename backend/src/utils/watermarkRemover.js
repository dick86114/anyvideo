/**
 * 水印去除工具
 * 专门处理各平台的水印去除逻辑
 */

class WatermarkRemover {
  
  /**
   * 小红书水印去除 - 增强版
   * @param {string} url - 原始图片URL
   * @returns {string} - 去水印后的URL
   */
  static removeXiaohongshuWatermark(url) {
    try {
      let cleanUrl = url;
      
      console.log(`开始处理小红书水印去除: ${url}`);
      
      // 策略1: 优先使用url_default或url_pre（这些通常是无水印的原图）
      // 这个策略在URL提取阶段已经处理了
      
      // 策略2: 移除所有质量参数和处理参数
      cleanUrl = cleanUrl.replace(/!\w+/g, ''); // 移除!后的所有参数
      cleanUrl = cleanUrl.replace(/\?.*$/g, ''); // 移除?后的所有查询参数
      
      // 策略3: 替换为更高质量的CDN域名
      if (cleanUrl.includes('sns-webpic-qc.xhscdn.com')) {
        // webpic通常有水印，替换为img域名
        cleanUrl = cleanUrl.replace('sns-webpic-qc.xhscdn.com', 'sns-img-qc.xhscdn.com');
      }
      
      // 策略4: 处理spectrum路径（通常包含处理参数）
      if (cleanUrl.includes('/spectrum/')) {
        // 尝试获取原图路径
        cleanUrl = cleanUrl.replace(/\/spectrum\/[^/]*\//, '/');
      }
      
      // 策略5: 移除特定的水印和处理参数
      const paramsToRemove = [
        /[?&]watermark=\d+/g,
        /[?&]wm=\d+/g,
        /[?&]x-oss-process=[^&]*/g,
        /[?&]imageslim/g,
        /[?&]imageView2[^&]*/g,
        /[?&]auto-orient/g
      ];
      
      paramsToRemove.forEach(param => {
        cleanUrl = cleanUrl.replace(param, '');
      });
      
      // 策略6: 清理URL末尾的多余字符
      cleanUrl = cleanUrl.replace(/[?&]$/, '');
      
      // 策略7: 对于Live Photo，尝试获取高质量版本
      // 注意：这里需要导入LivePhotoProcessor或使用简单的字符串检测
      if (cleanUrl.includes('live_photo') || cleanUrl.includes('livephoto')) {
        if (cleanUrl.includes('live_photo')) {
          cleanUrl = cleanUrl.replace('live_photo', 'live_photo_hd');
        }
      }
      
      console.log(`小红书水印去除完成: ${url} -> ${cleanUrl}`);
      
      return cleanUrl;
      
    } catch (error) {
      console.error('小红书水印去除失败:', error);
      return url; // 失败时返回原URL
    }
  }
  
  /**
   * 抖音水印去除
   * @param {string} url - 原始视频/图片URL
   * @returns {string} - 去水印后的URL
   */
  static removeDouyinWatermark(url) {
    try {
      let cleanUrl = url;
      
      console.log(`开始处理抖音水印去除: ${url}`);
      
      // 策略1: 替换playwm为play（去除水印标识）
      cleanUrl = cleanUrl.replace(/playwm/g, 'play');
      
      // 策略2: 移除水印参数
      cleanUrl = cleanUrl.replace(/[?&]watermark=1/g, '');
      cleanUrl = cleanUrl.replace(/[?&]wm=1/g, '');
      
      // 策略3: 尝试获取高清版本
      cleanUrl = cleanUrl.replace(/\/play\//, '/play_hd/');
      
      console.log(`抖音水印去除完成: ${url} -> ${cleanUrl}`);
      
      return cleanUrl;
      
    } catch (error) {
      console.error('抖音水印去除失败:', error);
      return url;
    }
  }
  
  /**
   * 微博水印去除
   * @param {string} url - 原始图片URL
   * @returns {string} - 去水印后的URL
   */
  static removeWeiboWatermark(url) {
    try {
      let cleanUrl = url;
      
      console.log(`开始处理微博水印去除: ${url}`);
      
      // 策略1: 替换为大图版本（大图通常水印较少）
      cleanUrl = cleanUrl.replace(/\/thumb\d+\//, '/large/');
      cleanUrl = cleanUrl.replace(/\/small\//, '/large/');
      cleanUrl = cleanUrl.replace(/\/middle\//, '/large/');
      cleanUrl = cleanUrl.replace(/\/bmiddle\//, '/large/');
      
      // 策略2: 尝试获取原图
      cleanUrl = cleanUrl.replace(/\/large\//, '/original/');
      
      console.log(`微博水印去除完成: ${url} -> ${cleanUrl}`);
      
      return cleanUrl;
      
    } catch (error) {
      console.error('微博水印去除失败:', error);
      return url;
    }
  }
  
  /**
   * 通用水印去除入口
   * @param {string} url - 原始URL
   * @param {string} platform - 平台名称
   * @returns {string} - 去水印后的URL
   */
  static removeWatermark(url, platform) {
    if (!url || typeof url !== 'string') {
      return url;
    }
    
    switch (platform.toLowerCase()) {
      case 'xiaohongshu':
        return this.removeXiaohongshuWatermark(url);
      case 'douyin':
        return this.removeDouyinWatermark(url);
      case 'weibo':
        return this.removeWeiboWatermark(url);
      default:
        console.log(`暂不支持 ${platform} 平台的水印去除`);
        return url;
    }
  }
  
  /**
   * 批量去水印
   * @param {string[]} urls - URL数组
   * @param {string} platform - 平台名称
   * @returns {string[]} - 去水印后的URL数组
   */
  static removeWatermarkBatch(urls, platform) {
    if (!Array.isArray(urls)) {
      return urls;
    }
    
    return urls.map(url => this.removeWatermark(url, platform));
  }
  
  /**
   * 验证URL是否可能包含水印
   * @param {string} url - 图片URL
   * @param {string} platform - 平台名称
   * @returns {boolean} - 是否可能包含水印
   */
  static hasWatermark(url, platform) {
    if (!url || typeof url !== 'string') {
      return false;
    }
    
    const watermarkIndicators = {
      xiaohongshu: [
        '!h5_', '!webp', '!jpg', 'watermark=', 'wm=', 'x-oss-process=', 'spectrum'
      ],
      douyin: [
        'playwm', 'watermark=1', 'wm=1'
      ],
      weibo: [
        '/thumb', '/small/', '/middle/', '/bmiddle/'
      ]
    };
    
    const indicators = watermarkIndicators[platform.toLowerCase()] || [];
    return indicators.some(indicator => url.includes(indicator));
  }
}

module.exports = WatermarkRemover;