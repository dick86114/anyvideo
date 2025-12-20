const { EntitySchema } = require('typeorm');

// Content entity schema for TypeORM
module.exports = new EntitySchema({
  name: 'Content',
  tableName: 'contents',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
    },
    platform: {
      type: 'varchar',
      length: 20,
      nullable: false,
    },
    content_id: {
      type: 'varchar',
      length: 100,
      nullable: false,
    },
    title: {
      type: 'varchar',
      length: 500,
      nullable: false,
    },
    author: {
      type: 'varchar',
      length: 100,
      nullable: false,
    },
    description: {
      type: 'text',
      nullable: true,
      default: '',
    },
    media_type: {
      type: 'varchar',
      length: 10,
      nullable: false,
      enum: ['video', 'image'],
    },
    file_path: {
      type: 'varchar',
      length: 500,
      nullable: false,
    },
    cover_url: {
      type: 'varchar',
      length: 500,
      nullable: false,
    },
    source_url: {
      type: 'varchar',
      length: 500,
      nullable: false,
    },
    source_type: {
      type: 'int',
      nullable: false,
      enum: [1, 2], // 1-单链接解析，2-监控任务
      default: 1,
    },
    created_at: {
      type: 'timestamp',
      default: () => 'CURRENT_TIMESTAMP',
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
      name: 'IDX_CONTENT_PLATFORM_CONTENT_ID',
      columns: ['platform', 'content_id'],
      unique: true,
    },
  ],
});
