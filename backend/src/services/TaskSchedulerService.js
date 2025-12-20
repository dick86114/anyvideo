const cron = require('node-cron');
const { AppDataSource } = require('../data-source');
const ParseService = require('./ParseService');
const AuthorCrawlerService = require('./AuthorCrawlerService');
const BackupService = require('./BackupService');
const HotsearchService = require('./HotsearchService');
const logger = require('../utils/logger');

// Get repositories from TypeORM data source
let CrawlTaskRepository;
let ContentRepository;
let TaskLogRepository;

class TaskSchedulerService {
  constructor() {
    this.scheduledTasks = new Map();
    // Don't initialize immediately, wait for TypeORM to be ready
  }

  // Initialize method to be called after TypeORM is ready
  async init() {
    await this.initialize();
  }

  // Initialize scheduler by loading tasks from database
  async initialize() {
    try {
      // Initialize repositories
      CrawlTaskRepository = AppDataSource.getRepository('CrawlTask');
      ContentRepository = AppDataSource.getRepository('Content');
      TaskLogRepository = AppDataSource.getRepository('TaskLog');
      
      // Load all enabled tasks
      const tasks = await CrawlTaskRepository.find({ where: { status: 1 } });
      
      // Schedule each task
      for (const task of tasks) {
        this.scheduleTask(task);
      }
      
      // Schedule daily backup task (runs at 2 AM every day)
      this.scheduleBackupTask();
      
      // Schedule daily hotsearch crawl task (runs at 8 AM, 12 PM, 4 PM, 8 PM every day)
      this.scheduleHotsearchTask();
      
      console.log('Task scheduler initialized with', tasks.length, 'enabled tasks');
    } catch (error) {
      console.error('Failed to initialize task scheduler:', error);
    }
  }

  // Schedule daily backup task
  scheduleBackupTask() {
    try {
      // Run at 2 AM every day
      const job = cron.schedule('0 2 * * *', async () => {
        logger.info('Starting daily database backup...');
        try {
          await BackupService.backupDatabase();
          logger.info('Daily database backup completed successfully');
        } catch (error) {
          logger.error('Daily database backup failed:', error);
        }
      });
      
      this.scheduledTasks.set('daily_backup', job);
      logger.info('Daily backup task scheduled');
    } catch (error) {
      logger.error('Failed to schedule backup task:', error);
    }
  }

  // Schedule hotsearch crawl task
  scheduleHotsearchTask() {
    try {
      // Run at 8 AM, 12 PM, 4 PM, 8 PM every day
      const job = cron.schedule('0 8,12,16,20 * * *', async () => {
        logger.info('Starting hotsearch crawl task...');
        try {
          await this.executeHotsearchTask();
          logger.info('Hotsearch crawl task completed successfully');
        } catch (error) {
          logger.error('Hotsearch crawl task failed:', error);
        }
      });
      
      this.scheduledTasks.set('hotsearch_crawl', job);
      logger.info('Hotsearch crawl task scheduled');
    } catch (error) {
      logger.error('Failed to schedule hotsearch task:', error);
    }
  }

  // Execute hotsearch crawl task
  async executeHotsearchTask() {
    try {
      // Create task log for hotsearch crawl
      const taskLog = new TaskLog({
        task_name: '每日热搜抓取',
        platform: 'all',
        start_time: new Date(),
        status: 'running',
        type: 'hotsearch'
      });
      await taskLog.save();
      
      // Fetch hotsearch data for all platforms
      const results = await HotsearchService.fetchAllHotsearch();
      
      // Update task log with success status
      await TaskLog.findByIdAndUpdate(taskLog._id, {
        end_time: new Date(),
        status: 'success',
        result: results,
        execution_time: Date.now() - taskLog.start_time,
        crawled_count: results.length
      });
      
      return { success: true, results };
    } catch (error) {
      logger.error('Failed to execute hotsearch task:', error);
      // Update task log with failed status
      return { success: false, error: error.message };
    }
  }

