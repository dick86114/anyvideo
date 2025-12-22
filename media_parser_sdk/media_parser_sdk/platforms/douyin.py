#!/usr/bin/env python3
"""
抖音平台解析器
"""

import re
import json
from typing import Optional
import httpx

from ..core.base_parser import BaseParser
from ..models.media_info import MediaInfo, MediaType, Platform, DownloadUrls
from ..exceptions import ParseError, NetworkError


class DouyinParser(BaseParser):
    """抖音平台解析器"""
    
    def __init__(self, logger=None):
        super().__init__(logger)
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        }
    
    def is_supported_url(self, url: str) -> bool:
        """检查是否支持该URL"""
        return any(domain in url.lower() for domain in ["douyin.com", "tiktok.com", "iesdouyin.com"])
    
    def parse(self, url: str) -> Optional[MediaInfo]:
        """解析抖音链接"""
        try:
            self.validate_url(url)
            
            # 获取网页HTML
            html = self._get_html(url)
            
            # 提取媒体信息
            media_data = self._extract_media_info(html, url)
            
            # 获取下载链接
            download_urls = self._get_download_urls(media_data)
            
            # 构建MediaInfo对象
            media_info = MediaInfo(
                platform=Platform.DOUYIN,
                title=media_data.get("title", "抖音视频"),
                author=media_data.get("author", "未知作者"),
                media_type=MediaType.VIDEO,  # 抖音主要是视频内容
                note_id=media_data.get("video_id"),
                download_urls=download_urls,
                description=media_data.get("description"),
                raw_data=media_data.get("raw_data", {})
            )
            
            return media_info
            
        except NetworkError as e:
            raise e
        except ParseError as e:
            raise e
        except Exception as e:
            raise ParseError(f"抖音链接解析失败: {str(e)}", url=url, platform="douyin")
    
    def _get_html(self, url: str) -> str:
        """获取网页HTML内容"""
        try:
            with httpx.Client(headers=self.headers, timeout=15, follow_redirects=True) as client:
                response = client.get(url)
                response.raise_for_status()
                return response.text
        except httpx.HTTPError as e:
            raise NetworkError(f"网络请求失败: {str(e)}", url=url)
    
    def _extract_media_info(self, html: str, url: str) -> dict:
        """从HTML中提取媒体信息"""
        media_data = {
            "title": "抖音视频",
            "author": "未知作者",
            "video_id": self._extract_video_id(url),
            "raw_data": {}
        }
        
        try:
            # 检查是否遇到反爬虫页面
            if len(html) < 10000 or "验证" in html or "captcha" in html.lower():
                self.log_debug("检测到抖音反爬重定向页面")
                # 在实际项目中，这里可以实现更复杂的反爬虫绕过逻辑
                return media_data
            
            # 尝试从HTML中提取标题
            title_patterns = [
                r'<title>(.*?)</title>',
                r'"desc":"([^"]*)"',
                r'"title":"([^"]*)"'
            ]
            
            for pattern in title_patterns:
                match = re.search(pattern, html, re.IGNORECASE)
                if match:
                    title = match.group(1).strip()
                    if title and title != "抖音":
                        media_data["title"] = title
                        break
            
            # 尝试提取作者信息
            author_patterns = [
                r'"nickname":"([^"]*)"',
                r'"author":"([^"]*)"'
            ]
            
            for pattern in author_patterns:
                match = re.search(pattern, html)
                if match:
                    author = match.group(1).strip()
                    if author:
                        media_data["author"] = author
                        break
            
        except Exception as e:
            self.log_debug(f"提取抖音媒体信息失败: {str(e)}")
        
        return media_data
    
    def _extract_video_id(self, url: str) -> Optional[str]:
        """从URL中提取视频ID"""
        # 从/video/路径中提取
        video_match = re.search(r'/video/(\d+)', url)
        if video_match:
            return video_match.group(1)
        
        # 从modal_id参数中提取
        modal_match = re.search(r'modal_id=(\d+)', url)
        if modal_match:
            return modal_match.group(1)
        
        return None
    
    def _get_download_urls(self, media_data: dict) -> DownloadUrls:
        """获取下载链接"""
        download_urls = DownloadUrls()
        
        # 注意：由于抖音的反爬虫机制，实际的下载链接提取需要更复杂的处理
        # 这里只是一个基础框架，实际使用时需要根据具体情况实现
        
        self.log_warning("抖音下载链接提取受反爬虫限制，需要专门的解决方案")
        
        return download_urls