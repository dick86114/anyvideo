#!/usr/bin/env python3
"""
交互式测试小红书实况图片解析功能
"""
import subprocess
import json

def test_xiaohongshu_live_photo():
    """交互式测试小红书实况图片解析功能"""
    print("=== 交互式测试小红书实况图片解析 ===")
    
    # 让用户输入有效的小红书URL
    test_url = input("请输入包含实况图片的小红书URL: ").strip()
    if not test_url:
        print("URL不能为空")
        return False
    
    try:
        print(f"\n测试链接: {test_url}")
        
        # 执行wrapper.py的parse命令
        result = subprocess.run(
            ["python3", "media_parser_sdk/wrapper.py", "parse", test_url],
            capture_output=True,
            text=True,
            timeout=60
        )
        
        if result.returncode != 0:
            print(f"执行失败: {result.stderr}")
            return False
        
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
        for i, url in enumerate(download_urls.get('images', [])[:3]):
            print(f"  图片{i+1}: {url}")
        
        print(f"- 实况图片URL数量: {len(download_urls.get('live', []))}")
        for i, url in enumerate(download_urls.get('live', [])[:3]):
            print(f"  实况图片{i+1}: {url}")
        
        print(f"- 视频URL数量: {len(download_urls.get('video', []))}")
        for i, url in enumerate(download_urls.get('video', [])[:1]):
            print(f"  视频{i+1}: {url}")
        
        # 检查是否包含实况图片信息
        if download_urls.get('live') and len(download_urls.get('live')) > 0:
            print("\n✅ 成功检测到实况图片URL")
            return True
        else:
            print("\n❌ 未检测到实况图片URL")
            return False
        
    except subprocess.TimeoutExpired:
        print("执行超时")
        return False
    except json.JSONDecodeError as e:
        print(f"JSON解析失败: {e}")
        print(f"原始输出: {result.stdout}")
        return False
    except Exception as e:
        print(f"测试失败: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """主函数"""
    success = test_xiaohongshu_live_photo()
    if success:
        print("\n=== 测试成功！小红书实况图片解析功能正常 ===")
    else:
        print("\n=== 测试失败！小红书实况图片解析功能存在问题 ===")

if __name__ == "__main__":
    main()