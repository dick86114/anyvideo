# 内容解析、管理与热点发现系统

## 项目概述

本系统旨在开发一个功能完备的后台管理系统，为核心用户（内容运营者、管理员）提供一体化的内容资产管理解决方案。系统核心价值在于打通"**热点发现 -> 精准采集 -> 有序存储 -> 可视化管理**"的全流程。

**核心功能模块**：

1.  **单作品解析**：输入任一内容平台链接，系统解析并保存**无水印**的原始媒体文件及元数据。
2.  **作者作品监控**：创建定时任务，持续监控指定创作者，自动采集其新发布的作品。
3.  **内容管理与存储**：对所有采集内容进行集中化管理，并按照**清晰的物理存储规则**保存文件。
4.  **任务调度中心**：统一管理所有自动化任务（监控、热搜抓取）的生命周期与状态。
5.  **平台热搜发现**：定时抓取、归档与查询各主流平台热搜榜，用于趋势洞察与选题发现。
6.  **数据可视化看板**：提供多维度数据仪表盘，直观展示内容资产概况与运营效率。
7.  **系统配置管理**：包含用户权限管理及平台账户（Cookie）配置，保障系统安全与解析成功率。

## 技术栈

### 后端技术栈

- **框架**: Express.js
- **数据库**: PostgreSQL + TypeORM
- **认证**: JWT (JSON Web Token)
- **爬虫**: Puppeteer + Axios
- **任务调度**: node-cron
- **日志**: Winston
- **缓存**: Node-cache
- **其他**: Cheerio, XLSX, fs-extra

### 前端技术栈

- **框架**: React 18
- **构建工具**: Vite
- **UI 组件库**: Ant Design
- **图表库**: Ant Design Charts
- **HTTP 客户端**: Axios

## 系统架构

### 后端架构

```
backend/
├── src/
│   ├── controllers/      # API控制器
│   ├── middleware/       # 中间件
│   ├── models/           # 数据模型
│   ├── routes/           # 路由定义
│   ├── services/         # 业务逻辑服务
│   ├── utils/            # 工具函数
│   ├── app.js            # 应用入口
│   └── server.js         # 服务器启动
├── logs/                 # 日志文件
├── tmp/                  # 临时文件
└── package.json          # 项目配置
```

### 前端架构

```
frontend/
├── src/
│   ├── components/       # 通用组件
│   ├── pages/            # 页面组件
│   ├── services/         # API服务
│   ├── App.jsx           # 应用根组件
│   └── main.jsx          # 应用入口
└── package.json          # 项目配置
```

## 安装与部署

### 环境要求

- Node.js >= 16.0.0
- PostgreSQL >= 12.0.0
- Git
- 推荐使用 PM2 进行生产环境部署

### 安装步骤

1. **克隆项目**

```bash
git clone https://gitea.yangzai.fun:16666/yangzai/videoAll.git
cd videoAll
```

2. **安装后端依赖**

```bash
cd backend
npm install
```

3. **配置环境变量**

   - 创建 `.env` 文件

   ```bash
   cp .env.example .env
   ```

   - 编辑 `.env` 文件，配置以下参数：

   ```env
   # 服务器配置
   PORT=3000
   NODE_ENV=development

   # 数据库配置
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432
   POSTGRES_DATABASE=video_all
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=your_password

   # JWT 配置
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=7d

   # 加密配置
   ENCRYPTION_KEY=your_encryption_key_here

   # 存储配置
   STORAGE_TYPE=local
   STORAGE_ROOT_PATH=./media

   # 备份配置
   BACKUP_DIR=./backups
   BACKUP_RETENTION_DAYS=7

   # 日志配置
   LOG_LEVEL=info

   # 安全配置
   PASSWORD_SALT_ROUNDS=10
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX=100
   ```

4. **安装前端依赖**

```bash
cd ../frontend
npm install
```

5. **构建前端项目**

```bash
npm run build
```

6. **启动后端服务**

```bash
cd ../backend
# 开发环境
npm run dev

# 生产环境（推荐使用 PM2）
npm install -g pm2
pm run start
```

7. **访问系统**
   - 前端地址：`http://localhost:3000`
   - 后端 API 地址：`http://localhost:3000/api/v1`
   - 默认管理员账号：admin@example.com / admin123

