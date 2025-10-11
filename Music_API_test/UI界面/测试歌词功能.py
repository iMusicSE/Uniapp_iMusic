"""
歌词下载功能测试脚本
用于快速测试歌词下载API和文件保存功能
"""

import requests
import json
import os
import re


def test_get_lyrics(song_id, song_name="测试歌曲"):
    """
    测试获取歌词功能
    
    参数:
        song_id: 歌曲ID
        song_name: 歌曲名称（用于显示）
    """
    print("\n" + "="*60)
    print(f"测试歌曲：{song_name} (ID: {song_id})")
    print("="*60)
    
    # API地址
    url = "http://music.163.com/api/song/lyric"
    
    # 请求参数
    params = {
        'id': song_id,
        'lv': -1,
        'kv': -1,
        'tv': -1
    }
    
    # 请求头
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'http://music.163.com/'
    }
    
    try:
        print("\n正在请求歌词API...")
        response = requests.get(url, params=params, headers=headers, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        print("✓ API请求成功")
        print(f"  响应状态码: {response.status_code}")
        
        # 检查歌词
        has_lyric = False
        has_trans = False
        
        if data.get('lrc') and data['lrc'].get('lyric'):
            has_lyric = True
            lyric_preview = data['lrc']['lyric'][:200]
            print(f"\n✓ 找到原文歌词")
            print(f"  预览（前200字符）：\n{lyric_preview}...")
            
        if data.get('tlyric') and data['tlyric'].get('lyric'):
            has_trans = True
            print(f"\n✓ 找到翻译歌词")
            
        if not has_lyric:
            print("\n✗ 该歌曲暂无歌词")
            
        return {
            'success': has_lyric,
            'has_lyric': has_lyric,
            'has_trans': has_trans,
            'data': data
        }
        
    except Exception as e:
        print(f"\n✗ 错误: {e}")
        return {'success': False, 'error': str(e)}


def test_parse_lrc(lrc_content):
    """
    测试LRC转TXT功能
    """
    print("\n" + "-"*60)
    print("测试LRC格式转换...")
    print("-"*60)
    
    if not lrc_content:
        print("✗ 没有歌词内容")
        return ""
    
    # 正则表达式匹配时间标签
    pattern = r'\[\d{2}:\d{2}\.\d{2,3}\]'
    
    lines = lrc_content.split('\n')
    text_lines = []
    
    for line in lines:
        text = re.sub(pattern, '', line).strip()
        if text and not text.startswith('['):
            text_lines.append(text)
    
    txt_content = '\n'.join(text_lines)
    
    print("✓ 格式转换成功")
    print(f"  原始行数: {len(lines)}")
    print(f"  转换后行数: {len(text_lines)}")
    print(f"\n  纯文本预览（前5行）：")
    for i, line in enumerate(text_lines[:5]):
        print(f"    {i+1}. {line}")
    
    return txt_content


def main():
    """
    主测试函数
    """
    print("="*60)
    print("歌词下载功能测试程序")
    print("="*60)
    
    # 测试歌曲列表
    test_songs = [
        {'id': '185668', 'name': '晴天 - 周杰伦'},
        {'id': '186016', 'name': '稻香 - 周杰伦'},
        {'id': '496869422', 'name': '德彪西 - 月光（纯音乐）'}
    ]
    
    print("\n提示：将测试以下歌曲的歌词下载功能")
    for i, song in enumerate(test_songs, 1):
        print(f"  {i}. {song['name']} (ID: {song['id']})")
    
    input("\n按回车键开始测试...")
    
    # 开始测试
    for song in test_songs:
        result = test_get_lyrics(song['id'], song['name'])
        
        if result['success']:
            # 测试格式转换
            lrc_content = result['data']['lrc']['lyric']
            test_parse_lrc(lrc_content)
            
        input("\n按回车键继续下一个测试...")
    
    print("\n" + "="*60)
    print("✓ 测试完成！")
    print("="*60)
    print("\n说明：")
    print("1. 如果所有测试都通过，说明歌词下载功能正常")
    print("2. 纯音乐（如德彪西的月光）通常没有歌词是正常的")
    print("3. 在UI程序中下载时会自动保存为LRC和TXT文件")
    print("\n你现在可以使用UI程序进行实际下载测试！")


if __name__ == "__main__":
    main()

