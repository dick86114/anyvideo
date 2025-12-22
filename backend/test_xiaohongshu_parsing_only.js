const ParseService = require('./src/services/ParseService');

/**
 * Test Xiaohongshu URL parsing functionality without download
 * This test focuses only on the parsing logic, not the actual download
 */
async function testXiaohongshuParsingOnly() {
  console.log('Testing Xiaohongshu parsing functionality only...');
  
  const testUrl = 'https://www.xiaohongshu.com/explore/69353db4000000001b030a5a?xsec_token=ABu4A_iISwNgzFD7qgSVTOwezPgp5HzTwpVKfG9tgbVU8=&xsec_source=pc_feed';
  
  console.log(`\nTest URL: ${testUrl}`);
  
  try {
    // Step 1: Parse the Xiaohongshu URL (only parsing, no download)
    console.log('\nStep 1: Parsing the Xiaohongshu URL...');
    const parsedData = await ParseService.parseXiaohongshuLink(testUrl);
    
    console.log('\n✅ Parsing successful! Extracted data:');
    console.log('--------------------------------------------------');
    console.log('Content ID:', parsedData.content_id);
    console.log('Title:', parsedData.title);
    console.log('Author:', parsedData.author);
    console.log('Description:', parsedData.description);
    console.log('Media Type:', parsedData.media_type);
    console.log('Media URL:', parsedData.media_url);
    console.log('Cover URL:', parsedData.cover_url);
    console.log('Images Count:', parsedData.all_images?.length || 0);
    console.log('--------------------------------------------------');
    
    // Step 2: Verify no fixed templates are used
    console.log('\nStep 2: Verifying no fixed templates are used...');
    
    // Check for fixed placeholders
    const hasFixedTemplates = parsedData.media_url.includes('w3schools.com') ||
                              parsedData.cover_url.includes('unsplash.com') ||
                              parsedData.content_id.startsWith('xiaohongshu_') && parsedData.content_id.length > 20;
    
    if (hasFixedTemplates) {
      console.log('❌ Fixed templates detected in parsed data!');
      process.exit(1);
    } else {
      console.log('✅ No fixed templates detected! All data is extracted from the page.');
    }
    
    // Step 3: Verify essential fields are extracted
    console.log('\nStep 3: Verifying essential fields are extracted...');
    
    const essentialFields = [
      { name: 'content_id', value: parsedData.content_id, required: true },
      { name: 'title', value: parsedData.title, required: true },
      { name: 'author', value: parsedData.author, required: true },
      { name: 'media_type', value: parsedData.media_type, required: true },
      { name: 'media_url', value: parsedData.media_url, required: true },
      { name: 'cover_url', value: parsedData.cover_url, required: true }
    ];
    
    let hasMissingFields = false;
    for (const field of essentialFields) {
      if (field.required && !field.value) {
        console.log(`❌ Missing essential field: ${field.name}`);
        hasMissingFields = true;
      } else if (field.value) {
        console.log(`✅ Found field: ${field.name}`);
      }
    }
    
    if (hasMissingFields) {
      process.exit(1);
    }
    
    console.log('\n🎉 All parsing tests passed!');
    return true;
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

// Run the test
testXiaohongshuParsingOnly();