### 生产环境部署建议

- 使用 Nginx 作为反向代理
- 配置 HTTPS 证书
- 启用 PostgreSQL 认证
- 定期备份数据库
- 配置日志轮转

## 使用指南

### 1. 系统登录

1. 访问 `http://localhost:3000`
2. 使用默认账号或管理员分配的账号登录
3. 首次登录建议修改密码

### 2. 内容解析

1. 进入「内容解析」页面
2. 在输入框中粘贴内容平台链接
3. 点击「解析」按钮
4. 系统自动解析并下载内容
5. 解析完成后可在「内容管理」页面查看

### 3. 创建作者监控任务

1. 进入「任务管理」页面
2. 点击「创建任务」按钮
3. 选择平台类型
4. 输入作者主页链接
5. 设置监控频率（每小时、每天、每周）
6. 点击「保存」按钮

### 4. 管理内容资产

1. 进入「内容管理」页面
2. 使用筛选条件查找特定内容
3. 点击内容卡片查看详情
4. 可执行预览、下载、删除等操作
5. 支持批量选择和批量操作

### 5. 查看热搜数据

1. 进入「热搜管理」页面
2. 选择平台和日期
3. 查看热搜榜单
4. 点击热搜关键词可一键解析相关内容

### 6. 配置系统参数

1. 进入「系统配置」页面
2. 配置平台 Cookie（提高解析成功率）
3. 管理用户账号
4. 调整系统设置

## 配置方法

### 平台 Cookie 配置

1. 登录对应平台
2. 打开浏览器开发者工具（F12）
3. 进入「Application」/「Storage」选项卡
4. 找到对应平台的 Cookie
5. 复制完整 Cookie 字符串
6. 进入系统「配置管理」-「Cookie 管理」
7. 添加新的 Cookie 配置
8. 定期更新 Cookie 以保持有效性

### 自定义存储路径

在 `.env` 文件中修改以下配置：

```env
STORAGE_PATH=/path/to/your/storage
TEMP_PATH=/path/to/your/temp
```

### 调整日志级别

在 `.env` 文件中修改：

```env
LOG_LEVEL=debug  # 可选：error, warn, info, debug, silly
```

### 配置速率限制

在 `.env` 文件中修改：

````env
RATE_LIMIT_WINDOW_MS=900000  # 15分钟
RATE_LIMIT_MAX=100  # 每个IP最多100请求

## API文档

### 认证相关API

| 接口 | 方法 | 路径 | 描述 |
|------|------|------|------|
| 登录 | POST | `/api/v1/auth/login` | 用户登录，返回JWT令牌 |
| 注册 | POST | `/api/v1/auth/register` | 用户注册 |
| 获取当前用户 | GET | `/api/v1/auth/me` | 获取当前登录用户信息 |
| 修改密码 | PUT | `/api/v1/auth/password` | 修改当前用户密码 |

### 内容管理API

| 接口 | 方法 | 路径 | 描述 |
|------|------|------|------|
| 解析内容 | POST | `/api/v1/content/parse` | 从链接解析内容 |
| 获取内容列表 | GET | `/api/v1/content` | 获取内容列表，支持分页和筛选 |
| 获取内容详情 | GET | `/api/v1/content/:id` | 获取单个内容详情 |
| 删除内容 | DELETE | `/api/v1/content/:id` | 删除单个内容 |
| 批量删除内容 | POST | `/api/v1/content/batch-delete` | 批量删除内容 |
| 批量导出内容 | POST | `/api/v1/content/export` | 批量导出内容为Excel |
| 下载导出文件 | GET | `/api/v1/content/download-export` | 下载导出的Excel文件 |
| 下载单个内容 | POST | `/api/v1/content/download` | 下载单个内容文件 |

### 任务管理API

| 接口 | 方法 | 路径 | 描述 |
|------|------|------|------|
| 创建任务 | POST | `/api/v1/tasks` | 创建监控任务 |
| 获取任务列表 | GET | `/api/v1/tasks` | 获取任务列表 |
| 获取任务详情 | GET | `/api/v1/tasks/:id` | 获取单个任务详情 |
| 更新任务 | PUT | `/api/v1/tasks/:id` | 更新任务信息 |
| 删除任务 | DELETE | `/api/v1/tasks/:id` | 删除任务 |
| 切换任务状态 | PATCH | `/api/v1/tasks/:id/status` | 启用/禁用任务 |
| 立即执行任务 | POST | `/api/v1/tasks/:id/run` | 立即执行任务 |
| 获取任务日志 | GET | `/api/v1/tasks/:id/logs` | 获取任务执行日志 |

