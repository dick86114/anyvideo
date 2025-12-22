#!/usr/bin/env node

const axios = require('axios');

async function testAPIEndpoint() {
  console.log('Testing API endpoint with SDK integration...');
  
  const testUrl = 'https://www.xiaohongshu.com/explore/6948f1b6000000001e033c84?xsec_token=ABMgrfZDNkghfZFaXgfEExOE7WvQKOQufOKXqlWmIaI5c=&xsec_source=pc_search';
  
  try {
    console.log(`\nTesting URL: ${testUrl}`);
    
    // Test the parse API endpoint
    const response = await axios.post('http://localhost:3000/api/v1/content/parse', {
      link: testUrl
    });
    
    console.log('\n=== API Response ===');
    console.log('Status:', response.status);
    console.log('Message:', response.data.message);
    console.log('Platform:', response.data.platform);
    console.log('Title:', response.data.title);
    console.log('Author:', response.data.author);
    console.log('Media Type:', response.data.media_type);
    console.log('Content ID:', response.data.content_id);
    console.log('Cover URL:', response.data.cover_url ? 'Present' : 'Missing');
    console.log('Media URL:', response.data.media_url ? 'Present' : 'Missing');
    console.log('All Images Count:', response.data.all_images ? response.data.all_images.length : 0);
    
    if (response.data.all_images && response.data.all_images.length > 0) {
      console.log('\n=== Image URLs ===');
      response.data.all_images.forEach((url, index) => {
        console.log(`Image ${index + 1}: ${url.substring(0, 80)}...`);
      });
    }
    
    console.log('\n✅ API endpoint test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ API endpoint test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the test
testAPIEndpoint().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Test execution failed:', error);
  process.exit(1);
});