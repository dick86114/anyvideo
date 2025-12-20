## MongoDB到PostgreSQL迁移计划

### 1. 迁移目标
将当前项目使用的MongoDB + Mongoose替换为PostgreSQL + TypeORM，确保项目正常运行。

### 2. 迁移步骤

#### 2.1 安装依赖
- 安装PostgreSQL驱动：`pg`
- 安装TypeORM：`typeorm`
- 安装TypeScript（可选，用于类型定义）：`typescript`
- 安装反射元数据：`reflect-metadata`

#### 2.2 配置PostgreSQL
- 安装PostgreSQL数据库
- 创建数据库和用户
- 配置环境变量

#### 2.3 迁移数据模型
将所有Mongoose Schema转换为TypeORM Entity：
- Content
- Config
- TaskLog
- HotsearchSnapshot
- PlatformAccount
- CrawlTask
- User

#### 2.4 迁移数据库连接
- 修改`src/utils/db.js`文件，替换MongoDB连接为PostgreSQL连接
- 更新`src/app.js`中的数据库连接调用

#### 2.5 迁移数据库操作
将所有Mongoose查询替换为TypeORM查询：
- 替换`find`、`findOne`、`findById`等查询
- 替换`save`、`update`、`delete`等操作
- 替换`populate`为TypeORM的`relations`或`join`

#### 2.6 迁移索引和约束
将MongoDB索引转换为PostgreSQL索引和约束：
- 唯一索引
- 外键约束
- 非空约束

#### 2.7 测试迁移
- 测试API端点
- 测试数据解析和保存
- 测试下载功能
- 测试后台任务

### 3. 代码变更

#### 3.1 新增文件
- `src/entity/`目录：存放TypeORM Entity
- `src/data-source.ts`：TypeORM数据源配置

#### 3.2 修改文件
- `src/utils/db.js`：替换数据库连接
- `src/app.js`：更新数据库连接调用
- 所有Model文件：替换为TypeORM Entity
- 所有Controller文件：更新数据库操作
- 所有Service文件：更新数据库操作

### 4. 迁移策略

#### 4.1 渐进式迁移
- 保持原MongoDB连接可用
- 逐步替换各个模块的数据库操作
- 最后移除MongoDB依赖

#### 4.2 数据迁移
- 编写数据迁移脚本，将MongoDB中的数据迁移到PostgreSQL
- 验证数据一致性

### 5. 风险控制

#### 5.1 备份
- 迁移前备份MongoDB数据
- 迁移过程中定期备份

#### 5.2 回滚计划
- 保留原MongoDB代码
- 可以快速切换回MongoDB

#### 5.3 测试
- 充分测试各个功能模块
- 测试边界情况
- 测试性能

### 6. 预期结果

- 项目成功迁移到PostgreSQL + TypeORM
- 所有功能正常运行
- 性能有所提升
- 代码结构更加清晰

### 7. 后续优化

- 优化SQL查询
- 配置连接池
- 实现读写分离
- 配置监控和告警

### 8. 迁移时间

- 预计总时间：2-3天
- 依赖安装和配置：1小时
- 数据模型迁移：1天
- 数据库操作迁移：1天
- 测试和调试：6小时

### 9. 技术选型理由

- **PostgreSQL**：强大的SQL支持，完善的事务处理，适合关系型数据
- **TypeORM**：支持多种数据库，提供类似Mongoose的API，学习曲线平缓
- **TypeScript**：可选，提供类型安全，减少运行时错误

### 10. 迁移工具

- **pg_dump/pg_restore**：PostgreSQL备份和恢复
- **TypeORM CLI**：用于生成Entity和迁移脚本
- **MongoDB Atlas**：如果使用云服务，提供数据导出功能

### 11. 注意事项

- 确保PostgreSQL版本兼容性
- 注意SQL注入防护
- 优化查询性能
- 监控数据库连接数
- 配置适当的连接池大小