### 热搜管理API

| 接口 | 方法 | 路径 | 描述 |
|------|------|------|------|
| 抓取单个平台热搜 | POST | `/api/v1/hotsearch/:platform` | 抓取指定平台热搜 |
| 抓取所有平台热搜 | POST | `/api/v1/hotsearch` | 抓取所有平台热搜 |
| 获取指定日期热搜 | GET | `/api/v1/hotsearch/:platform` | 获取指定日期的平台热搜 |
| 获取热搜趋势 | GET | `/api/v1/hotsearch/:platform/trends` | 获取热搜趋势数据 |
| 获取平台列表 | GET | `/api/v1/hotsearch/platforms` | 获取支持的平台列表 |
| 解析热搜内容 | POST | `/api/v1/hotsearch/parse` | 一键解析热搜内容 |
| 获取关联内容 | GET | `/api/v1/hotsearch/related` | 获取热搜关键词关联内容 |

### 仪表盘API

| 接口 | 方法 | 路径 | 描述 |
|------|------|------|------|
| 获取所有仪表盘数据 | GET | `/api/v1/dashboard` | 获取所有仪表盘数据 |
| 获取统计数据 | GET | `/api/v1/dashboard/stats` | 获取核心统计数据 |
| 获取平台分布 | GET | `/api/v1/dashboard/platform-distribution` | 获取内容平台分布数据 |
| 获取内容类型对比 | GET | `/api/v1/dashboard/content-type-comparison` | 获取内容类型对比数据 |
| 获取近期趋势 | GET | `/api/v1/dashboard/recent-trend` | 获取近期内容采集趋势 |

### 系统配置API

| 接口 | 方法 | 路径 | 描述 |
|------|------|------|------|
| 获取用户列表 | GET | `/api/v1/config/users` | 获取用户列表 |
| 创建用户 | POST | `/api/v1/config/users` | 创建新用户 |
| 更新用户 | PUT | `/api/v1/config/users/:id` | 更新用户信息 |
| 删除用户 | DELETE | `/api/v1/config/users/:id` | 删除用户 |
| 切换用户状态 | PATCH | `/api/v1/config/users/:id/status` | 启用/禁用用户 |
| 获取Cookie列表 | GET | `/api/v1/config/cookies` | 获取平台Cookie列表 |
| 创建Cookie | POST | `/api/v1/config/cookies` | 添加平台Cookie |
| 更新Cookie | PUT | `/api/v1/config/cookies/:id` | 更新平台Cookie |
| 删除Cookie | DELETE | `/api/v1/config/cookies/:id` | 删除平台Cookie |
| 测试Cookie有效性 | POST | `/api/v1/config/cookies/:id/test` | 测试Cookie有效性 |
| 获取系统设置 | GET | `/api/v1/config/system` | 获取系统设置 |
| 更新系统设置 | PUT | `/api/v1/config/system` | 更新系统设置 |

## 核心功能说明

### 1. 单作品解析
- 支持抖音、小红书、快手、B站、微博等主流平台
- 自动解析作品标题、作者、平台、类型等元数据
- 下载无水印原始媒体文件
- 自动生成封面图

### 2. 作者作品监控
- 支持设置监控频率（每小时、每天、每周）
- 自动检测作者新发布作品
- 支持多平台作者监控
- 完整的任务执行日志

### 3. 内容管理与存储
- 支持多维度筛选与搜索
- 支持内容预览、下载、删除等操作
- 支持批量操作
- 结构化存储（按平台、作者/作品标题组织）

### 4. 任务调度中心
- 可视化任务管理界面
- 支持手动触发任务执行
- 任务状态实时更新
- 详细的任务执行日志

### 5. 平台热搜发现
- 定时抓取各平台热搜榜
- 支持历史热搜查询
- 热搜趋势分析
- 一键解析热搜内容

