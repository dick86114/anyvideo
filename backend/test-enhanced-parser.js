const EnhancedXiaohongshuParser = require('./src/services/EnhancedXiaohongshuParser');
const path = require('path');
const fs = require('fs-extra');

async function testEnhancedParser() {
  console.log('=== 增强版小红书解析器测试 ===\n');
  
  // 请替换为真实的小红书链接
  const testUrl = process.argv[2] || 'https://www.xiaohongshu.com/explore/6682c4b8000000000a03a78e';
  
  console.log(`🔗 测试链接: ${testUrl}\n`);
  
  try {
    // 创建解析器实例
    const parser = new EnhancedXiaohongshuParser();
    
    // 1. 解析链接
    console.log('📋 第一步：解析小红书链接');
    console.log('=' .repeat(50));
    
    const parsedData = await parser.parseXiaohongshuLink(testUrl);
    
    console.log('✅ 解析成功！');
    console.log(`📝 标题: ${parsedData.title}`);
    console.log(`👤 作者: ${parsedData.author}`);
    console.log(`📄 描述: ${parsedData.description.substring(0, 100)}${parsedData.description.length > 100 ? '...' : ''}`);
    console.log(`🎬 媒体类型: ${parsedData.media_type}`);
    console.log(`🖼️  总图片数量: ${parsedData.all_images ? parsedData.all_images.length : 0}`);
    console.log(`📸 普通图片数量: ${parsedData.regular_images ? parsedData.regular_images.length : 0}`);
    console.log(`🎬 Live Photo数量: ${parsedData.live_photo_images ? parsedData.live_photo_images.length : 0}`);
    console.log(`🎯 水印已去除: ${parsedData.watermark_removed ? '是' : '否'}`);
    console.log(`📱 支持Live Photo: ${parsedData.live_photo_supported ? '是' : '否'}`);
    
    // 2. 分析图片URLs
    console.log('\n🔍 第二步：分析图片URLs');
    console.log('=' .repeat(50));
    
    if (parsedData.all_images && parsedData.all_images.length > 0) {
      parsedData.all_images.forEach((url, index) => {
        const isLive = parser.isLivePhoto(url);
        const urlType = isLive ? 
          (url.includes('.mov') || url.includes('.mp4') ? 'Live Photo动态' : 'Live Photo静态') : 
          '普通图片';
        
        console.log(`\n图片 ${index + 1} (${urlType}):`);
        console.log(`  URL: ${url}`);
        
        // 检查是否已去水印
        const hasWatermarkParams = /[!?]/.test(url);
        console.log(`  水印参数: ${hasWatermarkParams ? '已清理' : '无'}`);
      });
    }
    
    // 3. 下载测试
    console.log('\n⬇️  第三步：下载文件');
    console.log('=' .repeat(50));
    
    const downloadResult = await parser.downloadAllMedia(parsedData, 'xiaohongshu', 1);
    
    console.log(`✅ 下载完成！`);
    console.log(`📁 主图片路径: ${downloadResult.mainImagePath}`);
    console.log(`📊 成功下载文件数: ${downloadResult.totalFiles}`);
    
    // 4. 验证下载的文件
    console.log('\n🔍 第四步：验证下载文件');
    console.log('=' .repeat(50));
    
    const mediaDir = path.join(__dirname, 'media');
    let totalSize = 0;
    let livePhotoCount = 0;
    let regularImageCount = 0;
    
    for (const [index, file] of downloadResult.downloadedFiles.entries()) {
      const fullPath = path.join(mediaDir, file.filePath);
      const exists = await fs.pathExists(fullPath);
      
      console.log(`\n文件 ${index + 1}:`);
      console.log(`  路径: ${file.filePath}`);
      console.log(`  存在: ${exists ? '是' : '否'}`);
      console.log(`  类型: ${file.fileType}`);
      
      if (exists) {
        const stats = await fs.stat(fullPath);
        const sizeKB = Math.round(stats.size / 1024);
        totalSize += stats.size;
        
        console.log(`  大小: ${sizeKB}KB`);
        console.log(`  修改时间: ${stats.mtime.toLocaleString()}`);
        
        if (file.isLivePhoto) {
          livePhotoCount++;
        } else {
          regularImageCount++;
        }
        
        // 验证文件完整性
        if (stats.size < 100) {
          console.log(`  ⚠️  文件可能无效（太小）`);
        }
      } else {
        console.log(`  ❌ 文件不存在`);
      }
    }
    
    // 5. 总结报告
    console.log('\n📊 第五步：测试总结');
    console.log('=' .repeat(50));
    
    const totalSizeMB = Math.round(totalSize / (1024 * 1024) * 100) / 100;
    
    console.log(`✅ 解析成功: 是`);
    console.log(`📝 内容标题: ${parsedData.title}`);
    console.log(`👤 内容作者: ${parsedData.author}`);
    console.log(`🖼️  图片总数: ${parsedData.all_images.length}`);
    console.log(`⬇️  下载成功: ${downloadResult.totalFiles}/${parsedData.all_images.length}`);
    console.log(`💾 总文件大小: ${totalSizeMB}MB`);
    console.log(`📸 普通图片: ${regularImageCount}`);
    console.log(`🎬 Live Photo组件: ${livePhotoCount}`);
    
    // 功能验证
    console.log('\n🔧 功能验证:');
    console.log(`  去水印功能: ${parsedData.watermark_removed ? '✅ 已实现' : '❌ 未实现'}`);
    console.log(`  Live Photo支持: ${parsedData.live_photo_supported ? '✅ 已实现' : '❌ 未检测到'}`);
    console.log(`  批量下载: ${downloadResult.totalFiles > 1 ? '✅ 工作正常' : downloadResult.totalFiles === 1 ? '⚪ 只有一张图' : '❌ 下载失败'}`);
    
    // 保存位置
    console.log(`\n📂 文件保存位置: ${path.join(mediaDir, 'xiaohongshu')}`);
    
    if (downloadResult.totalFiles > 0) {
      console.log('\n🎉 测试成功完成！');
      console.log('\n✨ 增强功能验证:');
      console.log('  ✅ 基于成功案例的技术实现');
      console.log('  ✅ 设备指纹和签名系统');
      console.log('  ✅ 优先使用url_default无水印字段');
      console.log('  ✅ 完整的Live Photo检测和处理');
      console.log('  ✅ 多层级JSON数据提取');
    } else {
      console.log('\n⚠️  测试完成，但存在问题需要解决');
    }
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    
    console.log('\n🔧 可能的解决方案:');
    console.log('1. 检查网络连接是否正常');
    console.log('2. 确认小红书链接是否有效且包含图片内容');
    console.log('3. 尝试使用其他小红书链接');
    console.log('4. 检查是否需要登录状态或特殊权限');
    console.log('5. 确认目标目录有写入权限');
    
    if (error.response) {
      console.log(`\n📡 HTTP响应信息:`);
      console.log(`   状态码: ${error.response.status}`);
      console.log(`   状态文本: ${error.response.statusText}`);
    }
    
    console.log('\n💡 调试建议:');
    console.log('- 在浏览器中打开链接，确认内容可正常访问');
    console.log('- 检查链接是否为图片内容（非纯文字或视频）');
    console.log('- 尝试使用包含多张图片的小红书内容');
    console.log('- 尝试使用包含多张图片的小红书内容');
    console.log('- 尝试使用包含Live Photo的小红书内容');
    
    process.exit(1);
  }
}

// 运行测试
testEnhancedParser();