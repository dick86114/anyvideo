#!/usr/bin/env python3
"""
测试实况图片下载功能
"""
import sys
import os
import json
import asyncio
from media_parser_sdk import parse_url, download_media

def test_parse_live_photo():
    """测试解析包含实况图片的链接"""
    print("=== 测试实况图片解析功能 ===")
    
    # 测试包含实况图片的小红书链接
    # 注意：这里需要替换为实际有效的小红书实况图片链接
    test_url = "https://www.xiaohongshu.com/explore/651234567890abcdef123456"  # 示例链接
    
    try:
        print(f"测试链接: {test_url}")
        media_info = parse_url(test_url)
        
        print(f"\n解析结果:")
        print(f"平台: {media_info.platform}")
        print(f"标题: {media_info.title}")
        print(f"作者: {media_info.author}")
        print(f"媒体类型: {media_info.media_type}")
        print(f"是否包含实况图片: {media_info.has_live_photo}")
        print(f"资源数量: {media_info.resource_count}")
        
        print(f"\n下载链接:")
        print(f"- 图片URL数量: {len(media_info.download_urls.images)}")
        for i, url in enumerate(media_info.download_urls.images[:3]):
            print(f"  图片{i+1}: {url}")
        
        print(f"- 实况图片URL数量: {len(media_info.download_urls.live)}")
        for i, url in enumerate(media_info.download_urls.live[:3]):
            print(f"  实况图片{i+1}: {url}")
        
        print(f"- 视频URL数量: {len(media_info.download_urls.video)}")
        for i, url in enumerate(media_info.download_urls.video[:1]):
            print(f"  视频{i+1}: {url}")
        
        return media_info
        
    except Exception as e:
        print(f"解析失败: {str(e)}")
        return None

async def test_download_live_photo(media_info):
    """测试下载实况图片"""
    if not media_info:
        print("\n=== 跳过下载测试: 解析失败 ===")
        return
    
    print("\n=== 测试实况图片下载功能 ===")
    
    output_dir = "./test_downloads"
    try:
        print(f"开始下载到目录: {output_dir}")
        success = await download_media(media_info.url, output_dir=output_dir)
        
        if success:
            print("下载成功！")
            # 列出下载的文件
            print(f"\n下载的文件:")
            for root, dirs, files in os.walk(output_dir):
                for file in files:
                    file_path = os.path.join(root, file)
                    file_size = os.path.getsize(file_path) / 1024 / 1024  # MB
                    print(f"- {file_path} ({file_size:.2f} MB)")
        else:
            print("下载失败！")
            
    except Exception as e:
        print(f"下载失败: {str(e)}")

async def main():
    """主测试函数"""
    # 测试解析
    media_info = test_parse_live_photo()
    
    # 测试下载
    if media_info and (media_info.has_live_photo or media_info.download_urls.live):
        await test_download_live_photo(media_info)
    else:
        print("\n=== 跳过下载测试: 没有实况图片 ===")
    
    print("\n=== 测试完成 ===")

if __name__ == "__main__":
    asyncio.run(main())