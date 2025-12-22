#!/usr/bin/env python3
"""
异常定义模块
"""


class MediaParserError(Exception):
    """媒体解析器基础异常"""
    
    def __init__(self, message: str, error_code: str = None, details: dict = None):
        super().__init__(message)
        self.message = message
        self.error_code = error_code or "UNKNOWN_ERROR"
        self.details = details or {}
    
    def __str__(self):
        return f"[{self.error_code}] {self.message}"


class ParseError(MediaParserError):
    """解析错误"""
    
    def __init__(self, message: str, url: str = None, platform: str = None):
        super().__init__(message, "PARSE_ERROR", {"url": url, "platform": platform})
        self.url = url
        self.platform = platform


class DownloadError(MediaParserError):
    """下载错误"""
    
    def __init__(self, message: str, url: str = None, file_path: str = None):
        super().__init__(message, "DOWNLOAD_ERROR", {"url": url, "file_path": file_path})
        self.url = url
        self.file_path = file_path


class NetworkError(MediaParserError):
    """网络错误"""
    
    def __init__(self, message: str, status_code: int = None, url: str = None):
        super().__init__(message, "NETWORK_ERROR", {"status_code": status_code, "url": url})
        self.status_code = status_code
        self.url = url


class PlatformError(MediaParserError):
    """平台不支持错误"""
    
    def __init__(self, message: str, platform: str = None, url: str = None):
        super().__init__(message, "PLATFORM_ERROR", {"platform": platform, "url": url})
        self.platform = platform
        self.url = url


class ValidationError(MediaParserError):
    """验证错误"""
    
    def __init__(self, message: str, field: str = None, value: str = None):
        super().__init__(message, "VALIDATION_ERROR", {"field": field, "value": value})
        self.field = field
        self.value = value


class RateLimitError(MediaParserError):
    """频率限制错误"""
    
    def __init__(self, message: str, retry_after: int = None):
        super().__init__(message, "RATE_LIMIT_ERROR", {"retry_after": retry_after})
        self.retry_after = retry_after


class AuthenticationError(MediaParserError):
    """认证错误"""
    
    def __init__(self, message: str, platform: str = None):
        super().__init__(message, "AUTH_ERROR", {"platform": platform})
        self.platform = platform


class ContentNotFoundError(MediaParserError):
    """内容未找到错误"""
    
    def __init__(self, message: str, url: str = None):
        super().__init__(message, "CONTENT_NOT_FOUND", {"url": url})
        self.url = url