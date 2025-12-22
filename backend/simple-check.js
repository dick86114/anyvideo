const { AppDataSource } = require('./src/data-source');

async function simpleCheck() {
  try {
    console.log('🔗 连接数据库...');
    
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    
    console.log('✅ 数据库连接成功');
    
    // Check CrawlTask table for test data
    const crawlTaskRepo = AppDataSource.getRepository('CrawlTask');
    const allTasks = await crawlTaskRepo.find();
    
    console.log(`📊 CrawlTask 表中共有 ${allTasks.length} 条记录`);
    
    if (allTasks.length > 0) {
      console.log('\n所有任务:');
      allTasks.forEach((task, index) => {
        console.log(`${index + 1}. 任务名: "${task.name}"`);
        console.log(`   平台: ${task.platform}`);
        console.log(`   状态: ${task.status}`);
        console.log(`   目标: ${task.target_identifier}`);
        console.log(`   创建时间: ${task.created_at}`);
        console.log('   ---');
      });
      
      // Check for test data
      const testTasks = allTasks.filter(task => 
        task.name.includes('模拟内容标题') || 
        task.name.includes('测试') ||
        task.name.includes('Test') ||
        task.name.includes('Mock')
      );
      
      if (testTasks.length > 0) {
        console.log(`\n⚠️  发现 ${testTasks.length} 条测试任务:`);
        testTasks.forEach((task, index) => {
          console.log(`${index + 1}. "${task.name}" (${task.platform})`);
        });
      }
    }
    
    // Also check Content table again
    const contentRepo = AppDataSource.getRepository('Content');
    const allContents = await contentRepo.find();
    
    console.log(`\n📊 Content 表中共有 ${allContents.length} 条记录`);
    
    if (allContents.length > 0) {
      console.log('\n所有内容:');
      allContents.forEach((content, index) => {
        console.log(`${index + 1}. 标题: "${content.title}"`);
        console.log(`   作者: ${content.author}`);
        console.log(`   平台: ${content.platform}`);
        console.log('   ---');
      });
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

simpleCheck();