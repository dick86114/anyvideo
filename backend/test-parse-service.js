#!/usr/bin/env node
/**
 * ParseService测试脚本
 */

const ParseService = require('./src/services/ParseService');

async function testParseService() {
  console.log('开始测试ParseService...');
  
  // 测试URL列表
  const testUrls = [
    {
      name: '小红书测试',
      url: 'https://www.xiaohongshu.com/explore/6682c4b8000000000a03a78e'
    },
    {
      name: '抖音测试',
      url: 'https://www.douyin.com/video/7345678901234567890'
    },
    {
      name: 'B站测试',
      url: 'https://www.bilibili.com/video/BV1Xx411Z7xx'
    }
  ];
  
  for (const testItem of testUrls) {
    console.log(`\n--- 测试: ${testItem.name} ---`);
    console.log(`URL: ${testItem.url}`);
    
    try {
      const result = await ParseService.parseLink(testItem.url);
      console.log('✅ 解析成功!');
      console.log('结果:', JSON.stringify(result, null, 2));
    } catch (error) {
      console.log('❌ 解析失败:', error.message);
    }
  }
  
  console.log('\n测试完成!');
}

testParseService().catch(error => {
  console.error('测试脚本出错:', error);
  process.exit(1);
});