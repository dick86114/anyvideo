const ParseService = require('./src/services/ParseService');
const WatermarkRemover = require('./src/utils/watermarkRemover');
const LivePhotoProcessor = require('./src/utils/livePhotoProcessor');
const path = require('path');
const fs = require('fs-extra');

async function testRealXiaohongshu() {
  console.log('=== 真实小红书链接测试 ===\n');
  
  // 请在这里替换为真实的小红书链接
  const testUrl = process.argv[2] || 'https://www.xiaohongshu.com/explore/694269d1000000001f00dc48';
  
  console.log(`🔗 测试链接: ${testUrl}\n`);
  
  try {
    // 1. 解析链接
    console.log('📋 第一步：解析小红书链接');
    console.log('=' .repeat(50));
    
    const parsedData = await ParseService.parseXiaohongshuLink(testUrl);
    
    console.log('✅ 解析成功！');
    console.log(`📝 标题: ${parsedData.title}`);
    console.log(`👤 作者: ${parsedData.author}`);
    console.log(`📄 描述: ${parsedData.description.substring(0, 100)}${parsedData.description.length > 100 ? '...' : ''}`);
    console.log(`🎬 媒体类型: ${parsedData.media_type}`);
    console.log(`🖼️  图片数量: ${parsedData.all_images ? parsedData.all_images.length : 0}`);
    console.log(`🔗 封面URL: ${parsedData.cover_url}`);
    
    if (!parsedData.all_images || parsedData.all_images.length === 0) {
      console.log('❌ 没有找到图片URL，可能是：');
      console.log('   1. 链接是纯文字内容');
      console.log('   2. 链接已过期');
      console.log('   3. 需要登录才能访问');
      console.log('   4. 被反爬虫机制拦截');
      return;
    }
    
    // 2. 分析图片URLs
    console.log('\n🔍 第二步：分析图片URLs');
    console.log('=' .repeat(50));
    
    parsedData.all_images.forEach((url, index) => {
      console.log(`\n图片 ${index + 1}:`);
      console.log(`  原始URL: ${url}`);
      
      // 检测是否有水印
      const hasWatermark = WatermarkRemover.hasWatermark(url, 'xiaohongshu');
      console.log(`  包含水印标识: ${hasWatermark ? '是' : '否'}`);
      
      // 去水印处理
      const cleanUrl = WatermarkRemover.removeWatermark(url, 'xiaohongshu');
      const watermarkRemoved = cleanUrl !== url;
      console.log(`  去水印处理: ${watermarkRemoved ? '已处理' : '无需处理'}`);
      if (watermarkRemoved) {
        console.log(`  去水印URL: ${cleanUrl}`);
      }
      
      // 检测Live Photo
      const isLive = LivePhotoProcessor.isLivePhoto(url);
      console.log(`  实况图片: ${isLive ? '是' : '否'}`);
      
      if (isLive) {
        const liveUrls = LivePhotoProcessor.extractLivePhotoUrls(url);
        if (liveUrls.static) console.log(`    静态组件: ${liveUrls.static}`);
        if (liveUrls.motion) console.log(`    动态组件: ${liveUrls.motion}`);
      }
    });
    
    // 3. 下载测试
    console.log('\n⬇️  第三步：下载文件');
    console.log('=' .repeat(50));
    
    const downloadResult = await ParseService.downloadAllMedia(parsedData, 'xiaohongshu', 1);
    
    console.log(`✅ 下载完成！`);
    console.log(`📁 主图片路径: ${downloadResult.mainImagePath}`);
    console.log(`📊 成功下载文件数: ${downloadResult.totalFiles}`);
    
    if (downloadResult.totalFiles === 0) {
      console.log('❌ 没有成功下载任何文件，可能原因：');
      console.log('   1. 图片URL无效或已过期');
      console.log('   2. 网络连接问题');
      console.log('   3. 被服务器拒绝访问');
      console.log('   4. 文件保存权限问题');
      return;
    }
    
    // 4. 验证下载的文件
    console.log('\n🔍 第四步：验证下载文件');
    console.log('=' .repeat(50));
    
    const mediaDir = path.join(__dirname, 'media');
    let totalSize = 0;
    let livePhotoCount = 0;
    let watermarkRemovedCount = 0;
    
    for (const [index, file] of downloadResult.downloadedFiles.entries()) {
      const fullPath = path.join(mediaDir, file.filePath);
      const exists = await fs.pathExists(fullPath);
      
      console.log(`\n文件 ${index + 1}:`);
      console.log(`  路径: ${file.filePath}`);
      console.log(`  存在: ${exists ? '是' : '否'}`);
      
      if (exists) {
        const stats = await fs.stat(fullPath);
        const sizeKB = Math.round(stats.size / 1024);
        totalSize += stats.size;
        
        console.log(`  大小: ${sizeKB}KB`);
        console.log(`  修改时间: ${stats.mtime.toLocaleString()}`);
        
        // 检查是否是Live Photo
        if (file.isLivePhoto) {
          livePhotoCount++;
          console.log(`  类型: 实况图片 (${file.livePhotoComponent || 'unknown'})`);
        }
        
        // 检查是否去除了水印
        if (file.watermarkFreeUrl !== file.originalUrl) {
          watermarkRemovedCount++;
          console.log(`  水印处理: 已去除`);
        }
        
        // 简单验证文件是否为有效的媒体文件
        if (stats.size < 100) {
          console.log(`  ⚠️  文件可能无效（太小）`);
        } else if (stats.size > 50 * 1024 * 1024) {
          console.log(`  ⚠️  文件很大（>50MB）`);
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
    console.log(`📸 实况图片组件: ${livePhotoCount}`);
    console.log(`🎯 去水印处理: ${watermarkRemovedCount}`);
    
    // 功能状态
    console.log('\n🔧 功能状态:');
    console.log(`  去水印功能: ${watermarkRemovedCount > 0 ? '✅ 工作正常' : '⚪ 未触发'}`);
    console.log(`  实况图片支持: ${livePhotoCount > 0 ? '✅ 工作正常' : '⚪ 未检测到'}`);
    console.log(`  批量下载: ${downloadResult.totalFiles > 1 ? '✅ 工作正常' : downloadResult.totalFiles === 1 ? '⚪ 只有一张图' : '❌ 下载失败'}`);
    
    // 保存位置
    console.log(`\n📂 文件保存位置: ${path.join(mediaDir, 'xiaohongshu')}`);
    
    if (downloadResult.totalFiles > 0) {
      console.log('\n🎉 测试成功完成！');
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
      if (error.response.headers) {
        console.log(`   Content-Type: ${error.response.headers['content-type'] || 'unknown'}`);
      }
    }
    
    console.log('\n💡 调试建议:');
    console.log('- 在浏览器中打开链接，确认内容可正常访问');
    console.log('- 检查链接是否为图片内容（非纯文字或视频）');
    console.log('- 尝试使用包含多张图片的小红书内容');
  }
}

// 使用说明
if (require.main === module) {
  if (process.argv.length < 3) {
    console.log('使用方法:');
    console.log('node test-real-xiaohongshu.js <小红书链接>');
    console.log('');
    console.log('示例:');
    console.log('node test-real-xiaohongshu.js "https://www.xiaohongshu.com/explore/xxxxxx"');
    console.log('');
    console.log('使用默认测试链接...');
  }
  
  testRealXiaohongshu()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('测试脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { testRealXiaohongshu };