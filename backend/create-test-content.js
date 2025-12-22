const { AppDataSource } = require('./src/data-source');

async function createTestContent() {
  try {
    console.log('🔗 连接数据库...');
    
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    
    console.log('✅ 数据库连接成功\n');
    
    const contentRepo = AppDataSource.getRepository('Content');
    
    // Create diverse test content to test filtering
    const testContents = [
      {
        platform: 'xiaohongshu',
        content_id: 'xhs_001',
        title: '美食分享：家常菜制作教程',
        author: '美食达人小王',
        description: '分享一些简单易学的家常菜制作方法',
        media_type: 'video',
        file_path: 'xiaohongshu/cooking_tutorial.mp4',
        cover_url: 'https://via.placeholder.com/400x300?text=美食视频',
        all_images: JSON.stringify(['https://via.placeholder.com/400x300?text=美食1', 'https://via.placeholder.com/400x300?text=美食2']),
        source_url: 'https://www.xiaohongshu.com/explore/xhs_001',
        source_type: 1,
        created_at: new Date('2025-12-20T10:00:00Z')
      },
      {
        platform: 'douyin',
        content_id: 'dy_001',
        title: '旅行攻略：三亚海滩游玩指南',
        author: '旅行博主小李',
        description: '三亚最美海滩推荐和游玩攻略',
        media_type: 'image',
        file_path: 'douyin/sanya_beach.jpg',
        cover_url: 'https://via.placeholder.com/400x300?text=三亚海滩',
        all_images: JSON.stringify(['https://via.placeholder.com/400x300?text=海滩1', 'https://via.placeholder.com/400x300?text=海滩2', 'https://via.placeholder.com/400x300?text=海滩3']),
        source_url: 'https://www.douyin.com/video/dy_001',
        source_type: 1,
        created_at: new Date('2025-12-21T14:30:00Z')
      },
      {
        platform: 'bilibili',
        content_id: 'bili_001',
        title: '编程教程：JavaScript基础入门',
        author: '程序员小张',
        description: 'JavaScript编程语言基础知识讲解',
        media_type: 'video',
        file_path: 'bilibili/js_tutorial.mp4',
        cover_url: 'https://via.placeholder.com/400x300?text=编程教程',
        all_images: JSON.stringify(['https://via.placeholder.com/400x300?text=代码1']),
        source_url: 'https://www.bilibili.com/video/bili_001',
        source_type: 2,
        created_at: new Date('2025-12-22T09:15:00Z')
      },
      {
        platform: 'xiaohongshu',
        content_id: 'xhs_002',
        title: '护肤心得：冬季保湿技巧',
        author: '美妆博主小刘',
        description: '冬季护肤保湿的实用技巧分享',
        media_type: 'image',
        file_path: 'xiaohongshu/skincare_tips.jpg',
        cover_url: 'https://via.placeholder.com/400x300?text=护肤产品',
        all_images: JSON.stringify(['https://via.placeholder.com/400x300?text=护肤1', 'https://via.placeholder.com/400x300?text=护肤2']),
        source_url: 'https://www.xiaohongshu.com/explore/xhs_002',
        source_type: 1,
        created_at: new Date('2025-12-22T16:45:00Z')
      },
      {
        platform: 'kuaishou',
        content_id: 'ks_001',
        title: '健身训练：居家运动指南',
        author: '健身教练小陈',
        description: '适合在家进行的健身训练动作',
        media_type: 'video',
        file_path: 'kuaishou/home_workout.mp4',
        cover_url: 'https://via.placeholder.com/400x300?text=健身训练',
        all_images: JSON.stringify(['https://via.placeholder.com/400x300?text=健身1']),
        source_url: 'https://www.kuaishou.com/video/ks_001',
        source_type: 2,
        created_at: new Date('2025-12-22T08:20:00Z')
      }
    ];
    
    console.log(`📝 准备创建 ${testContents.length} 条测试内容...\n`);
    
    for (const [index, contentData] of testContents.entries()) {
      const content = contentRepo.create(contentData);
      await contentRepo.save(content);
      console.log(`✅ ${index + 1}. 创建成功: "${contentData.title}" (${contentData.platform})`);
    }
    
    console.log(`\n🎉 成功创建 ${testContents.length} 条测试内容！`);
    
    // 验证创建结果
    const totalCount = await contentRepo.count();
    console.log(`📊 数据库中现有内容总数: ${totalCount} 条`);
    
  } catch (error) {
    console.error('❌ 创建测试内容失败:', error);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('\n🔌 数据库连接已关闭');
    }
  }
}

createTestContent();