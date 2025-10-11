"""
自动化测试歌词下载功能
无需手动输入，直接展示测试结果
"""

from lyrics_download_test import test_lyrics_download

def main():
    print("\n" + "="*60)
    print("自动化测试：网易云音乐歌词下载功能")
    print("="*60)
    
    # 测试案例列表
    test_cases = [
        {
            'id': '185668',
            'name': '晴天',
            'artist': '周杰伦',
            'description': '热门中文歌曲（有歌词）'
        },
        {
            'id': '28391863',
            'name': '告白气球',
            'artist': '周杰伦',
            'description': '流行歌曲（有歌词）'
        },
        {
            'id': '496869422',
            'name': 'Suite bergamasque, L.75 - 3. Clair de lune',
            'artist': 'Pascal Rogé',
            'description': '纯音乐（可能无歌词）'
        }
    ]
    
    total = len(test_cases)
    success_count = 0
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n{'#'*60}")
        print(f"测试用例 {i}/{total}: {test_case['description']}")
        print(f"{'#'*60}")
        
        try:
            test_lyrics_download(
                test_case['id'],
                test_case['name'],
                test_case['artist']
            )
            success_count += 1
        except Exception as e:
            print(f"\n✗ 测试失败: {e}")
        
        if i < total:
            print("\n" + "-"*60)
            input("按回车键继续下一个测试...")
    
    # 测试总结
    print("\n" + "="*60)
    print("测试总结")
    print("="*60)
    print(f"总测试数: {total}")
    print(f"成功数: {success_count}")
    print(f"失败数: {total - success_count}")
    print(f"成功率: {success_count/total*100:.1f}%")
    print("="*60)
    
    print("\n✓ 自动化测试完成！")
    print("请检查 '音乐下载' 目录中的歌词文件。")

if __name__ == "__main__":
    main()

