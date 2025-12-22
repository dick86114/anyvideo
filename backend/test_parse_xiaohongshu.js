const ParseService = require('./src/services/ParseService');

async function testXiaohongshuParse() {
  try {
    // 使用一个真实的小红书URL进行测试
    const link = 'https://www.xiaohongshu.com/explore/69463270000000001b020073';
    console.log(`测试小红书URL解析: ${link}`);
    
    // 调用parseLink方法
    const parsedData = await ParseService.parseLink(link);
    console.log('解析结果:', parsedData);
    
    // 测试downloadMedia方法
    console.log('\n测试downloadMedia方法:');
    const file_path = await ParseService.downloadMedia(parsedData, 'xiaohongshu', 1, null);
    console.log('文件路径:', file_path);
    
  } catch (error) {
    console.error('测试失败:', error);
  }
}

testXiaohongshuParse();