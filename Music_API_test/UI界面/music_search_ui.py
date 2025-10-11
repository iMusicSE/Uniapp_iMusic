"""
网易云音乐搜索下载器 - UI界面版
功能：
1. 搜索歌曲并显示前10个结果
2. 用户可选择并下载音乐到本地
3. 同时下载歌词（LRC和TXT格式）
4. 显示API调用信息和解析的URL
"""

import tkinter as tk
from tkinter import ttk, scrolledtext, messagebox, filedialog
import requests
import json
import threading
import os
import re


class MusicSearchApp:
    def __init__(self, root):
        self.root = root
        self.root.title("网易云音乐搜索下载器")
        self.root.geometry("1200x800")
        
        # 搜索结果列表
        self.search_results = []
        
        # 是否下载歌词
        self.download_lyrics_var = tk.BooleanVar(value=True)
        
        # 创建界面
        self.create_widgets()
        
    def create_widgets(self):
        """创建界面组件"""
        
        # ========== 顶部搜索区域 ==========
        search_frame = tk.Frame(self.root, padx=10, pady=10)
        search_frame.pack(fill=tk.X)
        
        tk.Label(search_frame, text="歌曲名称:", font=("微软雅黑", 12)).pack(side=tk.LEFT, padx=5)
        
        self.search_entry = tk.Entry(search_frame, font=("微软雅黑", 12), width=40)
        self.search_entry.pack(side=tk.LEFT, padx=5)
        self.search_entry.bind("<Return>", lambda e: self.search_music())
        
        self.search_btn = tk.Button(search_frame, text="搜索", font=("微软雅黑", 12), 
                                    command=self.search_music, bg="#1890ff", fg="white", 
                                    padx=20, cursor="hand2")
        self.search_btn.pack(side=tk.LEFT, padx=5)
        
        # ========== 主内容区域（使用PanedWindow分割） ==========
        main_paned = tk.PanedWindow(self.root, orient=tk.HORIZONTAL, sashwidth=5)
        main_paned.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)
        
        # ========== 左侧：搜索结果区域 ==========
        left_frame = tk.Frame(main_paned)
        main_paned.add(left_frame, minsize=400)
        
        tk.Label(left_frame, text="搜索结果 (双击下载)", font=("微软雅黑", 12, "bold")).pack(pady=5)
        
        # 创建Treeview显示搜索结果
        tree_frame = tk.Frame(left_frame)
        tree_frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        # 添加滚动条
        tree_scroll_y = tk.Scrollbar(tree_frame)
        tree_scroll_y.pack(side=tk.RIGHT, fill=tk.Y)
        
        tree_scroll_x = tk.Scrollbar(tree_frame, orient=tk.HORIZONTAL)
        tree_scroll_x.pack(side=tk.BOTTOM, fill=tk.X)
        
        # 创建表格
        self.result_tree = ttk.Treeview(tree_frame, columns=("序号", "歌曲名", "歌手", "专辑"), 
                                        show="headings", yscrollcommand=tree_scroll_y.set,
                                        xscrollcommand=tree_scroll_x.set)
        
        # 配置滚动条
        tree_scroll_y.config(command=self.result_tree.yview)
        tree_scroll_x.config(command=self.result_tree.xview)
        
        # 设置列
        self.result_tree.heading("序号", text="序号")
        self.result_tree.heading("歌曲名", text="歌曲名")
        self.result_tree.heading("歌手", text="歌手")
        self.result_tree.heading("专辑", text="专辑")
        
        self.result_tree.column("序号", width=50, anchor="center")
        self.result_tree.column("歌曲名", width=150, anchor="w")
        self.result_tree.column("歌手", width=120, anchor="w")
        self.result_tree.column("专辑", width=120, anchor="w")
        
        self.result_tree.pack(fill=tk.BOTH, expand=True)
        
        # 绑定双击事件
        self.result_tree.bind("<Double-1>", self.on_item_double_click)
        
        # 下载选项和按钮
        btn_frame = tk.Frame(left_frame)
        btn_frame.pack(fill=tk.X, pady=5)
        
        # 歌词下载选项
        lyrics_check = tk.Checkbutton(btn_frame, text="同时下载歌词（LRC + TXT）", 
                                      variable=self.download_lyrics_var,
                                      font=("微软雅黑", 10))
        lyrics_check.pack(pady=3)
        
        self.download_btn = tk.Button(btn_frame, text="下载选中的歌曲", font=("微软雅黑", 11),
                                      command=self.download_selected, bg="#52c41a", fg="white",
                                      padx=15, cursor="hand2", state=tk.DISABLED)
        self.download_btn.pack(pady=5)
        
        # ========== 右侧：API信息区域 ==========
        right_frame = tk.Frame(main_paned)
        main_paned.add(right_frame, minsize=400)
        
        tk.Label(right_frame, text="API调用信息", font=("微软雅黑", 12, "bold")).pack(pady=5)
        
        # API调用信息显示区域
        api_frame = tk.LabelFrame(right_frame, text="API请求详情", font=("微软雅黑", 10), padx=5, pady=5)
        api_frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        self.api_text = scrolledtext.ScrolledText(api_frame, wrap=tk.WORD, font=("Consolas", 10),
                                                   height=15, bg="#f5f5f5")
        self.api_text.pack(fill=tk.BOTH, expand=True)
        
        # URL解析信息显示区域
        url_frame = tk.LabelFrame(right_frame, text="URL解析详情", font=("微软雅黑", 10), padx=5, pady=5)
        url_frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        self.url_text = scrolledtext.ScrolledText(url_frame, wrap=tk.WORD, font=("Consolas", 10),
                                                   height=15, bg="#f5f5f5")
        self.url_text.pack(fill=tk.BOTH, expand=True)
        
        # ========== 底部状态栏 ==========
        status_frame = tk.Frame(self.root, relief=tk.SUNKEN, bd=1)
        status_frame.pack(fill=tk.X, side=tk.BOTTOM)
        
        self.status_label = tk.Label(status_frame, text="就绪", anchor=tk.W, font=("微软雅黑", 9))
        self.status_label.pack(fill=tk.X, padx=5, pady=2)
        
    def update_status(self, message):
        """更新状态栏"""
        self.status_label.config(text=message)
        
    def search_music(self):
        """搜索音乐"""
        keyword = self.search_entry.get().strip()
        
        if not keyword:
            messagebox.showwarning("提示", "请输入要搜索的歌曲名称")
            return
        
        # 禁用搜索按钮
        self.search_btn.config(state=tk.DISABLED, text="搜索中...")
        self.update_status(f"正在搜索: {keyword}")
        
        # 在新线程中执行搜索
        thread = threading.Thread(target=self._search_music_thread, args=(keyword,))
        thread.daemon = True
        thread.start()
        
    def _search_music_thread(self, keyword):
        """搜索音乐线程"""
        try:
            # API地址
            url = "http://music.163.com/api/search/get/web"
            
            # 请求参数
            params = {
                's': keyword,
                'type': 1,
                'offset': 0,
                'limit': 10
            }
            
            # 请求头
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Referer': 'http://music.163.com/'
            }
            
            # 显示API调用信息
            api_info = f"""
API调用信息
{'='*50}
请求方法: GET
API地址: {url}

请求参数:
{json.dumps(params, indent=2, ensure_ascii=False)}

请求头:
{json.dumps(headers, indent=2, ensure_ascii=False)}

{'='*50}
正在发送请求...
"""
            self.root.after(0, self._update_api_text, api_info)
            
            # 发送请求
            response = requests.get(url, params=params, headers=headers, timeout=10)
            response.raise_for_status()
            
            # 解析响应
            data = response.json()
            
            # 更新API信息
            api_info += f"\n响应状态码: {response.status_code}\n"
            api_info += f"响应时间: {response.elapsed.total_seconds():.2f} 秒\n"
            api_info += f"\n响应数据:\n{json.dumps(data, indent=2, ensure_ascii=False)[:1000]}...\n"
            
            self.root.after(0, self._update_api_text, api_info)
            
            # 检查结果
            if data.get('code') == 200 and data.get('result'):
                songs = data['result'].get('songs', [])
                self.search_results = songs
                self.root.after(0, self._display_results, songs)
                self.root.after(0, self.update_status, f"找到 {len(songs)} 首歌曲")
            else:
                self.root.after(0, messagebox.showinfo, "提示", "未找到相关歌曲")
                self.root.after(0, self.update_status, "未找到结果")
                
        except Exception as e:
            error_msg = f"搜索出错: {str(e)}"
            self.root.after(0, messagebox.showerror, "错误", error_msg)
            self.root.after(0, self.update_status, error_msg)
            
        finally:
            # 恢复搜索按钮
            self.root.after(0, lambda: self.search_btn.config(state=tk.NORMAL, text="搜索"))
            
    def _update_api_text(self, text):
        """更新API信息文本框"""
        self.api_text.delete(1.0, tk.END)
        self.api_text.insert(1.0, text)
        
    def _display_results(self, songs):
        """显示搜索结果"""
        # 清空现有结果
        for item in self.result_tree.get_children():
            self.result_tree.delete(item)
            
        # 清空URL信息
        self.url_text.delete(1.0, tk.END)
        
        # 添加新结果
        url_info = "URL解析信息\n" + "="*50 + "\n\n"
        
        for i, song in enumerate(songs, 1):
            song_id = song.get('id', 'N/A')
            song_name = song.get('name', 'N/A')
            
            # 获取歌手信息
            artists = song.get('artists', [])
            artist_names = ', '.join([artist.get('name', '') for artist in artists])
            
            # 获取专辑信息
            album = song.get('album', {})
            album_name = album.get('name', 'N/A')
            
            # 添加到表格
            self.result_tree.insert("", tk.END, values=(i, song_name, artist_names, album_name))
            
            # 构建下载URL
            download_url = f"http://music.163.com/song/media/outer/url?id={song_id}.mp3"
            
            # 添加URL信息
            url_info += f"{i}. {song_name} - {artist_names}\n"
            url_info += f"   歌曲ID: {song_id}\n"
            url_info += f"   下载URL: {download_url}\n"
            url_info += f"   URL组成说明:\n"
            url_info += f"     - 基础URL: http://music.163.com/song/media/outer/url\n"
            url_info += f"     - 参数 id: {song_id}\n"
            url_info += f"     - 文件格式: .mp3\n"
            url_info += "-"*50 + "\n"
            
        # 显示URL信息
        self.url_text.insert(1.0, url_info)
        
        # 启用下载按钮
        self.download_btn.config(state=tk.NORMAL)
        
    def on_item_double_click(self, event):
        """双击事件处理"""
        self.download_selected()
        
    def download_selected(self):
        """下载选中的歌曲"""
        selection = self.result_tree.selection()
        
        if not selection:
            messagebox.showwarning("提示", "请先选择要下载的歌曲")
            return
            
        # 获取选中的索引
        item = self.result_tree.item(selection[0])
        index = int(item['values'][0]) - 1
        
        if 0 <= index < len(self.search_results):
            song = self.search_results[index]
            
            # 在新线程中下载
            thread = threading.Thread(target=self._download_song_thread, args=(song,))
            thread.daemon = True
            thread.start()
            
    def _download_song_thread(self, song):
        """下载歌曲线程"""
        try:
            song_id = song.get('id')
            song_name = song.get('name', 'Unknown')
            artists = song.get('artists', [])
            artist_names = ', '.join([artist.get('name', '') for artist in artists])
            
            # 构建文件名（去除非法字符）
            filename = f"{song_name} - {artist_names}.mp3"
            filename = "".join(c for c in filename if c not in r'\/:*?"<>|')
            
            # 询问保存位置
            filepath = filedialog.asksaveasfilename(
                defaultextension=".mp3",
                initialfile=filename,
                filetypes=[("MP3文件", "*.mp3"), ("所有文件", "*.*")]
            )
            
            if not filepath:
                return
            
            # 获取保存目录
            save_dir = os.path.dirname(filepath)
                
            # 下载URL
            download_url = f"http://music.163.com/song/media/outer/url?id={song_id}.mp3"
            
            self.root.after(0, self.update_status, f"正在下载音乐: {song_name}")
            self.root.after(0, self.download_btn.config, {"state": tk.DISABLED, "text": "下载中..."})
            
            # 发送下载请求
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            
            response = requests.get(download_url, headers=headers, stream=True, timeout=30)
            response.raise_for_status()
            
            # 检查内容长度
            total_size = int(response.headers.get('content-length', 0))
            
            if total_size < 1024:  # 如果文件太小，可能是下载失败
                self.root.after(0, messagebox.showwarning, "提示", 
                              "该歌曲可能需要VIP会员或暂时无法下载")
                self.root.after(0, self.update_status, "下载失败")
                return
            
            # 下载音乐文件
            downloaded_size = 0
            with open(filepath, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
                        downloaded_size += len(chunk)
                        
                        # 更新进度
                        if total_size > 0:
                            progress = (downloaded_size / total_size) * 100
                            status_msg = f"音乐下载进度: {progress:.1f}% ({downloaded_size}/{total_size} 字节)"
                            self.root.after(0, self.update_status, status_msg)
            
            # 音乐下载完成
            success_msg = f"音乐下载完成: {filename}\n保存位置: {filepath}"
            
            # 检查是否需要下载歌词
            if self.download_lyrics_var.get():
                self.root.after(0, self.update_status, "正在下载歌词...")
                
                # 下载歌词
                lyrics_result = self.download_lyrics(song_id, song_name, artist_names, save_dir)
                
                if lyrics_result.get('success'):
                    lyrics_count = lyrics_result.get('count', 0)
                    success_msg += f"\n\n歌词下载完成: 已保存 {lyrics_count} 个歌词文件"
                    success_msg += "\n  - LRC格式（带时间轴）"
                    success_msg += "\n  - TXT格式（纯文本）"
                    if lyrics_count > 2:
                        success_msg += "\n  - 双语版本"
                else:
                    success_msg += f"\n\n歌词下载提示: {lyrics_result.get('message', '未知错误')}"
            
            self.root.after(0, messagebox.showinfo, "成功", success_msg)
            self.root.after(0, self.update_status, "下载完成")
            
        except Exception as e:
            error_msg = f"下载出错: {str(e)}"
            self.root.after(0, messagebox.showerror, "错误", error_msg)
            self.root.after(0, self.update_status, error_msg)
            
        finally:
            self.root.after(0, self.download_btn.config, {"state": tk.NORMAL, "text": "下载选中的歌曲"})
    
    def get_lyrics(self, song_id):
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
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'http://music.163.com/'
        }
        
        try:
            # 发送GET请求
            response = requests.get(url, params=params, headers=headers, timeout=10)
            response.raise_for_status()
            
            # 解析JSON响应
            data = response.json()
            
            # 提取歌词信息
            result = {
                'success': True,
                'original_lyric': None,      # 原文歌词
                'translated_lyric': None,    # 翻译歌词
                'has_lyric': False
            }
            
            # 获取原文歌词
            if data.get('lrc') and data['lrc'].get('lyric'):
                result['original_lyric'] = data['lrc']['lyric']
                result['has_lyric'] = True
            
            # 获取翻译歌词
            if data.get('tlyric') and data['tlyric'].get('lyric'):
                result['translated_lyric'] = data['tlyric']['lyric']
            
            if not result['has_lyric']:
                result['success'] = False
            
            return result
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def parse_lrc_to_text(self, lrc_content):
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
    
    def save_lyrics_files(self, song_name, artist_name, lyrics_data, save_dir):
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
            return []
        
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
            
            # 2. 保存纯文本歌词（原文）
            if lyrics_data.get('original_lyric'):
                txt_path = os.path.join(save_dir, f"{safe_filename}.txt")
                text_lyrics = self.parse_lrc_to_text(lyrics_data['original_lyric'])
                with open(txt_path, 'w', encoding='utf-8') as f:
                    f.write(f"歌曲: {song_name}\n")
                    f.write(f"歌手: {artist_name}\n")
                    f.write("="*50 + "\n\n")
                    f.write(text_lyrics)
                saved_files.append(txt_path)
            
            # 3. 如果有翻译，保存双语版本
            if lyrics_data.get('translated_lyric'):
                bilingual_txt_path = os.path.join(save_dir, f"{safe_filename}_双语.txt")
                text_lyrics = self.parse_lrc_to_text(lyrics_data['original_lyric'])
                trans_lyrics = self.parse_lrc_to_text(lyrics_data['translated_lyric'])
                
                with open(bilingual_txt_path, 'w', encoding='utf-8') as f:
                    f.write(f"歌曲: {song_name}\n")
                    f.write(f"歌手: {artist_name}\n")
                    f.write("="*50 + "\n\n")
                    f.write("【原文】\n")
                    f.write(text_lyrics)
                    f.write("\n\n" + "="*50 + "\n\n")
                    f.write("【翻译】\n")
                    f.write(trans_lyrics)
                saved_files.append(bilingual_txt_path)
            
            return saved_files
            
        except Exception as e:
            print(f"保存歌词时出错: {e}")
            return saved_files
    
    def download_lyrics(self, song_id, song_name, artist_name, save_dir):
        """
        下载歌词到指定目录
        
        参数:
            song_id: 歌曲ID
            song_name: 歌曲名称
            artist_name: 歌手名称
            save_dir: 保存目录
        
        返回:
            下载结果信息
        """
        try:
            self.root.after(0, self.update_status, f"正在获取歌词...")
            
            # 获取歌词
            lyrics_data = self.get_lyrics(song_id)
            
            if lyrics_data.get('success'):
                # 保存歌词文件
                saved_files = self.save_lyrics_files(song_name, artist_name, lyrics_data, save_dir)
                
                if saved_files:
                    return {
                        'success': True,
                        'files': saved_files,
                        'count': len(saved_files)
                    }
                else:
                    return {'success': False, 'message': '歌词保存失败'}
            else:
                return {'success': False, 'message': '该歌曲暂无歌词'}
                
        except Exception as e:
            return {'success': False, 'message': f'歌词下载出错: {str(e)}'}


def main():
    """主函数"""
    root = tk.Tk()
    app = MusicSearchApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()

