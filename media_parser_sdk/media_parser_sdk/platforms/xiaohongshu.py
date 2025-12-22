#!/usr/bin/env python3
"""
小红书平台解析器
"""

import re
import json
from typing import Optional
import httpx

from ..core.base_parser import BaseParser
from ..models.media_info import MediaInfo, MediaType, Platform, DownloadUrls
from ..exceptions import ParseError, NetworkError


class XiaohongshuParser(BaseParser):
    """小红书平台解析器"""
    
    def __init__(self, logger=None):
        super().__init__(logger)
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://www.xiaohongshu.com/",
            "Accept-Language": "zh-CN,zh;q=0.9"
        }
    
    def is_supported_url(self, url: str) -> bool:
        """检查是否支持该URL"""
        return any(domain in url.lower() for domain in ["xiaohongshu.com", "xhslink.com"])
    
    def parse(self, url: str) -> Optional[MediaInfo]:
        """解析小红书链接"""
        try:
            self.validate_url(url)
            
            # 获取网页HTML
            html = self._get_html(url)
            
            # 提取媒体信息
            media_data = self._extract_media_info(html)
            if not media_data:
                raise ParseError("无法提取媒体信息", url=url, platform="xiaohongshu")
            
            # 获取下载链接
            download_urls = self._get_download_urls(media_data)
            
            # 构建MediaInfo对象
            media_info = MediaInfo(
                platform=Platform.XIAOHONGSHU,
                title=media_data.get("title", "小红书笔记"),
                author=media_data.get("author", "未知作者"),
                media_type=self._determine_media_type(media_data, download_urls),
                note_id=media_data.get("note_id"),
                download_urls=download_urls,
                description=media_data.get("description"),
                tags=media_data.get("tags", []),
                has_live_photo=media_data.get("has_live_photo", False),
                raw_data=media_data.get("raw_data", {})
            )
            
            return media_info
            
        except NetworkError as e:
            raise e
        except ParseError as e:
            raise e
        except Exception as e:
            raise ParseError(f"小红书链接解析失败: {str(e)}", url=url, platform="xiaohongshu")
    
    def _get_html(self, url: str) -> str:
        """获取网页HTML内容"""
        try:
            with httpx.Client(headers=self.headers, timeout=15, follow_redirects=True) as client:
                response = client.get(url)
                response.raise_for_status()
                return response.text
        except httpx.HTTPError as e:
            raise NetworkError(f"网络请求失败: {str(e)}", url=url)
    
    def _extract_media_info(self, html: str) -> Optional[dict]:
        """从HTML中提取媒体信息"""
        try:
            media_data = {
                "title": "小红书笔记",
                "author": "未知作者",
                "note_id": None,
                "has_live_photo": False,
                "raw_data": {}
            }
            
            # 提取window.__INITIAL_STATE__脚本数据
            initial_state_pattern = re.compile(r'window\.__INITIAL_STATE__\s*=\s*(.+?)(?=</script>)', re.DOTALL)
            initial_state_match = initial_state_pattern.search(html)
            
            if initial_state_match:
                initial_state_str = initial_state_match.group(1).strip()
                if initial_state_str.endswith(';'):
                    initial_state_str = initial_state_str[:-1]
                
                try:
                    initial_state = json.loads(initial_state_str)
                    media_data["raw_data"] = initial_state
                    
                    if self._parse_initial_state(initial_state, media_data):
                        return media_data
                except json.JSONDecodeError as e:
                    self.log_debug(f"__INITIAL_STATE__解析失败: {str(e)}")
                    
                    # 尝试修复JSON解析问题
                    try:
                        fixed_str = re.sub(r'\bundefined\b', 'null', initial_state_str)
                        fixed_str = re.sub(r',(\s*[}\]])', r'\1', fixed_str)
                        fixed_str = re.sub(r'//.*?\n', '\n', fixed_str)
                        fixed_str = re.sub(r'/\*.*?\*/', '', fixed_str, flags=re.DOTALL)
                        
                        initial_state = json.loads(fixed_str)
                        media_data["raw_data"] = initial_state
                        
                        if self._parse_initial_state(initial_state, media_data):
                            return media_data
                    except json.JSONDecodeError as e2:
                        self.log_debug(f"修复后仍然解析失败: {str(e2)}")
            
            # 备用方法：通过meta标签分析
            title_match = re.search(r'<title>(.*?)</title>', html, re.IGNORECASE)
            if title_match:
                media_data["title"] = title_match.group(1).replace(" - 小红书", "")
            
            return media_data
            
        except Exception as e:
            self.log_error(f"提取媒体信息失败: {str(e)}")
            return None
    
    def _parse_initial_state(self, initial_state: dict, media_data: dict) -> bool:
        """从__INITIAL_STATE__中解析详细媒体信息"""
        try:
            note = initial_state.get("note", {})
            note_detail_map = note.get("noteDetailMap", {})
            
            if note_detail_map:
                note_id = next(iter(note_detail_map.keys()), None)
                if note_id:
                    note_detail = note_detail_map[note_id]
                    note_data = note_detail.get("note", {})
                    
                    if note_data:
                        media_data["title"] = note_data.get("title", media_data["title"])
                        media_data["note_id"] = note_data.get("noteId", note_id)
                        media_data["description"] = note_data.get("desc", "")
                        
                        # 提取用户信息
                        user_data = note_data.get("user", {})
                        if isinstance(user_data, dict):
                            media_data["author"] = user_data.get("nickname", media_data["author"])
                        
                        # 检查是否有实况图片（增强逻辑）
                        media_data["has_live_photo"] = False
                        image_list = note_data.get("imageList", [])
                        if image_list:
                            for img in image_list:
                                # 检查多种实况图片的表示方式
                                if img.get("livePhoto") or img.get("live_photo") or img.get("livephoto"):
                                    media_data["has_live_photo"] = True
                                    break
                        
                        # 提取标签
                        tag_list = note_data.get("tagList", [])
                        media_data["tags"] = [tag.get("name", "") for tag in tag_list if tag.get("name")]
                        
                        # 保存完整的note数据，用于后续下载链接提取
                        media_data["note_data"] = note_data
                        return True
            
            # 备选方案：检查其他可能的note数据位置
            try:
                # 检查noteDetailMap的其他可能结构
                if isinstance(initial_state, dict):
                    # 遍历整个initial_state，寻找可能的note数据
                    for key, value in initial_state.items():
                        if isinstance(value, dict):
                            if "imageList" in value:
                                # 可能是直接的note数据
                                media_data["note_data"] = value
                                # 检查是否有实况图片
                                media_data["has_live_photo"] = False
                                image_list = value.get("imageList", [])
                                for img in image_list:
                                    if img.get("livePhoto") or img.get("live_photo") or img.get("livephoto"):
                                        media_data["has_live_photo"] = True
                                        break
                                return True
            except Exception as e:
                self.log_debug(f"备选方案解析失败: {str(e)}")
            
            return False
        except Exception as e:
            self.log_debug(f"解析__INITIAL_STATE__详细信息失败: {str(e)}")
            return False
    
    def _get_download_urls(self, media_data: dict) -> DownloadUrls:
        """获取下载链接"""
        download_urls = DownloadUrls()
        
        try:
            # 从note_data中提取媒体URL
            note_data = media_data.get("note_data")
            if note_data:
                self._extract_urls_from_note_data(note_data, download_urls)
            
            # 从raw_data中搜索所有可能的媒体链接
            raw_data = media_data.get("raw_data", {})
            if raw_data:
                self._extract_all_urls_from_data(raw_data, download_urls)
            
            return download_urls
            
        except Exception as e:
            self.log_error(f"获取下载链接失败: {str(e)}")
            return download_urls
    
    def _extract_urls_from_note_data(self, note_data: dict, download_urls: DownloadUrls) -> None:
        """从note_data中提取媒体URL"""
        try:
            self.log_debug(f"开始从note_data提取URL")
            
            # 处理视频数据
            if note_data.get("type") == "video" or "video" in note_data:
                video_data = note_data.get("video")
                if video_data:
                    self.log_debug(f"找到视频数据: {video_data.keys()}")
                    # 支持新老两种视频数据结构
                    h264_data = None
                    if "stream" in video_data:
                        h264_data = video_data.get("stream", {}).get("h264")
                    elif "media" in video_data:
                        h264_data = video_data.get("media", {}).get("stream", {}).get("h264")
                    elif "videoUrl" in video_data:
                        # 直接的视频URL字段
                        video_url = video_data.get("videoUrl")
                        if video_url:
                            clean_url = self.clean_url(video_url)
                            download_urls.video.append(clean_url)
                            self.log_debug(f"提取到直接视频URL: {clean_url}")
                    
                    if h264_data and isinstance(h264_data, list):
                        for h264_item in h264_data:
                            if isinstance(h264_item, dict):
                                master_url = h264_item.get("masterUrl")
                                if master_url:
                                    clean_url = self.clean_url(master_url)
                                    download_urls.video.append(clean_url)
                                    self.log_debug(f"提取到H264视频URL: {clean_url}")
            
            # 处理图片数据
            image_list = note_data.get("imageList")
            if image_list and isinstance(image_list, list):
                self.log_debug(f"找到图片列表，长度: {len(image_list)}")
                for i, image_item in enumerate(image_list):
                    if isinstance(image_item, dict):
                        self.log_debug(f"处理图片 {i+1}: {list(image_item.keys())}")
                        
                        # 提取静态图片URL
                        image_url = None
                        
                        # 优先从infoList中获取高质量图片
                        info_list = image_item.get("infoList", [])
                        if isinstance(info_list, list):
                            for info in info_list:
                                if isinstance(info, dict):
                                    scene = info.get("imageScene", "")
                                    url = info.get("url", "")
                                    if scene == "WB_DFT" and url:
                                        image_url = url
                                        break
                                    elif scene == "WB_PRV" and url and not image_url:
                                        image_url = url
                        
                        # 备用字段
                        if not image_url:
                            image_url = (image_item.get("urlDefault") or 
                                        image_item.get("url") or 
                                        image_item.get("urlPre") or
                                        image_item.get("urlList", [{}])[0].get("url", ""))
                        
                        if image_url:
                            clean_url = self.clean_url(image_url)
                            download_urls.images.append(clean_url)
                            self.log_debug(f"提取到图片URL: {clean_url}")
                        
                        # 提取实况图片的视频URL（增强逻辑）
                        live_photo = image_item.get("livePhoto") or image_item.get("live_photo") or image_item.get("livephoto")
                        if live_photo:
                            self.log_debug(f"找到实况图片数据: {live_photo}")
                            if isinstance(live_photo, dict):
                                # 直接从livePhoto对象中获取videoUrl
                                video_url = live_photo.get("videoUrl")
                                if video_url:
                                    clean_url = self.clean_url(video_url)
                                    download_urls.live.append(clean_url)
                                    self.log_debug(f"提取到实况图片URL: {clean_url}")
                                # 尝试获取其他可能的实况图片URL字段
                                else:
                                    self.log_debug(f"livePhoto对象没有videoUrl字段，检查其他字段: {list(live_photo.keys())}")
                                    # 检查其他可能的视频URL字段
                                    for field in ["url", "video_url", "live_url"]:
                                        if field in live_photo:
                                            url = live_photo.get(field)
                                            if url:
                                                clean_url = self.clean_url(url)
                                                download_urls.live.append(clean_url)
                                                self.log_debug(f"从{field}字段提取到实况图片URL: {clean_url}")
                            elif isinstance(live_photo, str):
                                # 实况图片可能直接是字符串URL
                                clean_url = self.clean_url(live_photo)
                                download_urls.live.append(clean_url)
                                self.log_debug(f"提取到实况图片URL（字符串）: {clean_url}")
        
        except Exception as e:
            self.log_debug(f"从note_data提取URL失败: {str(e)}")
            import traceback
            self.log_debug(traceback.format_exc())
    
    def _extract_all_urls_from_data(self, data: dict, download_urls: DownloadUrls) -> None:
        """从数据中提取所有可能的媒体URL"""
        try:
            data_str = json.dumps(data)
            
            # 匹配所有媒体链接
            media_pattern = re.compile(r'"(https?://[^"]+?\.(mp4|jpg|png|webp|mov|gif)[^"]*)"')
            media_matches = media_pattern.findall(data_str)
            
            for match in media_matches:
                url = match[0]
                ext = match[1]
                
                clean_url = self.clean_url(url)
                
                # 特殊处理MOV格式，通常是实况图片
                if ext == "mov":
                    if clean_url not in download_urls.live:
                        download_urls.live.append(clean_url)
                        self.log_debug(f"从raw_data提取到实况图片URL: {clean_url}")
                elif ext == "mp4":
                    if clean_url not in download_urls.video:
                        download_urls.video.append(clean_url)
                        self.log_debug(f"从raw_data提取到视频URL: {clean_url}")
                else:
                    if clean_url not in download_urls.images:
                        download_urls.images.append(clean_url)
                        self.log_debug(f"从raw_data提取到图片URL: {clean_url}")
            
            # 专门搜索livePhoto相关的URL
            live_photo_pattern = re.compile(r'livePhoto[^\"]*"(https?://[^\"]+?\.(mov|mp4)[^\"]*)"', re.DOTALL | re.IGNORECASE)
            live_photo_matches = live_photo_pattern.findall(data_str)
            
            for match in live_photo_matches:
                url = match[0]
                ext = match[1]
                clean_url = self.clean_url(url)
                
                if clean_url not in download_urls.live:
                    download_urls.live.append(clean_url)
                    self.log_debug(f"从livePhoto相关内容提取到实况图片URL: {clean_url}")
        
        except Exception as e:
            self.log_debug(f"提取所有URL失败: {str(e)}")
            import traceback
            self.log_debug(traceback.format_exc())
    
    def _determine_media_type(self, media_data: dict, download_urls: DownloadUrls) -> MediaType:
        """确定媒体类型"""
        # 检查是否有实况图片
        if media_data.get("has_live_photo") or download_urls.live:
            return MediaType.LIVE_PHOTO
        
        # 检查是否有视频（但没有实况图片）
        if download_urls.video and not download_urls.images:
            return MediaType.VIDEO
        
        # 默认为图片类型
        return MediaType.IMAGE