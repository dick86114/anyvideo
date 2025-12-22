const { AppDataSource } = require('./src/data-source');

async function checkSpecificContent() {
  try {
    console.log('🔗 连接数据库...');
    
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    
    console.log('✅ 数据库连接成功\n');
    
    // 获取所有内容记录的详细信息
    const contentRepo = AppDataSource.getRepository('Content');
    const allContents = await contentRepo.find({
      order: { created_at: 'DESC' }
    });
    
    console.log(`📊 数据库中共有 ${allContents.length} 条内容记录:\n`);
    
    allContents.forEach((content, index) => {
      console.log(`${index + 1}. 内容详情:`);
      console.log(`   ID: ${content.id}`);
      console.log(`   标题: "${content.title}"`);
      console.log(`   作者: "${content.author}"`);
      console.log(`   描述: "${content.description}"`);
      console.log(`   平台: ${content.platform}`);
      console.log(`   媒体类型: ${content.media_type}`);
      console.log(`   来源类型: ${content.source_type}`);
      console.log(`   创建时间: ${content.created_at}`);
      console.log(`   原始链接: ${content.source_url}`);
      console.log('   ---\n');
    });
    
    // 检查是否包含测试数据特征
    const testContents = allContents.filter(content => 
      content.author === '小红书作者' || 
      content.description === '小红书内容' ||
      content.title.includes('模拟内容标题')
    );
    
    if (testContents.length > 0) {
      console.log(`⚠️  发现 ${testContents.length} 条疑似测试数据:`);
      testContents.forEach((content, index) => {
        console.log(`   ${index + 1}. 标题: "${content.title}" | 作者: "${content.author}" | 描述: "${content.description}"`);
      });
      
      console.log('\n🧹 是否需要删除这些测试数据？');
    } else {
      console.log('✅ 没有发现测试数据，所有记录都是真实内容');
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('\n🔌 数据库连接已关闭');
    }
  }
}

checkSpecificContent();