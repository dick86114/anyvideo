const CrawlTask = require('../models/CrawlTask');
const TaskLog = require('../models/TaskLog');
const taskScheduler = require('../services/TaskSchedulerService');
const authorCrawlerService = require('../services/AuthorCrawlerService');
const logger = require('../utils/logger');

class TaskController {
  // Create a new crawl task
  static async createTask(req, res) {
    try {
      const {
        name,
        platform,
        target_identifier,
        frequency = 'daily',
        status = 1,
        config = {}
      } = req.body;

      // Validate input
      if (!name || !platform || !target_identifier) {
        return res.status(400).json({ message: '任务名称、平台和目标标识符不能为空' });
      }

      // Validate author link if target_identifier is a URL
      let authorId = target_identifier;
      if (target_identifier.startsWith('http://') || target_identifier.startsWith('https://')) {
        const validationResult = await authorCrawlerService.validateAuthorLink(platform, target_identifier);
        
        if (!validationResult.valid) {
          return res.status(400).json({ message: validationResult.message });
        }
        
        // Use extracted author ID if available
        if (validationResult.authorId) {
          authorId = validationResult.authorId;
        }
      }

      // Create new task
      const task = new CrawlTask({
        name,
        platform,
        target_identifier: authorId,
        frequency,
        status,
        config
      });

      await task.save();

      // Schedule the task if enabled
      await taskScheduler.addOrUpdateTask(task);

      res.status(201).json({
        message: '任务创建成功',
        data: task
      });
    } catch (error) {
      logger.error('Create task error:', error);
      res.status(500).json({ message: error.message || '任务创建失败' });
    }
  }

  // Get task list with pagination and filters
  static async getTaskList(req, res) {
    try {
      const {
        page = 1,
        page_size = 10,
        platform,
        status,
        frequency
      } = req.query;

      // Build query
      const query = {};
      if (platform) query.platform = platform;
      if (status !== undefined) query.status = parseInt(status);
      if (frequency) query.frequency = frequency;

      // Get total count
      const total = await CrawlTask.countDocuments(query);

      // Get paginated data
      const tasks = await CrawlTask.find(query)
        .sort({ created_at: -1 })
        .skip((parseInt(page) - 1) * parseInt(page_size))
        .limit(parseInt(page_size));

      res.status(200).json({
        message: '获取任务列表成功',
        data: {
          list: tasks,
          total,
          page: parseInt(page),
          page_size: parseInt(page_size)
        }
      });
    } catch (error) {
      console.error('Get task list error:', error);
      res.status(500).json({ message: '获取任务列表失败' });
    }
  }

  // Get task by ID
  static async getTaskById(req, res) {
    try {
      const { id } = req.params;
      const task = await CrawlTask.findById(id);

      if (!task) {
        return res.status(404).json({ message: '任务不存在' });
      }

      res.status(200).json({
        message: '获取任务成功',
        data: task
      });
    } catch (error) {
      console.error('Get task by id error:', error);
      res.status(500).json({ message: '获取任务失败' });
    }
  }

  // Update a task
  static async updateTask(req, res) {
    try {
      const { id } = req.params;
      let updateData = req.body;

      // Find task
      const task = await CrawlTask.findById(id);
      if (!task) {
        return res.status(404).json({ message: '任务不存在' });
      }

      // Validate author link if target_identifier is being updated and is a URL
      if (updateData.target_identifier && 
          (updateData.target_identifier.startsWith('http://') || 
           updateData.target_identifier.startsWith('https://'))) {
        const validationResult = await authorCrawlerService.validateAuthorLink(
          updateData.platform || task.platform, 
          updateData.target_identifier
        );
        
        if (!validationResult.valid) {
          return res.status(400).json({ message: validationResult.message });
        }
        
        // Use extracted author ID if available
        if (validationResult.authorId) {
          updateData.target_identifier = validationResult.authorId;
        }
      }

      // Update task
      Object.assign(task, updateData);
      await task.save();

      // Update task in scheduler
      await taskScheduler.addOrUpdateTask(task);

      res.status(200).json({
        message: '任务更新成功',
        data: task
      });
    } catch (error) {
      logger.error('Update task error:', error);
      res.status(500).json({ message: error.message || '任务更新失败' });
    }
  }

  // Delete a task
  static async deleteTask(req, res) {
    try {
      const { id } = req.params;

      // Find task first
      const task = await CrawlTask.findById(id);
      if (!task) {
        return res.status(404).json({ message: '任务不存在' });
      }

      // Remove task from scheduler
      taskScheduler.removeTask(id);

      // Delete task from database
      await CrawlTask.findByIdAndDelete(id);

      res.status(200).json({ message: '任务删除成功' });
    } catch (error) {
      console.error('Delete task error:', error);
      res.status(500).json({ message: '任务删除失败' });
    }
  }

  // Toggle task status (enable/disable)
  static async toggleTaskStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      // Validate status
      if (status !== 0 && status !== 1) {
        return res.status(400).json({ message: '无效的状态值，只能是0（禁用）或1（启用）' });
      }

