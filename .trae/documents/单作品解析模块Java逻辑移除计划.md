# 单作品解析模块Java逻辑移除计划

## 1. 模块现状分析
- **位置**: `/parser-module/` 目录，独立Java项目
- **功能**: 包含小红书、微博、抖音、快手、B站等平台的内容解析
- **依赖关系**: 
  - 内部依赖: jsoup、fastjson2、okhttp3等
  - 外部调用: 目前无直接调用，后端已有独立实现
- **替代方案**: 后端`ParseService.js`已实现相同功能，`media_parser_sdk`(Python)是新实现

## 2. 移除目标
- 移除所有平台executor类的业务逻辑
- 保留`ParserManager`的接口定义
- 保留配置文件和依赖关系
- 确保不影响系统其他功能
- 为后续Python实现集成做好准备

## 3. 详细移除步骤

### 3.1 代码备份
```bash
tar -czvf parser-module-backup-$(date +%Y%m%d).tar.gz /Users/wangxuyang/Downloads/01_GitHub/demo/videoAll/parser-module/src/main/java/com/flower/parser/executor/
```

### 3.2 移除业务逻辑

#### 3.2.1 简化`ParserManager.java`
- 保留类结构和方法签名
- 移除所有平台executor的实例化和调用
- 简化方法实现，保留空方法体

#### 3.2.2 清空executor类
- `HongShuExecutor.java`: 清空`dataExecutor`方法
- `WeiboExecutor.java`: 清空`dataExecutor`方法
- `DouYinExecutor.java`: 清空`ImageTextExecutor`方法
- `KuaishouExecutor.java`: 清空`dataExecutor`方法
- `BilibiliExecutor.java`: 清空`dataExecutor`方法

#### 3.2.3 保留工具类和配置
- 保留`utils/`目录下的所有工具类
- 保留`config/`目录下的配置
- 保留`entity/`目录下的实体类

### 3.3 验证移除结果
- 编译Java项目确保无语法错误
- 检查日志配置是否正常
- 确保接口定义完整

## 4. 预期结果
- 移除了所有Java解析业务逻辑
- 保留了`ParserManager`的完整接口
- 保留了外部依赖关系
- 不影响系统其他模块运行
- 为后续Python实现集成做好准备

## 5. 后续集成准备
- 保留的`ParserManager`接口将作为Python实现的集成入口
- 配置文件可直接用于新实现
- 依赖关系已梳理清晰