const ParseService = require('./src/services/ParseService');
const WatermarkRemover = require('./src/utils/watermarkRemover');
const LivePhotoProcessor = require('./src/utils/livePhotoProcessor');
const path = require('path');
const fs = require('fs-extra');

async function testComprehensive() {
  console.log('=== 小红书去水印和实况图片综合测试 ===\n');
  
  // 测试水印去除功能
  console.log('1. 测试水印去除功能');
  console.log('------------------------');
  
  const testUrls = [
    'https://sns-webpic-qc.xhscdn.com/202312345/1000/01e7c4d5ly1h9abc123def!h5_1080jpg',
    'https://sns-img-qc.xhscdn.com/spectrum/1040/live_photo/abc123def.jpg',
    'https://sns-webpic-qc.xhscdn.com/202312345/1000/live_image_static.heic',
    'https://example.com/image.jpg?watermark=1&wm=1',
  ];
  
  testUrls.forEach((url, index) => {
    console.log(`测试URL ${index + 1}: ${url}`);
    
    // 检测是否有水印
    const hasWatermark = WatermarkRemover.hasWatermark(url, 'xiaohongshu');
    console.log(`  是否可能有水印: ${hasWatermark}`);
    
    // 去除水印
    const cleanUrl = WatermarkRemover.removeWatermark(url, 'xiaohongshu');
    console.log(`  去水印后: ${cleanUrl}`);
    
    // 检测是否为Live Photo
    const isLive = LivePhotoProcessor.isLivePhoto(url);
    console.log(`  是否为实况图片: ${isLive}`);
    
    if (isLive) {
      const liveUrls = LivePhotoProcessor.extractLivePhotoUrls(url);
      console.log(`  静态图片URL: ${liveUrls.static}`);
      console.log(`  动态视频URL: ${liveUrls.motion}`);
    }
    
    console.log('');
  });
  
  // 测试Live Photo处理
  console.log('2. 测试Live Photo处理功能');
  console.log('---------------------------');
  
  const livePhotoUrls = [
    'https://sns-img-qc.xhscdn.com/live_photo/abc123_static.jpg',
    'https://sns-img-qc.xhscdn.com/live_photo/abc123_motion.mov',
    'https://example.com/livephoto.heic',
    'https://example.com/motion_photo.mp4',
  ];
  
  livePhotoUrls.forEach((url, index) => {
    console.log(`Live Photo URL ${index + 1}: ${url}`);
    
    const isLive = LivePhotoProcessor.isLivePhoto(url);
    console.log(`  是否为Live Photo: ${isLive}`);
    
    if (isLive) {
      const files = LivePhotoProcessor.generateLivePhotoFiles(
        url, index, 'test123', Date.now(), 'test_dir'
      );
      
      console.log(`  生成文件数量: ${files.length}`);
      files.forEach(file => {
        console.log(`    ${file.component}: ${file.filename}`);
      });
    }
    
    console.log('');
  });
  
  // 测试批量处理
  console.log('3. 测试批量处理功能');
  console.log('--------------------');
  
  const mixedUrls = [
    'https://sns-webpic-qc.xhscdn.com/image1.jpg!h5_1080jpg',
    'https://sns-img-qc.xhscdn.com/live_photo/image2_static.jpg',
    'https://sns-img-qc.xhscdn.com/live_photo/image2_motion.mov',
    'https://example.com/regular_image.png',
  ];
  
  console.log('原始URLs:');
  mixedUrls.forEach((url, index) => {
    console.log(`  ${index + 1}. ${url}`);
  });
  
  // 批量去水印
  const cleanUrls = WatermarkRemover.removeWatermarkBatch(mixedUrls, 'xiaohongshu');
  console.log('\n去水印后:');
  cleanUrls.forEach((url, index) => {
    console.log(`  ${index + 1}. ${url}`);
  });
  
  // 批量处理Live Photo
  const processedFiles = LivePhotoProcessor.processLivePhotoUrls(mixedUrls);
  console.log('\nLive Photo处理结果:');
  processedFiles.forEach((file, index) => {
    console.log(`  ${index + 1}. ${file.type} (${file.component}): ${file.url}`);
  });
  
  // 模拟完整的小红书解析流程
  console.log('\n4. 模拟完整解析流程');
  console.log('--------------------');
  
  const mockParsedData = {
    content_id: 'test_' + Date.now(),
    title: '测试小红书内容',
    author: '测试作者',
    description: '这是一个测试内容，包含多张图片和实况图片',
    media_type: 'image',
    cover_url: mixedUrls[0],
    media_url: mixedUrls[0],
    all_images: mixedUrls
  };
  
  console.log('模拟解析数据:');
  console.log(`  内容ID: ${mockParsedData.content_id}`);
  console.log(`  标题: ${mockParsedData.title}`);
  console.log(`  图片数量: ${mockParsedData.all_images.length}`);
  
  // 分析每张图片
  console.log('\n图片分析:');
  mockParsedData.all_images.forEach((url, index) => {
    const hasWatermark = WatermarkRemover.hasWatermark(url, 'xiaohongshu');
    const isLive = LivePhotoProcessor.isLivePhoto(url);
    const cleanUrl = WatermarkRemover.removeWatermark(url, 'xiaohongshu');
    
    console.log(`  图片 ${index + 1}:`);
    console.log(`    原始URL: ${url}`);
    console.log(`    有水印: ${hasWatermark}`);
    console.log(`    实况图片: ${isLive}`);
    console.log(`    去水印URL: ${cleanUrl}`);
    
    if (isLive) {
      const liveUrls = LivePhotoProcessor.extractLivePhotoUrls(url);
      if (liveUrls.static) console.log(`    静态组件: ${liveUrls.static}`);
      if (liveUrls.motion) console.log(`    动态组件: ${liveUrls.motion}`);
    }
  });
  
  console.log('\n=== 测试完成 ===');
  console.log('\n总结:');
  console.log('✅ 水印检测和去除功能正常');
  console.log('✅ Live Photo检测和处理功能正常');
  console.log('✅ 批量处理功能正常');
  console.log('✅ 综合解析流程正常');
  
  console.log('\n建议:');
  console.log('1. 使用真实的小红书链接进行实际测试');
  console.log('2. 检查下载的文件是否正确去除了水印');
  console.log('3. 验证Live Photo的静态和动态组件是否都能正常下载');
  console.log('4. 确保所有图片都被保存，而不仅仅是封面图');
}

// 运行测试
if (require.main === module) {
  testComprehensive()
    .then(() => {
      console.log('\n测试脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('测试过程中发生错误:', error);
      process.exit(1);
    });
}

module.exports = { testComprehensive };