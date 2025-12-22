#!/usr/bin/env python3
"""
媒体解析SDK - 多平台媒体内容解析工具

支持平台：
- 小红书 (Xiaohongshu)
- 抖音 (Douyin)
- 微博 (Weibo)
- 哔哩哔哩 (Bilibili)

主要功能：
- 链接解析和内容提取
- 无水印媒体下载
- 多种媒体类型支持（图片、视频、实况图片）
- 异步下载支持
- 详细的元数据提取
"""

# 版本信息
__version__ = "1.0.0"
__author__ = "Media Parser Team"
__email__ = "support@mediaparser.com"

# 导入数据模型和异常类（这些不会引起循环导入）
from .models.media_info import MediaInfo, MediaType, Platform
from .exceptions import (
    MediaParserError,
    ParseError,
    DownloadError,
    NetworkError,
    PlatformError,
    ValidationError
)

# 延迟导入核心类
def _get_media_parser():
    """获取MediaParser类"""
    from .core.parser import MediaParser
    return MediaParser

def _get_media_downloader():
    """获取MediaDownloader类"""
    from .core.downloader import MediaDownloader
    return MediaDownloader

# 创建类的引用（延迟加载）
class _LazyLoader:
    def __init__(self, loader_func):
        self._loader_func = loader_func
        self._loaded_class = None
    
    def __call__(self, *args, **kwargs):
        if self._loaded_class is None:
            self._loaded_class = self._loader_func()
        return self._loaded_class(*args, **kwargs)

MediaParser = _LazyLoader(_get_media_parser)
MediaDownloader = _LazyLoader(_get_media_downloader)

# 导出主要类和函数
__all__ = [
    # 核心类
    "MediaParser",
    "MediaDownloader",
    
    # 数据模型
    "MediaInfo",
    "MediaType",
    "Platform",
    
    # 异常类
    "MediaParserError",
    "ParseError",
    "DownloadError",
    "NetworkError",
    "PlatformError",
    "ValidationError",
    
    # 版本信息
    "__version__",
    "__author__",
    "__email__",
]

# 便捷函数
def parse_url(url: str, **kwargs) -> MediaInfo:
    """
    快速解析媒体链接
    
    Args:
        url: 媒体链接
        **kwargs: 其他参数
        
    Returns:
        MediaInfo: 媒体信息对象
        
    Example:
        >>> from media_parser_sdk import parse_url
        >>> media_info = parse_url("https://www.xiaohongshu.com/explore/...")
        >>> print(media_info.title)
    """
    parser = MediaParser(**kwargs)
    return parser.parse(url)

async def download_media(url: str, output_dir: str = "./downloads", **kwargs) -> bool:
    """
    快速下载媒体内容
    
    Args:
        url: 媒体链接
        output_dir: 下载目录
        **kwargs: 其他参数
        
    Returns:
        bool: 下载是否成功
        
    Example:
        >>> import asyncio
        >>> from media_parser_sdk import download_media
        >>> success = asyncio.run(download_media("https://www.xiaohongshu.com/explore/..."))
    """
    parser = MediaParser(**kwargs)
    downloader = MediaDownloader(output_dir=output_dir, **kwargs)
    
    media_info = parser.parse(url)
    return await downloader.download(media_info)

# 添加便捷函数到 __all__
__all__.extend(["parse_url", "download_media"])