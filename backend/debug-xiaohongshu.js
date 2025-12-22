const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs-extra');
const path = require('path');

async function debugXiaohongshu(url) {
  console.log('=== 小红书链接调试分析 ===');
  console.log(`🔗 目标URL: ${url}`);
  
  try {
    console.log('📡 开始获取页面内容...');
    
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Connection': 'keep-alive'
    };
    
    const response = await axios.get(url, {
      headers,
      timeout: 15000
    });
    
    console.log(`✅ 页面获取成功，状态码: ${response.status}`);
    console.log(`📄 内容长度: ${response.data.length} 字符`);
    
    const html = response.data;
    const $ = cheerio.load(html);
    
    // 基本信息
    const title = $('title').text();
    console.log(`📝 页面标题: ${title}`);
    
    // 查找JSON数据
    console.log('🔍 查找JSON数据...');
    
    const initialStateMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\})(?=\s*;|\s*<\/script>)/);
    
    if (initialStateMatch) {
      console.log('✅ 找到 __INITIAL_STATE__ 数据');
      
      try {
        let jsonStr = initialStateMatch[1];
        jsonStr = jsonStr.replace(/:\s*undefined\s*(,|\}|\])/g, ': null$1');
        jsonStr = jsonStr.replace(/,\s*(\}|\])/g, '$1');
        
        const jsonData = JSON.parse(jsonStr);
        console.log(`✅ JSON解析成功`);
        console.log(`🔑 顶级键: ${Object.keys(jsonData).slice(0, 10).join(', ')}`);
        
        // 查找note数据
        let noteData = null;
        
        if (jsonData.note && jsonData.note.noteDetailMap) {
          const noteIds = Object.keys(jsonData.note.noteDetailMap);
          if (noteIds.length > 0) {
            noteData = jsonData.note.noteDetailMap[noteIds[0]].note;
            console.log('✅ 找到note数据');
          }
        }
        
        if (noteData) {
          console.log(`📝 标题: ${noteData.title || '未找到'}`);
          console.log(`👤 作者: ${noteData.user?.nickname || '未找到'}`);
          console.log(`📄 描述: ${(noteData.desc || '未找到').substring(0, 100)}`);
          
          if (noteData.imageList && Array.isArray(noteData.imageList)) {
            console.log(`🖼️  图片数量: ${noteData.imageList.length}`);
            
            noteData.imageList.forEach((img, index) => {
              console.log(`图片 ${index + 1}:`);
              console.log(`  url_default: ${img.url_default || '无'}`);
              console.log(`  url_pre: ${img.url_pre || '无'}`);
              console.log(`  url: ${img.url || '无'}`);
              
              if (img.stream) {
                console.log(`  包含视频流数据`);
              }
            });
          } else {
            console.log('❌ 未找到imageList');
          }
        } else {
          console.log('❌ 未找到note数据');
        }
        
      } catch (parseError) {
        console.log(`❌ JSON解析失败: ${parseError.message}`);
      }
    } else {
      console.log('❌ 未找到 __INITIAL_STATE__ 数据');
    }
    
  } catch (error) {
    console.error('❌ 调试过程中发生错误:', error.message);
    
    if (error.response) {
      console.log(`📡 HTTP状态: ${error.response.status}`);
    }
  }
}

// 运行调试
if (require.main === module) {
  const testUrl = process.argv[2] || 'https://www.xiaohongshu.com/explore/694269d1000000001f00dc48';
  
  debugXiaohongshu(testUrl)
    .then(() => {
      console.log('🎉 调试完成！');
    })
    .catch((error) => {
      console.error('调试失败:', error);
    });
}

module.exports = { debugXiaohongshu };