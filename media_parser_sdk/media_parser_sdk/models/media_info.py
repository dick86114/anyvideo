#!/usr/bin/env python3
"""
媒体信息数据模型
"""

from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, HttpUrl
from datetime import datetime


class Platform(str, Enum):
    """支持的平台"""
    XIAOHONGSHU = "xiaohongshu"
    DOUYIN = "douyin"
    WEIBO = "weibo"
    BILIBILI = "bilibili"
    UNKNOWN = "unknown"


class MediaType(str, Enum):
    """媒体类型"""
    IMAGE = "image"
    VIDEO = "video"
    LIVE_PHOTO = "live_photo"
    AUDIO = "audio"
    UNKNOWN = "unknown"


class DownloadUrls(BaseModel):
    """下载链接集合"""
    video: List[str] = Field(default_factory=list, description="视频下载链接列表")
    images: List[str] = Field(default_factory=list, description="图片下载链接列表")
    live: List[str] = Field(default_factory=list, description="实况图片视频链接列表")
    audio: List[str] = Field(default_factory=list, description="音频下载链接列表")
    
    def has_content(self) -> bool:
        """检查是否有可下载的内容"""
        return bool(self.video or self.images or self.live or self.audio)
    
    def total_count(self) -> int:
        """获取总资源数量"""
        return len(self.video) + len(self.images) + len(self.live) + len(self.audio)


class MediaInfo(BaseModel):
    """媒体信息模型"""
    
    # 基本信息
    platform: Platform = Field(..., description="平台名称")
    title: str = Field(..., description="标题")
    author: str = Field(default="未知作者", description="作者")
    media_type: MediaType = Field(..., description="媒体类型")
    
    # 标识信息
    note_id: Optional[str] = Field(None, description="笔记/视频ID")
    url: Optional[str] = Field(None, description="原始链接")
    
    # 下载链接
    download_urls: DownloadUrls = Field(default_factory=DownloadUrls, description="下载链接集合")
    
    # 元数据
    description: Optional[str] = Field(None, description="描述/简介")
    tags: List[str] = Field(default_factory=list, description="标签列表")
    cover_url: Optional[str] = Field(None, description="封面图片URL")
    
    # 统计信息
    like_count: Optional[int] = Field(None, description="点赞数")
    comment_count: Optional[int] = Field(None, description="评论数")
    share_count: Optional[int] = Field(None, description="分享数")
    view_count: Optional[int] = Field(None, description="浏览数")
    
    # 时间信息
    publish_time: Optional[datetime] = Field(None, description="发布时间")
    parse_time: datetime = Field(default_factory=datetime.now, description="解析时间")
    
    # 原始数据
    raw_data: Dict[str, Any] = Field(default_factory=dict, description="原始数据")
    
    # 特殊标记
    has_live_photo: bool = Field(default=False, description="是否包含实况图片")
    is_watermark_removed: bool = Field(default=True, description="是否已去除水印")
    
    class Config:
        use_enum_values = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
        }
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return self.model_dump(exclude_none=True)
    
    def to_json(self) -> str:
        """转换为JSON字符串"""
        return self.model_dump_json(exclude_none=True, indent=2)
    
    @property
    def resource_count(self) -> int:
        """获取资源总数"""
        return self.download_urls.total_count()
    
    @property
    def has_downloadable_content(self) -> bool:
        """是否有可下载的内容"""
        return self.download_urls.has_content()
    
    def get_summary(self) -> str:
        """获取摘要信息"""
        platform_value = self.platform.value if hasattr(self.platform, 'value') else str(self.platform)
        media_type_value = self.media_type.value if hasattr(self.media_type, 'value') else str(self.media_type)
        
        return (
            f"平台: {platform_value}\n"
            f"标题: {self.title}\n"
            f"作者: {self.author}\n"
            f"类型: {media_type_value}\n"
            f"资源数: {self.resource_count}\n"
            f"视频: {len(self.download_urls.video)}个\n"
            f"图片: {len(self.download_urls.images)}个\n"
            f"实况: {len(self.download_urls.live)}个"
        )