#!/usr/bin/env python3
"""
媒体解析SDK演示程序
"""

import sys
import os
import asyncio
import logging
sys.path.insert(0, os.path.dirname(__file__))

from media_parser_sdk import MediaParser, MediaDownloader, parse_url

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def demo_basic_usage():
    """基础使用演示"""
    print("=" * 60)
    print("🎯 媒体解析SDK基础使用演示")
    print("=" * 60)
    
    # 创建解析器
    parser = MediaParser()
    
    print(f"✅ SDK版本: 1.0.0")
    print(f"✅ 支持平台: {', '.join([p.value for p in parser.get_supported_platforms()])}")
    
    # 演示URL识别
    print("\n📋 平台识别演示:")
    test_urls = [
        "https://www.xiaohongshu.com/explore/123",
        "https://www.douyin.com/video/456", 
        "https://www.weibo.com/789",
        "https://www.bilibili.com/video/av123"
    ]
    
    for url in test_urls:
        platform = parser.identify_platform(url)
        print(f"  {url} → {platform.value}")

def demo_media_info():
    """媒体信息模型演示"""
    print("\n📊 媒体信息模型演示:")
    
    from media_parser_sdk.models.media_info import MediaInfo, MediaType, Platform, DownloadUrls
    
    # 创建示例媒体信息
    download_urls = DownloadUrls(
        video=["https://example.com/video.mp4"],
        images=["https://example.com/img1.jpg", "https://example.com/img2.jpg"],
        live=["https://example.com/live.mov"]
    )
    
    media_info = MediaInfo(
        platform=Platform.XIAOHONGSHU,
        title="美丽的风景照片",
        author="摄影师小王",
        media_type=MediaType.LIVE_PHOTO,
        download_urls=download_urls,
        description="这是一组美丽的风景照片，包含实况图片效果",
        tags=["风景", "摄影", "自然"],
        has_live_photo=True
    )
    
    print(f"  标题: {media_info.title}")
    print(f"  作者: {media_info.author}")
    print(f"  类型: {media_info.media_type}")
    print(f"  资源数: {media_info.resource_count}")
    print(f"  包含实况: {media_info.has_live_photo}")

def demo_error_handling():
    """错误处理演示"""
    print("\n🛡️ 错误处理演示:")
    
    from media_parser_sdk.exceptions import PlatformError, ParseError
    
    parser = MediaParser()
    
    test_cases = [
        ("", "空URL"),
        ("invalid-url", "无效URL格式"),
        ("https://unknown-platform.com/content", "不支持的平台")
    ]
    
    for url, description in test_cases:
        try:
            parser.parse(url)
            print(f"  ❌ {description}: 应该失败但成功了")
        except (PlatformError, ParseError) as e:
            print(f"  ✅ {description}: 正确捕获异常")
        except Exception as e:
            print(f"  ⚠️ {description}: 意外异常 - {type(e).__name__}")

def demo_downloader_config():
    """下载器配置演示"""
    print("\n⚙️ 下载器配置演示:")
    
    # 默认配置
    downloader1 = MediaDownloader()
    print(f"  默认配置: 输出目录={downloader1.get_output_dir()}, 并发数={downloader1.max_workers}")
    
    # 自定义配置
    downloader2 = MediaDownloader(
        output_dir="./custom_downloads",
        max_workers=20,
        max_retries=5,
        retry_delay=3
    )
    print(f"  自定义配置: 输出目录={downloader2.get_output_dir()}, 并发数={downloader2.max_workers}")

async def demo_async_features():
    """异步功能演示"""
    print("\n🚀 异步功能演示:")
    
    # 模拟异步操作
    async def mock_download(name, delay):
        print(f"  开始下载 {name}...")
        await asyncio.sleep(delay)
        print(f"  ✅ {name} 下载完成")
        return True
    
    # 并发下载演示
    tasks = [
        mock_download("图片1", 0.5),
        mock_download("图片2", 0.3),
        mock_download("视频1", 0.8)
    ]
    
    results = await asyncio.gather(*tasks)
    print(f"  并发下载完成，成功: {sum(results)}/{len(results)}")

def demo_cli_info():
    """CLI工具信息演示"""
    print("\n💻 CLI工具使用:")
    
    cli_examples = [
        "media-parser parse 'https://www.xiaohongshu.com/explore/...'",
        "media-parser download 'https://www.xiaohongshu.com/explore/...' -o ./downloads",
        "media-parser batch urls.txt -o ./downloads",
        "media-parser --help"
    ]
    
    for example in cli_examples:
        print(f"  $ {example}")

def demo_file_structure():
    """文件结构演示"""
    print("\n📁 文件组织结构:")
    
    structure = """
  downloads/
  └── xiaohongshu/
      ├── 作者1_标题1_12345678/
      │   ├── media_info.json
      │   ├── 标题1.jpg
      │   ├── 标题1_2.jpg
      │   └── 标题1_live_1.mov
      └── 作者2_标题2_87654321/
          ├── media_info.json
          └── 标题2.mp4
    """
    print(structure)

async def main():
    """主演示函数"""
    print("🎉 欢迎使用媒体解析SDK！")
    
    # 基础功能演示
    demo_basic_usage()
    
    # 媒体信息模型演示
    demo_media_info()
    
    # 错误处理演示
    demo_error_handling()
    
    # 下载器配置演示
    demo_downloader_config()
    
    # 异步功能演示
    await demo_async_features()
    
    # CLI工具信息
    demo_cli_info()
    
    # 文件结构演示
    demo_file_structure()
    
    print("\n" + "=" * 60)
    print("🎊 演示完成！")
    print("=" * 60)
    print("\n📚 更多信息:")
    print("  - 查看 README.md 获取完整文档")
    print("  - 运行 python3 examples/basic_usage.py 查看基础示例")
    print("  - 运行 python3 examples/advanced_usage.py 查看高级示例")
    print("  - 使用 media-parser --help 查看CLI帮助")
    print("\n🚀 开始使用媒体解析SDK吧！")

if __name__ == "__main__":
    asyncio.run(main())