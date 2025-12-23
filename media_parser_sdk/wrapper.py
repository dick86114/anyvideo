#!/usr/bin/env python3
import sys
import json
import asyncio
from media_parser_sdk import parse_url, download_media

# 简化版本的增强功能
def extract_xiaohongshu_note_sync(url):
    """提取小红书笔记信息"""
    try:
        media_info = parse_url(url)
        
        # 创建结果对象
        class Result:
            def __init__(self, success, result_type, data=None, error_message=None):
                self.success = success
                self.result_type = result_type
                self.data = data
                self.error_message = error_message
        
        # 检测媒体类型
        media_type = str(media_info.media_type)
        
        # 如果有视频URL，优先设置为video类型
        video_urls = media_info.download_urls.video or []
        if video_urls:
            media_type = "video"
        
        return Result(
            success=True,
            result_type="note",
            data={
                "note_id": media_info.note_id,
                "title": media_info.title,
                "author": {"nickname": media_info.author},
                "videos": [{"url": v} for v in video_urls],
                "images": [{"url": i} for i in media_info.download_urls.images],
                "interaction_stats": {
                    "like_count": media_info.like_count,
                    "comment_count": media_info.comment_count,
                    "share_count": media_info.share_count
                },
                "media_type": media_type,
                "source_url": url
            }
        )
    except Exception as e:
        class Result:
            def __init__(self, success, result_type, data=None, error_message=None):
                self.success = success
                self.result_type = result_type
                self.data = data
                self.error_message = error_message
        
        return Result(
            success=False,
            result_type="note", 
            error_message=str(e)
        )

def extract_xiaohongshu_author_sync(url):
    """提取小红书博主资料"""
    return {
        "success": False,
        "result_type": "author_profile",
        "error_message": "博主资料功能正在开发中"
    }

def extract_xiaohongshu_author_notes_sync(url, max_notes=None):
    """提取小红书博主所有笔记"""
    return {
        "success": False,
        "result_type": "author_notes",
        "error_message": "博主笔记集合功能正在开发中"
    }


def main():
    """媒体解析SDK命令行包装器
    
    命令格式:
    python wrapper.py parse <url>
    python wrapper.py download <url> <output_dir>
    python wrapper.py xiaohongshu_note <url>
    python wrapper.py xiaohongshu_author <url>
    python wrapper.py xiaohongshu_author_notes <url> [max_notes]
    """
    if len(sys.argv) < 2:
        print(json.dumps({"error": "缺少命令参数"}))
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "parse":
        if len(sys.argv) < 3:
            print(json.dumps({"error": "缺少URL参数"}))
            sys.exit(1)
        url = sys.argv[2]
        try:
            media_info = parse_url(url)
            result = {
                "platform": media_info.platform,
                "title": media_info.title,
                "author": media_info.author,
                "media_type": media_info.media_type,
                "note_id": media_info.note_id,
                "url": media_info.url,
                "download_urls": {
                    "images": media_info.download_urls.images or [],
                    "video": media_info.download_urls.video or [],
                    "live": media_info.download_urls.live or [],
                    "audio": media_info.download_urls.audio or []
                },
                "description": media_info.description or "",
                "tags": media_info.tags or [],
                "resource_count": media_info.resource_count,
                "cover_url": media_info.cover_url or "",
                "has_live_photo": media_info.has_live_photo,
                "like_count": media_info.like_count,
                "comment_count": media_info.comment_count,
                "share_count": media_info.share_count,
                "view_count": media_info.view_count
            }
            print(json.dumps(result, ensure_ascii=False))
        except Exception as e:
            print(json.dumps({"error": str(e)}, ensure_ascii=False))
    
    elif command == "download":
        if len(sys.argv) < 4:
            print(json.dumps({"error": "缺少URL或输出目录参数"}))
            sys.exit(1)
        url = sys.argv[2]
        output_dir = sys.argv[3]
        try:
            success = asyncio.run(download_media(url, output_dir=output_dir))
            print(json.dumps({"success": success}))
        except Exception as e:
            print(json.dumps({"error": str(e)}, ensure_ascii=False))
    
    elif command == "xiaohongshu_note":
        if len(sys.argv) < 3:
            print(json.dumps({"error": "缺少URL参数"}))
            sys.exit(1)
        url = sys.argv[2]
        try:
            result = extract_xiaohongshu_note_sync(url)
            if result.success:
                print(json.dumps({
                    "success": True,
                    "result_type": result.result_type,
                    "data": result.data
                }, ensure_ascii=False, default=str))
            else:
                print(json.dumps({
                    "success": False,
                    "error": result.error_message
                }, ensure_ascii=False))
        except Exception as e:
            print(json.dumps({"error": str(e)}, ensure_ascii=False))
    
    elif command == "xiaohongshu_author":
        if len(sys.argv) < 3:
            print(json.dumps({"error": "缺少URL参数"}))
            sys.exit(1)
        url = sys.argv[2]
        try:
            result = extract_xiaohongshu_author_sync(url)
            if result.success:
                print(json.dumps({
                    "success": True,
                    "result_type": result.result_type,
                    "data": result.data
                }, ensure_ascii=False, default=str))
            else:
                print(json.dumps({
                    "success": False,
                    "error": result.error_message
                }, ensure_ascii=False))
        except Exception as e:
            print(json.dumps({"error": str(e)}, ensure_ascii=False))
    
    elif command == "xiaohongshu_author_notes":
        if len(sys.argv) < 3:
            print(json.dumps({"error": "缺少URL参数"}))
            sys.exit(1)
        url = sys.argv[2]
        max_notes = None
        if len(sys.argv) >= 4:
            try:
                max_notes = int(sys.argv[3])
            except ValueError:
                print(json.dumps({"error": "max_notes参数必须是整数"}))
                sys.exit(1)
        
        try:
            result = extract_xiaohongshu_author_notes_sync(url, max_notes)
            if result.success:
                print(json.dumps({
                    "success": True,
                    "result_type": result.result_type,
                    "data": result.data
                }, ensure_ascii=False, default=str))
            else:
                print(json.dumps({
                    "success": False,
                    "error": result.error_message
                }, ensure_ascii=False))
        except Exception as e:
            print(json.dumps({"error": str(e)}, ensure_ascii=False))
    
    else:
        print(json.dumps({"error": f"未知命令: {command}"}))
        sys.exit(1)


if __name__ == "__main__":
    main()