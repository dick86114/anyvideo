#!/usr/bin/env python3
"""
高级使用示例
"""

import asyncio
import logging
from pathlib import Path
from typing import List, Tuple

from media_parser_sdk import MediaParser, MediaDownloader
from media_parser_sdk.models.media_info import MediaInfo, Platform
from media_parser_sdk.exceptions import MediaParserError


class BatchProcessor:
    """批量处理器"""
    
    def __init__(self, output_dir: str = "./downloads", max_concurrent: int = 5):
        self.parser = MediaParser()
        self.downloader = MediaDownloader(
            output_dir=output_dir,
            max_workers=max_concurrent
        )
        self.results = []
    
    async def process_urls(self, urls: List[str]) -> List[Tuple[str, bool, str]]:
        """
        批量处理URL列表
        
        Returns:
            List[Tuple[str, bool, str]]: (url, success, message)
        """
        tasks = [self._process_single_url(url) for url in urls]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        return results
    
    async def _process_single_url(self, url: str) -> Tuple[str, bool, str]:
        """处理单个URL"""
        try:
            # 解析
            media_info = self.parser.parse(url)
            
            # 下载
            if media_info.has_downloadable_content:
                success = await self.downloader.download(media_info)
                message = f"成功下载: {media_info.title}"
                return (url, success, message)
            else:
                return (url, False, "没有可下载的内容")
                
        except MediaParserError as e:
            return (url, False, f"解析失败: {str(e)}")
        except Exception as e:
            return (url, False, f"未知错误: {str(e)}")


class MediaInfoAnalyzer:
    """媒体信息分析器"""
    
    @staticmethod
    def analyze_media_info(media_info: MediaInfo) -> dict:
        """分析媒体信息"""
        analysis = {
            "basic_info": {
                "platform": media_info.platform.value,
                "title": media_info.title,
                "author": media_info.author,
                "type": media_info.media_type.value,
            },
            "content_stats": {
                "total_resources": media_info.resource_count,
                "video_count": len(media_info.download_urls.video),
                "image_count": len(media_info.download_urls.images),
                "live_count": len(media_info.download_urls.live),
            },
            "features": {
                "has_downloadable_content": media_info.has_downloadable_content,
                "has_live_photo": media_info.has_live_photo,
                "is_watermark_removed": media_info.is_watermark_removed,
            },
            "metadata": {
                "tags": media_info.tags,
                "description_length": len(media_info.description or ""),
                "parse_time": media_info.parse_time.isoformat(),
            }
        }
        return analysis
    
    @staticmethod
    def generate_report(analyses: List[dict]) -> str:
        """生成分析报告"""
        if not analyses:
            return "没有数据可分析"
        
        # 统计信息
        total_count = len(analyses)
        platform_stats = {}
        type_stats = {}
        total_resources = 0
        
        for analysis in analyses:
            # 平台统计
            platform = analysis["basic_info"]["platform"]
            platform_stats[platform] = platform_stats.get(platform, 0) + 1
            
            # 类型统计
            media_type = analysis["basic_info"]["type"]
            type_stats[media_type] = type_stats.get(media_type, 0) + 1
            
            # 资源统计
            total_resources += analysis["content_stats"]["total_resources"]
        
        # 生成报告
        report = f"""
媒体内容分析报告
{'=' * 50}

总体统计:
- 总链接数: {total_count}
- 总资源数: {total_resources}
- 平均资源数: {total_resources / total_count:.1f}

平台分布:
{chr(10).join(f'- {platform}: {count} ({count/total_count*100:.1f}%)' for platform, count in platform_stats.items())}

内容类型分布:
{chr(10).join(f'- {media_type}: {count} ({count/total_count*100:.1f}%)' for media_type, count in type_stats.items())}

资源类型统计:
- 视频资源: {sum(a["content_stats"]["video_count"] for a in analyses)}
- 图片资源: {sum(a["content_stats"]["image_count"] for a in analyses)}
- 实况资源: {sum(a["content_stats"]["live_count"] for a in analyses)}

特殊功能:
- 包含实况图片: {sum(1 for a in analyses if a["features"]["has_live_photo"])}
- 已去水印: {sum(1 for a in analyses if a["features"]["is_watermark_removed"])}
        """
        
        return report.strip()


async def example_batch_processing():
    """批量处理示例"""
    print("=== 批量处理示例 ===")
    
    urls = [
        "https://www.xiaohongshu.com/explore/6948f1b6000000001e033c84",
        "https://www.xiaohongshu.com/explore/69492add000000001f008b09",
        # 可以添加更多链接
    ]
    
    processor = BatchProcessor(output_dir="./advanced_downloads")
    results = await processor.process_urls(urls)
    
    print(f"处理完成，共 {len(results)} 个链接:")
    for url, success, message in results:
        status = "✅" if success else "❌"
        print(f"{status} {url[:50]}... - {message}")


