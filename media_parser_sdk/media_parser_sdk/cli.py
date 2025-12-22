#!/usr/bin/env python3
"""
命令行工具
"""

import argparse
import asyncio
import sys
from pathlib import Path

from . import MediaParser, MediaDownloader, __version__
from .exceptions import MediaParserError


def main():
    """主函数"""
    parser = argparse.ArgumentParser(
        description="媒体解析SDK命令行工具",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例用法:
  # 解析链接
  media-parser parse "https://www.xiaohongshu.com/explore/..."
  
  # 下载媒体
  media-parser download "https://www.xiaohongshu.com/explore/..." -o ./downloads
  
  # 批量处理
  media-parser batch urls.txt -o ./downloads
        """
    )
    
    parser.add_argument("--version", action="version", version=f"media-parser-sdk {__version__}")
    
    subparsers = parser.add_subparsers(dest="command", help="可用命令")
    
    # 解析命令
    parse_parser = subparsers.add_parser("parse", help="解析媒体链接")
    parse_parser.add_argument("url", help="媒体链接")
    parse_parser.add_argument("-v", "--verbose", action="store_true", help="显示详细信息")
    
    # 下载命令
    download_parser = subparsers.add_parser("download", help="下载媒体内容")
    download_parser.add_argument("url", help="媒体链接")
    download_parser.add_argument("-o", "--output", default="./downloads", help="下载目录")
    download_parser.add_argument("-v", "--verbose", action="store_true", help="显示详细信息")
    
    # 批量处理命令
    batch_parser = subparsers.add_parser("batch", help="批量处理链接文件")
    batch_parser.add_argument("file", help="包含链接的文件路径")
    batch_parser.add_argument("-o", "--output", default="./downloads", help="下载目录")
    batch_parser.add_argument("-v", "--verbose", action="store_true", help="显示详细信息")
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    try:
        if args.command == "parse":
            handle_parse(args)
        elif args.command == "download":
            asyncio.run(handle_download(args))
        elif args.command == "batch":
            asyncio.run(handle_batch(args))
    except MediaParserError as e:
        print(f"错误: {e}", file=sys.stderr)
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n操作已取消", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"未知错误: {e}", file=sys.stderr)
        sys.exit(1)


def handle_parse(args):
    """处理解析命令"""
    parser = MediaParser()
    
    print(f"正在解析: {args.url}")
    media_info = parser.parse(args.url)
    
    print("\n解析结果:")
    print("=" * 50)
    print(media_info.get_summary())
    
    if args.verbose:
        print("\n详细信息:")
        print("-" * 30)
        print(media_info.to_json())


async def handle_download(args):
    """处理下载命令"""
    parser = MediaParser()
    downloader = MediaDownloader(output_dir=args.output)
    
    print(f"正在解析: {args.url}")
    media_info = parser.parse(args.url)
    
    print(f"解析成功: {media_info.title} - {media_info.author}")
    print(f"资源数量: {media_info.resource_count}")
    
    if not media_info.has_downloadable_content:
        print("没有可下载的内容")
        return
    
    print(f"开始下载到: {args.output}")
    success = await downloader.download(media_info)
    
    if success:
        print("下载完成!")
    else:
        print("下载失败!")


async def handle_batch(args):
    """处理批量命令"""
    file_path = Path(args.file)
    if not file_path.exists():
        print(f"文件不存在: {args.file}", file=sys.stderr)
        return
    
    # 读取链接
    with open(file_path, 'r', encoding='utf-8') as f:
        urls = [line.strip() for line in f if line.strip()]
    
    if not urls:
        print("文件中没有找到有效链接", file=sys.stderr)
        return
    
    parser = MediaParser()
    downloader = MediaDownloader(output_dir=args.output)
    
    print(f"共读取到 {len(urls)} 个链接")
    
    for i, url in enumerate(urls, 1):
        print(f"\n--- 处理链接 {i}/{len(urls)} ---")
        print(f"链接: {url}")
        
        try:
            media_info = parser.parse(url)
            print(f"解析成功: {media_info.title} - {media_info.author}")
            
            if media_info.has_downloadable_content:
                success = await downloader.download(media_info)
                if success:
                    print("下载完成")
                else:
                    print("下载失败")
            else:
                print("没有可下载的内容")
                
        except MediaParserError as e:
            print(f"处理失败: {e}")
            continue


if __name__ == "__main__":
    main()