const axios = require('axios');
const cheerio = require('cheerio');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs-extra');

/**
 * 增强版小红书解析器 - 基于成功案例的技术实现
 * 支持去水印和Live Photo下载
 */
class EnhancedXiaohongshuParser {
  
  constructor() {
    // User-Agent池
    this.userAgents = [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
      'Mozilla/5.0 (iPad; CPU OS 15_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.5 Mobile/15E148 Safari/604.1',
      'Mozilla/5.0 (Android 12; Mobile; rv:109.0) Gecko/113.0 Firefox/113.0',
      'Mozilla/5.0 (Android 13; Mobile; rv:126.0) Gecko/126.0 Firefox/126.0',
      'Mozilla/5.0 (Linux; Android 14; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.165 Mobile Safari/537.36'
    ];
    
    // 设备ID池
    this.deviceIds = [
      '5c1a8d0e-7b2f-4a3d-8c9a-1b2c3d4e5f6a',
      'a1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6p',
      '7f8e9d0c-6b5a-4d3c-2b1a-09876543210a',
      '3a4b5c6d-7e8f-9a0b-1c2d-3e4f5a6b7c8d',
      '9z8y7x6w-5v4u-3t2s-1r0q-9p8o7n6m5l4k'
    ];
  }
  
  /**
   * 生成随机User-Agent
   */
  getRandomUserAgent() {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }
  
  /**
   * 生成设备ID
   */
  generateDeviceId() {
    if (Math.random() > 0.5) {
      return this.deviceIds[Math.floor(Math.random() * this.deviceIds.length)];
    }
    return this.generateUUID();
  }
  
  /**
   * 生成UUID
   */
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
  /**
   * 生成时间戳
   */
  generateTimestamp() {
    return Math.floor(Date.now() / 1000).toString();
  }
  
  /**
   * 生成MD5哈希
   */
  md5(input) {
    return crypto.createHash('md5').update(input).digest('hex');
  }
  
  /**
   * 生成签名
   */
  generateSign(path, params, cookie, deviceId, timestamp) {
    let signStr = path + '?';
    
    // 添加参数
    if (params && Object.keys(params).length > 0) {
      const paramStr = Object.entries(params)
        .map(([key, value]) => `${key}=${value}`)
        .join('&');
      signStr += paramStr;
    }
    
    // 添加设备信息和时间戳
    signStr += `_${timestamp}_${deviceId}_${cookie || ''}`;
    
    return this.md5(signStr);
  }
  
  /**
   * 获取增强的请求头
   */
  getEnhancedHeaders(url, cookie = '') {
    const deviceId = this.generateDeviceId();
    const timestamp = this.generateTimestamp();
    const signature = this.generateSign('/explore', {}, cookie, deviceId, timestamp);
    
    return {
      'User-Agent': this.getRandomUserAgent(),
      'Referer': 'https://www.xiaohongshu.com/',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'x-t': timestamp,
      'x-s': signature,
      'x-device-id': deviceId,
      'x-requested-with': 'XMLHttpRequest',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Upgrade-Insecure-Requests': '1',
      'Cookie': cookie
    };
  }
  
