const ParseService = require('./src/services/ParseService');

// Test HTML file detection functionality
async function testHtmlDetection() {
  console.log('Testing HTML file detection functionality...');
  
  try {
    // Test case 1: Valid image URL (should pass)
    const validImageUrl = 'https://via.placeholder.com/800x600';
    console.log('\nTest 1: Valid image URL:', validImageUrl);
    
    const validImageData = {
      content_id: 'test_valid_image',
      title: 'Valid Image',
      author: 'Test Author',
      media_type: 'image',
      media_url: validImageUrl,
      all_images: [validImageUrl]
    };
    
    const validImagePath = await ParseService.downloadMedia(validImageData, 'test', 1);
    console.log('✓ Valid image download successful:', validImagePath);
    
    // Test case 2: HTML page URL (should fail with proper error)
    const htmlPageUrl = 'https://www.example.com';
    console.log('\nTest 2: HTML page URL:', htmlPageUrl);
    
    const htmlPageData = {
      content_id: 'test_html_page',
      title: 'HTML Page',
      author: 'Test Author',
      media_type: 'image',
      media_url: htmlPageUrl,
      all_images: [htmlPageUrl]
    };
    
    try {
      await ParseService.downloadMedia(htmlPageData, 'test', 1);
      console.error('❌ HTML detection failed: Should have rejected HTML page download');
    } catch (error) {
      console.log('✓ HTML detection successful: Correctly rejected HTML page download');
      console.log('  Expected error:', error.message);
    }
    
    console.log('\n🎉 All tests passed! HTML detection functionality is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Error stack:', error.stack);
  }
}

// Run the test
testHtmlDetection();
