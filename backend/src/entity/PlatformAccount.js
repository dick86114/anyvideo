const { EntitySchema } = require('typeorm');

// PlatformAccount entity schema for TypeORM
module.exports = new EntitySchema({
  name: 'PlatformAccount',
  tableName: 'platform_accounts',
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
    account_alias: {
      type: 'varchar',
      length: 50,
      nullable: false,
    },
    cookies_encrypted: {
      type: 'text',
      nullable: false,
    },
    is_valid: {
      type: 'boolean',
      nullable: false,
      default: true,
    },
    last_checked_at: {
      type: 'timestamp',
      default: () => 'CURRENT_TIMESTAMP',
    },
    created_at: {
      type: 'timestamp',
      default: () => 'CURRENT_TIMESTAMP',
    },
  },
  indices: [
    {
      name: 'IDX_PLATFORM_ACCOUNT_PLATFORM',
      columns: ['platform'],
    },
    {
      name: 'IDX_PLATFORM_ACCOUNT_VALID',
      columns: ['is_valid'],
    },
  ],
});
