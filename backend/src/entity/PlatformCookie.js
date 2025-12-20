const { EntitySchema } = require('typeorm');

// PlatformCookie entity schema for TypeORM
module.exports = new EntitySchema({
  name: 'PlatformCookie',
  tableName: 'platform_cookies',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
    },
    platform: {
      type: 'varchar',
      length: 50,
      nullable: false,
    },
    account_alias: {
      type: 'varchar',
      length: 100,
      nullable: false,
    },
    cookies_encrypted: {
      type: 'text',
      nullable: false,
    },
    is_valid: {
      type: 'boolean',
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
      name: 'IDX_PLATFORM_COOKIE_PLATFORM',
      columns: ['platform'],
    },
    {
      name: 'IDX_PLATFORM_COOKIE_VALID',
      columns: ['is_valid'],
    },
  ],
});
