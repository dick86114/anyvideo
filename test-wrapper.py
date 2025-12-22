#!/usr/bin/env python3
"""
测试wrapper.py的实况图片功能
"""
import subprocess
import json

def test_wrapper_parse():
    """测试wrapper.py的parse命令"""
    print("=== 测试wrapper.py的parse命令 ===")
    
    # 测试包含实况图片的小红书链接（示例）
    test_url = "https://www.xiaohongshu.com/explore/651234567890abcdef123456"  # 示例链接
    
    try:
        print(f"测试链接: {test_url}")
        
        # 执行wrapper.py的parse命令
        result = subprocess.run(
            ["python3", "media_parser_sdk/wrapper.py", "parse", test_url],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode != 0:
            print(f"执行失败: {result.stderr}")
            return None
        
        # 解析JSON结果
        parsed_result = json.loads(result.stdout)
        
        print(f"\n解析结果:")
        print(f"平台: {parsed_result.get('platform')}")
        print(f"标题: {parsed_result.get('title')}")
        print(f"作者: {parsed_result.get('author')}")
        print(f"媒体类型: {parsed_result.get('media_type')}")
        print(f"是否包含实况图片: {parsed_result.get('has_live_photo')}")
        
        print(f"\n下载链接:")
        download_urls = parsed_result.get('download_urls', {})
        print(f"- 图片URL数量: {len(download_urls.get('images', []))}")
        print(f"- 实况图片URL数量: {len(download_urls.get('live', []))}")
        print(f"- 视频URL数量: {len(download_urls.get('video', []))}")
        
        # 检查是否包含实况图片信息
        if download_urls.get('live') and len(download_urls.get('live')) > 0:
            print("\n✅ 成功检测到实况图片URL")
            for i, url in enumerate(download_urls.get('live')[:3]):
                print(f"  实况图片{i+1}: {url}")
        else:
            print("\n❌ 未检测到实况图片URL")
        
        return parsed_result
        
    except subprocess.TimeoutExpired:
        print("执行超时")
        return None
    except json.JSONDecodeError as e:
        print(f"JSON解析失败: {e}")
        print(f"原始输出: {result.stdout}")
        return None
    except Exception as e:
        print(f"测试失败: {str(e)}")
        return None

def main():
    """主测试函数"""
    test_wrapper_parse()
    print("\n=== 测试完成 ===")

if __name__ == "__main__":
    main()