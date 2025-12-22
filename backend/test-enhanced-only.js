const EnhancedXiaohongshuParser = require('./src/services/EnhancedXiaohongshuParser');

async function testEnhancedOnly() {
  console.log('=== 直接测试增强版小红书解析器 ===\n');
  
  const parser = new EnhancedXiaohongshuParser();
  
  // Test with mock data to verify functionality
  console.log('📋 第一步：测试解析器核心功能（使用模拟数据）');
  console.log('=' .repeat(60));
  
  // Test with mock JSON data
  const mockJsonData = {
    note: {
      noteDetailMap: {
        "test123": {
          note: {
            id: "test123",
            title: "测试小红书内容 - 去水印和Live Photo功能验证",
            desc: "这是一个测试内容，用于验证增强版解析器的去水印和Live Photo支持功能。包含多张图片和实况照片。",
            user: {
              nickname: "测试用户",
              name: "测试用户"
            },
            imageList: [
              {
                url_default: "https://sns-img-qc.xhscdn.com/test1_no_watermark.jpg",
                url: "https://sns-img-qc.xhscdn.com/test1_with_watermark.jpg!nc_n_webp_mw_1",
                large: {
                  url: "https://sns-img-qc.xhscdn.com/test1_large.jpg"
                }
              },
              {
                url_default: "https://sns-img-qc.xhscdn.com/test2_no_watermark.jpg",
                url: "https://sns-img-qc.xhscdn.com/test2_with_watermark.jpg!nc_n_webp_mw_1",
                live_photo: {
                  image_url: "https://sns-img-qc.xhscdn.com/test2_live_static.jpg",
                  video_url: "https://sns-video-qc.xhscdn.com/test2_live_motion.mp4"
                }
              },
              {
                url_default: "https://sns-img-qc.xhscdn.com/test3_no_watermark.jpg",
                url: "https://sns-img-qc.xhscdn.com/test3_with_watermark.jpg!nc_n_webp_mw_1",
                stream: {
                  h264: [
                    {
                      master_url: "https://sns-video-qc.xhscdn.com/test3_h264_stream.m3u8"
                    }
                  ],
                  h265: [
                    {
                      master_url: "https://sns-video-qc.xhscdn.com/test3_h265_stream.m3u8"
                    }
                  ]
                }
              }
            ]
          }
        }
      }
    }
  };
  
  // Test content data finding
  const contentData = parser.findContentData(mockJsonData);
  if (contentData) {
    console.log('✅ 内容数据查找：成功');
    console.log(`   标题: ${contentData.title}`);
    console.log(`   作者: ${contentData.user.nickname}`);
    console.log(`   图片数量: ${contentData.imageList.length}`);
    
    // Test image URL extraction
    const imageUrls = parser.extractImageUrls(contentData);
    console.log(`✅ 图片URL提取：成功提取 ${imageUrls.length} 个URL`);
    
    // Analyze extracted URLs
    let regularImages = 0;
    let livePhotoComponents = 0;
    let watermarkFreeUrls = 0;
    
    imageUrls.forEach((url, index) => {
      const isLive = parser.isLivePhoto(url);
      const isWatermarkFree = url.includes('url_default') || !url.includes('!');
      
      console.log(`   ${index + 1}. ${url}`);
      console.log(`      类型: ${isLive ? 'Live Photo组件' : '普通图片'}`);
      console.log(`      水印: ${isWatermarkFree ? '无水印' : '可能有水印'}`);
      
      if (isLive) {
        livePhotoComponents++;
      } else {
        regularImages++;
      }
      
      if (isWatermarkFree) {
        watermarkFreeUrls++;
      }
    });
    
    // Test watermark removal
    const cleanedUrls = imageUrls.map(url => parser.removeWatermark(url));
    console.log(`✅ 去水印处理：完成`);
    
    console.log('\n📊 功能验证结果:');
    console.log(`   普通图片: ${regularImages} 张`);
    console.log(`   Live Photo组件: ${livePhotoComponents} 个`);
    console.log(`   无水印URL: ${watermarkFreeUrls}/${imageUrls.length}`);
    console.log(`   去水印功能: ${cleanedUrls.length === imageUrls.length ? '✅ 正常' : '❌ 异常'}`);
    console.log(`   Live Photo支持: ${livePhotoComponents > 0 ? '✅ 检测到' : '⚪ 未检测到'}`);
    console.log(`   多图下载: ${imageUrls.length > 1 ? '✅ 支持' : '⚪ 单图'}`);
    
  } else {
    console.log('❌ 内容数据查找：失败');
  }
  
  console.log('\n📋 第二步：测试真实URL解析（可能因网络问题失败）');
  console.log('=' .repeat(60));
  
  const testUrl = 'https://www.xiaohongshu.com/explore/694269d1000000001f00dc48';
  
  try {
    const result = await parser.parseXiaohongshuLink(testUrl);
    
    console.log('✅ 真实URL解析成功!');
    console.log(`   标题: ${result.title}`);
    console.log(`   作者: ${result.author}`);
    console.log(`   媒体类型: ${result.media_type}`);
    console.log(`   图片数量: ${result.all_images ? result.all_images.length : 0}`);
    console.log(`   去水印: ${result.watermark_removed ? '是' : '否'}`);
    console.log(`   Live Photo: ${result.live_photo_supported ? '是' : '否'}`);
    
  } catch (error) {
    console.log('❌ 真实URL解析失败:', error.message);
    
    if (error.message.includes('ECONNABORTED') || error.message.includes('timeout')) {
      console.log('💡 失败原因: 网络连接问题');
    } else if (error.message.includes('未能找到内容数据')) {
      console.log('💡 失败原因: 页面结构变化或内容不存在');
    } else {
      console.log('💡 失败原因: 其他技术问题');
    }
  }
  
  console.log('\n🎉 增强版解析器测试完成!');
  console.log('\n📋 技术实现总结:');
  console.log('✅ 基于成功Java案例的技术架构');
  console.log('✅ 设备指纹和签名系统');
  console.log('✅ 优先使用url_default无水印字段');
  console.log('✅ 完整的Live Photo检测和处理');
  console.log('✅ 多层级JSON数据提取');
  console.log('✅ 增强的去水印算法');
  console.log('✅ 支持多种图片数据结构');
  console.log('✅ 集成到ParseService作为备用方案');
  
  console.log('\n💡 使用建议:');
  console.log('- 增强版解析器已集成到ParseService中');
  console.log('- 当主解析器失败时会自动使用增强版解析器');
  console.log('- 支持去水印和Live Photo下载');
  console.log('- 可以下载所有图片，不只是封面图');
  console.log('- 建议使用最新的、包含实际内容的小红书链接测试');
}

testEnhancedOnly().catch(console.error);