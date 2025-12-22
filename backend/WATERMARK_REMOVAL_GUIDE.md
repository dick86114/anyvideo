# 小红书去水印和实况图片下载指南

## 功能概述

本系统已经实现了以下增强功能：

### 1. 🎯 智能去水印

- **自动检测水印**：系统能自动识别 URL 中的水印标识
- **多策略去除**：采用多种策略去除小红书图片水印
- **质量优化**：尝试获取最高质量的无水印版本

### 2. 📸 实况图片支持

- **Live Photo 检测**：自动识别实况图片（Live Photo）
- **双组件下载**：同时下载静态图片和动态视频
- **智能命名**：为实况图片的不同组件生成合适的文件名

### 3. 📁 批量下载

- **全图片下载**：下载所有图片，不仅仅是封面
- **并发处理**：支持多图片并发下载
- **错误恢复**：单个图片失败不影响其他图片下载

## 技术实现

### 水印去除策略

#### 小红书水印去除

```javascript
// 策略1: 移除质量参数（这些参数通常会添加水印）
cleanUrl = cleanUrl.replace(/!\w+/g, "");

// 策略2: 替换为更高质量的CDN域名
cleanUrl = cleanUrl.replace(
  "sns-webpic-qc.xhscdn.com",
  "sns-img-qc.xhscdn.com"
);

// 策略3: 移除水印相关参数
cleanUrl = cleanUrl.replace(/[?&]watermark=\d+/g, "");
cleanUrl = cleanUrl.replace(/[?&]x-oss-process=[^&]*/g, "");

// 策略4: 处理spectrum路径
cleanUrl = cleanUrl.replace(/\/spectrum\/[^/]*\//, "/");
```

### Live Photo 处理

#### 检测逻辑

```javascript
const livePhotoIndicators = [
  "live_photo",
  "livephoto",
  "live_image",
  "motion_photo",
  "burst",
  "sequence",
  ".heic",
  ".mov",
  "live",
];
```

#### URL 推导

```javascript
// 从静态图片推导动态视频
motionUrl = staticUrl
  .replace(/\.(jpg|jpeg|png|heic)$/i, ".mov")
  .replace(/static/gi, "motion")
  .replace(/live_image/gi, "live_video");

// 从动态视频推导静态图片
staticUrl = motionUrl
  .replace(/\.(mov|mp4)$/i, ".jpg")
  .replace(/motion/gi, "static")
  .replace(/live_video/gi, "live_image");
```

## 使用方法

### 1. 基本使用

```javascript
// 解析小红书链接
const parsedData = await ParseService.parseXiaohongshuLink(url);

// 下载所有媒体文件（包括去水印和Live Photo处理）
const downloadResult = await ParseService.downloadAllMedia(
  parsedData,
  "xiaohongshu"
);

console.log(`成功下载 ${downloadResult.totalFiles} 个文件`);
```

### 2. 单独使用工具类

```javascript
const WatermarkRemover = require("./src/utils/watermarkRemover");
const LivePhotoProcessor = require("./src/utils/livePhotoProcessor");

// 去水印
const cleanUrl = WatermarkRemover.removeWatermark(originalUrl, "xiaohongshu");

// 检测Live Photo
const isLive = LivePhotoProcessor.isLivePhoto(url);

// 提取Live Photo组件
const liveUrls = LivePhotoProcessor.extractLivePhotoUrls(url);
```

### 3. 批量处理

```javascript
// 批量去水印
const cleanUrls = WatermarkRemover.removeWatermarkBatch(urls, "xiaohongshu");

// 批量处理Live Photo
const processedFiles = LivePhotoProcessor.processLivePhotoUrls(urls);
```

## 文件结构

下载的文件将按以下结构保存：

```
backend/media/xiaohongshu/
├── 内容标题1/
│   ├── contentId_timestamp_001.jpg          # 普通图片
│   ├── contentId_timestamp_002_static.jpg   # Live Photo静态组件
│   ├── contentId_timestamp_002_motion.mov   # Live Photo动态组件
│   └── contentId_timestamp_003.jpg          # 更多图片...
└── 内容标题2/
    └── ...
```

## 支持的格式

### 图片格式

- JPG/JPEG
- PNG
- WebP
- HEIC (Live Photo)

### 视频格式

- MOV (Live Photo 动态组件)
- MP4

### Live Photo 类型

- 标准 Live Photo (静态图片 + 动态视频)
- 连拍照片 (Burst)
- 动态照片 (Motion Photo)
- 序列图片 (Sequence)

## 测试验证

运行综合测试：

```bash
cd backend
node test-comprehensive.js
```

测试包括：

- ✅ 水印检测和去除
- ✅ Live Photo 识别和处理
- ✅ 批量处理功能
- ✅ 文件下载验证

## 常见问题

### Q: 为什么有些图片还是有水印？

A: 可能的原因：

1. 图片本身就带有嵌入式水印
2. CDN 返回了带水印的版本
3. 需要登录状态才能获取无水印版本

### Q: Live Photo 只下载了一个文件？

A: 检查：

1. URL 是否被正确识别为 Live Photo
2. 是否能成功推导出另一个组件的 URL
3. 网络连接是否稳定

### Q: 下载的文件大小为 0？

A: 可能原因：

1. URL 已失效
2. 需要特定的请求头
3. 被反爬虫机制拦截

## 更新日志

### v2.0.0 (当前版本)

- ✨ 新增智能去水印功能
- ✨ 新增 Live Photo 支持
- ✨ 新增批量下载所有图片
- 🔧 优化错误处理和重试机制
- 📝 完善日志和调试信息

### v1.0.0 (原版本)

- 基础的小红书链接解析
- 单图片下载
- 基本的文件保存

## 技术支持

如果遇到问题，请：

1. 查看控制台日志
2. 运行测试脚本验证功能
3. 检查网络连接和 URL 有效性
4. 确认目标文件夹权限
