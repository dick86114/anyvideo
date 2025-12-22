#!/usr/bin/env python3
"""
测试小红书解析功能
"""

import sys
import os
import asyncio
sys.path.insert(0, os.path.dirname(__file__))

from media_parser_sdk import MediaParser, MediaDownloader

def test_xiaohongshu_parsing():
    """测试小红书链接解析"""
    print("=== 测试小红书链接解析 ===")
    
    # 测试链接
    test_urls = [
        "https://www.xiaohongshu.com/explore/6948f1b6000000001e033c84?xsec_token=ABMgrfZDNkghfZFaXgfEExOE7WvQKOQufOKXqlWmIaI5c=&xsec_source=pc_search",
        "https://www.xiaohongshu.com/explore/69492add000000001f008b09?xsec_token=ABsOK0NN0mC006WcMeFHYWM5Vf3fQL04SsM2Hk_hWFKHU=&xsec_source=pc_feed"
    ]
    
    parser = MediaParser()
    
    for i, url in enumerate(test_urls, 1):
        print(f"\n--- 测试链接 {i} ---")
        print(f"URL: {url}")
        
        try:
            # 解析链接
            media_info = parser.parse(url)
            
            print(f"✅ 解析成功")
            print(f"标题: {media_info.title}")
            print(f"作者: {media_info.author}")
            print(f"类型: {media_info.media_type.value}")
            print(f"平台: {media_info.platform.value}")
            print(f"笔记ID: {media_info.note_id}")
            print(f"资源数量: {media_info.resource_count}")
            print(f"视频: {len(media_info.download_urls.video)}个")
            print(f"图片: {len(media_info.download_urls.images)}个")
            print(f"实况: {len(media_info.download_urls.live)}个")
            print(f"有实况图片: {media_info.has_live_photo}")
            
            if media_info.description:
                print(f"描述: {media_info.description[:100]}...")
            
            if media_info.tags:
                print(f"标签: {', '.join(media_info.tags[:5])}")
            
        except Exception as e:
            print(f"❌ 解析失败: {e}")
            import traceback
            traceback.print_exc()

async def test_xiaohongshu_download():
    """测试小红书内容下载"""
    print("\n=== 测试小红书内容下载 ===")
    
    # 使用一个测试链接
    test_url = "https://www.xiaohongshu.com/explore/6948f1b6000000001e033c84?xsec_token=ABMgrfZDNkghfZFaXgfEExOE7WvQKOQufOKXqlWmIaI5c=&xsec_source=pc_search"
    
    parser = MediaParser()
    downloader = MediaDownloader(output_dir="./test_downloads")
    
    try:
        print(f"解析链接: {test_url}")
        media_info = parser.parse(test_url)
        
        print(f"✅ 解析成功: {media_info.title}")
        
        if media_info.has_downloadable_content:
            print(f"开始下载，共 {media_info.resource_count} 个资源...")
            success = await downloader.download(media_info)
            
            if success:
                print("✅ 下载完成")
            else:
                print("❌ 下载失败")
        else:
            print("❌ 没有可下载的内容")
            
    except Exception as e:
        print(f"❌ 下载测试失败: {e}")
        import traceback
        traceback.print_exc()

def main():
    """主函数"""
    print("开始小红书功能测试...\n")
    
    # 测试解析
    test_xiaohongshu_parsing()
    
    # 测试下载（可选，因为需要网络请求）
    print("\n是否测试下载功能？(y/n): ", end="")
    try:
        choice = input().lower().strip()
        if choice == 'y':
            asyncio.run(test_xiaohongshu_download())
        else:
            print("跳过下载测试")
    except KeyboardInterrupt:
        print("\n测试被中断")
    
    print("\n测试完成")

if __name__ == "__main__":
    main()