      // Update task status
      const task = await CrawlTask.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );

      if (!task) {
        return res.status(404).json({ message: '任务不存在' });
      }

      // Update task in scheduler
      await taskScheduler.addOrUpdateTask(task);

      res.status(200).json({
        message: `任务已${status === 1 ? '启用' : '禁用'}`,
        data: task
      });
    } catch (error) {
      console.error('Toggle task status error:', error);
      res.status(500).json({ message: '切换任务状态失败' });
    }
  }

  // Run task immediately
  static async runTaskImmediately(req, res) {
    try {
      const { id } = req.params;

      // Run task
      const result = await taskScheduler.runTaskImmediately(id);

      if (result.success) {
        res.status(200).json({
          message: '任务已开始执行',
          data: result
        });
      } else {
        res.status(500).json({
          message: result.message
        });
      }
    } catch (error) {
      console.error('Run task immediately error:', error);
      res.status(500).json({ message: '执行任务失败' });
    }
  }

  // Run hotsearch task immediately
  static async runHotsearchTask(req, res) {
    try {
      logger.info('Running hotsearch task immediately...');
      const result = await taskScheduler.executeHotsearchTask();
      
      if (result.success) {
        res.status(200).json({
          message: '热搜抓取任务已开始执行',
          data: result
        });
      } else {
        res.status(500).json({
          message: result.error || '执行热搜抓取任务失败'
        });
      }
    } catch (error) {
      logger.error('Run hotsearch task error:', error);
      res.status(500).json({ message: '执行热搜抓取任务失败' });
    }
  }

  // Get hotsearch task logs
  static async getHotsearchTaskLogs(req, res) {
    try {
      const {
        page = 1,
        page_size = 10,
        status,
        start_date,
        end_date
      } = req.query;

      // Build query
      const query = {
        type: 'hotsearch'
      };
      
      if (status) query.status = status;
      if (start_date) query.start_time = { $gte: new Date(start_date) };
      if (end_date) {
        query.start_time = query.start_time || {};
        query.start_time.$lte = new Date(end_date);
      }

      // Get total count
      const total = await TaskLog.countDocuments(query);

      // Get paginated data
      const logs = await TaskLog.find(query)
        .sort({ start_time: -1 })
        .skip((parseInt(page) - 1) * parseInt(page_size))
        .limit(parseInt(page_size));

      res.status(200).json({
        message: '获取热搜任务日志成功',
        data: {
          list: logs,
          total,
          page: parseInt(page),
          page_size: parseInt(page_size)
        }
      });
    } catch (error) {
      logger.error('Get hotsearch task logs error:', error);
      res.status(500).json({ message: '获取热搜任务日志失败' });
    }
  }

  // Get author monitoring task logs by task ID
  static async getTaskLogs(req, res) {
    try {
      const {
        page = 1,
        page_size = 10,
        status,
        start_date,
        end_date
      } = req.query;
      const { taskId } = req.params;

      // Build query
      const query = {
        task_id: taskId,
        type: 'author'
      };
      
      if (status) query.status = status;
      if (start_date) query.start_time = { $gte: new Date(start_date) };
      if (end_date) {
        query.start_time = query.start_time || {};
        query.start_time.$lte = new Date(end_date);
      }

      // Get total count
      const total = await TaskLog.countDocuments(query);

      // Get paginated data
      const logs = await TaskLog.find(query)
        .sort({ start_time: -1 })
        .skip((parseInt(page) - 1) * parseInt(page_size))
        .limit(parseInt(page_size));

      res.status(200).json({
        message: '获取任务日志成功',
        data: {
          list: logs,
          total,
          page: parseInt(page),
          page_size: parseInt(page_size)
        }
      });
    } catch (error) {
      logger.error('Get task logs error:', error);
      res.status(500).json({ message: '获取任务日志失败' });
    }
  }

  // Get all task logs (for admin use)
  static async getAllTaskLogs(req, res) {
    try {
      const {
        page = 1,
        page_size = 10,
        status,
        start_date,
        end_date,
        task_id,
        type
      } = req.query;

      // Build query
      const query = {};
      
      if (status) query.status = status;
      if (start_date) query.start_time = { $gte: new Date(start_date) };
      if (end_date) {
        query.start_time = query.start_time || {};
        query.start_time.$lte = new Date(end_date);
      }
      if (task_id) query.task_id = task_id;
      if (type) query.type = type;

      // Get total count
      const total = await TaskLog.countDocuments(query);

      // Get paginated data
      const logs = await TaskLog.find(query)
        .sort({ start_time: -1 })
        .skip((parseInt(page) - 1) * parseInt(page_size))
        .limit(parseInt(page_size));

      res.status(200).json({
        message: '获取所有任务日志成功',
        data: {
          list: logs,
          total,
          page: parseInt(page),
          page_size: parseInt(page_size)
        }
      });
    } catch (error) {
      logger.error('Get all task logs error:', error);
      res.status(500).json({ message: '获取所有任务日志失败' });
    }
  }
}

module.exports = TaskController;