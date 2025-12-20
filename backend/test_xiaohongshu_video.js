const ParseService = require('./src/services/ParseService');

// Test Xiaohongshu video parsing functionality
async function testXiaohongshuVideoParsing() {
  console.log('Testing Xiaohongshu video parsing functionality...');
  
  // User provided URL
  const testUrl = 'https://www.xiaohongshu.com/explore/69353db4000000001b030a5a?xsec_token=ABu4A_iISwNgzFD7qgSVTOwezPgp5HzTwpVKfG9tgbVU8=&xsec_source=pc_feed';
  
  // Local video URL for testing (more reliable than external sample videos)
  const localTestVideoUrl = 'https://www.w3schools.com/html/mov_bbb.mp4';
  
  try {
    console.log('\nTest URL:', testUrl);
    console.log('\nStep 1: Parsing the Xiaohongshu URL...');
    
    // Parse the link
    const parsedData = await ParseService.parseLink(testUrl);
    
    console.log('✓ Link parsing successful!');
    console.log('\nParsing Results:');
    console.log('  Media Type:', parsedData.media_type);
    console.log('  Title:', parsedData.title);
    console.log('  Author:', parsedData.author);
    console.log('  Cover URL:', parsedData.cover_url);
    console.log('  Media URL:', parsedData.media_url);
    console.log('  All Images:', parsedData.all_images.length);
    
    // Check if it's a video
    if (parsedData.media_type === 'video') {
      console.log('\n✅ Video content detected!');
      
      // Step 2: Download the video
      console.log('\nStep 2: Downloading the video...');
      const filePath = await ParseService.downloadMedia(parsedData, 'xiaohongshu', 1);
      
      console.log('✓ Video download successful!');
      console.log('  Saved to:', filePath);
      
      console.log('\n🎉 Test completed successfully!');
      console.log('\nSummary:');
      console.log('  - URL parsed successfully');
      console.log('  - Video content detected');
      console.log('  - Video downloaded successfully');
      console.log('  - File saved locally');
    } else {
      console.log('\n⚠️  Not a video content. Media type:', parsedData.media_type);
      
      // Step 2: Download the image content
      console.log('\nStep 2: Downloading the image content...');
      const filePath = await ParseService.downloadMedia(parsedData, 'xiaohongshu', 1);
      
      console.log('✓ Image content download successful!');
      console.log('  Saved to:', filePath);
      
      console.log('\n🎉 Test completed successfully!');
      console.log('\nSummary:');
      console.log('  - URL parsed successfully');
      console.log('  - Image content detected');
      console.log('  - Image downloaded successfully');
      console.log('  - File saved locally');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nError Details:');
    console.error('  Stack:', error.stack);
    
    if (error.response) {
      console.error('  Response Status:', error.response.status);
      console.error('  Response Headers:', error.response.headers);
      console.error('  Response Data:', error.response.data?.substring(0, 500) + '...');
    } else if (error.request) {
      console.error('  Request:', error.request);
    }
    
    console.error('\n🚨 Test failed to parse Xiaohongshu URL');
  }
}

// Run the test
testXiaohongshuVideoParsing();
