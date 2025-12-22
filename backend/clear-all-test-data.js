const { AppDataSource } = require('./src/data-source');

async function clearAllTestData() {
  try {
    console.log('🔗 连接数据库...');
    
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    
    console.log('✅ 数据库连接成功\n');
    
    // 定义测试数据的特征模式
    const testPatterns = [
      '模拟内容标题',
      '测试',
      'Test',
      'Mock',
      'Sample',
      '小红书作者',
      '小红书内容'
    ];
    
    let totalDeleted = 0;
    
    // 检查并清理 Content 表
    console.log('🔍 检查 Content 表...');
    const contentRepo = AppDataSource.getRepository('Content');
    
    for (const pattern of testPatterns) {
      const queryBuilder = contentRepo.createQueryBuilder('content');
      
      // 构建查询条件
      const testContents = await queryBuilder
        .where('content.title LIKE :pattern', { pattern: `%${pattern}%` })
        .orWhere('content.author LIKE :pattern', { pattern: `%${pattern}%` })
        .orWhere('content.description LIKE :pattern', { pattern: `%${pattern}%` })
        .getMany();
      
      if (testContents.length > 0) {
        console.log(`   发现 ${testContents.length} 条包含"${pattern}"的记录`);
        
        // 显示要删除的记录
        testContents.forEach((content, index) => {
          console.log(`   ${index + 1}. 标题: "${content.title}" | 作者: "${content.author}"`);
        });
        
        // 删除记录
        await contentRepo.remove(testContents);
        totalDeleted += testContents.length;
        console.log(`   ✅ 已删除 ${testContents.length} 条记录\n`);
      }
    }
    
    // 检查并清理 CrawlTask 表
    console.log('🔍 检查 CrawlTask 表...');
    const taskRepo = AppDataSource.getRepository('CrawlTask');
    
    for (const pattern of testPatterns) {
      const queryBuilder = taskRepo.createQueryBuilder('task');
      
      const testTasks = await queryBuilder
        .where('task.name LIKE :pattern', { pattern: `%${pattern}%` })
        .getMany();
      
      if (testTasks.length > 0) {
        console.log(`   发现 ${testTasks.length} 条包含"${pattern}"的任务`);
        
        testTasks.forEach((task, index) => {
          console.log(`   ${index + 1}. 任务名: "${task.name}"`);
        });
        
        await taskRepo.remove(testTasks);
        totalDeleted += testTasks.length;
        console.log(`   ✅ 已删除 ${testTasks.length} 条任务\n`);
      }
    }
    
    // 检查并清理 TaskLog 表
    console.log('🔍 检查 TaskLog 表...');
    const logRepo = AppDataSource.getRepository('TaskLog');
    
    for (const pattern of testPatterns) {
      const queryBuilder = logRepo.createQueryBuilder('log');
      
      const testLogs = await queryBuilder
        .where('log.task_name LIKE :pattern', { pattern: `%${pattern}%` })
        .orWhere('log.error LIKE :pattern', { pattern: `%${pattern}%` })
        .getMany();
      
      if (testLogs.length > 0) {
        console.log(`   发现 ${testLogs.length} 条包含"${pattern}"的日志`);
        await logRepo.remove(testLogs);
        totalDeleted += testLogs.length;
        console.log(`   ✅ 已删除 ${testLogs.length} 条日志\n`);
      }
    }
    
    console.log(`\n🎉 清理完成！共删除 ${totalDeleted} 条测试数据\n`);
    
    // 验证清理结果
    console.log('📊 验证清理结果...\n');
    
    const contentCount = await contentRepo.count();
    const taskCount = await taskRepo.count();
    const logCount = await logRepo.count();
    
    console.log(`Content 表剩余记录: ${contentCount}`);
    console.log(`CrawlTask 表剩余记录: ${taskCount}`);
    console.log(`TaskLog 表剩余记录: ${logCount}`);
    
    // 显示剩余的内容（如果有）
    if (contentCount > 0) {
      console.log('\n剩余内容预览:');
      const remainingContents = await contentRepo.find({
        take: 5,
        order: { created_at: 'DESC' }
      });
      
      remainingContents.forEach((content, index) => {
        console.log(`   ${index + 1}. 标题: "${content.title}" | 作者: "${content.author}" | 平台: ${content.platform}`);
      });
    }
    
  } catch (error) {
    console.error('❌ 清理失败:', error);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('\n🔌 数据库连接已关闭');
    }
  }
}

clearAllTestData();
