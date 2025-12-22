# 快速开始指南

## 5 分钟上手媒体解析 SDK

### 1. 基础解析

```python
from media_parser_sdk import parse_url

# 解析小红书链接
url = "https://www.xiaohongshu.com/explore/..."
media_info = parse_url(url)

print(f"标题: {media_info.title}")
print(f"作者: {media_info.author}")
print(f"类型: {media_info.media_type}")
print(f"资源数: {media_info.resource_count}")
```

### 2. 下载媒体

```python
import asyncio
from media_parser_sdk import download_media

async def main():
    url = "https://www.xiaohongshu.com/explore/..."
    success = await download_media(url, output_dir="./downloads")
    print(f"下载{'成功' if success else '失败'}")

asyncio.run(main())
```

### 3. 批量处理

```python
import asyncio
from media_parser_sdk import MediaParser, MediaDownloader

async def batch_download():
    urls = [
        "https://www.xiaohongshu.com/explore/...",
        "https://www.xiaohongshu.com/explore/...",
    ]

    parser = MediaParser()
    downloader = MediaDownloader(output_dir="./downloads")

    for url in urls:
        try:
            media_info = parser.parse(url)
            success = await downloader.download(media_info)
            print(f"{'✅' if success else '❌'} {media_info.title}")
        except Exception as e:
            print(f"❌ {url}: {e}")

asyncio.run(batch_download())
```

### 4. 命令行使用

```bash
# 解析链接
media-parser parse "https://www.xiaohongshu.com/explore/..."

# 下载媒体
media-parser download "https://www.xiaohongshu.com/explore/..." -o ./downloads

# 批量处理
echo "https://www.xiaohongshu.com/explore/..." > urls.txt
media-parser batch urls.txt -o ./downloads
```

### 5. 自定义配置

```python
from media_parser_sdk import MediaParser, MediaDownloader
import logging

# 自定义日志
logger = logging.getLogger("my_app")
logger.setLevel(logging.DEBUG)

# 创建解析器
parser = MediaParser(logger=logger)

# 创建下载器
downloader = MediaDownloader(
    output_dir="./my_downloads",
    max_workers=20,      # 增加并发数
    max_retries=5,       # 增加重试次数
    retry_delay=3,       # 增加重试延迟
    logger=logger
)
```

## 支持的平台

| 平台     | 状态        | 功能                         |
| -------- | ----------- | ---------------------------- |
| 小红书   | ✅ 完整支持 | 图片、视频、实况图片解析下载 |
| 抖音     | ⚠️ 基础支持 | 基础信息解析，下载受限       |
| 微博     | 🚧 开发中   | 基础框架已完成               |
| 哔哩哔哩 | 🚧 开发中   | 基础框架已完成               |

## 文件组织

下载的文件按以下结构组织：

```
downloads/
└── xiaohongshu/
    ├── 作者1_标题1_笔记ID/
    │   ├── media_info.json
    │   ├── 标题1.jpg
    │   ├── 标题1_2.jpg
    │   └── 标题1_live_1.mov
    └── 作者2_标题2_笔记ID/
        └── ...
```

## 错误处理

```python
from media_parser_sdk import MediaParser
from media_parser_sdk.exceptions import ParseError, PlatformError, NetworkError

parser = MediaParser()

try:
    media_info = parser.parse(url)
except PlatformError as e:
    print(f"平台不支持: {e}")
except ParseError as e:
    print(f"解析失败: {e}")
except NetworkError as e:
    print(f"网络错误: {e}")
except Exception as e:
    print(f"未知错误: {e}")
```

## 更多示例

查看 `examples/` 目录获取更多使用示例：

- `basic_usage.py` - 基础使用方法
- `advanced_usage.py` - 高级功能和自定义

## 获取帮助

- 查看 [README.md](README.md) 获取完整文档
- 运行 `python3 test_*.py` 查看测试示例
- 使用 `media-parser --help` 查看命令行帮助
