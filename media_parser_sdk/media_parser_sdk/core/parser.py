#!/usr/bin/env python3
"""
媒体解析器核心模块
"""

import re
import logging
from typing import Optional, Dict
from urllib.parse import urlparse

from ..models.media_info import MediaInfo, Platform
from ..exceptions import ParseError, PlatformError
from .base_parser import BaseParser
from ..platforms.xiaohongshu import XiaohongshuParser
from ..platforms.douyin import DouyinParser
from ..platforms.weibo import WeiboParser
from ..platforms.bilibili import BilibiliParser


class MediaParser:
    """媒体解析器主类"""
    
    def __init__(self, logger: Optional[logging.Logger] = None, **kwargs):
        """初始化媒体解析器"""
        self.logger = logger or self._create_default_logger()
        self.config = kwargs
        
        # 注册平台解析器
        self.parsers: Dict[Platform, BaseParser] = {
            Platform.XIAOHONGSHU: XiaohongshuParser(self.logger),
            Platform.DOUYIN: DouyinParser(self.logger),
            Platform.WEIBO: WeiboParser(self.logger),
            Platform.BILIBILI: BilibiliParser(self.logger),
        }
    
    def _create_default_logger(self) -> logging.Logger:
        """创建默认日志记录器"""
        logger = logging.getLogger("MediaParser")
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
            logger.setLevel(logging.INFO)
        return logger
    
    def parse(self, url: str) -> MediaInfo:
        """解析媒体链接"""
        try:
            platform = self.identify_platform(url)
            if platform == Platform.UNKNOWN:
                raise PlatformError(f"不支持的平台链接: {url}")
            
            parser = self.parsers.get(platform)
            if not parser:
                raise PlatformError(f"平台 {platform.value} 解析器未实现")
            
            self.logger.info(f"开始解析 {platform.value} 链接: {url}")
            media_info = parser.parse(url)
            
            if not media_info:
                raise ParseError(f"解析失败，未能提取到媒体信息: {url}")
            
            media_info.url = url
            self.logger.info(f"解析成功: {media_info.title} - {media_info.author}")
            return media_info
            
        except (ParseError, PlatformError) as e:
            self.logger.error(f"解析失败: {str(e)}")
            raise e
        except Exception as e:
            self.logger.error(f"解析过程中发生未知错误: {str(e)}")
            raise ParseError(f"解析失败: {str(e)}")
    
    def identify_platform(self, url: str) -> Platform:
        """识别链接所属平台"""
        domain = urlparse(url).netloc.lower()
        
        if any(keyword in domain for keyword in ["xiaohongshu.com", "xhslink.com"]):
            return Platform.XIAOHONGSHU
        
        if any(keyword in domain for keyword in ["douyin.com", "tiktok.com", "iesdouyin.com"]):
            return Platform.DOUYIN
        
        if any(keyword in domain for keyword in ["weibo.com", "weibo.cn", "sina.cn"]):
            return Platform.WEIBO
        
        if any(keyword in domain for keyword in ["bilibili.com", "b23.tv"]):
            return Platform.BILIBILI
        
        return Platform.UNKNOWN
    
    def is_supported_url(self, url: str) -> bool:
        """检查是否支持该URL"""
        return self.identify_platform(url) != Platform.UNKNOWN
    
    def get_supported_platforms(self) -> list[Platform]:
        """获取支持的平台列表"""
        return list(self.parsers.keys())
    
    def add_parser(self, platform: Platform, parser: BaseParser) -> None:
        """添加自定义解析器"""
        self.parsers[platform] = parser
        self.logger.info(f"已添加 {platform.value} 平台解析器")
    
    def remove_parser(self, platform: Platform) -> None:
        """移除解析器"""
        if platform in self.parsers:
            del self.parsers[platform]
            self.logger.info(f"已移除 {platform.value} 平台解析器")
