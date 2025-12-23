#!/usr/bin/env python3
"""
小红书专用数据模型
"""

from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum


class NoteType(str, Enum):
    """笔记类型枚举"""
    NORMAL = "normal"      # 普通图文笔记
    VIDEO = "video"        # 视频笔记
    LIVE_PHOTO = "live_photo"  # 实况图片笔记
    CAROUSEL = "carousel"  # 轮播图笔记


class MediaResource(BaseModel):
    """媒体资源模型"""
    url: str = Field(..., description="媒体资源URL")
    width: Optional[int] = Field(None, description="宽度")
    height: Optional[int] = Field(None, description="高度")
    format: Optional[str] = Field(None, description="格式 (jpg, mp4, mov等)")
    size: Optional[int] = Field(None, description="文件大小(字节)")
    duration: Optional[float] = Field(None, description="视频时长(秒)")
    quality: Optional[str] = Field(None, description="质量标识 (720p, 1080p等)")
    is_live_photo: bool = Field(False, description="是否为实况图片")
    live_video_url: Optional[str] = Field(None, description="实况图片的视频URL")


class VideoResource(MediaResource):
    """视频资源模型"""
    bitrate: Optional[int] = Field(None, description="比特率")
    fps: Optional[int] = Field(None, description="帧率")
    codec: Optional[str] = Field(None, description="编码格式 (h264, h265等)")
    stream_urls: Optional[Dict[str, str]] = Field(None, description="不同质量的流URL")


class InteractionStats(BaseModel):
    """互动数据模型"""
    like_count: int = Field(0, description="点赞数")
    collect_count: int = Field(0, description="收藏数")
    comment_count: int = Field(0, description="评论数")
    share_count: int = Field(0, description="分享数")
    view_count: int = Field(0, description="浏览数")


class AuthorInfo(BaseModel):
    """作者信息模型"""
    user_id: str = Field(..., description="用户ID")
    nickname: str = Field(..., description="昵称")
    avatar_url: Optional[str] = Field(None, description="头像URL")
    xiaohongshu_id: Optional[str] = Field(None, description="小红书号")
    ip_location: Optional[str] = Field(None, description="IP属地")
    is_verified: bool = Field(False, description="是否认证")
    verification_info: Optional[str] = Field(None, description="认证信息")


class NoteInfo(BaseModel):
    """笔记信息模型"""
    note_id: str = Field(..., description="笔记ID")
    title: str = Field(..., description="标题")
    content: str = Field(..., description="正文内容")
    note_type: NoteType = Field(NoteType.NORMAL, description="笔记类型")
    
    # 作者信息
    author: AuthorInfo = Field(..., description="作者信息")
    
    # 媒体资源
    images: List[MediaResource] = Field(default_factory=list, description="图片资源列表")
    videos: List[VideoResource] = Field(default_factory=list, description="视频资源列表")
    cover_image: Optional[MediaResource] = Field(None, description="封面图片")
    
    # 互动数据
    interaction_stats: InteractionStats = Field(default_factory=InteractionStats, description="互动数据")
    
    # 时间信息
    publish_time: Optional[datetime] = Field(None, description="发布时间")
    
    # 内容属性
    is_original: bool = Field(True, description="是否原创")
    tags: List[str] = Field(default_factory=list, description="标签列表")
    topics: List[str] = Field(default_factory=list, description="话题列表")
    location: Optional[str] = Field(None, description="位置信息")
    
    # 源信息
    source_url: str = Field(..., description="原始URL")


class AuthorProfile(BaseModel):
    """博主资料模型"""
    user_id: str = Field(..., description="用户ID")
    nickname: str = Field(..., description="昵称")
    xiaohongshu_id: Optional[str] = Field(None, description="小红书号")
    avatar_url: Optional[str] = Field(None, description="头像URL")
    ip_location: Optional[str] = Field(None, description="IP属地")
    signature: Optional[str] = Field(None, description="个人签名")
    
    # 认证信息
    is_verified: bool = Field(False, description="是否认证")
    verification_info: Optional[str] = Field(None, description="认证信息")
    
    # 社交数据
    following_count: int = Field(0, description="关注数")
    followers_count: int = Field(0, description="粉丝数")
    total_likes_received: int = Field(0, description="获赞总数")
    total_collects_received: int = Field(0, description="收藏总数")
    notes_count: int = Field(0, description="笔记总数")
    
    # 特殊标识
    has_pinned_note: bool = Field(False, description="是否有置顶笔记")
    pinned_note_id: Optional[str] = Field(None, description="置顶笔记ID")
    
    # 源信息
    profile_url: str = Field(..., description="个人主页URL")


class AuthorNotesCollection(BaseModel):
    """博主笔记集合模型"""
    author_profile: AuthorProfile = Field(..., description="博主资料")
    notes: List[NoteInfo] = Field(default_factory=list, description="笔记列表")
    total_notes: int = Field(0, description="总笔记数")
    extracted_notes: int = Field(0, description="已提取笔记数")
    has_more: bool = Field(False, description="是否还有更多")
    
    # 提取统计
    extraction_stats: Dict[str, Any] = Field(default_factory=dict, description="提取统计信息")


class XiaohongshuExtractResult(BaseModel):
    """小红书提取结果统一模型"""
    success: bool = Field(..., description="是否成功")
    result_type: str = Field(..., description="结果类型: note, author_profile, author_notes")
    data: Optional[Dict[str, Any]] = Field(None, description="提取的数据")
    error_message: Optional[str] = Field(None, description="错误信息")
    extraction_time: datetime = Field(default_factory=datetime.now, description="提取时间")