const { EntitySchema } = require('typeorm');

// SystemSettings entity schema for TypeORM
module.exports = new EntitySchema({
  name: 'SystemSettings',
  tableName: 'system_settings',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
    },
    storage_path: {
      type: 'varchar',
      length: 500,
      default: '/data/media/',
    },
    task_schedule_interval: {
      type: 'int',
      default: 3600,
    },
    hotsearch_fetch_interval: {
      type: 'int',
      default: 3600,
    },
    updated_at: {
      type: 'timestamp',
      default: () => 'CURRENT_TIMESTAMP',
    },
  },
});
