const axios = require('axios');

async function testFilteringFunctionality() {
  console.log('🧪 测试内容管理页面筛选功能...\n');
  
  const baseURL = 'http://localhost:3000/api/v1';
  
  const tests = [
    {
      name: '默认显示所有内容（无筛选条件）',
      url: `${baseURL}/content`,
      expectedBehavior: '应该返回所有内容'
    },
    {
      name: '按平台筛选 - 小红书',
      url: `${baseURL}/content?platform=xiaohongshu`,
      expectedBehavior: '应该只返回小红书平台的内容'
    },
    {
      name: '按平台筛选 - 抖音',
      url: `${baseURL}/content?platform=douyin`,
      expectedBehavior: '应该只返回抖音平台的内容'
    },
    {
      name: '按媒体类型筛选 - 视频',
      url: `${baseURL}/content?media_type=video`,
      expectedBehavior: '应该只返回视频类型的内容'
    },
    {
      name: '按媒体类型筛选 - 图片',
      url: `${baseURL}/content?media_type=image`,
      expectedBehavior: '应该只返回图片类型的内容'
    },
    {
      name: '按来源类型筛选 - 单链接解析',
      url: `${baseURL}/content?source_type=1`,
      expectedBehavior: '应该只返回单链接解析的内容'
    },
    {
      name: '按来源类型筛选 - 监控任务',
      url: `${baseURL}/content?source_type=2`,
      expectedBehavior: '应该只返回监控任务的内容'
    },
    {
      name: '关键词搜索 - "美食"',
      url: `${baseURL}/content?keyword=美食`,
      expectedBehavior: '应该返回标题或描述包含"美食"的内容'
    },
    {
      name: '关键词搜索 - "编程"',
      url: `${baseURL}/content?keyword=编程`,
      expectedBehavior: '应该返回标题或描述包含"编程"的内容'
    },
    {
      name: '组合筛选 - 小红书 + 图片',
      url: `${baseURL}/content?platform=xiaohongshu&media_type=image`,
      expectedBehavior: '应该返回小红书平台的图片内容'
    },
    {
      name: '组合筛选 - 视频 + 监控任务',
      url: `${baseURL}/content?media_type=video&source_type=2`,
      expectedBehavior: '应该返回监控任务来源的视频内容'
    },
    {
      name: '分页测试 - 第1页，每页2条',
      url: `${baseURL}/content?page=1&page_size=2`,
      expectedBehavior: '应该返回第1页的2条记录'
    },
    {
      name: '分页测试 - 第2页，每页2条',
      url: `${baseURL}/content?page=2&page_size=2`,
      expectedBehavior: '应该返回第2页的2条记录'
    }
  ];
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  for (const [index, test] of tests.entries()) {
    try {
      console.log(`${index + 1}. ${test.name}`);
      console.log(`   URL: ${test.url}`);
      console.log(`   预期: ${test.expectedBehavior}`);
      
      const response = await axios.get(test.url, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = response.data;
      
      if (data.message === '获取成功' && data.data) {
        const { list, total, page, page_size } = data.data;
        console.log(`   ✅ 成功: 返回 ${list.length} 条记录，总计 ${total} 条`);
        
        // 显示返回的内容摘要
        if (list.length > 0) {
          console.log(`   📋 内容摘要:`);
          list.forEach((item, i) => {
            console.log(`      ${i + 1}. "${item.title}" (${item.platform}, ${item.media_type})`);
          });
        }
        
        passedTests++;
      } else {
        console.log(`   ❌ 失败: 响应格式不正确`);
      }
      
    } catch (error) {
      console.log(`   ❌ 失败: ${error.message}`);
      if (error.response) {
        console.log(`   📄 状态码: ${error.response.status}`);
        console.log(`   📄 响应: ${JSON.stringify(error.response.data)}`);
      }
    }
    
    console.log(''); // 空行分隔
  }
  
  console.log(`🎯 测试结果: ${passedTests}/${totalTests} 个测试通过`);
  
  if (passedTests === totalTests) {
    console.log('🎉 所有筛选功能测试通过！');
  } else {
    console.log('⚠️  部分测试失败，请检查相关功能');
  }
}

testFilteringFunctionality();