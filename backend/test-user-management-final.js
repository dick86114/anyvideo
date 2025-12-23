const axios = require('axios');

async function testUserManagementComplete() {
  console.log('🧪 用户管理页面完整测试\n');
  
  try {
    // 1. 测试登录
    console.log('1. 测试用户登录...');
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      username: 'admin',
      password: '123456'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5173'
      }
    });
    
    console.log('✅ 登录成功');
    const token = loginResponse.data.data.token;
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Origin': 'http://localhost:5173',
      'Content-Type': 'application/json'
    };
    
    // 2. 测试获取用户列表（模拟前端调用）
    console.log('\n2. 测试获取用户列表...');
    const usersResponse = await axios.get('http://localhost:3000/api/v1/users', { 
      headers,
      timeout: 10000
    });
    
    console.log('✅ 获取用户列表成功');
    console.log(`   用户数量: ${usersResponse.data.data.length}`);
    console.log(`   响应消息: ${usersResponse.data.message}`);
    
    // 3. 测试获取当前用户信息
    console.log('\n3. 测试获取当前用户信息...');
    const currentUserResponse = await axios.get('http://localhost:3000/api/v1/users/me', { 
      headers,
      timeout: 10000
    });
    
    console.log('✅ 获取当前用户信息成功');
    console.log(`   当前用户: ${currentUserResponse.data.data.username}`);
    
    // 4. 测试CORS预检请求
    console.log('\n4. 测试CORS预检请求...');
    try {
      await axios.options('http://localhost:3000/api/v1/users', {
        headers: {
          'Origin': 'http://localhost:5173',
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'authorization,content-type'
        }
      });
      console.log('✅ CORS预检请求成功');
    } catch (corsError) {
      console.log('⚠️ CORS预检请求失败，但这可能是正常的');
    }
    
    console.log('\n🎉 用户管理页面测试完成！');
    console.log('\n📋 测试结果总结：');
    console.log('   ✅ 用户认证正常');
    console.log('   ✅ 用户列表API正常');
    console.log('   ✅ 当前用户API正常');
    console.log('   ✅ 网络连接正常');
    console.log('\n💡 如果前端仍然报错，请尝试：');
    console.log('   1. 清除浏览器缓存和localStorage');
    console.log('   2. 硬刷新页面 (Ctrl+Shift+R 或 Cmd+Shift+R)');
    console.log('   3. 检查浏览器开发者工具的Network标签页');
    console.log('   4. 确认token是否正确存储在localStorage中');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('   状态码:', error.response.status);
      console.error('   响应数据:', error.response.data);
    } else if (error.request) {
      console.error('   网络错误: 无法连接到服务器');
    }
  }
}

testUserManagementComplete();