#!/usr/bin/env python3
"""
基础解析器抽象类
"""

from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
import logging

from ..models.media_info import MediaInfo
from ..exceptions import ParseError


class BaseParser(ABC):
    """基础解析器抽象类"""
    
    def __init__(self, logger: Optional[logging.Logger] = None):
        """
        初始化基础解析器
        
        Args:
            logger: 日志记录器，如果为None则创建默认logger
        """
        self.logger = logger or self._create_default_logger()
    
    def _create_default_logger(self) -> logging.Logger:
        """创建默认日志记录器"""
        logger = logging.getLogger(f"{self.__class__.__module__}.{self.__class__.__name__}")
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
            logger.setLevel(logging.INFO)
        return logger
    
    @abstractmethod
    def parse(self, url: str) -> Optional[MediaInfo]:
        """
        解析媒体链接
        
        Args:
            url: 媒体链接
            
        Returns:
            MediaInfo: 媒体信息对象，解析失败返回None
            
        Raises:
            ParseError: 解析失败时抛出
        """
        pass
    
    @abstractmethod
    def is_supported_url(self, url: str) -> bool:
        """
        检查是否支持该URL
        
        Args:
            url: 待检查的URL
            
        Returns:
            bool: 是否支持
        """
        pass
    
    def validate_url(self, url: str) -> None:
        """
        验证URL格式
        
        Args:
            url: 待验证的URL
            
        Raises:
            ParseError: URL格式无效时抛出
        """
        if not url or not isinstance(url, str):
            raise ParseError("URL不能为空且必须是字符串类型")
        
        if not url.startswith(('http://', 'https://')):
            raise ParseError("URL必须以http://或https://开头")
        
        if not self.is_supported_url(url):
            raise ParseError(f"不支持的URL格式: {url}")
    
    def clean_url(self, url: str) -> str:
        """
        清理URL，去除水印参数等
        
        Args:
            url: 原始URL
            
        Returns:
            str: 清理后的URL
        """
        import re
        
        # 去除常见的水印参数
        patterns = [
            r'\?x-oss-process[^&]*',
            r'\?watermark[^&]*',
            r'\?wm[^&]*',
            r'&x-oss-process[^&]*',
            r'&watermark[^&]*',
            r'&wm[^&]*',
        ]
        
        cleaned_url = url
        for pattern in patterns:
            cleaned_url = re.sub(pattern, '', cleaned_url)
        
        return cleaned_url
    
    def extract_id_from_url(self, url: str) -> Optional[str]:
        """
        从URL中提取ID
        
        Args:
            url: 媒体链接
            
        Returns:
            str: 提取的ID，如果无法提取则返回None
        """
        # 子类可以重写此方法实现特定的ID提取逻辑
        return None
    
    def log_debug(self, message: str, **kwargs):
        """记录调试日志"""
        self.logger.debug(message, extra=kwargs)
    
    def log_info(self, message: str, **kwargs):
        """记录信息日志"""
        self.logger.info(message, extra=kwargs)
    
    def log_warning(self, message: str, **kwargs):
        """记录警告日志"""
        self.logger.warning(message, extra=kwargs)
    
    def log_error(self, message: str, **kwargs):
        """记录错误日志"""
        self.logger.error(message, extra=kwargs)