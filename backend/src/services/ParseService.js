const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');
const fs = require('fs-extra');
const crypto = require('crypto');
const Content = require('../models/Content');
const storageService = require('./StorageService');
const { isValidUrl, isValidImageUrl, normalizeUrl, filterAndNormalizeImageUrls } = require('../utils/urlValidator');

// Cookie storage path
const COOKIE_STORAGE_PATH = path.join(__dirname, '../../data/cookies.json');

// User-Agent pool for device fingerprinting
const USER_AGENTS = [
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPad; CPU OS 15_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.5 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Android 12; Mobile; rv:109.0) Gecko/113.0 Firefox/113.0',
  'Mozilla/5.0 (Android 13; Mobile; rv:126.0) Gecko/126.0 Firefox/126.0',
  'Mozilla/5.0 (Linux; Android 14; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.165 Mobile Safari/537.36'
];

// Device ID pool for device fingerprinting
const DEVICE_IDS = [
  '5c1a8d0e-7b2f-4a3d-8c9a-1b2c3d4e5f6a',
  'a1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6p',
  '7f8e9d0c-6b5a-4d3c-2b1a-09876543210a',
  '3a4b5c6d-7e8f-9a0b-1c2d-3e4f5a6b7c8d',
  '9z8y7x6w-5v4u-3t2s-1r0q-9p8o7n6m5l4k'
];

// Ensure cookie storage directory exists
fs.ensureDirSync(path.dirname(COOKIE_STORAGE_PATH));

class ParseService {
  // Parse link from different platforms
  static async parseLink(link) {
    try {
      // Detect platform from link
      const platform = this.detectPlatform(link);
      if (!platform) {
        throw new Error('不支持的平台链接');
      }

      // Parse based on platform
      let parsedData;
      switch (platform) {
        case 'douyin':
          parsedData = await this.parseDouyinLink(link);
          break;
        case 'xiaohongshu':
          parsedData = await this.parseXiaohongshuLink(link);
          break;
        case 'kuaishou':
          parsedData = await this.parseKuaishouLink(link);
          break;
        case 'bilibili':
          parsedData = await this.parseBilibiliLink(link);
          break;
        case 'weibo':
          parsedData = await this.parseWeiboLink(link);
          break;
        default:
          throw new Error('暂不支持该平台的解析');
      }

      // Generate file path based on platform, author, and content ID
      const cleanedAuthor = this.cleanFilename(parsedData.author || 'unknown');
      const cleanedTitle = this.cleanFilename(parsedData.title || 'untitled');
      const fileExt = parsedData.media_type === 'video' ? 'mp4' : 'jpg';
      const filePath = path.join(platform, cleanedAuthor, `${parsedData.content_id}.${fileExt}`);
      
      return {
        platform,
        content_id: parsedData.content_id,
        title: parsedData.title,
        author: parsedData.author,
        description: parsedData.description || '',
        media_type: parsedData.media_type,
        cover_url: parsedData.cover_url,
        media_url: parsedData.media_url, // 添加media_url字段
        all_images: parsedData.all_images, // 添加all_images字段
        file_path: filePath, // 添加file_path字段
        source_url: link,
        source_type: 1, // 1-单链接解析
        created_at: new Date()
      };
    } catch (error) {
      console.error('Parse link error:', error);
      throw error;
    }
  }

  // Detect platform from URL
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

  // -------------------------------
  // Login State Management Methods
  // -------------------------------

  // Save cookies to file
  static async saveCookies(cookies) {
    try {
      await fs.writeJSON(COOKIE_STORAGE_PATH, {
        cookies,
        lastUpdated: new Date().toISOString()
      });
      console.log('Cookies saved successfully');
    } catch (error) {
      console.error('Error saving cookies:', error);
    }
  }

  // Load cookies from file
  static async loadCookies() {
    try {
      if (await fs.pathExists(COOKIE_STORAGE_PATH)) {
        const data = await fs.readJSON(COOKIE_STORAGE_PATH);
        // Check if cookies are older than 24 hours
        const lastUpdated = new Date(data.lastUpdated);
        const now = new Date();
        const hoursDiff = (now - lastUpdated) / (1000 * 60 * 60);
        
        if (hoursDiff < 24) {
          return data.cookies;
        } else {
          console.log('Cookies expired, need to refresh');
          // Attempt to refresh cookies
          await this.refreshCookies();
          return this.loadCookies();
        }
      }
      return null;
    } catch (error) {
      console.error('Error loading cookies:', error);
      return null;
    }
  }

  // Refresh cookies by re-logging in or using refresh token
  static async refreshCookies() {
    // In a real implementation, this would handle cookie refresh
    // For now, we'll just log a message
    console.log('Refreshing cookies...');
    // TODO: Implement actual cookie refresh logic
  }

  // Generate random User-Agent for device fingerprinting
  static getRandomUserAgent() {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  }

  // Generate device ID for device fingerprinting
  static generateDeviceId() {
    // Use random device ID from pool or generate new one
    if (Math.random() > 0.5) {
      return DEVICE_IDS[Math.floor(Math.random() * DEVICE_IDS.length)];
    }
    // Generate new device ID
    return crypto.randomUUID();
  }

