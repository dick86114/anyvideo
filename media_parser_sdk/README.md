# 媒体解析 SDK (Media Parser SDK)

[![Python Version](https://img.shields.io/badge/python-3.8+-blue.svg)](https://python.org)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-orange.svg)](https://github.com/your-org/media-parser-sdk)

一个强大的多平台媒体内容解析 SDK，支持小红书、抖音、微博、哔哩哔哩等主流平台的媒体内容解析和无水印下载。

## 🌟 核心功能

### 支持平台

- ✅ **小红书 (Xiaohongshu)** - 完整支持

  - 图片笔记解析和下载
  - 视频笔记解析和下载
  - 实况图片解析和下载
  - 无水印处理
  - 完整元数据提取

- ⚠️ **抖音 (Douyin)** - 基础支持

  - 视频信息解析
  - 反爬虫检测
  - 需要额外配置以绕过限制

- 🚧 **微博 (Weibo)** - 开发中
- 🚧 **哔哩哔哩 (Bilibili)** - 开发中

### 主要特性

- 🎯 **智能解析**: 自动识别平台和内容类型
- 📁 **智能组织**: 按笔记自动创建文件夹，便于管理
- 🚀 **异步下载**: 支持并发下载，提高效率
- 🔄 **自动重试**: 网络失败时自动重试
- 📊 **详细日志**: 完整的操作日志记录
- 🛡️ **异常处理**: 完善的错误处理机制
- 📱 **多种类型**: 支持图片、视频、实况图片等

## 📦 安装

### 使用 pip 安装（推荐）

```bash
pip install media-parser-sdk
```

### 从源码安装

```bash
git clone https://github.com/your-org/media-parser-sdk.git
cd media-parser-sdk
pip install -e .
```

### 开发环境安装

```bash
git clone https://github.com/your-org/media-parser-sdk.git
cd media-parser-sdk
pip install -e ".[dev]"
```

## 🔧 环境依赖

### Python 版本要求

- Python 3.8 或更高版本

### 核心依赖

```
httpx>=0.25.0          # HTTP客户端
rich>=13.0.0           # 终端美化
retry>=0.9.2           # 重试机制
pydantic>=2.0.0        # 数据验证
typing-extensions>=4.0.0  # 类型支持
```

### 可选依赖

```bash
# 开发工具
pip install "media-parser-sdk[dev]"

# 文档生成
pip install "media-parser-sdk[docs]"
```

## 🚀 快速开始

### 基础用法

```python
from media_parser_sdk import MediaParser, MediaDownloader
import asyncio

# 创建解析器
parser = MediaParser()

# 解析链接
url = "https://www.xiaohongshu.com/explore/..."
media_info = parser.parse(url)

print(f"标题: {media_info.title}")
print(f"作者: {media_info.author}")
print(f"类型: {media_info.media_type}")
print(f"资源数: {media_info.resource_count}")

# 下载媒体
async def download_example():
    downloader = MediaDownloader(output_dir="./downloads")
    success = await downloader.download(media_info)
    return success

# 运行下载
success = asyncio.run(download_example())
```

### 便捷函数

```python
from media_parser_sdk import parse_url, download_media
import asyncio

# 快速解析
media_info = parse_url("https://www.xiaohongshu.com/explore/...")

# 快速下载
success = asyncio.run(download_media(
    "https://www.xiaohongshu.com/explore/...",
    output_dir="./downloads"
))
```

## 📚 API 接口文档

### MediaParser 类

媒体解析器主类，负责解析各平台的媒体链接。

#### 初始化

```python
parser = MediaParser(logger=None, **kwargs)
```

**参数:**

- `logger` (Optional[logging.Logger]): 自定义日志记录器
- `**kwargs`: 其他配置参数

#### 主要方法

##### parse(url: str) -> MediaInfo

解析媒体链接并返回媒体信息对象。

**参数:**

- `url` (str): 媒体链接

**返回:**

- `MediaInfo`: 媒体信息对象

**异常:**

- `ParseError`: 解析失败
- `PlatformError`: 平台不支持
- `NetworkError`: 网络错误

**示例:**

```python
parser = MediaParser()
media_info = parser.parse("https://www.xiaohongshu.com/explore/...")
```

##### identify_platform(url: str) -> Platform

识别链接所属平台。

**参数:**

- `url` (str): 媒体链接

**返回:**

- `Platform`: 平台枚举值

##### is_supported_url(url: str) -> bool

检查是否支持该 URL。

**参数:**

- `url` (str): 待检查的 URL

**返回:**

- `bool`: 是否支持

### MediaDownloader 类

媒体下载器，负责下载媒体内容。

#### 初始化

```python
downloader = MediaDownloader(
    output_dir="./downloads",
    max_workers=10,
    max_retries=3,
    retry_delay=2,
    logger=None,
    **kwargs
)
```

**参数:**

- `output_dir` (str): 下载目录，默认 "./downloads"
- `max_workers` (int): 最大并发数，默认 10
- `max_retries` (int): 最大重试次数，默认 3
- `retry_delay` (int): 重试延迟秒数，默认 2
- `logger` (Optional[logging.Logger]): 自定义日志记录器
- `**kwargs`: 其他配置参数

#### 主要方法

##### async download(media_info: MediaInfo) -> bool

下载媒体资源。

**参数:**

- `media_info` (MediaInfo): 媒体信息对象

**返回:**

- `bool`: 下载是否成功

**异常:**

- `DownloadError`: 下载失败

**示例:**

```python
downloader = MediaDownloader(output_dir="./my_downloads")
success = await downloader.download(media_info)
```

### MediaInfo 类

媒体信息数据模型，包含解析得到的所有媒体信息。

#### 主要属性

```python
class MediaInfo:
    platform: Platform          # 平台名称
    title: str                  # 标题
    author: str                 # 作者
    media_type: MediaType       # 媒体类型
    note_id: Optional[str]      # 笔记/视频ID
    url: Optional[str]          # 原始链接
    download_urls: DownloadUrls # 下载链接集合
    description: Optional[str]   # 描述
    tags: List[str]             # 标签列表
    # ... 更多属性
```

#### 主要方法

##### get_summary() -> str

获取媒体信息摘要。

##### to_dict() -> Dict[str, Any]

转换为字典格式。

##### to_json() -> str

转换为 JSON 字符串。

### 枚举类型

#### Platform

```python
class Platform(str, Enum):
    XIAOHONGSHU = "xiaohongshu"
    DOUYIN = "douyin"
    WEIBO = "weibo"
    BILIBILI = "bilibili"
    UNKNOWN = "unknown"
```

#### MediaType

```python
class MediaType(str, Enum):
    IMAGE = "image"
    VIDEO = "video"
    LIVE_PHOTO = "live_photo"
    AUDIO = "audio"
    UNKNOWN = "unknown"
```

## 🖥️ 命令行工具

安装后可以使用 `media-parser` 命令行工具。

### 基本用法

```bash
# 解析链接
media-parser parse "https://www.xiaohongshu.com/explore/..."

# 下载媒体
media-parser download "https://www.xiaohongshu.com/explore/..." -o ./downloads

# 批量处理
media-parser batch urls.txt -o ./downloads

# 显示版本
media-parser --version

# 显示帮助
media-parser --help
```

### 命令详解

#### parse 命令

解析媒体链接并显示信息。

```bash
media-parser parse <URL> [选项]
```

**选项:**

- `-v, --verbose`: 显示详细信息

#### download 命令

下载媒体内容。

```bash
media-parser download <URL> [选项]
```

**选项:**

- `-o, --output <DIR>`: 指定下载目录，默认 "./downloads"
- `-v, --verbose`: 显示详细信息

#### batch 命令

批量处理链接文件。

```bash
media-parser batch <FILE> [选项]
```

**选项:**

- `-o, --output <DIR>`: 指定下载目录，默认 "./downloads"
- `-v, --verbose`: 显示详细信息

**文件格式:**
每行一个链接，支持空行和注释（以#开头）。

```
# 小红书链接
https://www.xiaohongshu.com/explore/...

# 抖音链接
https://www.douyin.com/video/...
```

## 📁 文件组织结构

下载的文件会按照以下结构组织：

```
downloads/
└── xiaohongshu/                    # 平台目录
    ├── 作者1_标题1_笔记ID/          # 笔记专用文件夹
    │   ├── media_info.json         # 媒体信息文件
    │   ├── 标题1.jpg               # 第一张图片
    │   ├── 标题1_2.jpg             # 第二张图片
    │   ├── 标题1.mp4               # 视频文件
    │   └── 标题1_live_1.mov        # 实况图片视频
    └── 作者2_标题2_笔记ID/
        └── ...
```

### 文件命名规则

- **文件夹**: `作者_标题_笔记ID前8位`
- **图片**: `标题.jpg`, `标题_2.jpg`, `标题_3.jpg`...
- **视频**: `标题.mp4`, `标题_2.mp4`...
- **实况**: `标题_live_1.mov`, `标题_live_2.mov`...

## 🔧 高级用法

### 自定义配置

```python
import logging
from media_parser_sdk import MediaParser, MediaDownloader

# 自定义日志
logger = logging.getLogger("my_app")
logger.setLevel(logging.DEBUG)

# 创建解析器
parser = MediaParser(logger=logger)

# 创建下载器
downloader = MediaDownloader(
    output_dir="./custom_downloads",
    max_workers=20,           # 增加并发数
    max_retries=5,           # 增加重试次数
    retry_delay=3,           # 增加重试延迟
    logger=logger
)
```

### 批量处理

```python
import asyncio
from media_parser_sdk import MediaParser, MediaDownloader

async def batch_download(urls, output_dir="./downloads"):
    parser = MediaParser()
    downloader = MediaDownloader(output_dir=output_dir)

    results = []
    for url in urls:
        try:
            media_info = parser.parse(url)
            success = await downloader.download(media_info)
            results.append((url, success))
        except Exception as e:
            print(f"处理失败 {url}: {e}")
            results.append((url, False))

    return results

# 使用示例
urls = [
    "https://www.xiaohongshu.com/explore/...",
    "https://www.xiaohongshu.com/explore/...",
]

results = asyncio.run(batch_download(urls))
```

### 自定义解析器

```python
from media_parser_sdk.core.base_parser import BaseParser
from media_parser_sdk.models.media_info import MediaInfo, Platform, MediaType
from media_parser_sdk import MediaParser

class CustomParser(BaseParser):
    def is_supported_url(self, url: str) -> bool:
        return "example.com" in url

    def parse(self, url: str) -> MediaInfo:
        # 实现自定义解析逻辑
        return MediaInfo(
            platform=Platform.UNKNOWN,
            title="自定义内容",
            author="自定义作者",
            media_type=MediaType.IMAGE
        )

# 注册自定义解析器
parser = MediaParser()
parser.add_parser(Platform.UNKNOWN, CustomParser())
```

## ❗ 常见问题

### Q1: 安装时出现依赖错误

**A:** 确保 Python 版本>=3.8，并尝试升级 pip：

```bash
python -m pip install --upgrade pip
pip install media-parser-sdk
```

### Q2: 小红书解析失败

**A:** 可能的原因和解决方案：

- 检查链接格式是否正确
- 确保网络连接正常
- 某些私密笔记可能无法访问
- 尝试使用完整的链接（包含参数）

### Q3: 抖音内容无法下载

**A:** 抖音有较强的反爬虫机制：

- 当前版本只支持基础信息解析
- 下载功能需要额外的反爬虫处理
- 建议关注后续版本更新

### Q4: 下载速度慢

**A:** 可以调整并发参数：

```python
downloader = MediaDownloader(
    max_workers=20,  # 增加并发数
    max_retries=5    # 增加重试次数
)
```

### Q5: 文件下载不完整

**A:** 检查以下几点：

- 网络连接是否稳定
- 磁盘空间是否充足
- 防火墙是否阻止连接
- 尝试增加重试次数和延迟

### Q6: 内存占用过高

**A:** 对于大量文件的批量下载：

- 减少 `max_workers` 参数
- 分批处理链接
- 及时清理临时文件

## ⚠️ 注意事项

### 使用限制

1. **仅供学习研究**: 本 SDK 仅用于学习和研究目的
2. **遵守平台规则**: 使用时请遵守各平台的服务条款
3. **合理使用频率**: 避免过于频繁的请求，以免被平台限制
4. **版权尊重**: 下载的内容请尊重原作者版权

### 技术限制

1. **反爬虫机制**: 部分平台有反爬虫限制，可能影响解析效果
2. **链接时效性**: 某些下载链接可能有时效性
3. **网络依赖**: 需要稳定的网络连接
4. **平台更新**: 平台接口变化可能影响解析功能

### 最佳实践

1. **错误处理**: 始终使用 try-catch 处理异常
2. **日志记录**: 启用详细日志以便调试
3. **资源管理**: 及时释放网络连接和文件句柄
4. **版本更新**: 定期更新到最新版本

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

### 开发环境设置

```bash
git clone https://github.com/your-org/media-parser-sdk.git
cd media-parser-sdk
pip install -e ".[dev]"

# 运行测试
pytest

# 代码格式化
black media_parser_sdk/

# 类型检查
mypy media_parser_sdk/
```

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🔗 相关链接

- [GitHub 仓库](https://github.com/your-org/media-parser-sdk)
- [PyPI 包](https://pypi.org/project/media-parser-sdk/)
- [问题反馈](https://github.com/your-org/media-parser-sdk/issues)
- [更新日志](CHANGELOG.md)

## 📞 联系我们

- 邮箱: support@mediaparser.com
- 问题反馈: [GitHub Issues](https://github.com/your-org/media-parser-sdk/issues)

---

**免责声明**: 本工具仅供学习和研究使用，请遵守相关平台的服务条款和法律法规。使用本工具所产生的任何法律责任由使用者自行承担。