  // Schedule a task based on its frequency
  scheduleTask(task) {
    try {
      // Determine cron expression based on frequency
      let cronExpression;
      switch (task.frequency) {
        case 'hourly':
          cronExpression = '0 * * * *'; // Run every hour
          break;
        case 'daily':
          cronExpression = '0 0 * * *'; // Run every day at midnight
          break;
        case 'weekly':
          cronExpression = '0 0 * * 0'; // Run every Sunday at midnight
          break;
        default:
          throw new Error(`Invalid frequency: ${task.frequency}`);
      }

      // Create cron job
      const job = cron.schedule(cronExpression, async () => {
        await this.executeTask(task);
      });

      // Store the job
      this.scheduledTasks.set(task.id, job);
      console.log(`Task scheduled: ${task.name} (${task.frequency})`);
      
      // Update next run time
      this.updateNextRunTime(task);
    } catch (error) {
      console.error(`Failed to schedule task ${task.name}:`, error);
    }
  }

  // Execute a task
  async executeTask(task) {
    let taskLog;
    const startTime = Date.now();
    
    try {
      console.log(`Executing task: ${task.name}`);
      
      // Create task log
      taskLog = TaskLogRepository.create({
        task_id: task.id,
        task_name: task.name,
        platform: task.platform,
        start_time: new Date(),
        status: 'running'
      });
      await TaskLogRepository.save(taskLog);
      
      // Update task status
      await CrawlTaskRepository.update(task.id, {
        last_run_at: new Date(),
        next_run_at: this.calculateNextRunTime(task)
      });
      
      // Execute actual task logic based on task type
      // For now, we'll implement author monitoring logic
      const result = await this.executeAuthorMonitoringTask(task);
      
      // Calculate execution time
      const endTime = new Date();
      const executionTime = endTime - startTime;
      
      // Update task log with success status
      await TaskLogRepository.update(taskLog.id, {
        end_time: endTime,
        status: 'success',
        result,
        execution_time: executionTime,
        crawled_count: result?.crawled_count || 0,
        new_count: result?.new_count || 0,
        updated_count: result?.updated_count || 0
      });
      
      console.log(`Task executed successfully: ${task.name}`);
      
    } catch (error) {
      console.error(`Failed to execute task ${task.name}:`, error);
      
      // Update task log with failed status
      const endTime = new Date();
      const executionTime = endTime - startTime;
      
      if (taskLog) {
        await TaskLogRepository.update(taskLog.id, {
          end_time: endTime,
          status: 'failed',
          error: error.message,
          execution_time: executionTime
        });
      }
    }
  }

  // Execute author monitoring task
  async executeAuthorMonitoringTask(task) {
    try {
      const { platform, target_identifier, config } = task;
      
      console.log(`Monitoring author: ${target_identifier} on ${platform}`);
      
      // Mock author profile crawling
      // In real implementation, this would call the actual crawling service
      const authorWorks = await this.crawlAuthorWorks(platform, target_identifier, config);
      
      console.log(`Found ${authorWorks.length} works for author ${target_identifier}`);
      
      // Check for new works and save to database
      const result = await this.saveNewWorks(authorWorks, task._id);
      
      return {
        crawled_count: authorWorks.length,
        new_count: result.new_count,
        updated_count: result.updated_count,
        total_processed: result.total_processed
      };
      
    } catch (error) {
      console.error('Failed to execute author monitoring task:', error);
      throw error;
    }
  }

  // Crawl author works using real crawler service
  async crawlAuthorWorks(platform, targetIdentifier, config) {
    try {
      // Use the real AuthorCrawlerService to crawl author works
      const works = await AuthorCrawlerService.crawlAuthorWorks(platform, targetIdentifier, config);
      return works;
    } catch (error) {
      logger.error(`Failed to crawl author works for ${targetIdentifier} on ${platform}:`, error);
      // Return empty array if crawling fails to avoid breaking the task
      return [];
    }
  }

