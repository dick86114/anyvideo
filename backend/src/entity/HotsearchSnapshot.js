const { EntitySchema } = require('typeorm');

// HotsearchSnapshot entity schema for TypeORM
module.exports = new EntitySchema({
  name: 'HotsearchSnapshot',
  tableName: 'hotsearch_snapshots',
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
    capture_date: {
      type: 'date',
      nullable: false,
    },
    capture_time: {
      type: 'timestamp',
      nullable: false,
      default: () => 'CURRENT_TIMESTAMP',
    },
    snapshot_data: {
      type: 'json',
      nullable: false,
    },
    created_at: {
      type: 'timestamp',
      default: () => 'CURRENT_TIMESTAMP',
    },
  },
  indices: [
    {
      name: 'IDX_HOTSEARCH_PLATFORM_DATE',
      columns: ['platform', 'capture_date'],
      unique: true,
    },
  ],
});
