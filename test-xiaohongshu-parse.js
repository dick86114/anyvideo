const ParseService = require('./backend/src/services/ParseService');

// 测试函数
async function testXiaohongshuParse() {
  console.log('开始测试小红书URL解析功能...');
  
  // 测试用的小红书URL
  const testUrls = [
    // 示例URL，实际测试时请替换为有效的小红书链接
    'https://www.xiaohongshu.com/explore/648d7e550000000018039c8e',
    'https://www.xiaohongshu.com/note/648d7e550000000018039c8e'
  ];
  
  for (const url of testUrls) {
    console.log(`\n=== 测试URL: ${url} ===`);
    try {
      const result = await ParseService.parseLink(url);
      console.log('解析成功！');
      console.log('结果:', JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('解析失败:', error.message);
    }
  }
}

// 执行测试
testXiaohongshuParse();