### 6. 数据可视化看板
- 核心数据概览
- 平台分布分析
- 内容类型对比
- 近期采集趋势

### 7. 系统配置管理
- 用户权限管理
- 平台Cookie配置
- 系统参数设置
- 合规性声明

## 性能优化与缓存策略

### 后端性能优化
- 实现了API响应压缩
- 集成了请求速率限制
- 静态文件缓存
- 数据库查询优化
- 核心数据缓存（内容列表、仪表盘数据、热搜数据）

### 前端性能优化
- 组件懒加载
- 图片懒加载
- 请求防抖与节流
- 状态管理优化

## 系统安全性

### 认证与授权
- JWT认证机制
- 基于角色的访问控制
- 密码加密存储

### 输入验证
- 请求参数验证
- 防止SQL注入
- 防止XSS攻击

### 安全配置
- CORS策略配置
- HTTPS支持
- 安全的Cookie设置

## 日志与监控

### 日志管理
- 结构化日志记录
- 多级别日志（info, warn, error）
- 日志文件轮转
- 日志查询与分析

### 系统监控
- 系统健康状态监控
- 资源使用率监控
- 应用统计信息
- 实时指标监控

## 开发与测试

### 开发流程
1. 代码编写
2. 单元测试
3. 集成测试
4. 代码审查
5. 构建部署

### 测试工具
- Jest (单元测试)
- Supertest (API测试)

### 运行测试
```bash
# 后端测试
cd backend
npm test

# 前端测试
cd frontend
npm test
````

## 常见问题与解决方案

1. **问题**：解析失败
   **解决方案**：检查平台 Cookie 是否有效，网络连接是否正常，查看系统日志获取详细错误信息

2. **问题**：监控任务未执行
   **解决方案**：检查任务状态是否为启用，查看任务日志获取详细错误信息，确保系统服务正常运行

3. **问题**：系统运行缓慢
   **解决方案**：检查数据库索引，优化查询语句，清理过期数据，增加服务器资源

4. **问题**：文件下载失败
   **解决方案**：检查存储路径权限，确保文件存在，查看系统日志获取详细错误信息

5. **问题**：登录失败
   **解决方案**：检查用户名密码是否正确，联系管理员重置密码，检查 JWT 配置是否正确

## 贡献指南

### 开发环境搭建

1. 克隆项目代码
2. 按照「安装步骤」配置开发环境
3. 安装依赖
4. 启动开发服务器

### 代码规范

- 遵循项目现有的代码风格
- 使用 ESLint 和 Prettier 进行代码检查和格式化
- 为新功能编写测试用例
- 提交代码前运行测试

### 提交规范

- 使用语义化提交信息
- 提交信息格式：`type(scope): description`
- 例如：`feat(content): add batch delete functionality`

### 分支管理

- `main`：主分支，用于发布生产版本
- `develop`：开发分支，用于集成新功能
- `feature/xxx`：功能分支，用于开发特定功能
- `fix/xxx`：修复分支，用于修复 bug

### 贡献流程

1. Fork 项目仓库
2. 创建功能分支
3. 提交代码
4. 创建 Pull Request
5. 代码审查
6. 合并到主分支

## 版本更新日志

### v1.0.0 (2025-12-19)

- 初始版本发布
- 实现所有核心功能
- 完善的 API 文档
- 支持多平台内容解析
- 作者监控任务功能
- 内容管理系统
- 热搜数据抓取与分析
- 数据可视化仪表盘

## 许可证

MIT License

Copyright (c) 2025 videoAll Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## 免责声明

本项目仅供学习和研究使用，请勿用于商业用途。使用本项目进行内容抓取时，请遵守各平台的服务条款和相关法律法规。对于因使用本项目而引起的任何法律责任，项目作者不承担任何责任。

## 联系方式

如有任何问题或建议，欢迎通过以下方式联系：

- 项目仓库：https://gitea.yangzai.fun:16666/yangzai/videoAll.git
- 项目文档：https://gitea.yangzai.fun:16666/yangzai/videoAll.git

## 更新记录

- 2025-12-19：初始版本发布
- 2025-12-20：完善 README 文档，添加使用指南和配置方法
- 2025-12-21：优化 API 文档，添加贡献指南

## 致谢

感谢所有为本项目做出贡献的开发者和测试人员。