  // Save new works to database
  async saveNewWorks(works, taskId) {
    try {
      let newCount = 0;
      let updatedCount = 0;
      let totalProcessed = 0;
      
      for (const work of works) {
        totalProcessed++;
        // Check if work already exists
        const existingWork = await ContentRepository.findOne({
          where: {
            platform: work.platform,
            content_id: work.content_id
          }
        });
        
        if (!existingWork) {
          // Download media file first
          const filePath = await ParseService.downloadMedia(
            work, 
            work.platform, 
            2, // Source type 2: Monitoring task
            taskId
          );
          
          // Save new work with file path
          const content = ContentRepository.create({
            platform: work.platform,
            content_id: work.content_id,
            title: work.title,
            author: work.author,
            description: work.description || '',
            media_type: work.media_type,
            file_path: filePath, // Set the actual file path
            cover_url: work.cover_url,
            source_url: work.source_url,
            source_type: 2, // 2-监控任务
            task_id: taskId,
            created_at: work.created_at || new Date()
          });
          
          await ContentRepository.save(content);
          console.log(`Saved new work: ${work.title}`);
          newCount++;
        } else {
          // Update existing work if needed
          // For now, we'll just log that it exists
          console.log(`Work already exists: ${work.title}`);
          updatedCount++;
        }
      }
      
      // Return statistics for logging
      return {
        new_count: newCount,
        updated_count: updatedCount,
        total_processed: totalProcessed
      };
    } catch (error) {
      console.error('Failed to save new works:', error);
      throw error;
    }
  }

  // Calculate next run time based on frequency
  calculateNextRunTime(task) {
    const now = new Date();
    const nextRunTime = new Date(now);
    
    switch (task.frequency) {
      case 'hourly':
        nextRunTime.setHours(nextRunTime.getHours() + 1);
        break;
      case 'daily':
        nextRunTime.setDate(nextRunTime.getDate() + 1);
        break;
      case 'weekly':
        nextRunTime.setDate(nextRunTime.getDate() + 7);
        break;
    }
    
    return nextRunTime;
  }

  // Update next run time for a task
  async updateNextRunTime(task) {
    try {
      const nextRunTime = this.calculateNextRunTime(task);
      await CrawlTaskRepository.update(task.id, {
        next_run_at: nextRunTime
      });
    } catch (error) {
      console.error(`Failed to update next run time for task ${task.name}:`, error);
    }
  }

  // Add or update a task in the scheduler
  async addOrUpdateTask(task) {
    try {
      // If task already exists, remove it first
      if (this.scheduledTasks.has(task.id)) {
        this.removeTask(task.id);
      }
      
      // If task is enabled, schedule it
      if (task.status === 1) {
        this.scheduleTask(task);
      }
    } catch (error) {
      console.error(`Failed to add or update task ${task.name}:`, error);
    }
  }

  // Remove a task from the scheduler
  removeTask(taskId) {
    const taskIdStr = typeof taskId === 'string' ? taskId : taskId.toString();
    if (this.scheduledTasks.has(taskIdStr)) {
      const job = this.scheduledTasks.get(taskIdStr);
      job.stop();
      this.scheduledTasks.delete(taskIdStr);
      console.log(`Task removed from scheduler: ${taskIdStr}`);
    }
  }

  // Start a task immediately
  async runTaskImmediately(taskId) {
    try {
      const task = await CrawlTaskRepository.findOne({ where: { id: taskId } });
      if (!task) {
        throw new Error('Task not found');
      }
      
      await this.executeTask(task);
      return { success: true, message: 'Task executed successfully' };
    } catch (error) {
      console.error(`Failed to run task immediately:`, error);
      return { success: false, message: error.message };
    }
  }

  // Stop all tasks
  stopAll() {
    for (const [taskId, job] of this.scheduledTasks) {
      job.stop();
    }
    this.scheduledTasks.clear();
    console.log('All tasks stopped');
  }
}

// Export a singleton instance
module.exports = new TaskSchedulerService();