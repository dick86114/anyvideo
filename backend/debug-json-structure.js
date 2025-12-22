const EnhancedXiaohongshuParser = require('./src/services/EnhancedXiaohongshuParser');
const fs = require('fs-extra');

async function debugJsonStructure() {
  console.log('=== 调试JSON结构 ===\n');
  
  const testUrl = process.argv[2] || 'https://www.xiaohongshu.com/explore/6682c4b8000000000a03a78e';
  
  try {
    const parser = new EnhancedXiaohongshuParser();
    
    // 获取页面内容
    const headers = parser.getEnhancedHeaders(testUrl);
    const axios = require('axios');
    
    console.log('📡 发送HTTP请求...');
    const response = await axios.get(testUrl, {
      headers,
      timeout: 15000,
      maxRedirects: 5
    });
    
    console.log(`✅ 成功获取页面内容，长度: ${response.data.length}`);
    
    // 提取JSON数据
    const jsonData = parser.extractJsonData(response.data);
    
    if (jsonData) {
      console.log('\n🔍 JSON数据结构分析:');
      console.log('顶级键:', Object.keys(jsonData));
      
      // 保存完整JSON到文件以便分析
      await fs.writeFile('debug-json-output.json', JSON.stringify(jsonData, null, 2));
      console.log('✅ 完整JSON已保存到 debug-json-output.json');
      
      // 分析每个顶级键
      Object.keys(jsonData).forEach(key => {
        const value = jsonData[key];
        console.log(`\n键 "${key}":`);
        console.log(`  类型: ${typeof value}`);
        
        if (typeof value === 'object' && value !== null) {
          if (Array.isArray(value)) {
            console.log(`  数组长度: ${value.length}`);
            if (value.length > 0) {
              console.log(`  第一个元素类型: ${typeof value[0]}`);
              if (typeof value[0] === 'object') {
                console.log(`  第一个元素键: ${Object.keys(value[0]).slice(0, 5).join(', ')}`);
              }
            }
          } else {
            const subKeys = Object.keys(value);
            console.log(`  子键数量: ${subKeys.length}`);
            console.log(`  子键: ${subKeys.slice(0, 10).join(', ')}`);
            
            // 特别检查noteData
            if (key === 'noteData') {
              console.log('\n  📋 noteData详细分析:');
              if (value.noteDetailMap) {
                const noteIds = Object.keys(value.noteDetailMap);
                console.log(`    noteDetailMap包含 ${noteIds.length} 个note ID`);
                if (noteIds.length > 0) {
                  const firstNoteId = noteIds[0];
                  const firstNote = value.noteDetailMap[firstNoteId];
                  console.log(`    第一个note ID: ${firstNoteId}`);
                  console.log(`    第一个note键: ${Object.keys(firstNote).join(', ')}`);
                  
                  if (firstNote.note) {
                    console.log(`    note对象键: ${Object.keys(firstNote.note).slice(0, 10).join(', ')}`);
                    
                    // 检查图片相关字段
                    const noteObj = firstNote.note;
                    if (noteObj.imageList) {
                      console.log(`    ✅ 找到imageList，包含 ${noteObj.imageList.length} 张图片`);
                    }
                    if (noteObj.images) {
                      console.log(`    ✅ 找到images，包含 ${noteObj.images.length} 张图片`);
                    }
                    if (noteObj.image_list) {
                      console.log(`    ✅ 找到image_list，包含 ${noteObj.image_list.length} 张图片`);
                    }
                  }
                }
              }
            }
          }
        }
      });
      
      // 尝试使用解析器查找内容数据
      console.log('\n🔍 尝试查找内容数据...');
      const contentData = parser.findContentData(jsonData);
      
      if (contentData) {
        console.log('✅ 成功找到内容数据!');
        console.log('内容数据键:', Object.keys(contentData).slice(0, 15).join(', '));
        
        if (contentData.title) {
          console.log(`标题: ${contentData.title}`);
        }
        if (contentData.imageList) {
          console.log(`图片列表: ${contentData.imageList.length} 张`);
        }
        if (contentData.images) {
          console.log(`图片数组: ${contentData.images.length} 张`);
        }
      } else {
        console.log('❌ 未能找到内容数据');
      }
      
    } else {
      console.log('❌ 未能提取到JSON数据');
    }
    
  } catch (error) {
    console.error('❌ 调试失败:', error.message);
  }
}

debugJsonStructure();