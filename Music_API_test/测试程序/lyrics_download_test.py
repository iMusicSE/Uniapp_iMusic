"""
网易云音乐歌词下载测试程序
功能：
1. 根据歌曲ID获取歌词
2. 保存歌词为LRC和TXT格式
3. 支持原文歌词、翻译歌词和罗马音
"""

import requests
import json
import os
import re


def get_lyrics(song_id):
    """
    获取歌曲歌词
    
    参数:
        song_id: 歌曲ID
    
    返回:
        包含歌词信息的字典
    """
    # 网易云音乐歌词API
    url = "http://music.163.com/api/song/lyric"
    
    # 请求参数
    params = {
        'id': song_id,
        'lv': -1,  # 原文歌词版本
        'kv': -1,  # 卡拉OK版本
        'tv': -1   # 翻译版本
    }
    
    # 请求头
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'http://music.163.com/'
    }
    
    try:
        print(f"\n{'='*60}")
        print(f"正在请求歌词API...")
        print(f"API地址: {url}")
        print(f"歌曲ID: {song_id}")
        print(f"{'='*60}")
        
        # 发送GET请求
        response = requests.get(url, params=params, headers=headers, timeout=10)
        response.raise_for_status()
        
        # 解析JSON响应
        data = response.json()
        
        print(f"\n✓ 请求成功！")
        print(f"响应状态码: {response.status_code}")
        
        # 提取歌词信息
        result = {
            'success': True,
            'original_lyric': None,      # 原文歌词
            'translated_lyric': None,    # 翻译歌词
            'roma_lyric': None,          # 罗马音歌词
            'has_lyric': False
        }
        
        # 获取原文歌词
        if data.get('lrc') and data['lrc'].get('lyric'):
            result['original_lyric'] = data['lrc']['lyric']
            result['has_lyric'] = True
            print(f"✓ 找到原文歌词")
        
        # 获取翻译歌词
        if data.get('tlyric') and data['tlyric'].get('lyric'):
            result['translated_lyric'] = data['tlyric']['lyric']
            print(f"✓ 找到翻译歌词")
        
        # 获取罗马音歌词
        if data.get('romalrc') and data['romalrc'].get('lyric'):
            result['roma_lyric'] = data['romalrc']['lyric']
            print(f"✓ 找到罗马音歌词")
        
        if not result['has_lyric']:
            print(f"✗ 该歌曲暂无歌词")
            result['success'] = False
        
        return result
        
    except requests.exceptions.RequestException as e:
        print(f"\n✗ 请求错误: {e}")
        return {'success': False, 'error': str(e)}
    except json.JSONDecodeError as e:
        print(f"\n✗ JSON解析错误: {e}")
        return {'success': False, 'error': str(e)}


def parse_lrc_to_text(lrc_content):
    """
    将LRC格式转换为纯文本
    
    参数:
        lrc_content: LRC格式的歌词
    
    返回:
        纯文本格式的歌词
    """
    if not lrc_content:
        return ""
    
    # 正则表达式匹配时间标签 [00:00.00]
    pattern = r'\[\d{2}:\d{2}\.\d{2,3}\]'
    
    lines = lrc_content.split('\n')
    text_lines = []
    
    for line in lines:
        # 移除时间标签
        text = re.sub(pattern, '', line).strip()
        if text and not text.startswith('['):  # 排除元数据标签
            text_lines.append(text)
    
    return '\n'.join(text_lines)


def merge_lyrics(original, translated):
    """
    合并原文和翻译歌词
    
    参数:
        original: 原文歌词(LRC格式)
        translated: 翻译歌词(LRC格式)
    
    返回:
        合并后的歌词文本
    """
    if not original:
        return ""
    
    if not translated:
        return original
    
    # 解析原文歌词
    orig_lines = original.split('\n')
    trans_lines = translated.split('\n')
    
    # 创建时间戳到翻译的映射
    trans_map = {}
    time_pattern = r'\[(\d{2}:\d{2}\.\d{2,3})\]'
    
    for line in trans_lines:
        matches = re.findall(time_pattern, line)
        if matches:
            time_stamp = matches[0]
            text = re.sub(r'\[\d{2}:\d{2}\.\d{2,3}\]', '', line).strip()
            if text:
                trans_map[time_stamp] = text
    
    # 合并歌词
    merged = []
    for line in orig_lines:
        merged.append(line)
        matches = re.findall(time_pattern, line)
        if matches and matches[0] in trans_map:
            # 添加翻译行（不带时间戳）
            merged.append(f"  ({trans_map[matches[0]]})")
    
    return '\n'.join(merged)


