const ParseService = require('./src/services/ParseService');
const path = require('path');
const fs = require('fs-extra');

async function testXiaohongshuEnhanced() {
  console.log('=== 测试小红书增强功能 ===');
  
  // 测试URL - 请替换为实际的小红书链接
  const testUrls = [
    'https://www.xiaohongshu.com/explore/694269d1000000001f00dc48', // 图片内容
    // 可以添加更多测试URL
  ];
  
  for (const url of testUrls) {
    try {
      console.log(`\n--- 测试URL: ${url} ---`);
      
      // 1. 解析链接
      console.log('1. 解析链接...');
      const parsedData = await ParseService.parseXiaohongshuLink(url);
      
      console.log('解析结果:');
      console.log(`- 内容ID: ${parsedData.content_id}`);
      console.log(`- 标题: ${parsedData.title}`);
      console.log(`- 作者: ${parsedData.author}`);
      console.log(`- 媒体类型: ${parsedData.media_type}`);
      console.log(`- 图片数量: ${parsedData.all_images ? parsedData.all_images.length : 0}`);
      
      if (parsedData.all_images) {
        parsedData.all_images.forEach((img, index) => {
          const isLive = ParseService.isLivePhotoUrl(img);
          console.log(`  图片 ${index + 1}: ${img} ${isLive ? '(实况图片)' : ''}`);
        });
      }
      
      // 2. 测试去水印功能
      console.log('\n2. 测试去水印功能...');
      if (parsedData.all_images) {
        parsedData.all_images.forEach((img, index) => {
          const originalUrl = img;
          const watermarkFreeUrl = ParseService.removeWatermarkFromUrl(img, 'xiaohongshu');
          console.log(`图片 ${index + 1}:`);
          console.log(`  原始URL: ${originalUrl}`);
          console.log(`  去水印URL: ${watermarkFreeUrl}`);
          console.log(`  是否为实况图片: ${ParseService.isLivePhotoUrl(img)}`);
        });
      }
      
      // 3. 测试批量下载功能
      console.log('\n3. 测试批量下载功能...');
      const downloadResult = await ParseService.downloadAllMedia(parsedData, 'xiaohongshu', 1);
      
      console.log('下载结果:');
      console.log(`- 主图片路径: ${downloadResult.mainImagePath}`);
      console.log(`- 下载文件总数: ${downloadResult.totalFiles}`);
      console.log('- 下载文件详情:');
      
      downloadResult.downloadedFiles.forEach((file, index) => {
        console.log(`  文件 ${index + 1}:`);
        console.log(`    路径: ${file.filePath}`);
        console.log(`    是否为实况图片: ${file.isLivePhoto}`);
        if (file.livePhotoComponent) {
          console.log(`    实况图片组件: ${file.livePhotoComponent}`);
        }
        console.log(`    原始URL: ${file.originalUrl}`);
        console.log(`    去水印URL: ${file.watermarkFreeUrl}`);
      });
      
      // 4. 验证文件是否存在
      console.log('\n4. 验证下载的文件...');
      const mediaDir = path.join(__dirname, 'media');
      
      for (const file of downloadResult.downloadedFiles) {
        const fullPath = path.join(mediaDir, file.filePath);
        const exists = await fs.pathExists(fullPath);
        const stats = exists ? await fs.stat(fullPath) : null;
        
        console.log(`文件: ${file.filePath}`);
        console.log(`  存在: ${exists}`);
        if (stats) {
          console.log(`  大小: ${stats.size} 字节`);
          console.log(`  修改时间: ${stats.mtime}`);
        }
      }
      
    } catch (error) {
      console.error(`测试失败: ${error.message}`);
      console.error('错误详情:', error);
    }
  }
}

// 运行测试
if (require.main === module) {
  testXiaohongshuEnhanced()
    .then(() => {
      console.log('\n=== 测试完成 ===');
      process.exit(0);
    })
    .catch((error) => {
      console.error('测试过程中发生错误:', error);
      process.exit(1);
    });
}

module.exports = { testXiaohongshuEnhanced };