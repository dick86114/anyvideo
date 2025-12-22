const EnhancedXiaohongshuParser = require('./src/services/EnhancedXiaohongshuParser');

async function testMock() {
  const parser = new EnhancedXiaohongshuParser();
  
  // Mock data based on Java success case
  const mockData = {
    note: {
      noteDetailMap: {
        "test123": {
          note: {
            title: "测试标题",
            desc: "测试描述",
            user: { nickname: "测试用户" },
            imageList: [
              {
                url_default: "https://test.com/image1_no_watermark.jpg",
                url: "https://test.com/image1.jpg!watermark",
                live_photo: {
                  image_url: "https://test.com/live1.jpg",
                  video_url: "https://test.com/live1.mp4"
                }
              }
            ]
          }
        }
      }
    }
  };
  
  console.log('Testing content data finding...');
  const content = parser.findContentData(mockData);
  
  if (content) {
    console.log('✅ Found content:', content.title);
    
    const images = parser.extractImageUrls(content);
    console.log('✅ Extracted images:', images.length);
    images.forEach(img => console.log('  -', img));
    
    const cleaned = images.map(img => parser.removeWatermark(img));
    console.log('✅ Watermark removed:');
    cleaned.forEach(img => console.log('  -', img));
    
  } else {
    console.log('❌ No content found');
  }
}

testMock();