async def example_content_analysis():
    """内容分析示例"""
    print("\n=== 内容分析示例 ===")
    
    urls = [
        "https://www.xiaohongshu.com/explore/6948f1b6000000001e033c84",
        "https://www.xiaohongshu.com/explore/69492add000000001f008b09",
    ]
    
    parser = MediaParser()
    analyzer = MediaInfoAnalyzer()
    analyses = []
    
    for url in urls:
        try:
            media_info = parser.parse(url)
            analysis = analyzer.analyze_media_info(media_info)
            analyses.append(analysis)
            print(f"分析完成: {media_info.title}")
        except Exception as e:
            print(f"分析失败 {url}: {e}")
    
    # 生成报告
    if analyses:
        report = analyzer.generate_report(analyses)
        print(f"\n{report}")


def example_custom_parser():
    """自定义解析器示例"""
    print("\n=== 自定义解析器示例 ===")
    
    from media_parser_sdk.core.base_parser import BaseParser
    from media_parser_sdk.models.media_info import MediaInfo, MediaType, DownloadUrls
    
    class ExampleParser(BaseParser):
        """示例自定义解析器"""
        
        def is_supported_url(self, url: str) -> bool:
            return "example.com" in url
        
        def parse(self, url: str) -> MediaInfo:
            self.validate_url(url)
            
            # 模拟解析过程
            return MediaInfo(
                platform=Platform.UNKNOWN,
                title="自定义解析内容",
                author="自定义作者",
                media_type=MediaType.IMAGE,
                download_urls=DownloadUrls(
                    images=["https://example.com/image1.jpg"]
                )
            )
    
    # 使用自定义解析器
    parser = MediaParser()
    custom_parser = ExampleParser()
    
    # 注册自定义解析器
    parser.add_parser(Platform.UNKNOWN, custom_parser)
    
    # 测试
    test_url = "https://example.com/content/123"
    if parser.is_supported_url(test_url):
        print("自定义解析器注册成功")
    else:
        print("自定义解析器注册失败")


async def example_error_handling():
    """错误处理示例"""
    print("\n=== 错误处理示例 ===")
    
    from media_parser_sdk.exceptions import (
        ParseError, NetworkError, PlatformError, DownloadError
    )
    
    parser = MediaParser()
    
    # 测试各种错误情况
    test_cases = [
        ("", "空URL"),
        ("invalid-url", "无效URL"),
        ("https://unsupported-platform.com/content", "不支持的平台"),
        ("https://www.xiaohongshu.com/explore/invalid", "无效内容ID"),
    ]
    
    for url, description in test_cases:
        try:
            media_info = parser.parse(url)
            print(f"✅ {description}: 解析成功")
        except PlatformError as e:
            print(f"❌ {description}: 平台错误 - {e}")
        except ParseError as e:
            print(f"❌ {description}: 解析错误 - {e}")
        except NetworkError as e:
            print(f"❌ {description}: 网络错误 - {e}")
        except Exception as e:
            print(f"❌ {description}: 未知错误 - {e}")


async def example_file_management():
    """文件管理示例"""
    print("\n=== 文件管理示例 ===")
    
    # 创建下载器
    downloader = MediaDownloader(output_dir="./managed_downloads")
    
    # 获取下载目录信息
    output_dir = downloader.get_output_dir()
    print(f"下载目录: {output_dir}")
    print(f"目录是否存在: {output_dir.exists()}")
    
    # 列出已下载的内容
    if output_dir.exists():
        platforms = [d for d in output_dir.iterdir() if d.is_dir()]
        print(f"已下载的平台: {[p.name for p in platforms]}")
        
        for platform_dir in platforms:
            media_dirs = [d for d in platform_dir.iterdir() if d.is_dir()]
            print(f"{platform_dir.name} 平台下载数: {len(media_dirs)}")
            
            for media_dir in media_dirs[:3]:  # 只显示前3个
                files = list(media_dir.glob("*"))
                print(f"  - {media_dir.name}: {len(files)} 个文件")


async def main():
    """主函数"""
    print("媒体解析SDK高级示例程序")
    print("=" * 60)
    
    # 批量处理示例
    await example_batch_processing()
    
    # 内容分析示例
    await example_content_analysis()
    
    # 自定义解析器示例
    example_custom_parser()
    
    # 错误处理示例
    await example_error_handling()
    
    # 文件管理示例
    await example_file_management()
    
    print("\n高级示例程序执行完成!")


if __name__ == "__main__":
    # 配置日志
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    asyncio.run(main())