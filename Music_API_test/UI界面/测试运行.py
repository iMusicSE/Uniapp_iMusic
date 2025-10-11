"""
快速测试程序 - 验证依赖和基本功能
"""

import sys

def check_dependencies():
    """检查依赖库"""
    print("="*50)
    print("正在检查依赖...")
    print("="*50)
    
    # 检查Python版本
    print(f"\n✓ Python版本: {sys.version}")
    
    # 检查tkinter
    try:
        import tkinter
        print("✓ tkinter: 已安装")
    except ImportError:
        print("✗ tkinter: 未安装（这是Python内置库，应该已经包含）")
        return False
    
    # 检查requests
    try:
        import requests
        print(f"✓ requests: 已安装 (版本 {requests.__version__})")
    except ImportError:
        print("✗ requests: 未安装")
        print("  请运行: pip install requests")
        return False
    
    print("\n" + "="*50)
    print("所有依赖检查完成！")
    print("="*50)
    print("\n可以启动主程序了！")
    print("运行: python music_search_ui.py")
    print("或双击: 启动程序.bat")
    
    return True

def test_api():
    """测试API连接"""
    print("\n" + "="*50)
    print("测试API连接...")
    print("="*50)
    
    try:
        import requests
        
        url = "http://music.163.com/api/search/get/web"
        params = {
            's': '测试',
            'type': 1,
            'offset': 0,
            'limit': 1
        }
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        print("正在发送测试请求...")
        response = requests.get(url, params=params, headers=headers, timeout=5)
        
        if response.status_code == 200:
            print(f"✓ API连接成功！(状态码: {response.status_code})")
            data = response.json()
            if data.get('code') == 200:
                print("✓ API响应正常！")
                return True
        else:
            print(f"✗ API连接失败 (状态码: {response.status_code})")
            return False
            
    except Exception as e:
        print(f"✗ 测试失败: {e}")
        return False

if __name__ == "__main__":
    print("\n网易云音乐搜索下载器 - 环境测试\n")
    
    if check_dependencies():
        test_api()
        
    print("\n按任意键退出...")
    input()

