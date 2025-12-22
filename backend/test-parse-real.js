const axios = require('axios');
const cheerio = require('cheerio');

async function analyzeXiaohongshuPage(url) {
    try {
        console.log('分析小红书页面:', url);
        
        // 设置请求头
        const headers = {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
            'Referer': 'https://www.xiaohongshu.com/'
        };
        
        // 获取页面内容
        const response = await axios.get(url, { headers, timeout: 15000 });
        const html = response.data;
        
        // 分析页面结构
        console.log('\n=== 页面基本信息 ===');
        console.log('状态码:', response.status);
        console.log('页面长度:', html.length, '字符');
        
        // 查找所有script标签
        console.log('\n=== Script标签分析 ===');
        const $ = cheerio.load(html);
        const scripts = $('script');
        console.log('找到', scripts.length, '个script标签');
        
        // 查找包含关键数据的script标签
        console.log('\n=== 查找关键数据 ===');
        let hasNoteData = false;
        let hasInitialState = false;
        
        scripts.each((index, script) => {
            const content = $(script).html();
            if (content) {
                // 查找包含note数据的脚本
                if (content.includes('note') && content.includes('{') && content.length > 1000) {
                    hasNoteData = true;
                    console.log(`Script ${index} 包含note数据`);
                    // 输出前500字符
                    console.log('内容预览:', content.substring(0, 500), '...');
                }
                // 查找包含初始状态的脚本
                if (content.includes('__INITIAL_STATE__') || content.includes('__INITIAL_DATA__')) {
                    hasInitialState = true;
                    console.log(`Script ${index} 包含初始状态数据`);
                    // 输出前500字符
                    console.log('内容预览:', content.substring(0, 500), '...');
                }
            }
        });
        
        // 查找meta标签
        console.log('\n=== Meta标签分析 ===');
        const metaTitle = $('meta[name="title"]').attr('content') || $('meta[property="og:title"]').attr('content');
        const metaDesc = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content');
        const metaImage = $('meta[property="og:image"]').attr('content');
        
        console.log('Meta标题:', metaTitle);
        console.log('Meta描述:', metaDesc);
        console.log('Meta图片:', metaImage);
        
        // 查找主要内容元素
        console.log('\n=== 主要内容元素分析 ===');
        const contentSelectors = ['.note-main', '.note-content', '.detail-content', '.article-content'];
        contentSelectors.forEach(selector => {
            const elements = $(selector);
            if (elements.length > 0) {
                console.log(`找到${elements.length}个${selector}元素`);
            }
        });
        
        // 查找图片元素
        console.log('\n=== 图片元素分析 ===');
        const images = $('img');
        console.log('找到', images.length, '个img标签');
        
        // 输出前10个图片URL
        images.slice(0, 10).each((index, img) => {
            const src = $(img).attr('src') || $(img).attr('data-src') || $(img).attr('data-original');
            const className = $(img).attr('class') || '';
            if (src) {
                console.log(`图片${index}: ${src} (class: ${className})`);
            }
        });
        
        // 查找视频元素
        console.log('\n=== 视频元素分析 ===');
        const videos = $('video');
        console.log('找到', videos.length, '个video标签');
        videos.each((index, video) => {
            const src = $(video).attr('src') || $(video).attr('data-src');
            console.log(`视频${index}: ${src}`);
        });
        
        // 查找note相关的div
        console.log('\n=== Note相关元素 ===');
        const noteDivs = $('[class*="note"], [data-type="note"]');
        console.log('找到', noteDivs.length, '个note相关元素');
        noteDivs.slice(0, 5).each((index, div) => {
            const className = $(div).attr('class') || '';
            const dataType = $(div).attr('data-type') || '';
            console.log(`Note元素${index}: class=${className}, data-type=${dataType}`);
        });
        
        // 返回分析结果
        return {
            hasNoteData,
            hasInitialState,
            metaTitle,
            metaDesc,
            metaImage,
            scriptCount: scripts.length,
            imageCount: images.length,
            videoCount: videos.length
        };
        
    } catch (error) {
        console.error('分析页面失败:', error.message);
        return null;
    }
}

// 测试真实的小红书URL
const realUrls = [
    // 替换为真实的小红书URL
    'https://www.xiaohongshu.com/explore/651a2b3c4d5e6f7g8h9i0j1k'
];

async function runTests() {
    for (const url of realUrls) {
        await analyzeXiaohongshuPage(url);
        console.log('\n' + '='.repeat(50) + '\n');
    }
}

runTests();
