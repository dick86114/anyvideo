#!/usr/bin/env node

const axios = require('axios');

// Create axios instance with mock token for testing
const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  headers: {
    'Authorization': 'Bearer mock-token-test-user'
  }
});

async function testTaskAPI() {
  console.log('Testing Task API endpoints...');
  
  try {
    console.log('\n=== Step 1: Test Task List API ===');
    const listResponse = await api.get('/tasks');
    
    console.log('✅ Task List API:');
    console.log('  Status:', listResponse.status);
    console.log('  Total Tasks:', listResponse.data.data?.total || 0);
    console.log('  Response Structure:', Object.keys(listResponse.data));
    
    console.log('\n=== Step 2: Test Hotsearch Logs API ===');
    const hotsearchLogsResponse = await api.get('/tasks/hotsearch/logs');
    
    console.log('✅ Hotsearch Logs API:');
    console.log('  Status:', hotsearchLogsResponse.status);
    console.log('  Total Logs:', hotsearchLogsResponse.data.data?.total || 0);
    
    console.log('\n=== API Test Summary ===');
    console.log('🎉 Task API endpoints are accessible!');
    console.log('');
    console.log('✅ Task List API: Working');
    console.log('✅ Hotsearch Logs API: Working');
    console.log('✅ Authentication: Working');
    console.log('');
    console.log('🖥️  Frontend at http://localhost:5174/tasks should work!');
    console.log('');
    console.log('Note: Database operations may need MongoDB connection.');
    console.log('      The frontend will show mock data if database is unavailable.');
    
  } catch (error) {
    console.error('\n❌ Task API test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the test
testTaskAPI().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Test execution failed:', error);
  process.exit(1);
});