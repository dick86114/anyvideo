const { EntitySchema } = require('typeorm');

// CrawlTask entity schema for TypeORM
module.exports = new EntitySchema({
  name: 'CrawlTask',
  tableName: 'crawl_tasks',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
    },
    name: {
      type: 'varchar',
      length: 100,
      nullable: false,
    },
    platform: {
      type: 'varchar',
      length: 20,
      nullable: false,
    },
    target_identifier: {
      type: 'varchar',
      length: 200,
      nullable: false,
    },
    frequency: {
      type: 'varchar',
      length: 20,
      nullable: false,
      enum: ['hourly', 'daily', 'weekly'],
    },
    status: {
      type: 'int',
      nullable: false,
      enum: [0, 1], // 0-禁用，1-启用
      default: 1,
    },
    last_run_at: {
      type: 'timestamp',
      nullable: true,
      default: null,
    },
    next_run_at: {
      type: 'timestamp',
      nullable: true,
      default: null,
    },
    config: {
      type: 'json',
      nullable: false,
      default: {},
    },
    created_at: {
      type: 'timestamp',
      default: () => 'CURRENT_TIMESTAMP',
    },
  },
  indices: [
    {
      name: 'IDX_CRAWL_TASK_PLATFORM',
      columns: ['platform'],
    },
    {
      name: 'IDX_CRAWL_TASK_STATUS',
      columns: ['status'],
    },
    {
      name: 'IDX_CRAWL_TASK_NEXT_RUN',
      columns: ['next_run_at'],
    },
  ],
});