  /**
   * 从HTML提取JSON数据
   */
  extractJsonData(htmlContent) {
    const regexPatterns = [
      // 更精确的正则表达式
      /window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\});?\s*(?:<\/script>|$)/,
      /window\.__INITIAL_DATA__\s*=\s*(\{[\s\S]*?\});?\s*(?:<\/script>|$)/,
      /window\.INITIAL_STATE\s*=\s*(\{[\s\S]*?\});?\s*(?:<\/script>|$)/,
      /__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\});?\s*(?:<\/script>|$)/,
      /window\.__NOTE_DATA__\s*=\s*(\{[\s\S]*?\});?\s*(?:<\/script>|$)/,
      /window\.\$NOTE_DATA\s*=\s*(\{[\s\S]*?\});?\s*(?:<\/script>|$)/,
      /window\.__PAGE_DATA__\s*=\s*(\{[\s\S]*?\});?\s*(?:<\/script>|$)/,
      /__NOTE_DATA__\s*=\s*(\{[\s\S]*?\});?\s*(?:<\/script>|$)/,
      /window\.\$REDUX_STATE\s*=\s*(\{[\s\S]*?\});?\s*(?:<\/script>|$)/,
      /window\.\$STORE\s*=\s*(\{[\s\S]*?\});?\s*(?:<\/script>|$)/,
      /window\.store\s*=\s*(\{[\s\S]*?\});?\s*(?:<\/script>|$)/,
      /window\.__data__\s*=\s*(\{[\s\S]*?\});?\s*(?:<\/script>|$)/
    ];
    
    for (const pattern of regexPatterns) {
      try {
        const match = htmlContent.match(pattern);
        if (match && match[1]) {
          let jsonString = match[1].trim();
          
          // 移除末尾的分号
          if (jsonString.endsWith(';')) {
            jsonString = jsonString.substring(0, jsonString.length - 1);
          }
          
          // 清理JSON字符串
          jsonString = jsonString.replace(/:\s*undefined\s*(,|\}|\])/g, ': null$1');
          jsonString = jsonString.replace(/,\s*(\}|\])/g, '$1');
          
          console.log(`✅ 找到JSON数据，长度: ${jsonString.length}`);
          
          const parsed = JSON.parse(jsonString);
          console.log(`✅ JSON解析成功，顶级键: ${Object.keys(parsed).slice(0, 10).join(', ')}`);
          
          return parsed;
        }
      } catch (e) {
        console.warn(`JSON解析失败，尝试下一个模式: ${e.message}`);
        continue;
      }
    }
    
    // 如果所有模式都失败，尝试更宽松的匹配
    console.log('🔍 尝试更宽松的JSON匹配...');
    
    const fallbackPatterns = [
      /(\{[^{}]*"note"[^{}]*\{[\s\S]*?\}[^{}]*\})/g,
      /(\{[^{}]*"imageList"[^{}]*\[[\s\S]*?\][^{}]*\})/g,
      /(\{[^{}]*"title"[^{}]*"[^"]*"[\s\S]*?\})/g
    ];
    
    for (const pattern of fallbackPatterns) {
      try {
        const matches = htmlContent.match(pattern);
        if (matches) {
          for (const match of matches) {
            try {
              const parsed = JSON.parse(match);
              if (parsed && typeof parsed === 'object') {
                console.log(`✅ 备用模式找到JSON数据`);
                return parsed;
              }
            } catch (e) {
              continue;
            }
          }
        }
      } catch (e) {
        continue;
      }
    }
    
    return null;
  }
  
  /**
   * 从JSON中查找内容数据
   */
  findContentData(json) {
    const paths = [
      // 优先路径：note.noteDetailMap（小红书最新数据结构）
      () => {
        if (json.note && json.note.noteDetailMap) {
          const noteIds = Object.keys(json.note.noteDetailMap);
          if (noteIds.length > 0) {
            const noteData = json.note.noteDetailMap[noteIds[0]];
            return noteData.note || noteData;
          }
        }
        return null;
      },
      // 备用路径 - 基于成功Java案例的完整路径
      () => json.notes && Array.isArray(json.notes) && json.notes.length > 0 ? json.notes[0] : null,
      () => json.note,
      () => json.data && json.data.note,
      () => json.state && json.state.note,
      () => json.data && json.data.contents && Array.isArray(json.data.contents) && json.data.contents.length > 0 ? json.data.contents[0] : null,
      () => json.props && json.props.pageProps && json.props.pageProps.note,
      () => json.__NEXT_DATA__ && json.__NEXT_DATA__.props && json.__NEXT_DATA__.props.pageProps && json.__NEXT_DATA__.props.pageProps.note,
      () => json.data && json.data.noteDetail,
      () => json.detail && json.detail.note,
      () => json.fe_data && json.fe_data.note,
      () => json.data && json.data.detail && json.data.detail.note,
      () => json.state && json.state.detail && json.state.detail.note,
      () => json.__data__ && json.__data__.note,
      () => json.note_data,
      () => json.data && json.data.contents && Array.isArray(json.data.contents) && json.data.contents.length > 0 && json.data.contents[0].content ? json.data.contents[0].content : null,
      () => json.data && json.data.content,
      () => json.content,
      () => json.noteDetail && json.noteDetail.note,
      () => json.fe_page && json.fe_page.note,
      () => json.pageData && json.pageData.note,
      () => json.entryData && json.entryData.note && json.entryData.note.noteData,
      () => json.initialData && json.initialData.note,
      () => json.feed && json.feed.items && Array.isArray(json.feed.items) && json.feed.items.length > 0 && json.feed.items[0].note ? json.feed.items[0].note : null,
      () => json.contentData && json.contentData.note
    ];
    
    for (const pathFn of paths) {
      try {
        const result = pathFn();
        if (result && typeof result === 'object' && (result.title || result.imageList || result.images || result.image_list)) {
          console.log('✅ 找到内容数据');
          return result;
        }
      } catch (e) {
        continue;
      }
    }
    
    // 如果标准路径都失败，尝试直接从顶级键查找
    console.log('🔍 尝试从顶级键查找内容数据...');
    const topLevelKeys = ['noteData', 'note_data', 'data', 'content', 'detail'];
    
    for (const key of topLevelKeys) {
      try {
        if (json[key] && typeof json[key] === 'object') {
          console.log(`✅ 在顶级键 "${key}" 中找到数据`);
          
          // 如果是noteData，可能需要进一步提取
          if (key === 'noteData' && json[key].noteDetailMap) {
            const noteIds = Object.keys(json[key].noteDetailMap);
            if (noteIds.length > 0) {
              const noteDetail = json[key].noteDetailMap[noteIds[0]];
              if (noteDetail.note) {
                console.log('✅ 从noteDetailMap中提取到note数据');
                return noteDetail.note;
              }
              return noteDetail;
            }
          }
          
          // 直接返回找到的数据
          return json[key];
        }
      } catch (e) {
        continue;
      }
    }
    
    return null;
  }
  
  /**
   * 提取图片URLs - 支持去水印和Live Photo
   */
  extractImageUrls(contentData) {
    const imageUrls = [];
    
    try {
      // 1. 从imageList数组提取（小红书主要使用的字段）
      if (contentData.imageList && Array.isArray(contentData.imageList)) {
        console.log(`找到 ${contentData.imageList.length} 张图片 (imageList)`);
        
        for (let i = 0; i < contentData.imageList.length; i++) {
          const img = contentData.imageList[i];
          console.log(`处理图片 ${i + 1}:`, JSON.stringify(img, null, 2).substring(0, 300) + '...');
          
          // 优先级顺序：url_default > url_pre > url > 其他（基于Java成功案例）
          let selectedUrl = null;
          
          // 最高优先级：url_default（无水印原图）
          if (img.url_default) {
            selectedUrl = img.url_default;
            console.log(`✅ 提取到默认高清图片URL (无水印): ${selectedUrl}`);
          } 
          // 次优先级：url_pre（预处理图片）
          else if (img.url_pre) {
            selectedUrl = img.url_pre;
            console.log(`✅ 提取到预处理图片URL: ${selectedUrl}`);
          } 
          // 标准URL
          else if (img.url) {
            selectedUrl = img.url;
            console.log(`✅ 提取到标准图片URL: ${selectedUrl}`);
          } 
          // 大图URL
          else if (img.large && img.large.url) {
            selectedUrl = img.large.url;
            console.log(`✅ 提取到大图URL: ${selectedUrl}`);
          } 
          // 中图URL
          else if (img.middle && img.middle.url) {
            selectedUrl = img.middle.url;
            console.log(`✅ 提取到中图URL: ${selectedUrl}`);
          }
          // 原始图片URL
          else if (img.origin_url) {
            selectedUrl = img.origin_url;
            console.log(`✅ 提取到原始图片URL: ${selectedUrl}`);
          }
          // 原始图片URL（另一种命名）
          else if (img.original_url) {
            selectedUrl = img.original_url;
            console.log(`✅ 提取到原始图片URL: ${selectedUrl}`);
          }
          
          if (selectedUrl) {
            imageUrls.push(selectedUrl);
          }
          
          // 处理Live Photo（基于Java成功案例）
          if (img.live_photo) {
            console.log(`🎬 检测到Live Photo`);
            if (img.live_photo.image_url) {
              console.log(`✅ 提取到Live Photo静态图片: ${img.live_photo.image_url}`);
              imageUrls.push(img.live_photo.image_url);
            }
            if (img.live_photo.video_url) {
              console.log(`✅ 提取到Live Photo动态视频: ${img.live_photo.video_url}`);
              imageUrls.push(img.live_photo.video_url);
            }
          }
          
          // 处理视频流（Live Photo的另一种形式）- 基于Java成功案例
          if (img.stream) {
            console.log(`🎬 检测到视频流数据`);
            if (img.stream.h264 && Array.isArray(img.stream.h264)) {
              img.stream.h264.forEach((stream, streamIndex) => {
                if (stream.master_url || stream.masterUrl) {
                  const streamUrl = stream.master_url || stream.masterUrl;
                  console.log(`✅ 提取到H264视频流 ${streamIndex + 1}: ${streamUrl}`);
                  imageUrls.push(streamUrl);
                }
              });
            }
            if (img.stream.h265 && Array.isArray(img.stream.h265)) {
              img.stream.h265.forEach((stream, streamIndex) => {
                if (stream.master_url || stream.masterUrl) {
                  const streamUrl = stream.master_url || stream.masterUrl;
                  console.log(`✅ 提取到H265视频流 ${streamIndex + 1}: ${streamUrl}`);
                  imageUrls.push(streamUrl);
                }
              });
            }
          }
        }
      }
      
      // 2. 从images数组提取（备用）- 基于Java成功案例
      else if (contentData.images && Array.isArray(contentData.images)) {
        console.log(`找到 ${contentData.images.length} 张图片 (images)`);
        
        for (let i = 0; i < contentData.images.length; i++) {
          const img = contentData.images[i];
          
          let imgUrl = null;
          // 优先级顺序：large > origin_url > original_url > url > middle
          if (img.large && img.large.url) {
            imgUrl = img.large.url;
          } else if (img.origin_url) {
            imgUrl = img.origin_url;
          } else if (img.original_url) {
            imgUrl = img.original_url;
          } else if (img.url) {
            imgUrl = img.url;
          } else if (img.middle && img.middle.url) {
            imgUrl = img.middle.url;
          }
          
          if (imgUrl) {
            console.log(`✅ 提取到图片URL (images ${i + 1}): ${imgUrl}`);
            imageUrls.push(imgUrl);
          }
          
          // 处理Live Photo
          if (img.live_photo) {
            if (img.live_photo.image_url) {
              imageUrls.push(img.live_photo.image_url);
            }
            if (img.live_photo.video_url) {
              imageUrls.push(img.live_photo.video_url);
            }
          }
        }
      }
      
      // 3. 从image_list数组提取（另一种数据结构）- 基于Java成功案例
      else if (contentData.image_list && Array.isArray(contentData.image_list)) {
        console.log(`找到 ${contentData.image_list.length} 张图片 (image_list)`);
        
        for (let i = 0; i < contentData.image_list.length; i++) {
          const img = contentData.image_list[i];
          
          let imgUrl = null;
          if (img.large && img.large.url) {
            imgUrl = img.large.url;
          } else if (img.url) {
            imgUrl = img.url;
          } else if (img.middle && img.middle.url) {
            imgUrl = img.middle.url;
          } else if (img.small && img.small.url) {
            imgUrl = img.small.url;
          } else if (img.origin_url) {
            imgUrl = img.origin_url;
          }
          
          if (imgUrl) {
            console.log(`✅ 提取到图片URL (image_list ${i + 1}): ${imgUrl}`);
            imageUrls.push(imgUrl);
          }
        }
      }
      
      // 4. 从contents提取（内容块结构）- 基于Java成功案例
      else if (contentData.contents && Array.isArray(contentData.contents)) {
        console.log(`找到 ${contentData.contents.length} 个内容块 (contents)`);
        
        for (let i = 0; i < contentData.contents.length; i++) {
          const contentItem = contentData.contents[i];
          
          if (contentItem.type === 'image' && contentItem.data) {
            const imgUrl = contentItem.data.url;
            if (imgUrl) {
              console.log(`✅ 提取到内容块图片URL ${i + 1}: ${imgUrl}`);
              imageUrls.push(imgUrl);
            }
          }
          // 处理实况图片内容块
          else if (contentItem.type === 'live_photo' && contentItem.data) {
            if (contentItem.data.image_url) {
              console.log(`✅ 提取到Live Photo静态图片: ${contentItem.data.image_url}`);
              imageUrls.push(contentItem.data.image_url);
            }
            if (contentItem.data.video_url) {
              console.log(`✅ 提取到Live Photo动态视频: ${contentItem.data.video_url}`);
              imageUrls.push(contentItem.data.video_url);
            }
          }
        }
      }
      
    } catch (error) {
      console.error('提取图片URL失败:', error);
    }
    
    return imageUrls;
  }
  
  /**
   * 去水印处理
   */
  removeWatermark(url) {
    try {
      let cleanUrl = url;
      
      console.log(`🎯 开始去水印处理: ${url}`);
      
      // 策略1: 如果已经是url_default，通常已经是无水印的
      if (url.includes('url_default')) {
        console.log(`✅ 检测到url_default，通常已无水印`);
        return cleanUrl;
      }
      
      // 策略2: 移除所有质量参数
      cleanUrl = cleanUrl.replace(/!\w+/g, '');
      cleanUrl = cleanUrl.replace(/\?.*$/g, '');
      
      // 策略3: 替换CDN域名获取高质量版本
      if (cleanUrl.includes('sns-webpic-qc.xhscdn.com')) {
        cleanUrl = cleanUrl.replace('sns-webpic-qc.xhscdn.com', 'sns-img-qc.xhscdn.com');
        console.log(`✅ 替换CDN域名: webpic -> img`);
      }
      
      // 策略4: 处理spectrum路径
      if (cleanUrl.includes('/spectrum/')) {
        cleanUrl = cleanUrl.replace(/\/spectrum\/[^/]*\//, '/');
        console.log(`✅ 移除spectrum处理路径`);
      }
      
      // 策略5: 移除水印参数
      const watermarkParams = [
        /[?&]watermark=\d+/g,
        /[?&]wm=\d+/g,
        /[?&]x-oss-process=[^&]*/g,
        /[?&]imageslim/g,
        /[?&]imageView2[^&]*/g,
        /[?&]auto-orient/g
      ];
      
      watermarkParams.forEach(param => {
        cleanUrl = cleanUrl.replace(param, '');
      });
      
      // 策略6: 清理URL末尾
      cleanUrl = cleanUrl.replace(/[?&]$/, '');
      
      console.log(`✅ 去水印完成: ${url} -> ${cleanUrl}`);
      
      return cleanUrl;
      
    } catch (error) {
      console.error('去水印处理失败:', error);
      return url;
    }
  }
  
  /**
   * 检测是否为Live Photo
   */
  isLivePhoto(url) {
    const livePhotoIndicators = [
      'live_photo',
      'livephoto',
      'live_image',
      'motion_photo',
      'burst',
      'sequence',
      '.heic',
      '.mov',
      'live'
    ];
    
    return livePhotoIndicators.some(indicator => 
      url.toLowerCase().includes(indicator.toLowerCase())
    );
  }
  
  /**
   * 主解析函数
   */
  async parseXiaohongshuLink(url) {
    try {
      console.log(`🚀 开始解析小红书链接: ${url}`);
      
      // 获取增强的请求头
      const headers = this.getEnhancedHeaders(url);
      
      console.log('📡 发送HTTP请求...');
      const response = await axios.get(url, {
        headers,
        timeout: 15000,
        maxRedirects: 5
      });
      
      console.log(`✅ 成功获取页面内容，长度: ${response.data.length}`);
      
      // 提取JSON数据
      const jsonData = this.extractJsonData(response.data);
      
      if (!jsonData) {
        throw new Error('未能提取到有效的JSON数据');
      }
      
      // 查找内容数据
      const contentData = this.findContentData(jsonData);
      
      if (!contentData) {
        throw new Error('未能找到内容数据');
      }
      
      // 提取基本信息
      const title = contentData.title || '小红书内容';
      const author = contentData.user?.nickname || contentData.user?.name || '小红书作者';
      const description = contentData.desc || contentData.description || '';
      const contentId = this.extractContentIdFromUrl(url);
      const isVideo = contentData.type === 'video';
      
      // 提取图片URLs
      const imageUrls = this.extractImageUrls(contentData);
      
      if (imageUrls.length === 0) {
        throw new Error('未找到有效的图片URL');
      }
      
      // 去水印处理
      const watermarkFreeUrls = imageUrls.map(url => this.removeWatermark(url));
      
      // 分离Live Photo
      const regularImages = [];
      const livePhotoImages = [];
      
      watermarkFreeUrls.forEach(url => {
        if (this.isLivePhoto(url)) {
          livePhotoImages.push(url);
        } else {
          regularImages.push(url);
        }
      });
      
      console.log(`✅ 解析完成:`);
      console.log(`   标题: ${title}`);
      console.log(`   作者: ${author}`);
      console.log(`   类型: ${isVideo ? '视频' : '图文'}`);
      console.log(`   普通图片: ${regularImages.length} 张`);
      console.log(`   Live Photo: ${livePhotoImages.length} 个`);
      
      return {
        content_id: contentId,
        title,
        author,
        description,
        media_type: isVideo ? 'video' : 'image',
        cover_url: watermarkFreeUrls[0],
        media_url: watermarkFreeUrls[0],
        all_images: watermarkFreeUrls,
        regular_images: regularImages,
        live_photo_images: livePhotoImages,
        watermark_removed: true,
        live_photo_supported: livePhotoImages.length > 0
      };
      
    } catch (error) {
      console.error('❌ 小红书链接解析失败:', error.message);
      throw error;
    }
  }
  
  /**
   * 从URL提取内容ID
   */
  extractContentIdFromUrl(url) {
    try {
      const match = url.match(/(?:explore|note)\/([0-9a-fA-F]{20,})/);
      return match ? match[1] : `xiaohongshu_${Date.now()}`;
    } catch (error) {
      return `xiaohongshu_${Date.now()}`;
    }
  }
  
  /**
   * 下载所有媒体文件
   */
  async downloadAllMedia(parsedData, platform, sourceType = 1) {
    try {
      console.log(`📥 开始批量下载，内容ID: ${parsedData.content_id}`);
      
      const timestamp = Date.now();
      const cleanedTitle = this.cleanFilename(parsedData.title || 'untitled');
      const baseDir = path.join(platform, cleanedTitle);
      
      // 创建完整目录路径
      const fullDirPath = path.join(process.env.STORAGE_ROOT_PATH || path.join(__dirname, '../../media'), baseDir);
      await fs.ensureDir(fullDirPath);
      
      const downloadedFiles = [];
      let mainImagePath = null;
      
      if (parsedData.all_images && parsedData.all_images.length > 0) {
        console.log(`📸 处理 ${parsedData.all_images.length} 个媒体文件`);
        
        for (let i = 0; i < parsedData.all_images.length; i++) {
          const imageUrl = parsedData.all_images[i];
          
          try {
            const isLive = this.isLivePhoto(imageUrl);
            let fileExt = 'jpg';
            let fileType = 'image';
            
            if (isLive) {
              if (imageUrl.includes('.mov') || imageUrl.includes('.mp4')) {
                fileExt = 'mov';
                fileType = 'live_photo_motion';
              } else {
                fileExt = 'jpg';
                fileType = 'live_photo_static';
              }
            }
            
            const filename = `${parsedData.content_id}_${timestamp}_${String(i + 1).padStart(3, '0')}.${fileExt}`;
            const filePath = path.join(fullDirPath, filename);
            const relativePath = path.join(baseDir, filename);
            
            console.log(`⬇️  下载文件 ${i + 1}/${parsedData.all_images.length}: ${filename}`);
            console.log(`   URL: ${imageUrl}`);
            console.log(`   类型: ${fileType}`);
            
            // 下载文件
            await this.downloadSingleFile(imageUrl, filePath);
            
            downloadedFiles.push({
              originalUrl: imageUrl,
              filePath: relativePath,
              isLivePhoto: isLive,
              fileType: fileType,
              index: i
            });
            
            // 设置主图片
            if (mainImagePath === null && !isLive) {
              mainImagePath = relativePath;
            }
            
          } catch (error) {
            console.error(`❌ 下载文件 ${i + 1} 失败:`, error.message);
          }
        }
      }
      
      // 如果没有主图片，使用第一个文件
      if (mainImagePath === null && downloadedFiles.length > 0) {
        mainImagePath = downloadedFiles[0].filePath;
      }
      
      console.log(`✅ 批量下载完成，成功下载 ${downloadedFiles.length} 个文件`);
      
      return {
        mainImagePath: mainImagePath,
        downloadedFiles: downloadedFiles,
        totalFiles: downloadedFiles.length
      };
      
    } catch (error) {
      console.error('❌ 批量下载失败:', error);
      throw error;
    }
  }
  
  /**
   * 下载单个文件
   */
  async downloadSingleFile(url, filePath) {
    const headers = {
      'User-Agent': this.getRandomUserAgent(),
      'Referer': 'https://www.xiaohongshu.com/',
      'Accept': 'image/webp,image/apng,image/svg+xml,image/*,video/*,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Connection': 'keep-alive'
    };
    
    const response = await axios.get(url, {
      responseType: 'stream',
      headers: headers,
      timeout: 30000,
      maxRedirects: 5
    });
    
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
      response.data.on('error', reject);
    });
  }
  
  /**
   * 清理文件名
   */
  cleanFilename(filename) {
    return filename.replace(/[^a-zA-Z0-9\u4e00-\u9fa5_.-]/g, '_').slice(0, 100);
  }
}

module.exports = EnhancedXiaohongshuParser;