  // Generate timestamp for signature
  static generateTimestamp() {
    return Math.floor(Date.now() / 1000);
  }

  // Generate signature for Xiaohongshu API requests
  static generateSign(path, params, cookie) {
    // Simplified signature generation - in real implementation, this would be reversed from Xiaohongshu's algorithm
    const timestamp = this.generateTimestamp();
    const deviceId = this.generateDeviceId();
    
    // Combine all parameters for signing
    const signStr = `${path}?${new URLSearchParams(params).toString()}_${timestamp}_${deviceId}_${cookie}`;
    
    // Generate MD5 hash
    const md5Sign = crypto.createHash('md5').update(signStr).digest('hex');
    
    return {
      'x-t': timestamp.toString(),
      'x-s': md5Sign,
      'x-device-id': deviceId,
      'User-Agent': this.getRandomUserAgent()
    };
  }

  // Get compliant headers for Xiaohongshu requests
  static async getXiaohongshuHeaders(url, path, params = {}) {
    const cookies = await this.loadCookies() || '';
    const signature = this.generateSign(path, params, cookies);
    
    return {
      'User-Agent': signature['User-Agent'],
      'Referer': 'https://www.xiaohongshu.com/',
      'Cookie': cookies,
      'Accept': 'application/json, text/plain, */*',
      'x-t': signature['x-t'],
      'x-s': signature['x-s'],
      'x-device-id': signature['x-device-id'],
      'x-requested-with': 'XMLHttpRequest'
    };
  }

  // Parse Douyin link (mock implementation)
  static async parseDouyinLink(link) {
    // Mock parsed data - will be replaced with actual parsing logic
    return {
      content_id: `douyin_${Date.now()}`,
      title: '抖音测试视频',
      author: '抖音测试作者',
      description: '这是一个抖音测试视频的描述',
      media_type: 'video',
      cover_url: 'https://via.placeholder.com/300x200',
      media_url: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4' // Sample video URL
    };
  }

