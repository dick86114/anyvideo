const axios = require('axios');

async function testFrontendAPI() {
  console.log('🧪 测试前端API调用...\n');
  
  const baseURL = 'http://localhost:3000/api/v1';
  
  // 测试内容列表API
  try {
    console.log('1️⃣ 测试内容列表API...');
    const response = await axios.get(`${baseURL}/content`, {
      params: {
        page: 1,
        page_size: 10
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ 内容列表API调用成功');
    console.log('📊 响应数据:', JSON.stringify(response.data, null, 2));
    
    if (response.data.data && response.data.data.list && response.data.data.list.length === 0) {
      console.log('🎉 返回空列表，符合预期\n');
    }
    
  } catch (error) {
    console.log('❌ 内容列表API调用失败:', error.message);
    if (error.response) {
      console.log('📄 响应状态:', error.response.status);
      console.log('📄 响应数据:', error.response.data);
    }
    console.log('');
  }
  
  // 测试单作品解析API
  try {
    console.log('2️⃣ 测试单作品解析API...');
    const testUrl = 'https://www.xiaohongshu.com/explore/123456';
    
    const response = await axios.post(`${baseURL}/content/parse`, {
      link: testUrl  // 使用 link 而不是 url
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ 单作品解析API调用成功');
    console.log('📊 响应数据:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ 单作品解析API调用失败:', error.message);
    if (error.response) {
      console.log('📄 响应状态:', error.response.status);
      console.log('📄 响应数据:', error.response.data);
    }
    console.log('');
  }
  
  // 测试健康检查
  try {
    console.log('3️⃣ 测试健康检查API...');
    const response = await axios.get('http://localhost:3000/health');
    
    console.log('✅ 健康检查API调用成功');
    console.log('📊 响应数据:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ 健康检查API调用失败:', error.message);
    if (error.response) {
      console.log('📄 响应状态:', error.response.status);
      console.log('📄 响应数据:', error.response.data);
    }
  }
}

testFrontendAPI();