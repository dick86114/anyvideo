#!/usr/bin/env python3
"""
媒体下载器模块
"""

import asyncio
import os
import re
from pathlib import Path
from typing import Optional, Dict, Any
import httpx
import logging

from ..models.media_info import MediaInfo, MediaType
from ..exceptions import DownloadError, NetworkError


class MediaDownloader:
    """媒体下载器"""
    
    def __init__(
        self,
        output_dir: str = "./downloads",
        max_workers: int = 10,
        max_retries: int = 3,
        retry_delay: int = 2,
        logger: Optional[logging.Logger] = None,
        **kwargs
    ):
        """
        初始化下载器
        
        Args:
            output_dir: 下载目录
            max_workers: 最大并发数
            max_retries: 最大重试次数
            retry_delay: 重试延迟（秒）
            logger: 日志记录器
            **kwargs: 其他配置参数
        """
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        self.max_workers = max_workers
        self.max_retries = max_retries
        self.retry_delay = retry_delay
        self.logger = logger or self._create_default_logger()
        self.config = kwargs
        
        # 并发控制
        self.semaphore = asyncio.Semaphore(max_workers)
        
        # HTTP客户端配置
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "*/*",
            "Accept-Encoding": "gzip, deflate, br"
        }
        
        self.client_config = {
            "headers": self.headers,
            "timeout": httpx.Timeout(60, connect=10),
            "follow_redirects": True,
            "http2": True,
            "limits": httpx.Limits(
                max_connections=20,
                max_keepalive_connections=10,
                keepalive_expiry=300
            )
        }
    
    def _create_default_logger(self) -> logging.Logger:
        """创建默认日志记录器"""
        logger = logging.getLogger("MediaDownloader")
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
            logger.setLevel(logging.INFO)
        return logger
    
    async def download(self, media_info: MediaInfo) -> bool:
        """
        下载媒体资源
        
        Args:
            media_info: 媒体信息对象
            
        Returns:
            bool: 下载是否成功
            
        Raises:
            DownloadError: 下载失败时抛出
        """
        try:
            if not media_info.has_downloadable_content:
                raise DownloadError("没有可下载的资源链接")
            
            # 准备下载任务
            tasks = []
            download_urls = media_info.download_urls
            
            # 创建媒体专用文件夹
            media_dir = self._create_media_directory(media_info)
            
            # 准备所有下载任务
            all_tasks = []
            
            # 下载视频
            for i, url in enumerate(download_urls.video):
                filename = self._generate_filename(media_info, "video", i, media_dir)
                all_tasks.append((url, filename, "video"))
            
            # 下载图片
            for i, url in enumerate(download_urls.images):
                filename = self._generate_filename(media_info, "image", i, media_dir)
                all_tasks.append((url, filename, "image"))
            
            # 下载实况图片
            for i, url in enumerate(download_urls.live):
                filename = self._generate_filename(media_info, "live", i, media_dir)
                all_tasks.append((url, filename, "live"))
            
            # 过滤已存在的文件
            filtered_tasks = [
                (url, filename, media_type) 
                for url, filename, media_type in all_tasks 
                if not filename.exists()
            ]
            
            if not filtered_tasks:
                self.logger.info("所有文件已存在，无需下载")
                return True
            
            # 执行下载任务
            self.logger.info(f"开始下载，共 {len(filtered_tasks)} 个资源")
            
            download_tasks = [
                self._download_file(url, filename, media_type)
                for url, filename, media_type in filtered_tasks
            ]
            
            results = await asyncio.gather(*download_tasks, return_exceptions=True)
            
            # 统计结果
            success_count = sum(1 for r in results if r is True)
            fail_count = len(filtered_tasks) - success_count
            skip_count = len(all_tasks) - len(filtered_tasks)
            
            self.logger.info(f"下载完成：成功 {success_count} 个，失败 {fail_count} 个，跳过 {skip_count} 个已存在文件")
            
            # 创建媒体信息文件
            self._create_info_file(media_info, media_dir)
            
            return success_count > 0
            
        except Exception as e:
            raise DownloadError(f"媒体下载失败: {str(e)}")
    
    async def _download_file(self, url: str, filename: Path, media_type: str) -> bool:
        """下载单个文件"""
        async with self.semaphore:
            retry_count = 0
            while retry_count <= self.max_retries:
                try:
                    async with httpx.AsyncClient(**self.client_config) as client:
                        async with client.stream("GET", url) as response:
                            response.raise_for_status()
                            
                            # 确保目录存在
                            filename.parent.mkdir(parents=True, exist_ok=True)
                            
                            # 写入文件
                            with open(filename, "wb") as f:
                                async for chunk in response.aiter_bytes(chunk_size=16384):
                                    f.write(chunk)
                    
                    self.logger.info(f"{media_type} 下载成功: {filename}")
                    return True
                    
                except httpx.HTTPError as e:
                    retry_count += 1
                    if retry_count <= self.max_retries:
                        self.logger.warning(
                            f"{media_type} 下载失败 ({url}): 网络错误 - {str(e)}, "
                            f"将在 {self.retry_delay} 秒后重试，第 {retry_count}/{self.max_retries} 次重试"
                        )
                        await asyncio.sleep(self.retry_delay)
                    else:
                        self.logger.error(
                            f"{media_type} 下载失败 ({url}): 网络错误 - {str(e)}, "
                            f"已重试 {self.max_retries} 次，放弃"
                        )
                        return False
                except Exception as e:
                    retry_count += 1
                    if retry_count <= self.max_retries:
                        self.logger.warning(
                            f"{media_type} 处理失败 ({url}): {str(e)}, "
                            f"将在 {self.retry_delay} 秒后重试，第 {retry_count}/{self.max_retries} 次重试"
                        )
                        await asyncio.sleep(self.retry_delay)
                    else:
                        self.logger.error(
                            f"{media_type} 处理失败 ({url}): {str(e)}, "
                            f"已重试 {self.max_retries} 次，放弃"
                        )
                        return False
        
        return False
    
    def _create_media_directory(self, media_info: MediaInfo) -> Path:
        """创建媒体专用目录"""
        # 清理文件名
        def clean_filename(s):
            return re.sub(r'[\\/:*?"<>|]', '_', s[:50])
        
        title = clean_filename(media_info.title)
        author = clean_filename(media_info.author)
        
        # 创建文件夹名称：作者_标题_笔记ID前8位
        folder_name = f"{author}_{title}"
        if media_info.note_id:
            folder_name += f"_{media_info.note_id[:8]}"
        folder_name = clean_filename(folder_name)
        
        # 创建目录结构：downloads/平台/笔记文件夹/
        platform_dir = self.output_dir / media_info.platform.value
        media_dir = platform_dir / folder_name
        media_dir.mkdir(parents=True, exist_ok=True)
        
        return media_dir
    
    def _generate_filename(self, media_info: MediaInfo, media_type: str, index: int, media_dir: Path) -> Path:
        """生成文件名"""
        title = re.sub(r'[\\/:*?"<>|]', '_', media_info.title[:50])
        
        # 根据媒体类型确定扩展名
        if media_type == "video":
            ext = "mp4"
        elif media_type == "image":
            ext = "jpg"
        elif media_type == "live":
            ext = "mov"
        else:
            ext = "bin"
        
        # 生成文件名
        if index == 0:
            filename = f"{title}.{ext}"
        else:
            filename = f"{title}_{index + 1}.{ext}"
        
        return media_dir / filename
    
    def _create_info_file(self, media_info: MediaInfo, media_dir: Path) -> None:
        """创建媒体信息文件"""
        try:
            info_file = media_dir / "media_info.json"
            if not info_file.exists():
                with open(info_file, 'w', encoding='utf-8') as f:
                    f.write(media_info.to_json())
        except Exception as e:
            self.logger.warning(f"创建信息文件失败: {str(e)}")
    
    def get_output_dir(self) -> Path:
        """获取下载目录"""
        return self.output_dir