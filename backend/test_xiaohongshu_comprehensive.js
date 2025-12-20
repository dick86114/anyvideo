const ParseService = require('./src/services/ParseService');

// Test cases for different types of Xiaohongshu URLs
const testCases = [
  {
    name: 'Video content',
    url: 'https://www.xiaohongshu.com/explore/69353db4000000001b030a5a?xsec_token=ABu4A_iISwNgzFD7qgSVTOwezPgp5HzTwpVKfG9tgbVU8=&xsec_source=pc_feed',
    expectedMediaType: 'video'
  },
  {
    name: 'Image content',
    url: 'https://www.xiaohongshu.com/explore/63c7a9a4000000001a02f0d3',
    expectedMediaType: 'image'
  },
  {
    name: 'Multi-image content',
    url: 'https://www.xiaohongshu.com/explore/642e0b1b000000002703f4d8',
    expectedMediaType: 'image'
  },
  // Add more test cases as needed
];

// Comprehensive test function
async function runComprehensiveTests() {
  console.log('=== 小红书URL解析功能综合测试 ===\n');
  
  let passedTests = 0;
  let failedTests = 0;
  
  for (const testCase of testCases) {
    console.log(`📋 测试用例: ${testCase.name}`);
    console.log(`URL: ${testCase.url}`);
    console.log(`预期媒体类型: ${testCase.expectedMediaType}`);
    
    try {
      // Step 1: Parse the URL
      const parsedData = await ParseService.parseLink(testCase.url);
      
      console.log('\n✅ 解析成功!');
      console.log(`媒体类型: ${parsedData.media_type}`);
      console.log(`标题: ${parsedData.title}`);
      console.log(`作者: ${parsedData.author}`);
      console.log(`封面URL: ${parsedData.cover_url}`);
      console.log(`媒体URL: ${parsedData.media_url}`);
      console.log(`图片数量: ${parsedData.all_images.length}`);
      
      // Validate media type
      if (parsedData.media_type === testCase.expectedMediaType) {
        console.log('✅ 媒体类型验证通过');
      } else {
        console.log(`❌ 媒体类型验证失败: 预期 ${testCase.expectedMediaType}, 实际 ${parsedData.media_type}`);
      }
      
      // Step 2: Test download functionality (optional for this test)
      console.log('\n📥 测试资源下载 (可选)...');
      const filePath = await ParseService.downloadMedia(parsedData, 'xiaohongshu', 1);
      console.log(`✅ 资源下载成功: ${filePath}`);
      
      console.log('\n🎉 测试用例通过!\n' + '-'.repeat(50) + '\n');
      passedTests++;
    } catch (error) {
      console.log(`\n❌ 测试用例失败: ${error.message}`);
      console.error('错误详情:', error.stack);
      console.log('\n' + '-'.repeat(50) + '\n');
      failedTests++;
    }
  }
  
  // Test summary
  console.log('=== 测试总结 ===');
  console.log(`总测试用例数: ${testCases.length}`);
  console.log(`通过: ${passedTests}`);
  console.log(`失败: ${failedTests}`);
  console.log(`通过率: ${((passedTests / testCases.length) * 100).toFixed(2)}%`);
  
  if (failedTests === 0) {
    console.log('\n🎉 所有测试用例通过! 小红书URL解析功能正常工作。');
  } else {
    console.log('\n⚠️  部分测试用例失败，需要进一步调试和优化。');
  }
}

// Run the tests
runComprehensiveTests().catch(error => {
  console.error('测试执行失败:', error);
  process.exit(1);
});
