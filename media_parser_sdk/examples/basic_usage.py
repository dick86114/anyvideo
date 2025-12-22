#!/usr/bin/env python3
"""
基础使用示例
"""

import asyncio
import logging
from media_parser_sdk import MediaParser, MediaDownloader, parse_url, download_media

# 配置日志
logging.basicConfig(level=logging.INFO)


def example_parse():
    """解析示例"""
    print("=== 解析示例 ===")
    
    # 小红书链接示例
    url = "https://www.xiaohongshu.com/explore/6948f1b6000000001e033c84"
    
    try:
        # 方法1: 使用便捷函数
        media_info = parse_url(url)
        print(f"标题: {media_info.title}")
        print(f"作者: {media_info.author}")
        print(f"类型: {media_info.media_type}")
        print(f"平台: {media_info.platform}")
        print(f"资源数: {media_info.resource_count}")
        
        # 方法2: 使用类实例
        parser = MediaParser()
        media_info2 = parser.parse(url)
        print(f"\n摘要信息:\n{media_info2.get_summary()}")
        
    except Exception as e:
        print(f"解析失败: {e}")


async def example_download():
    """下载示例"""
    print("\n=== 下载示例 ===")
    
    url = "https://www.xiaohongshu.com/explore/6948f1b6000000001e033c84"
    
    try:
        # 方法1: 使用便捷函数
        success = await download_media(url, output_dir="./example_downloads")
        print(f"便捷函数下载结果: {success}")
        
        # 方法2: 使用类实例
        parser = MediaParser()
        downloader = MediaDownloader(
            output_dir="./example_downloads",
            max_workers=5,
            max_retries=3
        )
        
        media_info = parser.parse(url)
        if media_info.has_downloadable_content:
            success = await downloader.download(media_info)
            print(f"类实例下载结果: {success}")
        else:
            print("没有可下载的内容")
            
    except Exception as e:
        print(f"下载失败: {e}")


async def example_batch():
    """批量处理示例"""
    print("\n=== 批量处理示例 ===")
    
    urls = [
        "https://www.xiaohongshu.com/explore/6948f1b6000000001e033c84",
        "https://www.xiaohongshu.com/explore/69492add000000001f008b09",
    ]
    
    parser = MediaParser()
    downloader = MediaDownloader(output_dir="./batch_downloads")
    
    for i, url in enumerate(urls, 1):
        print(f"\n处理链接 {i}/{len(urls)}: {url}")
        
        try:
            media_info = parser.parse(url)
            print(f"解析成功: {media_info.title} - {media_info.author}")
            
            if media_info.has_downloadable_content:
                success = await downloader.download(media_info)
                print(f"下载{'成功' if success else '失败'}")
            else:
                print("没有可下载的内容")
                
        except Exception as e:
            print(f"处理失败: {e}")


def example_custom_config():
    """自定义配置示例"""
    print("\n=== 自定义配置示例 ===")
    
    # 自定义日志
    logger = logging.getLogger("custom_parser")
    logger.setLevel(logging.DEBUG)
    
    # 创建自定义配置的解析器
    parser = MediaParser(logger=logger)
    
    # 创建自定义配置的下载器
    downloader = MediaDownloader(
        output_dir="./custom_downloads",
        max_workers=20,      # 增加并发数
        max_retries=5,       # 增加重试次数
        retry_delay=3,       # 增加重试延迟
        logger=logger
    )
    
    print("自定义配置创建完成")
    print(f"支持的平台: {[p.value for p in parser.get_supported_platforms()]}")


async def main():
    """主函数"""
    print("媒体解析SDK示例程序")
    print("=" * 50)
    
    # 基础解析示例
    example_parse()
    
    # 下载示例
    await example_download()
    
    # 批量处理示例
    await example_batch()
    
    # 自定义配置示例
    example_custom_config()
    
    print("\n示例程序执行完成!")


if __name__ == "__main__":
    asyncio.run(main())