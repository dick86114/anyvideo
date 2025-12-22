#!/usr/bin/env python3
"""
调试小红书URL解析过程，特别是实况图片提取逻辑
"""
import re
import json
import httpx
from media_parser_sdk.platforms.xiaohongshu import XiaohongshuParser

def debug_xiaohongshu_parsing(url):
    """调试小红书URL解析过程"""
    print(f"=== 调试小红书URL解析: {url} ===")
    
    parser = XiaohongshuParser()
    
    try:
        # 获取网页HTML
        print("\n1. 获取网页HTML...")
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://www.xiaohongshu.com/",
            "Accept-Language": "zh-CN,zh;q=0.9"
        }
        
        with httpx.Client(headers=headers, timeout=15, follow_redirects=True) as client:
            response = client.get(url)
            response.raise_for_status()
            html = response.text
        
        print(f"HTML长度: {len(html)} 字符")
        
        # 提取__INITIAL_STATE__
        print("\n2. 提取__INITIAL_STATE__...")
        initial_state_pattern = re.compile(r'window\.__INITIAL_STATE__\s*=\s*(.+?)(?=</script>)', re.DOTALL)
        initial_state_match = initial_state_pattern.search(html)
        
        if initial_state_match:
            initial_state_str = initial_state_match.group(1).strip()
            if initial_state_str.endswith(';'):
                initial_state_str = initial_state_str[:-1]
            
            print(f"__INITIAL_STATE__长度: {len(initial_state_str)} 字符")
            
            try:
                # 尝试解析JSON
                initial_state = json.loads(initial_state_str)
                print("✅ 成功解析__INITIAL_STATE__")
                
                # 检查noteDetailMap
                note = initial_state.get("note", {})
                note_detail_map = note.get("noteDetailMap", {})
                print(f"noteDetailMap 键数量: {len(note_detail_map.keys())}")
                
                if note_detail_map:
                    note_id = next(iter(note_detail_map.keys()), None)
                    if note_id:
                        note_detail = note_detail_map[note_id]
                        note_data = note_detail.get("note", {})
                        print(f"note_data 存在: {bool(note_data)}")
                        
                        # 检查imageList
                        image_list = note_data.get("imageList", [])
                        print(f"imageList 长度: {len(image_list)}")
                        
                        # 检查每张图片是否包含livePhoto
                        has_live_photo = False
                        for i, img in enumerate(image_list):
                            live_photo = img.get("livePhoto")
                            print(f"  图片 {i+1}: livePhoto = {live_photo}")
                            if live_photo:
                                has_live_photo = True
                                print(f"    ✅ 发现实况图片: {live_photo}")
                                
                                # 检查livePhoto的结构
                                if isinstance(live_photo, dict):
                                    print(f"    livePhoto类型: dict")
                                    print(f"    livePhoto键: {list(live_photo.keys())}")
                                    print(f"    videoUrl存在: {bool(live_photo.get('videoUrl'))}")
                        
                        print(f"\n3. 提取实况图片结果:")
                        print(f"   检测到实况图片: {has_live_photo}")
            except json.JSONDecodeError as e:
                print(f"❌ JSON解析失败: {e}")
                print(f"原始数据前1000字符: {initial_state_str[:1000]}...")
        else:
            print("❌ 未找到__INITIAL_STATE__")
            
        # 检查页面中是否包含livePhoto相关内容
        print("\n4. 检查页面中livePhoto相关内容...")
        live_photo_matches = re.findall(r'livePhoto', html)
        print(f"页面中livePhoto出现次数: {len(live_photo_matches)}")
        
        if live_photo_matches:
            # 提取包含livePhoto的上下文
            context_matches = re.findall(r'.{0,100}livePhoto.{0,100}', html, re.DOTALL)
            print(f"提取到 {len(context_matches)} 个上下文片段")
            for i, match in enumerate(context_matches[:3]):
                print(f"  片段 {i+1}: {match[:200]}...")
    
    except Exception as e:
        print(f"❌ 调试过程中发生错误: {str(e)}")
        import traceback
        traceback.print_exc()

def main():
    """主函数"""
    # 提示用户输入小红书URL
    test_url = input("请输入小红书URL: ").strip()
    if not test_url:
        print("URL不能为空")
        return
    
    debug_xiaohongshu_parsing(test_url)

if __name__ == "__main__":
    main()