// Simple test script to verify API connectivity from frontend perspective
import axios from 'axios';

const testAPI = async () => {
  try {
    console.log('Testing frontend API connectivity...');
    
    // Test login first
    console.log('1. Testing login...');
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      username: 'admin',
      password: '123456'
    }, {
      headers: {
        'Origin': 'http://localhost:5173',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Login successful');
    const token = loginResponse.data.data.token;
    
    // Test users API
    console.log('2. Testing users API...');
    const usersResponse = await axios.get('http://localhost:3000/api/v1/users', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Origin': 'http://localhost:5173'
      },
      timeout: 10000
    });
    
    console.log('✅ Users API successful');
    console.log('Response:', usersResponse.data);
    
  } catch (error) {
    console.error('❌ API test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('Network error - no response received');
      console.error('Request config:', error.config);
    } else {
      console.error('Error:', error.message);
    }
  }
};

testAPI();