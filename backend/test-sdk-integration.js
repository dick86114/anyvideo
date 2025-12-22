#!/usr/bin/env node

const ParseService = require('./src/services/ParseService');

async function testSDKIntegration() {
  console.log('Testing SDK integration...');
  
  // Test Xiaohongshu URL
  const testUrl = 'https://www.xiaohongshu.com/explore/6948f1b6000000001e033c84?xsec_token=ABMgrfZDNkghfZFaXgfEExOE7WvQKOQufOKXqlWmIaI5c=&xsec_source=pc_search';
  
  try {
    console.log(`\nTesting URL: ${testUrl}`);
    
    // Test parsing
    const result = await ParseService.parseLink(testUrl);
    console.log('\n=== Parse Result ===');
    console.log('Platform:', result.platform);
    console.log('Title:', result.title);
    console.log('Author:', result.author);
    console.log('Media Type:', result.media_type);
    console.log('Has Live Photo:', result.has_live_photo);
    console.log('All Images Count:', result.all_images ? result.all_images.length : 0);
    console.log('Cover URL:', result.cover_url ? 'Present' : 'Missing');
    console.log('Media URL:', result.media_url ? 'Present' : 'Missing');
    
    if (result.all_images && result.all_images.length > 0) {
      console.log('\n=== Image URLs ===');
      result.all_images.forEach((url, index) => {
        console.log(`Image ${index + 1}: ${url.substring(0, 80)}...`);
      });
    }
    
    console.log('\n✅ SDK integration test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ SDK integration test failed:');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testSDKIntegration().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Test execution failed:', error);
  process.exit(1);
});