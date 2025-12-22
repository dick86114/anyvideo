#!/usr/bin/env python3
"""
SDK测试脚本
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

def test_basic_imports():
    """测试基础导入"""
    print("=== 测试基础导入 ===")
    
    try:
        from media_parser_sdk.models.media_info import MediaInfo, MediaType, Platform
        print("✅ MediaInfo, MediaType, Platform 导入成功")
    except Exception as e:
        print(f"❌ MediaInfo 导入失败: {e}")
        return False
    
    try:
        from media_parser_sdk.exceptions import ParseError, PlatformError
        print("✅ 异常类导入成功")
    except Exception as e:
        print(f"❌ 异常类导入失败: {e}")
        return False
    
    try:
        from media_parser_sdk.core.base_parser import BaseParser
        print("✅ BaseParser 导入成功")
    except Exception as e:
        print(f"❌ BaseParser 导入失败: {e}")
        return False
    
    return True

def test_platform_parsers():
    """测试平台解析器导入"""
    print("\n=== 测试平台解析器导入 ===")
    
    try:
        from media_parser_sdk.platforms.xiaohongshu import XiaohongshuParser
        print("✅ XiaohongshuParser 导入成功")
    except Exception as e:
        print(f"❌ XiaohongshuParser 导入失败: {e}")
        return False
    
    try:
        from media_parser_sdk.platforms.douyin import DouyinParser
        print("✅ DouyinParser 导入成功")
    except Exception as e:
        print(f"❌ DouyinParser 导入失败: {e}")
        return False
    
    try:
        from media_parser_sdk.platforms.weibo import WeiboParser
        print("✅ WeiboParser 导入成功")
    except Exception as e:
        print(f"❌ WeiboParser 导入失败: {e}")
        return False
    
    try:
        from media_parser_sdk.platforms.bilibili import BilibiliParser
        print("✅ BilibiliParser 导入成功")
    except Exception as e:
        print(f"❌ BilibiliParser 导入失败: {e}")
        return False
    
    return True

def test_core_classes():
    """测试核心类"""
    print("\n=== 测试核心类 ===")
    
    try:
        from media_parser_sdk.core.parser import MediaParser
        print("✅ MediaParser 导入成功")
        
        parser = MediaParser()
        print("✅ MediaParser 实例化成功")
        
        platforms = parser.get_supported_platforms()
        print(f"✅ 支持的平台: {[p.value for p in platforms]}")
        
        # 测试URL识别
        test_urls = [
            'https://www.xiaohongshu.com/explore/test',
            'https://www.douyin.com/video/test',
            'https://www.weibo.com/test',
            'https://www.bilibili.com/video/test'
        ]
        
        for url in test_urls:
            platform = parser.identify_platform(url)
            print(f"✅ {url} -> {platform.value}")
        
    except Exception as e:
        print(f"❌ MediaParser 测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    try:
        from media_parser_sdk.core.downloader import MediaDownloader
        print("✅ MediaDownloader 导入成功")
        
        downloader = MediaDownloader()
        print("✅ MediaDownloader 实例化成功")
        
    except Exception as e:
        print(f"❌ MediaDownloader 测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True

def test_sdk_interface():
    """测试SDK接口"""
    print("\n=== 测试SDK接口 ===")
    
    try:
        from media_parser_sdk import MediaParser, MediaDownloader, parse_url
        print("✅ SDK主接口导入成功")
        
        parser = MediaParser()
        print("✅ 通过SDK接口创建MediaParser成功")
        
        downloader = MediaDownloader()
        print("✅ 通过SDK接口创建MediaDownloader成功")
        
    except Exception as e:
        print(f"❌ SDK接口测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True

def test_cli():
    """测试CLI工具"""
    print("\n=== 测试CLI工具 ===")
    
    try:
        from media_parser_sdk.cli import main
        print("✅ CLI工具导入成功")
    except Exception as e:
        print(f"❌ CLI工具导入失败: {e}")
        return False
    
    return True

def main():
    """主测试函数"""
    print("开始SDK功能测试...\n")
    
    tests = [
        test_basic_imports,
        test_platform_parsers,
        test_core_classes,
        test_sdk_interface,
        test_cli
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
            else:
                print(f"❌ {test.__name__} 失败")
        except Exception as e:
            print(f"❌ {test.__name__} 异常: {e}")
    
    print(f"\n=== 测试结果 ===")
    print(f"通过: {passed}/{total}")
    print(f"失败: {total - passed}/{total}")
    
    if passed == total:
        print("🎉 所有测试通过！SDK功能正常")
        return True
    else:
        print("❌ 部分测试失败，需要修复")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)