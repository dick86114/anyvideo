const { EntitySchema } = require('typeorm');

// TaskLog entity schema for TypeORM
module.exports = new EntitySchema({
  name: 'TaskLog',
  tableName: 'task_logs',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
    },
    task_id: {
      type: 'uuid',
      nullable: true,
    },
    task_name: {
      type: 'varchar',
      length: 100,
      nullable: false,
    },
    platform: {
      type: 'varchar',
      length: 20,
      nullable: false,
    },
    start_time: {
      type: 'timestamp',
      nullable: false,
      default: () => 'CURRENT_TIMESTAMP',
    },
    end_time: {
      type: 'timestamp',
      nullable: true,
    },
    status: {
      type: 'varchar',
      length: 10,
      nullable: false,
      enum: ['success', 'failed', 'running'],
      default: 'running',
    },
    type: {
      type: 'varchar',
      length: 15,
      enum: ['author', 'hotsearch', 'backup'],
      default: 'author',
    },
    result: {
      type: 'json',
      nullable: true,
    },
    error: {
      type: 'text',
      nullable: true,
    },
    crawled_count: {
      type: 'int',
      default: 0,
    },
    new_count: {
      type: 'int',
      default: 0,
    },
    updated_count: {
      type: 'int',
      default: 0,
    },
    execution_time: {
      type: 'int', // in milliseconds
      default: 0,
    },
  },
  relations: {
    task: {
      type: 'many-to-one',
      target: 'CrawlTask',
      joinColumn: { name: 'task_id' },
      nullable: true,
    },
  },
  indices: [
    {
      name: 'IDX_TASK_LOG_TASK_ID',
      columns: ['task_id'],
    },
    {
      name: 'IDX_TASK_LOG_START_TIME',
      columns: ['start_time', 'status'],
    },
  ],
});
