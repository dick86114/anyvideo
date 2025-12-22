const ParseService = require('./src/services/ParseService');

async function testXiaohongshuParse() {
    // 测试小红书URL
    const testUrl = 'https://www.xiaohongshu.com/explore/651a2b3c4d5e6f7g8h9i0j1k';
    
    try {
        console.log('测试小红书URL解析：', testUrl);
        const result = await ParseService.parseLink(testUrl);
        console.log('解析结果：', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('解析失败：', error.message);
    }
}

testXiaohongshuParse();
