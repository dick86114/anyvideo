const EnhancedXiaohongshuParser = require('./src/services/EnhancedXiaohongshuParser');

async function testWithMockData() {
  console.log('=== 使用模拟数据测试解析器 ===\n');
  
  const parser = new EnhancedXiaohongshuParser();
  
  // 模拟小红书JSON数据结构（基于Java成功案例）
  const mockJsonData = {
    note: {
      noteDetailMap: {
        "6682c4b8000000000a03a78e": {
          note: {
            id: "6682c4b8000000000a03a78e",
            title: "测试小红书内容标题",
            desc: "这是一个测试描述，用于验证去水印和Live Photo功能是否正常工作。",
            type: "normal",
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
                },
                middle: {
                  url: "https://sns-img-qc.xhscdn.com/test1_middle.jpg"
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
                      master_url: "https://sns-video-qc.xhscdn.com/test3_h264_stream.m3u8",
                      masterUrl: "https://sns-video-qc.xhscdn.com/test3_h264_stream.m3u8"
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
  
  console.log('🔍 测试JSON数据查找...');
  const contentData = parser.findContentData(mockJsonData);
  
  if (contentData) {
    console.log('✅ 成功找到内容数据!');
    console.log(`标题: ${contentData.title}`);
    console.log(`描述: ${contentData.desc}`);
    console.log(`作者: ${contentData.user.nickname}`);
    console.log(`图片数量: ${contentData.imageList.length}`);
    
    console.log('\n🖼️  测试图片URL提取...');
    const imageUrls = parser.extractImageUrls(contentData);
    
    console.log(`\n✅ 提取到 ${imageUrls.length} 个媒体URL:`);
    imageUrls.forEach((url, index) => {
      const isLive = parser.isLivePhoto(url);
      const isWatermarkFree = url.includes('url_default') || !url.includes('!');
      console.log(`${index + 1}. ${url}`);
      console.log(`   Live Photo: ${isLive ? '是' : '否'}`);
      console.log(`   无水印: ${isWatermarkFree ? '是' : '否'}`);
    });
    
    console.log('\n🎯 测试去水印功能...');
    const watermarkFreeUrls = imageUrls.map(url => parser.removeWatermark(url));
    
    console.log('\n✅ 去水印后的URLs:');
    watermarkFreeUrls.forEach((url, index) => {
      console.log(`${index + 1}. ${url}`);
    });
    
    console.log('\n📊 功能验证结果:');
    
    // 验证去水印
    const hasWatermarkFreeUrls = watermarkFreeUrls.some(url => 
      url.inclu