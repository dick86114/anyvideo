const { EntitySchema } = require('typeorm');

// User entity schema for TypeORM
module.exports = new EntitySchema({
  name: 'User',
  tableName: 'users',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
    },
    username: {
      type: 'varchar',
      length: 50,
      nullable: false,
      unique: true,
    },
    password_hash: {
      type: 'varchar',
      length: 255,
      nullable: false,
    },
    role: {
      type: 'varchar',
      length: 20,
      nullable: false,
      enum: ['admin', 'operator'],
      default: 'operator',
    },
    is_active: {
      type: 'boolean',
      nullable: false,
      default: true,
    },
    created_at: {
      type: 'timestamp',
      default: () => 'CURRENT_TIMESTAMP',
    },
    updated_at: {
      type: 'timestamp',
      default: () => 'CURRENT_TIMESTAMP',
      onUpdate: 'CURRENT_TIMESTAMP',
    },
    deleted_at: {
      type: 'timestamp',
      nullable: true,
    },
  },
  indices: [
    {
      name: 'IDX_USER_USERNAME',
      columns: ['username'],
      unique: true,
    },
    {
      name: 'IDX_USER_ROLE',
      columns: ['role'],
    },
    {
      name: 'IDX_USER_ACTIVE',
      columns: ['is_active'],
    },
  ],
});