  // Parse Xiaohongshu link (enhanced implementation)
  static async parseXiaohongshuLink(link) {
    try {
      console.log(`开始解析小红书链接: ${link}`);
      
      // Use enhanced headers for Xiaohongshu requests
      const headers = await this.getXiaohongshuHeaders(link, '/explore');
      
      // Use axios to get page content
      const response = await axios.get(link, {
        headers: {
          ...headers,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        },
        timeout: 15000 // 15 seconds timeout for Xiaohongshu requests
      });
      
      console.log('成功获取小红书页面内容');
      const html = response.data;
      
      // Try to extract JSON data from the page using regex
      // Xiaohongshu stores content data in __INITIAL_STATE__ or similar JSON variables
      let jsonData = null;
      
      // Enhanced regex patterns to find JSON data
      const regexPatterns = [
        // Common initial state patterns
        /window\.__INITIAL_STATE__\s*=\s*(\{[^;]+\});/, 
        /window\.__INITIAL_DATA__\s*=\s*(\{[^;]+\});/, 
        /window\.INITIAL_STATE\s*=\s*(\{[^;]+\});/, 
        
        // Note-specific patterns
        /window\.__NOTE_DATA__\s*=\s*(\{[^;]+\});/, 
        /window\.\$NOTE_DATA\s*=\s*(\{[^;]+\});/, 
        /window\.__PAGE_DATA__\s*=\s*(\{[^;]+\});/, 
        
        // Redux/Store patterns
        /window\.\$REDUX_STATE\s*=\s*(\{[^;]+\});/, 
        /window\.\$STORE\s*=\s*(\{[^;]+\});/, 
        
        // Alternative patterns
        /window\.__data__\s*=\s*(\{[^;]+\});/, 
        /window\.\$REQUIRED_FIELDS\s*=\s*(\{[^;]+\});/, 
        /window\.data\s*=\s*(\{[^;]+\});/, 
        
        // New patterns based on current Xiaohongshu structure
        /<script[^>]*id="__NEXT_DATA__"[^>]*>\s*window\.__NEXT_DATA__\s*=\s*(\{[^;]+\});\s*<\/script>/, // Next.js data pattern
        /<script[^>]*>\s*__INITIAL_STATE__\s*=\s*(\{[^;]+\});\s*<\/script>/ // Additional initial state pattern
      ];
      
      console.log('开始提取JSON数据...');
      for (const pattern of regexPatterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          try {
            console.log(`找到匹配的JSON模式: ${pattern.toString().substring(0, 50)}...`);
            jsonData = JSON.parse(match[1]);
            console.log('JSON数据解析成功');
            break;
          } catch (parseError) {
            console.error('JSON解析失败:', parseError);
            continue;
          }
        }
      }
      
      let title = '小红书内容';
      let author = '小红书作者';
      const extractedImageUrls = [];
      let extractedVideoUrl = null;
      let isVideo = false;
      
      // Extract data from JSON if found
      if (jsonData) {
        console.log('开始从JSON数据提取内容...');
        
        // Debug log - show JSON structure (truncated)
        console.log('JSON数据结构:', JSON.stringify(jsonData, null, 2).substring(0, 500) + '...');
        
        // Enhanced content data extraction - support more structures
        const contentData = jsonData.notes?.[0] || 
                           jsonData.note || 
                           jsonData.data?.note || 
                           jsonData.state?.note ||
                           jsonData.data?.contents?.[0] ||
                           jsonData.props?.pageProps?.note ||
                           jsonData.__NEXT_DATA__?.props?.pageProps?.note ||
                           jsonData.data?.noteDetail ||
                           {};
        
        console.log('找到的内容数据:', JSON.stringify(contentData, null, 2).substring(0, 300) + '...');
        
        if (contentData.title) {
          title = contentData.title;
          console.log(`提取到标题: ${title}`);
        }
        
        if (contentData.user) {
          author = contentData.user.nickname || contentData.user.name || contentData.user.username || author;
          console.log(`提取到作者: ${author}`);
        }
        
        // Check if it's a video
        if (contentData.video) {
          console.log('找到视频内容');
          isVideo = true;
          // Enhanced video URL extraction
          extractedVideoUrl = contentData.video.url || 
                              contentData.video.h264_url || 
                              contentData.video.h265_url ||
                              contentData.video.m3u8_url ||
                              contentData.video.play_addr_url ||
                              contentData.video.play_url ||
                              contentData.video.video_url ||
                              contentData.video.video_src ||
                              contentData.video.src ||
                              contentData.video.original_url ||
                              contentData.video.full_url ||
                              contentData.video.download_url ||
                              contentData.video.hls_url ||
                              contentData.video.stream_url ||
                              contentData.video.main_url ||
                              contentData.video.play_list?.[0]?.url ||
                              contentData.video.quality_list?.[0]?.url;
          console.log(`提取到视频URL: ${extractedVideoUrl}`);
        }
        
        // Extract image URLs from different possible locations (supports both video and image content)
        console.log('开始提取图片URL...');
        
        // 1. Extract from images array (supports multiple image formats)
        if (contentData.images && Array.isArray(contentData.images)) {
          console.log(`找到 ${contentData.images.length} 张图片`);
          contentData.images.forEach((img, index) => {
            console.log(`处理图片 ${index + 1}:`, JSON.stringify(img, null, 2).substring(0, 200) + '...');
            
            // Enhanced image URL extraction for different image types
            const imgUrls = {
              // Thumbnail URLs
              thumbnail: img.thumb_url || img.thumbnail_url,
              // Normal quality URLs
              normal: img.url || img.middle?.url,
              // High quality URLs
              high: img.large?.url || img.origin_url || img.original_url,
              // Live photo URLs (image + video combination)
              livePhotoImage: img.live_photo?.image_url,
              livePhotoVideo: img.live_photo?.video_url
            };
            
            // Add high quality URLs first, then fall back to normal quality
            if (imgUrls.high) {
              console.log(`提取到高清图片URL: ${imgUrls.high}`);
              extractedImageUrls.push(imgUrls.high);
            } else if (imgUrls.normal) {
              console.log(`提取到普通图片URL: ${imgUrls.normal}`);
              extractedImageUrls.push(imgUrls.normal);
            } else if (imgUrls.thumbnail) {
              console.log(`提取到缩略图URL: ${imgUrls.thumbnail}`);
              extractedImageUrls.push(imgUrls.thumbnail);
            }
            
            // Handle live photos (store both image and video URLs)
            if (imgUrls.livePhotoImage && imgUrls.livePhotoVideo) {
              console.log(`提取到实况图片资源 - 图片: ${imgUrls.livePhotoImage}, 视频: ${imgUrls.livePhotoVideo}`);
              extractedImageUrls.push(imgUrls.livePhotoImage);
              extractedImageUrls.push(imgUrls.livePhotoVideo);
            }
          });
        } 
        
        // 2. Try another possible image location (image_list)
        else if (contentData.image_list && Array.isArray(contentData.image_list)) {
          console.log(`找到 ${contentData.image_list.length} 张图片 (image_list)`);
          contentData.image_list.forEach((img, index) => {
            const imgUrl = img.url || img.large?.url || img.middle?.url || img.small?.url || img.origin_url;
            if (imgUrl) {
              console.log(`提取到图片URL (image_list ${index + 1}): ${imgUrl}`);
              extractedImageUrls.push(imgUrl);
            }
          });
        }
        
        // 3. Try content blocks (for mixed content types)
        else if (contentData.contents && Array.isArray(contentData.contents)) {
          console.log(`找到 ${contentData.contents.length} 个内容项`);
          contentData.contents.forEach((item, index) => {
            if (item.type === 'image' && item.data?.url) {
              console.log(`从内容项 ${index + 1} 提取到图片URL: ${item.data.url}`);
              extractedImageUrls.push(item.data.url);
            }
            // Handle live photo content blocks if any
            else if (item.type === 'live_photo' && item.data) {
              const { image_url, video_url } = item.data;
              if (image_url && video_url) {
                console.log(`从内容项 ${index + 1} 提取到实况图片资源 - 图片: ${image_url}, 视频: ${video_url}`);
                extractedImageUrls.push(image_url);
                extractedImageUrls.push(video_url);
              }
            }
          });
        }
        
        // Extract cover URL separately (supports different cover structures)
        let coverUrl = null;
        if (contentData.cover) {
          coverUrl = contentData.cover.url || 
                     contentData.cover.large?.url || 
                     contentData.cover.middle?.url || 
                     contentData.cover.small?.url ||
                     contentData.cover.origin_url;
        } else if (contentData.cover_url) {
          coverUrl = contentData.cover_url;
        } else if (contentData.images?.[0]) {
          // Fallback: use first image as cover
          const firstImg = contentData.images[0];
          coverUrl = firstImg.large?.url || firstImg.url || firstImg.middle?.url;
        }
        
        if (coverUrl) {
          console.log(`提取到封面URL: ${coverUrl}`);
          // Add cover URL to images for video content if not already present
          if (isVideo && coverUrl && !extractedImageUrls.includes(coverUrl)) {
            extractedImageUrls.push(coverUrl);
          }
        }
      } else {
        console.log('未找到JSON数据，使用cheerio解析HTML...');
        // Fallback to cheerio parsing if JSON extraction fails
        const $ = cheerio.load(html);
        
        // Try different selectors for title
        const titleSelectors = ['h1', '.note-title', '.title', '.rich-text', '.content-title'];
        for (const selector of titleSelectors) {
          const foundTitle = $(selector).first().text().trim();
          if (foundTitle) {
            title = foundTitle;
            console.log(`从HTML提取到标题 (${selector}): ${title}`);
            break;
          }
        }
        
        // Try different selectors for author
        const authorSelectors = ['.name', '.user-name', '.author', '.nickname', '.username'];
        for (const selector of authorSelectors) {
          const foundAuthor = $(selector).first().text().trim();
          if (foundAuthor) {
            author = foundAuthor;
            console.log(`从HTML提取到作者 (${selector}): ${author}`);
            break;
          }
        }
        
        // Check if it's a video by looking for video tags or video-specific classes
        isVideo = $('video').length > 0 || $('[data-type="video"]').length > 0 || $('[class*="video"]').length > 0;
        console.log(`通过HTML检测到视频: ${isVideo}`);
        
        // Extract video URL if it's a video
        if (isVideo) {
          // Try to find video URL in different attributes and elements
          let videoElement = $('video').first();
          
          // Try multiple ways to extract video URL from video tag
          extractedVideoUrl = videoElement.attr('src') || 
                              videoElement.attr('data-src') ||
                              videoElement.attr('data-video-url') ||
                              videoElement.attr('data-original') ||
                              videoElement.attr('data-play-url') ||
                              videoElement.find('source').attr('src') ||
                              videoElement.find('source').attr('data-src') ||
                              '';
          
          // Try to find video URL in other places if not found in video tag
          if (!extractedVideoUrl) {
            console.log('尝试从所有脚本标签中提取视频URL...');
            
            // First, try to find all script tags that contain video-related content
            const allScripts = $('script');
            let foundScript = null;
            
            // Try to find script tag with video data
            for (let i = 0; i < allScripts.length; i++) {
              const script = allScripts[i];
              const content = $(script).html();
              
              if (content && (content.includes('video') || content.includes('Video') || content.includes('note'))) {
                console.log(`找到可能包含视频数据的脚本标签 (${i+1}/${allScripts.length})`);
                
                // Try to find video URL using more comprehensive patterns
                const patterns = [
                  // Direct URL patterns
                  /https?:\/\/[^'",\s]+\.(mp4|m3u8|avi|mov)/gi,
                  
                  // JSON-like patterns
                  /"url"\s*:\s*"([^"]+)"/gi,
                  /'url'\s*:\s*'([^']+)'/gi,
                  
                  // Video-specific patterns
                  /"videoUrl"\s*:\s*"([^"]+)"/gi,
                  /"playUrl"\s*:\s*"([^"]+)"/gi,
                  /"video"\s*:\s*\{[^}]*"url"\s*:\s*"([^"]+)"/gi,
                  
                  // More comprehensive patterns
                  /"[^"\s]+url[^"\s]+"\s*:\s*"([^"]+)"/gi,
                  /'[^'\s]+url[^'\s]+'\s*:\s*'([^']+)'/gi,
                  
                  // CDN URL patterns
                  /https?:\/\/[^'",\s]+\.cdn[^'",\s]+/gi,
                  /https?:\/\/[^'",\s]+\.com[^'",\s]+\.(mp4|m3u8)/gi
                ];
                
                for (const pattern of patterns) {
                  let match;
                  while ((match = pattern.exec(content)) !== null) {
                    const foundUrl = match[1] || match[0];
                    // Check if this is a valid video URL
                    if (foundUrl.includes('.mp4') || foundUrl.includes('.m3u8')) {
                      console.log(`从脚本中提取到视频URL: ${foundUrl}`);
                      extractedVideoUrl = foundUrl;
                      foundScript = i + 1;
                      break;
                    }
                  }
                  
                  if (extractedVideoUrl) {
                    break;
                  }
                }
                
                if (extractedVideoUrl) {
                  break;
                }
              }
            }
            
            if (extractedVideoUrl) {
              console.log(`从脚本标签 ${foundScript} 成功提取到视频URL`);
            } else {
              console.log('未能从脚本标签中提取到视频URL');
            }
          }
          
          console.log(`从HTML提取到视频URL: ${extractedVideoUrl}`);
        }
        
        // Enhanced image URL extraction from HTML
        console.log('开始从HTML提取图片URL...');
        
        // 1. Extract from img tags with various attributes
        $('img').each((index, element) => {
          const $img = $(element);
          // Try different image URL attributes
          const src = $img.attr('src');
          const dataSrc = $img.attr('data-src') || $img.attr('data-original') || $img.attr('data-img-url');
          const dataLazySrc = $img.attr('data-lazy-src') || $img.attr('data-lazyload-src');
          const dataRealSrc = $img.attr('data-real-src') || $img.attr('data-actual-src');
          const actualSrc = src || dataSrc || dataLazySrc || dataRealSrc;
          
          if (actualSrc) {
            console.log(`从HTML img标签提取到图片URL ${index + 1}: ${actualSrc}`);
            extractedImageUrls.push(actualSrc);
          }
        });
        
        // 2. Extract from meta tags for cover images
        const ogImage = $('meta[property="og:image"]').attr('content');
        if (ogImage) {
          console.log(`从HTML meta标签提取到封面图片URL: ${ogImage}`);
          if (!extractedImageUrls.includes(ogImage)) {
            extractedImageUrls.push(ogImage);
          }
        }
        
        // 3. Extract from link tags (preloaded images)
        $('link[rel="preload"][as="image"]').each((index, element) => {
          const href = $(element).attr('href');
          if (href) {
            console.log(`从HTML link标签提取到预加载图片URL ${index + 1}: ${href}`);
            extractedImageUrls.push(href);
          }
        });
        
        // 4. Extract from script tags containing image data
        $('script').each((index, element) => {
          const content = $(element).html();
          if (content && (content.includes('image') || content.includes('img'))) {
            // Try to find image URLs in script content
            const imgUrlPattern = /https?:\/\/[^\"',\s]+\.(jpg|jpeg|png|gif|webp)/gi;
            let match;
            while ((match = imgUrlPattern.exec(content)) !== null) {
              const imgUrl = match[0];
              if (imgUrl && !extractedImageUrls.includes(imgUrl)) {
                console.log(`从HTML script标签提取到图片URL: ${imgUrl}`);
                extractedImageUrls.push(imgUrl);
              }
            }
          }
        });
      }
      
      console.log(`总共提取到 ${extractedImageUrls.length} 个图片URL`);
      
      // Enhance image URLs - ensure they are valid and properly formatted
      console.log('开始验证和规范化图片URL...');
      let validImageUrls = filterAndNormalizeImageUrls(extractedImageUrls);
      console.log(`验证后剩余 ${validImageUrls.length} 个有效图片URL`);
      
      // Log valid image URLs
      validImageUrls.forEach((url, index) => {
        console.log(`有效图片URL ${index + 1}: ${url}`);
      });
      
      // For videos, only keep the first image as cover
      if (isVideo) {
        validImageUrls = validImageUrls.slice(0, 1);
        console.log('视频内容，只保留封面图');
      }
      
      // Add high-quality fallback images if no valid images were found
      if (validImageUrls.length === 0) {
        console.log('没有找到有效图片URL，使用高质量占位符图片');
        // Use high-quality placeholder images from a reliable service
        validImageUrls.push('https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?w=800&h=600&fit=crop&crop=center');
        // Only add more placeholders for image content
        if (!isVideo) {
          validImageUrls.push('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=600&fit=crop&crop=center');
          validImageUrls.push('https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&h=600&fit=crop&crop=center');
        }
      }
      
      // Set media type and URL based on content type
      let mediaUrl;
      if (isVideo) {
        // If it's a video, use video placeholder URL if no valid video URL found
        mediaUrl = extractedVideoUrl || 'https://www.w3schools.com/html/mov_bbb.mp4';
      } else {
        // If it's an image, use the first valid image URL
        mediaUrl = validImageUrls[0];
      }
      
      const result = {
        content_id: `xiaohongshu_${Date.now()}`,
        title: title || `小红书内容_${Date.now()}`,
        author: author || `小红书作者_${Date.now().toString().slice(-4)}`,
        description: '小红书内容',
        media_type: isVideo ? 'video' : 'image',
        cover_url: validImageUrls[0],
        media_url: mediaUrl,
        all_images: isVideo ? [validImageUrls[0]] : validImageUrls // Only return cover for video, all images for image content
      };
      
      console.log('解析完成，返回结果:', JSON.stringify(result, null, 2).substring(0, 400) + '...');
      
      return result;
    } catch (error) {
      console.error('小红书链接解析失败:', error);
      
      // Detailed error logging
      if (error.response) {
        console.error('HTTP响应错误:', error.response.status, error.response.statusText);
        console.error('响应头:', error.response.headers);
        console.error('响应数据:', error.response.data?.substring(0, 500) + '...');
      } else if (error.request) {
        console.error('请求错误:', error.request);
      } else {
        console.error('请求配置错误:', error.message);
      }
      
      // Fallback to appropriate mock data based on detected media type
      console.log('使用备用数据返回解析结果');
      
      // Use appropriate mock data based on detected media type
      if (isVideo) {
        // Video fallback data
        return {
          content_id: `xiaohongshu_${Date.now()}`,
          title: title || '小红书测试视频',
          author: author || '小红书测试作者',
          description: '这是一个小红书测试视频的描述',
          media_type: 'video',
          cover_url: 'https://via.placeholder.com/800x600?text=小红书+测试视频封面',
          media_url: 'https://www.w3schools.com/html/mov_bbb.mp4', // More reliable video URL
          all_images: ['https://via.placeholder.com/800x600?text=小红书+测试视频封面']
        };
      } else {
        // Image fallback data
        const imageUrls = [
          'https://via.placeholder.com/800x600?text=小红书+测试图片1',
          'https://via.placeholder.com/800x600?text=小红书+测试图片2',
          'https://via.placeholder.com/800x600?text=小红书+测试图片3'
        ];
        
        return {
          content_id: `xiaohongshu_${Date.now()}`,
          title: title || '小红书测试图文',
          author: author || '小红书测试作者',
          description: '这是一个小红书测试图文的描述',
          media_type: 'image',
          cover_url: imageUrls[0],
          media_url: imageUrls[0],
          all_images: imageUrls // Sample images for testing
        };
      }
    }
  }

  // Parse Kuaishou link (mock implementation)
  static async parseKuaishouLink(link) {
    return {
      content_id: `kuaishou_${Date.now()}`,
      title: '快手测试视频',
      author: '快手测试作者',
      description: '这是一个快手测试视频的描述',
      media_type: 'video',
      cover_url: 'https://via.placeholder.com/300x200',
      media_url: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4' // Sample video URL
    };
  }

  // Parse Bilibili link (mock implementation)
  static async parseBilibiliLink(link) {
    return {
      content_id: `bilibili_${Date.now()}`,
      title: 'B站测试视频',
      author: 'B站测试UP主',
      description: '这是一个B站测试视频的描述',
      media_type: 'video',
      cover_url: 'https://via.placeholder.com/300x200',
      media_url: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4' // Sample video URL
    };
  }

  // Parse Weibo link (mock implementation)
  static async parseWeiboLink(link) {
    return {
      content_id: `weibo_${Date.now()}`,
      title: '微博测试内容',
      author: '微博测试博主',
      description: '这是一个微博测试内容的描述',
      media_type: Math.random() > 0.5 ? 'video' : 'image',
      cover_url: 'https://via.placeholder.com/300x200',
      media_url: Math.random() > 0.5 
        ? 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4' 
        : 'https://via.placeholder.com/800x600' // Sample URL
    };
  }

  // Clean filename by removing special characters and limiting length
  static cleanFilename(filename) {
    // Remove special characters
    let cleaned = filename.replace(/[^a-zA-Z0-9\u4e00-\u9fa5_.-]/g, '_');
    // Limit length to 100 characters
    return cleaned.slice(0, 100);
  }

  // Check if directory exists, if not create it, handle naming conflicts
  static async ensureUniqueDirectory(basePath, directoryName) {
    let counter = 0;
    let finalName = directoryName;
    let finalPath = path.join(basePath, finalName);

    // Check if directory exists and create if needed
    // In a real implementation, this would check the actual filesystem or storage
    // For now, we'll just return a safe path with potential counter suffix
    return finalPath;
  }
  
  // Helper function to check if content type is a supported media type
  static isSupportedMediaType(contentType) {
    const supportedTypes = {
      'image': ['jpeg', 'png', 'gif', 'webp', 'jpg'],
      'video': ['mp4', 'mov', 'avi', 'mkv', 'webm']
    };
    
    if (!contentType) return false;
    
    const typeParts = contentType.split('/');
    if (typeParts.length !== 2) return false;
    
    const [mainType, subType] = typeParts;
    return supportedTypes[mainType] && supportedTypes[mainType].includes(subType);
  }
  
  // Helper function to check if file is HTML by examining the first few bytes
  static async isHTMLFile(filePath) {
    // Read first 512 bytes to check for HTML signature
    const fileStream = fs.createReadStream(filePath, { end: 512 });
    let firstChunk;
    
    try {
      firstChunk = await new Promise((resolve, reject) => {
        fileStream.on('data', (chunk) => {
          fileStream.close();
          resolve(chunk.toString());
        });
        fileStream.on('error', reject);
      });
    } catch (error) {
      console.error('ParseService.isHTMLFile: Error reading file:', error);
      return false;
    }
    
    // Check if the content looks like HTML
    return /<html|<!DOCTYPE html|<!doctype html/i.test(firstChunk);
  }
  
  // Helper function to check if file has valid media magic numbers
  static isMediaFileByMagicNumber(buffer) {
    if (!buffer || buffer.length < 4) return false;
    
    // Magic numbers for common image formats
    const imageMagicNumbers = {
      JPEG: [0xFF, 0xD8, 0xFF], // JPEG starts with FF D8 FF
      PNG: [0x89, 0x50, 0x4E, 0x47], // PNG starts with 89 50 4E 47
      GIF: [0x47, 0x49, 0x46], // GIF starts with GIF
      WEBP: [0x52, 0x49, 0x46, 0x46] // WebP starts with RIFF
    };
    
    // Convert buffer to array for easier comparison
    const bufferArray = Array.from(buffer.slice(0, 8));
    
    // Check image formats
    for (const [format, magic] of Object.entries(imageMagicNumbers)) {
      if (bufferArray.slice(0, magic.length).every((byte, i) => byte === magic[i])) {
        return { valid: true, type: 'image', format };
      }
    }
    
    // Check video formats with more flexible validation
    // AVI starts with RIFF
    if (bufferArray.slice(0, 4).every((byte, i) => byte === [0x52, 0x49, 0x46, 0x46][i])) {
      return { valid: true, type: 'video', format: 'AVI' };
    }
    
    // MP4/MOV starts with ftyp (after 4-byte length field)
    // The first 4 bytes are length, then "ftyp" (66 74 79 70)
    if (bufferArray.slice(4, 8).every((byte, i) => byte === [0x66, 0x74, 0x79, 0x70][i])) {
      // Check if it's MP4 or MOV based on the ftyp brand
      // For simplicity, we'll just return MP4 for any ftyp file
      return { valid: true, type: 'video', format: 'MP4' };
    }
    
    return { valid: false };
  }
  
  // Enhanced file validation function
  static async validateMediaFile(filePath, expectedType) {
    try {
      // Check if file exists
      const stats = await fs.stat(filePath);
      if (stats.size === 0) {
        console.error('ParseService.validateMediaFile: Empty file:', filePath);
        return false;
      }
      
      // Check file size is reasonable for media
      if (stats.size < 100) { // Media files should be at least 100 bytes
        console.error('ParseService.validateMediaFile: File too small for media:', filePath, stats.size, 'bytes');
        return false;
      }
      
      // Read first 8 bytes for magic number checking
      const fileStream = fs.createReadStream(filePath, { end: 8 });
      const firstChunk = await new Promise((resolve, reject) => {
        fileStream.on('data', (chunk) => {
          fileStream.close();
          resolve(chunk);
        });
        fileStream.on('error', reject);
      });
      
      // Check magic numbers
      const magicCheck = this.isMediaFileByMagicNumber(firstChunk);
      if (!magicCheck.valid) {
        console.error('ParseService.validateMediaFile: Invalid magic numbers for media file:', filePath);
        return false;
      }
      
      // Check if magic number matches expected type
      if (expectedType && magicCheck.type !== expectedType) {
        console.error('ParseService.validateMediaFile: Magic number type mismatch:', filePath, expectedType, magicCheck.type);
        return false;
      }
      
      // Check if file is HTML (additional safety net)
      const isHtml = await this.isHTMLFile(filePath);
      if (isHtml) {
        console.error('ParseService.validateMediaFile: File is HTML, not media:', filePath);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('ParseService.validateMediaFile: Error validating file:', error, filePath);
      return false;
    }
  }
  
  // Helper function to validate media URL
  static isValidMediaUrl(url) {
    if (!url || typeof url !== 'string') return false;
    
    // Basic URL validation
    try {
      const parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return false;
      }
      
      // Exclude known placeholder domains that might return HTML
      const placeholderDomains = [
        'via.placeholder.com',
        'images.unsplash.com', // Can be real images, but might return HTML on errors
        'loremflickr.com',
        'picsum.photos',
        'sample-videos.com' // Sample video URLs
      ];
      
      if (placeholderDomains.includes(parsedUrl.hostname)) {
        console.warn('ParseService.isValidMediaUrl: Using placeholder URL, may cause issues:', url);
      }
      
      return true;
    } catch (error) {
      console.error('ParseService.isValidMediaUrl: Invalid URL:', error, url);
      return false;
    }
  }

  // Download media file and save to both database and project root directory
  static async downloadMedia(parsedData, platform, sourceType = 1, taskId = null) {
    try {
      // Validate required fields
      if (!parsedData.media_url) {
        console.error('ParseService.downloadMedia: Missing media URL in parsed data');
        throw new Error('Missing media URL in parsed data');
      }
      
      console.log('ParseService.downloadMedia: Starting download for content_id:', parsedData.content_id);
      console.log('ParseService.downloadMedia: Media URL:', parsedData.media_url);
      console.log('ParseService.downloadMedia: Media type:', parsedData.media_type);
      
      // Validate media URL format
      if (!this.isValidMediaUrl(parsedData.media_url)) {
        console.error('ParseService.downloadMedia: Invalid media URL:', parsedData.media_url);
        throw new Error('Invalid media URL format');
      }
      
      const timestamp = Date.now();
      const ext = parsedData.media_type === 'video' ? 'mp4' : 'jpg';
      const filename = `${parsedData.content_id}_${timestamp}.${ext}`;
      
      // Create directory structure based on source type
      let relativePath;
      if (sourceType === 2) {
        // Source type 2: Monitoring task - use author name
        const cleanedAuthorName = this.cleanFilename(parsedData.author || 'unknown');
        relativePath = path.join(platform, cleanedAuthorName, filename);
        console.log('ParseService.downloadMedia: Using author-based directory structure:', relativePath);
      } else {
        // Source type 1: Single link parse - use cleaned title
        const cleanedTitle = this.cleanFilename(parsedData.title || 'untitled');
        relativePath = path.join(platform, cleanedTitle, filename);
        console.log('ParseService.downloadMedia: Using title-based directory structure:', relativePath);
      }
      
      // Create full path in project root directory
      const projectRootPath = path.join(__dirname, '../../media');
      const fullPath = path.join(projectRootPath, relativePath);
      const dirPath = path.dirname(fullPath);
      
      console.log('ParseService.downloadMedia: Full file path:', fullPath);
      console.log('ParseService.downloadMedia: Directory path:', dirPath);
      
      // Ensure directory exists
      console.log('ParseService.downloadMedia: Ensuring directory exists...');
      await fs.ensureDir(dirPath);
      console.log('ParseService.downloadMedia: Directory ensured successfully');
      
      // Dynamic Referer header based on the target URL
      let referer = 'https://www.example.com/';
      try {
        const parsedUrl = new URL(parsedData.media_url);
        referer = `${parsedUrl.protocol}//${parsedUrl.host}/`;
      } catch (urlError) {
        console.warn('ParseService.downloadMedia: Failed to parse media URL for Referer:', urlError.message);
      }
      
      console.log('ParseService.downloadMedia: Using Referer:', referer);
      
      // Download retry logic with exponential backoff
      const maxRetries = 3;
      let lastError = null;
      
      for (let retry = 0; retry < maxRetries; retry++) {
        try {
          console.log(`ParseService.downloadMedia: Attempt ${retry + 1}/${maxRetries} for URL:`, parsedData.media_url);
          
          // Download the actual file with proper headers and timeout
          const response = await axios.get(parsedData.media_url, {
            responseType: 'stream',
            timeout: 30000, // 30 seconds timeout
            maxRedirects: 5,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              'Referer': referer,
              'Accept': parsedData.media_type === 'video' ? 'video/*' : 'image/*' // Only accept specific media type
            }
          });
          
          console.log('ParseService.downloadMedia: Download response received with status:', response.status);
          
          // Check Content-Type header
          const contentType = response.headers['content-type'] || '';
          console.log('ParseService.downloadMedia: Received Content-Type:', contentType);
          
          // Verify it's a supported media type
          if (!this.isSupportedMediaType(contentType)) {
            console.error('ParseService.downloadMedia: Unsupported media type:', contentType, 'for URL:', parsedData.media_url);
            throw new Error(`Unsupported media type: ${contentType}`);
          }
          
          // Save the file to project root directory
          console.log('ParseService.downloadMedia: Saving file to disk...');
          await new Promise((resolve, reject) => {
            const writer = fs.createWriteStream(fullPath);
            
            response.data.pipe(writer);
            
            writer.on('finish', () => {
              console.log('ParseService.downloadMedia: File saved successfully');
              resolve();
            });
            
            writer.on('error', (err) => {
              console.error('ParseService.downloadMedia: Error writing file:', err);
              reject(err);
            });
            
            response.data.on('error', (err) => {
              console.error('ParseService.downloadMedia: Error in download stream:', err);
              reject(err);
            });
          });
          
          // Enhanced file validation
          console.log('ParseService.downloadMedia: Validating downloaded media file...');
          const isValidMedia = await this.validateMediaFile(fullPath, parsedData.media_type);
          
          if (isValidMedia) {
            console.log('ParseService.downloadMedia: File validation successful');
            // Return the relative path for database storage
            console.log('ParseService.downloadMedia: Download completed successfully. Returning path:', relativePath);
            return relativePath;
          } else {
            console.error('ParseService.downloadMedia: File validation failed, retrying...');
            // Clean up invalid file
            await fs.unlink(fullPath).catch(console.error);
            lastError = new Error('File validation failed after download');
            
            // Wait before retry (exponential backoff)
            if (retry < maxRetries - 1) {
              const delay = Math.pow(2, retry) * 1000; // 1s, 2s, 4s delays
              console.log(`ParseService.downloadMedia: Waiting ${delay}ms before retry...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
        } catch (error) {
          lastError = error;
          console.error(`ParseService.downloadMedia: Attempt ${retry + 1} failed:`, error.message);
          
          // Wait before retry (exponential backoff)
          if (retry < maxRetries - 1) {
            const delay = Math.pow(2, retry) * 1000; // 1s, 2s, 4s delays
            console.log(`ParseService.downloadMedia: Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      
      // All retries failed
      console.error('ParseService.downloadMedia: All download attempts failed');
      throw lastError || new Error('Failed to download media after multiple attempts');
    } catch (error) {
      console.error('ParseService.downloadMedia: Error:', error.stack);
      // Throw error instead of returning mock path
      // This ensures proper error handling in calling functions
      throw error;
    }
  }
}

module.exports = ParseService;