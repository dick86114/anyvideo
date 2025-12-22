const ParseService = require('./src/services/ParseService');
const path = require('path');
const fs = require('fs-extra');

async function quickTest() {
  console.log('=== 小红书快速测试 ===\n');
  
  // 请在这里替换为真实的小红书链接进行测试
  const testUrl = 'https://www.xiaohongshu.com/explore/694269d1000000001f00dc48';
  
  try {
    console.log(`测试链接: ${testUrl}\n`);
    
    // 1. 解析链接
    console.log('🔍 正在解析链接...');
    const parsedData = await ParseService.parseXiaohongshuLink(testUrl);
    
    console.log('✅ 解析成功！');
    console.log(`📝 标题: ${parsedData.title}`);
    console.log(`👤 作者: ${parsedData.author}`);
    console.log(`🎬 类型: ${parsedData.media_type}`);
    console.log(`🖼️  图片数量: ${parsedData.all_images ? parsedData.all_images.length : 0}`);
    
    if (parsedData.all_images && parsedData.all_images.length > 0) {
      console.log('\n📸 图片详情:');
      parsedData.all_images.forEach((img, index) => {
        const isLive = ParseService.isLivePhotoUrl(img);
        console.log(`  ${index + 1}. ${img.substring(0, 80)}... ${isLive ? '(实况图片)' : ''}`);
      });
    }
    
    // 2. 测试去水印
    console.log('\n🎯 测试去水印功能...');
    if (parsedData.all_images) {
      parsedData.all_images.forEach((img, index) => {
        const cleanUrl = ParseService.removeWatermarkFromUrl(img, 'xiaohongshu');
        const changed = cleanUrl !== img;
        console.log(`  图片 ${index + 1}: ${changed ? '✅ 已去水印' : '⚪ 无需处理'}`);
        if (changed) {
          console.log(`    原始: ${img.substring(0, 60)}...`);
          console.log(`    处理: ${cleanUrl.substring(0, 60)}...`);
        }
      });
    }
    
    // 3. 下载文件
    console.log('\n⬇️  开始下载文件...');
    const downloadResult = await ParseService.downloadAllMedia(parsedData, 'xiaohongshu', 1);
    
    console.log('✅ 下载完成！');
    console.log(`📁 主图片: ${downloadResult.mainImagePath}`);
    console.log(`📊 总文件数: ${downloadResult.totalFiles}`);
    
    // 4. 验证文件
    console.log('\n🔍 验证下载的文件...');
    const mediaDir = path.join(__dirname, 'media');
    
    for (const [index, file] of downloadResult.downloadedFiles.entries()) {
      const fullPath = path.join(mediaDir, file.filePath);
      const exists = await fs.pathExists(fullPath);
      
      if (exists) {
        const stats = await fs.stat(fullPath);
        const sizeKB = Math.round(stats.size / 1024);
        const liveInfo = file.isLivePhoto ? ` (${file.livePhotoComponent || 'live'})` : '';
        console.log(`  ✅ 文件 ${index + 1}: ${file.filePath} (${sizeKB}KB)${liveInfo}`);
      } else {
        console.log(`  ❌ 文件 ${index + 1}: ${file.filePath} - 文件不存在`);
      }
    }
    
    // 5. 显示保存路径
    console.log('\n📂 文件保存位置:');
    const saveDir = path.join(mediaDir, 'xiaohongshu');
    console.log(`   ${saveDir}`);
    
    // 6. 总结
    console.log('\n📋 总结:');
    console.log(`✅ 成功解析小红书内容`);
    console.log(`✅ 成功下载 ${downloadResult.totalFiles} 个文件`);
    
    const livePhotoCount = downloadResult.downloadedFiles.filter(f => f.isLivePhoto).length;
    if (livePhotoCount > 0) {
      console.log(`✅ 包含 ${livePhotoCount} 个实况图片组件`);
    }
    
    const watermarkRemoved = downloadResult.downloadedFiles.filter(f => 
      f.watermarkFreeUrl !== f.originalUrl
    ).length;
    if (watermarkRemoved > 0) {
      console.log(`✅ 成功去除 ${watermarkRemoved} 个文件的水印`);
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('\n🔧 可能的解决方案:');
    console.error('1. 检查网络连接');
    console.error('2. 确认小红书链接有效');
    console.error('3. 检查是否需要登录状态');
    console.error('4. 尝试其他小红书链接');
    
    if (error.response) {
      console.error(`\n📡 HTTP状态: ${error.response.status} ${error.response.statusText}`);
    }
  }
}

// 运行测试
if (require.main === module) {
  quickTest()
    .then(() => {
      console.log('\n🎉 测试完成！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 测试过程中发生严重错误:', error);
      process.exit(1);
    });
}

module.exports = { quickTest };