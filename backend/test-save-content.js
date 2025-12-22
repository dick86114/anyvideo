#!/usr/bin/env node

const axios = require('axios');

async function testSaveContent() {
  console.log('Testing save content functionality...');
  
  const testUrl = 'https://www.xiaohongshu.com/explore/6948f1b6000000001e033c84?xsec_token=ABMgrfZDNkghfZFaXgfEExOE7WvQKOQufOKXqlWmIaI5c=&xsec_source=pc_search';
  
  try {
    console.log(`\nTesting save for URL: ${testUrl}`);
    
    // Test the save API endpoint
    const response = await axios.post('http://localhost:3000/api/v1/content/save', {
      link: testUrl,
      source_type: 1
    });
    
    console.log('\n=== Save API Response ===');
    console.log('Status:', response.status);
    console.log('Message:', response.data.message);
    console.log('Data:', response.data.data);
    
    console.log('\n✅ Save content test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Save content test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the test
testSaveContent().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Test execution failed:', error);
  process.exit(1);
});