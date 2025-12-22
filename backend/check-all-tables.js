const { AppDataSource } = require('./src/data-source');

async function checkAllTables() {
  try {
    console.log('🔗 连接数据库...');
    
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    
    console.log('✅ 数据库连接成功\n');
    
    // Check all tables
    const tables = [
      { name: 'Content', tableName: 'contents' },
      { name: 'CrawlTask', tableName: 'crawl_tasks' },
      { name: 'TaskLog', tableName: 'task_logs' },
      { name: 'HotsearchSnapshot', tableName: 'hotsearch_snapshots' },
      { name: 'PlatformAccount', tableName: 'platform_accounts' },
      { name: 'PlatformCookie', tableName: 'platform_cookies' },
      { name: 'SystemSettings', tableName: 'system_settings' },
      { name: 'User', tableName: 'users' }
    ];
    
    for (const table of tables) {
      try {
        const repository = AppDataSource.getRepository(table.name);
        const count = await repository.count();
        
        console.log(`📊 ${table.name} (${table.tableName}): ${count} 条记录`);
        
        if (count > 0) {
          const records = await repository.find({
            take: 5,
            order: { created_at: 'DESC' }
          });
          
          console.log(`   预览前 ${Math.min(count, 5)} 条:`);
          records.forEach((record, index) => {
            // Display relevant fields based on table type
            if (table.name === 'Content') {
              console.log(`   ${index + 1}. 标题: "${record.title}" (${record.platform})`);
            } else if (table.name === 'CrawlTask') {
              console.log(`   ${index + 1}. 任务名: "${record.name}" - 平台: ${record.platform}`);
            } else if (table.name === 'TaskLog') {
              console.log(`   ${index + 1}. 日志: ${record.message}`);
            } else {
              // Generic display for other tables
              const keys = Object.keys(record);
              const displayKey = keys.find(k => k.includes('name') || k.includes('title')) || keys[1] || keys[0];
              console.log(`   ${index + 1}. ${displayKey}: ${record[displayKey]}`);
            }
          });
        }
        console.log('');
        
      } catch (error) {
        console.log(`❌ 检查 ${table.name} 表失败: ${error.message}\n`);
      }
    }
    
    // Special check for test data patterns
    console.log('🔍 查找包含"模拟内容标题"的数据...\n');
    
    // Check CrawlTask table specifically
    try {
      const crawlTaskRepo = AppDataSource.getRepository('CrawlTask');
      const testTasks = await crawlTaskRepo
        .createQueryBuilder('task')
        .where('task.name LIKE :pattern', { pattern: '%模拟内容标题%' })
        .getMany();
      
      if (testTasks.length > 0) {
        console.log(`⚠️  在 CrawlTask 表中发现 ${testTasks.length} 条包含"模拟内容标题"的记录:`);
        testTasks.forEach((task, index) => {
          console.log(`   ${index + 1}. 任务名: "${task.name}"`);
          console.log(`      平台: ${task.platform}`);
          console.log(`      状态: ${task.status}`);
          console.log(`      目标: ${task.target_identifier}`);
          console.log(`      创建时间: ${task.created_at}`);
          console.log('      ---');
        });
      } else {
        console.log('✅ CrawlTask 表中没有找到包含"模拟内容标题"的记录');
      }
    } catch (error) {
      console.log(`❌ 检查 CrawlTask 表失败: ${error.message}`);
    }
    
    // Check other tables for test patterns
    const testPatterns = ['模拟内容标题', '测试', 'Test', 'Mock', 'Sample'];
    
    for (const pattern of testPatterns) {
      console.log(`\n🔍 查找包含"${pattern}"的数据...`);
      
      for (const table of tables) {
        try {
          const repository = AppDataSource.getRepository(table.name);
          const queryBuilder = repository.createQueryBuilder('entity');
          
          // Build dynamic query based on table structure
          const metadata = repository.metadata;
          const textColumns = metadata.columns.filter(col => 
            col.type === 'varchar' || col.type === 'text'
          );
          
          if (textColumns.length > 0) {
            const conditions = textColumns.map((col, index) => 
              `entity.${col.propertyName} LIKE :pattern${index}`
            );
            const parameters = {};
            textColumns.forEach((col, index) => {
              parameters[`pattern${index}`] = `%${pattern}%`;
            });
            
            const results = await queryBuilder
              .where(conditions.join(' OR '), parameters)
              .getMany();
            
            if (results.length > 0) {
              console.log(`   ${table.name}: 发现 ${results.length} 条记录`);
            }
          }
        } catch (error) {
          // Skip tables that don't exist or have issues
        }
      }
    }
    
  } catch (error) {
    console.error('❌ 检查数据库失败:', error);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('\n🔌 数据库连接已关闭');
    }
  }
}

checkAllTables();