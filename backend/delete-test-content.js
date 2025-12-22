const { AppDataSource } = require('./src/data-source');

async function deleteTestContent() {
  try {
    console.log('🔗 连接数据库...');
    
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    
    console.log('✅ 数据库连接成功\n');
    
    // 删除包含测试数据特征的记录
    const contentRepo = AppDataSource.getRepository('Content');
    
    const testContents = await contentRepo.find({
      where: [
        { author: '小红书作者' },
        { description: '小红书内容' }
      ]
    });
    
    if (testContents.length > 0) {
      console.log(`🧹 发现 ${testContents.length} 条测试数据，准备删除:`);
      
      testContents.forEach((content, index) => {
        console.log(`   ${index + 1}. 标题: "${content.title}" | 作者: "${content.author}" | 描述: "${content.description}"`);
      });
      
      await contentRepo.remove(testContents);
      console.log(`\n✅ 已删除 ${testContents.length} 条测试数据`);
    } else {
      console.log('✅ 没有发现测试数据');
    }
    
    // 验证删除结果
    const remainingCount = await contentRepo.count();
    console.log(`\n📊 数据库中剩余内容记录: ${remainingCount} 条`);
    
  } catch (error) {
    console.error('❌ 删除失败:', error);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('\n🔌 数据库连接已关闭');
    }
  }
}

deleteTestContent();