def save_lyrics(song_name, artist_name, lyrics_data, save_dir="音乐下载"):
    """
    保存歌词到文件
    
    参数:
        song_name: 歌曲名称
        artist_name: 歌手名称
        lyrics_data: 歌词数据字典
        save_dir: 保存目录
    
    返回:
        保存的文件路径列表
    """
    if not lyrics_data.get('success') or not lyrics_data.get('has_lyric'):
        print("\n没有可保存的歌词")
        return []
    
    # 创建保存目录
    if not os.path.exists(save_dir):
        os.makedirs(save_dir)
    
    # 清理文件名中的非法字符
    safe_filename = f"{song_name} - {artist_name}"
    safe_filename = "".join(c for c in safe_filename if c not in r'\/:*?"<>|')
    
    saved_files = []
    
    try:
        # 1. 保存原文LRC文件
        if lyrics_data.get('original_lyric'):
            lrc_path = os.path.join(save_dir, f"{safe_filename}.lrc")
            with open(lrc_path, 'w', encoding='utf-8') as f:
                f.write(lyrics_data['original_lyric'])
            saved_files.append(lrc_path)
            print(f"\n✓ 已保存原文LRC: {lrc_path}")
        
        # 2. 保存纯文本歌词（原文）
        if lyrics_data.get('original_lyric'):
            txt_path = os.path.join(save_dir, f"{safe_filename}.txt")
            text_lyrics = parse_lrc_to_text(lyrics_data['original_lyric'])
            with open(txt_path, 'w', encoding='utf-8') as f:
                f.write(f"歌曲: {song_name}\n")
                f.write(f"歌手: {artist_name}\n")
                f.write("="*50 + "\n\n")
                f.write(text_lyrics)
            saved_files.append(txt_path)
            print(f"✓ 已保存纯文本歌词: {txt_path}")
        
        # 3. 如果有翻译，保存双语LRC
        if lyrics_data.get('translated_lyric'):
            bilingual_path = os.path.join(save_dir, f"{safe_filename}_双语.lrc")
            merged = merge_lyrics(lyrics_data['original_lyric'], 
                                 lyrics_data['translated_lyric'])
            with open(bilingual_path, 'w', encoding='utf-8') as f:
                f.write(merged)
            saved_files.append(bilingual_path)
            print(f"✓ 已保存双语LRC: {bilingual_path}")
        
        # 4. 如果有罗马音，单独保存
        if lyrics_data.get('roma_lyric'):
            roma_path = os.path.join(save_dir, f"{safe_filename}_罗马音.lrc")
            with open(roma_path, 'w', encoding='utf-8') as f:
                f.write(lyrics_data['roma_lyric'])
            saved_files.append(roma_path)
            print(f"✓ 已保存罗马音LRC: {roma_path}")
        
        return saved_files
        
    except Exception as e:
        print(f"\n✗ 保存歌词时出错: {e}")
        return saved_files


def test_lyrics_download(song_id, song_name="Unknown", artist_name="Unknown"):
    """
    测试歌词下载功能
    
    参数:
        song_id: 歌曲ID
        song_name: 歌曲名称
        artist_name: 歌手名称
    """
    print("\n" + "="*60)
    print(f"开始测试歌词下载功能")
    print(f"歌曲: {song_name}")
    print(f"歌手: {artist_name}")
    print(f"歌曲ID: {song_id}")
    print("="*60)
    
    # 获取歌词
    lyrics_data = get_lyrics(song_id)
    
    if lyrics_data.get('success'):
        # 显示歌词预览
        print(f"\n{'='*60}")
        print("歌词预览（前500字符）:")
        print(f"{'='*60}")
        if lyrics_data.get('original_lyric'):
            preview = lyrics_data['original_lyric'][:500]
            print(preview)
            if len(lyrics_data['original_lyric']) > 500:
                print("...")
        
        # 保存歌词
        saved_files = save_lyrics(song_name, artist_name, lyrics_data)
        
        if saved_files:
            print(f"\n{'='*60}")
            print(f"✓ 歌词下载完成！共保存 {len(saved_files)} 个文件")
            print(f"{'='*60}")
        
    else:
        print(f"\n✗ 歌词获取失败")


def main():
    """
    主函数
    """
    print("="*60)
    print("网易云音乐歌词下载测试程序")
    print("="*60)
    
    while True:
        print("\n请选择操作：")
        print("1. 测试单首歌曲歌词下载")
        print("2. 使用预设示例进行测试")
        print("3. 退出")
        
        choice = input("\n请输入选项 (1/2/3): ").strip()
        
        if choice == '1':
            song_id = input("\n请输入歌曲ID: ").strip()
            if song_id:
                song_name = input("请输入歌曲名称（可选，按回车跳过）: ").strip() or "Unknown"
                artist_name = input("请输入歌手名称（可选，按回车跳过）: ").strip() or "Unknown"
                test_lyrics_download(song_id, song_name, artist_name)
            else:
                print("请输入有效的歌曲ID")
                
        elif choice == '2':
            print("\n使用预设示例进行测试...")
            
            # 示例1: 周杰伦 - 晴天
            print("\n【示例1】周杰伦 - 晴天")
            test_lyrics_download("185668", "晴天", "周杰伦")
            
            input("\n按回车键继续下一个示例...")
            
            # 示例2: 德彪西 - 月光（纯音乐，可能没有歌词）
            print("\n【示例2】德彪西 - 月光")
            test_lyrics_download("496869422", "Suite bergamasque, L.75 - 3. Clair de lune", "Pascal Rogé")
            
            input("\n按回车键继续...")
                
        elif choice == '3':
            print("\n感谢使用，再见！")
            break
            
        else:
            print("\n无效的选项，请重新选择")


if __name__ == "__main__":
    main()

