#!/usr/bin/env python3
import sys
import json
import asyncio
from media_parser_sdk import parse_url, download_media


def main():
    """媒体解析SDK命令行包装器
    
    命令格式:
    python wrapper.py parse <url>
    python wrapper.py download <url> <output_dir>
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
    
    else:
        print(json.dumps({"error": f"未知命令: {command}"}))
        sys.exit(1)


if __name__ == "__main__":
    main()