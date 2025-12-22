const axios = require('axios');

// Test Xiaohongshu URL
const url = 'https://www.xiaohongshu.com/explore/64c8f9c0000000001a01f2b6';

async function analyzeJsonStructure() {
  console.log(`开始分析小红书URL的JSON结构: ${url}`);
  
  try {
    // Send request with proper headers
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        'Referer': 'https://www.xiaohongshu.com/'
      },
      timeout: 15000
    });
    
    const html = response.data;
    
    // Try multiple regex patterns to find JSON data
    const regexPatterns = [
      /window\.__INITIAL_STATE__\s*=\s*((?:\{[\s\S]*?\}))\s*;/,
      /window\.__INITIAL_STATE__\s*=\s*((?:\{[\s\S]*?\}))\s*<\/script>/,
      /window\.__INITIAL_DATA__\s*=\s*((?:\{[\s\S]*?\}))\s*;/,
      /window\.INITIAL_STATE\s*=\s*((?:\{[\s\S]*?\}))\s*;/,
      /__INITIAL_STATE__\s*=\s*((?:\{[\s\S]*?\}))\s*;/,
      /window\.__NOTE_DATA__\s*=\s*((?:\{[\s\S]*?\}))\s*;/,
      /window\.\$NOTE_DATA\s*=\s*((?:\{[\s\S]*?\}))\s*;/,
      /window\.__PAGE_DATA__\s*=\s*((?:\{[\s\S]*?\}))\s*;/,
      /"note"\s*:\s*\{[\s\S]*?\}/
    ];
    
    let foundJson = false;
    
    for (const regex of regexPatterns) {
      const match = html.match(regex);
      
      if (match && match[1]) {
        try {
          let jsonStr = match[1];
          
          console.log(`\n=== 找到JSON数据 (使用模式: ${regex.toString().substring(0, 50)}...) ===`);
          
          // If it's just a note object (not a full state), wrap it
          if (jsonStr.startsWith('{') && !jsonStr.includes('__INITIAL_STATE__')) {
            // Check if it's just a note object
            if (jsonStr.includes('"title"') || jsonStr.includes('"images"') || jsonStr.includes('"video"')) {
              console.log('检测到独立的note对象');
              const jsonData = JSON.parse(jsonStr);
              console.log('=== Note对象分析 ===');
              console.log('Note对象键:', Object.keys(jsonData));
              
              // Check for images
              if (jsonData.images) {
                console.log('✓ 包含images字段');
                if (Array.isArray(jsonData.images)) {
                  console.log(`   图片数量: ${jsonData.images.length}`);
                  jsonData.images.forEach((img, index) => {
                    console.log(`   图片 ${index + 1}:`, Object.keys(img));
                  });
                }
              }
              
              // Check for video
              if (jsonData.video) {
                console.log('✓ 包含video字段');
                console.log('   Video对象键:', Object.keys(jsonData.video));
              }
              
              foundJson = true;
              break;
            }
          } else {
            // Clean JSON string by removing undefined values
            jsonStr = jsonStr.replace(/:\s*undefined\s*(,|\})/g, ': null$1');
            jsonStr = jsonStr.replace(/:\s*undefined\s*\]/g, ': null]');
            
            // Handle trailing commas
            jsonStr = jsonStr.replace(/,\s*(\}|\])/g, '$1');
            
            const jsonData = JSON.parse(jsonStr);
            
            console.log('=== JSON结构分析 ===');
            console.log('JSON根级别键:', Object.keys(jsonData));
            
            // Check for common content paths
            console.log('\n=== 内容路径检查 ===');
            
            // Check different paths
            const pathsToCheck = [
              'notes',
              'note',
              'data.note',
              'state.note',
              'data.contents',
              'props.pageProps.note',
              '__NEXT_DATA__.props.pageProps.note',
              'data.noteDetail',
              'detail.note',
              'fe_data.note',
              'data.detail.note',
              'state.detail.note',
              '__data__.note',
              'note_data',
              'data.contents[0].content',
              'data.content',
              'content',
              'noteDetail.note',
              'fe_page.note',
              'pageData.note',
              'entryData.note.noteData',
              'initialData.note',
              'feed.items',
              'contentData.note',
              'store.note',
              'global.note',
              'page.note',
              'post.note',
              'article.note',
              'detail.noteDetail'
            ];
            
            pathsToCheck.forEach(path => {
              try {
                const value = path.split('.').reduce((obj, key) => {
                  // Handle array indices like [0]
                  const arrayMatch = key.match(/(.*)\[(\d+)\]/);
                  if (arrayMatch) {
                    const [, arrayKey, index] = arrayMatch;
                    return obj?.[arrayKey]?.[parseInt(index)];
                  }
                  return obj?.[key];
                }, jsonData);
                
                if (value) {
                  console.log(`✓ 路径存在: ${path}`);
                  console.log(`   类型: ${typeof value}`);
                  if (Array.isArray(value)) {
                    console.log(`   数组长度: ${value.length}`);
                  } else if (typeof value === 'object') {
                    console.log(`   对象键: ${Object.keys(value).join(', ')}`);
                  }
                }
              } catch (error) {
                // Ignore errors
              }
            });
            
            // Find all keys containing 'note' in the entire JSON
            console.log('\n=== 所有包含"note"的键 ===');
            function findNoteKeys(obj, currentPath = '') {
              if (typeof obj !== 'object' || obj === null) {
                return;
              }
              
              Object.keys(obj).forEach(key => {
                const newPath = currentPath ? `${currentPath}.${key}` : key;
                if (key.includes('note') || key.includes('Note')) {
                  console.log(`✓ 包含note的键: ${newPath}`);
                }
                
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                  findNoteKeys(obj[key], newPath);
                }
              });
            }
            
            findNoteKeys(jsonData);
            
            foundJson = true;
            break;
          }
          
        } catch (parseError) {
          console.error('JSON解析失败:', parseError.message);
          continue;
        }
      }
    }
    
    if (!foundJson) {
      console.error('未找到任何JSON数据');
      
      // Try to extract just the note content from HTML
      console.log('\n=== 尝试直接从HTML提取内容 ===');
      
      // Find note in HTML
      const noteRegex = /"note"\s*:\s*\{([\s\S]*?)\}/;
      const noteMatch = html.match(noteRegex);
      
      if (noteMatch && noteMatch[1]) {
        console.log('找到note内容片段:');
        console.log(noteMatch[1].substring(0, 500) + '...');
      }
    }
    
  } catch (error) {
    console.error('请求失败:', error.message);
  }
}

// Run analysis
analyzeJsonStructure();
