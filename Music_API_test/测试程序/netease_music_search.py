"""
网易云音乐搜索程序
功能：根据歌曲名称搜索并返回最相似的歌曲ID
"""

import requests
import json


def search_music(keyword, limit=10):
    """
    搜索网易云音乐
    
    参数:
        keyword: 搜索关键词（歌曲名称）
        limit: 返回结果数量，默认10条
    
    返回:
        包含歌曲信息的列表
    """
    # 网易云音乐搜索API
    url = "http://music.163.com/api/search/get/web"
    
    # 请求参数
    params = {
        's': keyword,           # 搜索关键词
        'type': 1,              # 1表示单曲
        'offset': 0,            # 偏移量
        'limit': limit          # 返回结果数量
    }
    
    # 设置请求头，模拟浏览器访问
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'http://music.163.com/'
    }
    
    try:
        # 发送GET请求
        response = requests.get(url, params=params, headers=headers, timeout=10)
        response.raise_for_status()
        
        # 解析JSON响应
        data = response.json()
        
        # 检查是否有结果
        if data.get('code') == 200 and data.get('result'):
            songs = data['result'].get('songs', [])
            return songs
        else:
            print("未找到相关歌曲")
            return []
            
    except requests.exceptions.RequestException as e:
        print(f"请求错误: {e}")
        return []
    except json.JSONDecodeError as e:
        print(f"JSON解析错误: {e}")
        return []


def display_search_results(songs):
    """
    显示搜索结果
    
    参数:
        songs: 歌曲列表
    """
    if not songs:
        print("没有找到相关歌曲")
        return
    
    print(f"\n搜索到 {len(songs)} 首歌曲：")
    print("-" * 80)
    
    for i, song in enumerate(songs, 1):
        song_id = song.get('id', 'N/A')
        song_name = song.get('name', 'N/A')
        
        # 获取歌手信息
        artists = song.get('artists', [])
        artist_names = ', '.join([artist.get('name', '') for artist in artists])
        
        # 获取专辑信息
        album = song.get('album', {})
        album_name = album.get('name', 'N/A')
        
        print(f"{i}. 歌曲名: {song_name}")
        print(f"   歌手: {artist_names}")
        print(f"   专辑: {album_name}")
        print(f"   ID: {song_id}")
        print(f"   播放链接: http://music.163.com/song/media/outer/url?id={song_id}.mp3")
        print("-" * 80)


def get_best_match_id(keyword):
    """
    获取最匹配的歌曲ID（返回第一个结果）
    
    参数:
        keyword: 搜索关键词
    
    返回:
        最匹配的歌曲ID
    """
    songs = search_music(keyword, limit=1)
    
    if songs:
        best_match = songs[0]
        song_id = best_match.get('id')
        song_name = best_match.get('name')
        artists = best_match.get('artists', [])
        artist_names = ', '.join([artist.get('name', '') for artist in artists])
        
        print(f"\n最匹配的歌曲：")
        print(f"歌曲名: {song_name}")
        print(f"歌手: {artist_names}")
        print(f"ID: {song_id}")
        print(f"播放链接: http://music.163.com/song/media/outer/url?id={song_id}.mp3")
        
        return song_id
    else:
        print("未找到匹配的歌曲")
        return None


def main():
    """
    主函数
    """
    print("=" * 80)
    print("网易云音乐搜索程序")
    print("=" * 80)
    
    while True:
        print("\n请选择操作：")
        print("1. 搜索歌曲（显示多个结果）")
        print("2. 获取最匹配的歌曲ID")
        print("3. 退出")
        
        choice = input("\n请输入选项 (1/2/3): ").strip()
        
        if choice == '1':
            keyword = input("\n请输入要搜索的歌曲名称: ").strip()
            if keyword:
                songs = search_music(keyword)
                display_search_results(songs)
            else:
                print("请输入有效的歌曲名称")
                
        elif choice == '2':
            keyword = input("\n请输入要搜索的歌曲名称: ").strip()
            if keyword:
                get_best_match_id(keyword)
            else:
                print("请输入有效的歌曲名称")
                
        elif choice == '3':
            print("\n感谢使用，再见！")
            break
            
        else:
            print("\n无效的选项，请重新选择")


if __name__ == "__main__":
    main()

