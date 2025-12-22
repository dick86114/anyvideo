const ParseService = require('./src/services/ParseService');

// Test media download functionality
async function testMediaDownload() {
  console.log('Testing media download functionality...');
  
  try {
    // Test case 1: Valid image URL
    const testImageUrl = 'https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?w=800&h=600&fit=crop&crop=center';
    console.log('\nTest 1: Downloading valid image from URL:', testImageUrl);
    
    const imageParsedData = {
      content_id: 'test_image_123',
      title: 'Test Image',
      author: 'Test Author',
      media_type: 'image',
      media_url: testImageUrl,
      all_images: [testImageUrl]
    };
    
    const imageFilePath = await ParseService.downloadMedia(imageParsedData, 'test', 1);
    console.log('✓ Image download successful:', imageFilePath);
    
    // Test case 2: Valid video URL
    const testVideoUrl = 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4';
    console.log('\nTest 2: Downloading valid video from URL:', testVideoUrl);
    
    const videoParsedData = {
      content_id: 'test_video_456',
      title: 'Test Video',
      author: 'Test Author',
      media_type: 'video',
      media_url: testVideoUrl,
      all_images: [testImageUrl] // Cover image
    };
    
    const videoFilePath = await ParseService.downloadMedia(videoParsedData, 'test', 1);
    console.log('✓ Video download successful:', videoFilePath);
    
    console.log('\n🎉 All tests passed! Media download functionality is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Error stack:', error.stack);
  }
}

// Run the test
testMediaDownload();
