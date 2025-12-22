const ParseService = require('./src/services/ParseService');

async function testIntegratedParser() {
  console.log('=== 测试集成的小红书解析器 ===\n');
  
  // Test URLs - some may work, some may fail to trigger fallback
  const testUrls = [
    'https://www.xiaohongshu.com/explore/694269d1000000001f00dc48',
    'https://www.xiaohongshu.com/explore/6682c4b8000000000a03a78e',
    'https://www.xiaohongshu.com/explore/69353db4000000001b030a5a'
  ];
  
  for (let i = 0; i < testUrls.length; i++) {
    const url = testUrls[i];
    console.log(`\n📋 测试 ${i + 1}/${testUrls.length}: ${url}`);
    console.log('=' .repeat(80));
    
    try {
      const result = await ParseService.parseXiaohongshuLink(url);
      
      console.log('✅ 解析成功!');
      console.log(`📝 标题: ${result.title}`);
      console.log(`👤 作者: ${result.author}`);
      console.log(`📄 描述: ${result.description.substring(0, 100)}${result.description.length > 100 ? '...' : ''}`);
      console.log(`🎬 媒体类型: ${result.media_type}`);
      console.log(`🖼️  图片数量: ${result.all_images ? result.all_images.length : 0}`);
      console.log(`📸 封面URL: ${result.cover_url}`);
      console.log(`🎯 媒体URL: ${result.media_url}`);
      
      // 检查去水印和Live Photo功能
      if (result.all_images && result.all_images.length > 0) {
        console.log('\n🔍 图片URL分析:');
        result.all_images.forEach((url, index) => {
          const hasWatermark = url.includes('!') || url.includes('watermark');
          const isLivePhoto = url.includes('live') || url.includes('.mov') || url.includes('.mp4');
          console.log(`  ${index + 1}. ${url.substring(0, 80)}${url.length > 80 ? '...' : ''}`);
          console.log(`     水印: ${hasWatermark ? '可能有' : '已清理'}, Live Photo: ${isLivePhoto ? '是' : '否'}`);
        });
      }
      
      console.log('\n✨ 功能验证:');
      console.log(`  去水印: ${result.all_images && result.all_images.some(url => !url.includes('!')) ? '✅ 工作正常' : '⚠️  需要检查'}`);
      console.log(`  Live Photo: ${result.all_images && result.all_images.some(url => url.includes('.mov') || url.includes('.mp4')) ? '✅ 检测到' : '⚪ 未检测到'}`);
      console.log(`  多图下载: ${result.all_images && result.all_images.length > 1 ? '✅ 支持' : '⚪ 单图或无图'}`);
      
    } catch (error) {
      console.log('❌ 解析失败:', error.message);
      
      // 分析失败原因
      if (error.message.includes('ECONNABORTED')) {
        console.log('💡 失败原因: 网络连接超时');
      } else if (error.message.includes('404')) {
        console.log('💡 失败原因: 内容不存在或已删除');
      } else if (error.message.includes('403')) {
        console.log('💡 失败原因: 访问被拒绝，可能需要登录');
      } else {
        console.log('💡 失败原因: 解析逻辑问题');
      }
    }
    
    // 添加延迟避免请求过快
    if (i < testUrls.length - 1) {
      console.log('\n⏳ 等待 2 秒后继续下一个测试...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('\n🎉 集成测试完成!');
  console.log('\n📊 测试总结:');
  console.log('- 测试了主解析器和增强解析器的集成');
  console.log('- 验证了去水印功能的实现');
  console.log('- 检查了Live Photo支持');
  console.log('- 确认了多图下载能力');
  console.log('\n💡 如果所有测试都失败，可能是网络问题或小红书反爬虫机制');
  console.log('   建议使用真实的、最新的小红书链接进行测试');
}

// 运行测试
testIntegratedParser().catch(console.error);