# iMusic - UniApp 音乐播放器

一个功能完善的音乐播放器应用，基于 UniApp 开发，支持多平台运行。

## 📱 功能特性

### 核心功能
- ✅ 音乐搜索 - 支持搜索网易云音乐曲库
- ✅ 在线播放 - 流畅的音乐播放体验
- ✅ 歌词显示 - 实时滚动歌词
- ✅ 播放控制 - 播放/暂停、上一首/下一首
- ✅ 进度控制 - 可拖动进度条
- ✅ 播放模式 - 列表循环、单曲循环、随机播放

### 页面功能

#### 🎵 发现页
- 轮播图展示
- 快捷功能入口（每日推荐、排行榜、私人电台等）
- 推荐歌单
- 新歌推荐列表

#### 🔍 搜索页
- 实时搜索功能
- 搜索历史记录
- 热门搜索推荐
- 多类型搜索（单曲、歌手、专辑、歌单）

#### 👤 我的音乐
- 个人信息展示
- 收藏列表管理
- 播放历史记录
- 数据统计（收藏数、历史数、播放列表数）

#### 🎼 播放详情页
- 全屏播放界面
- 旋转唱片动画
- 实时歌词显示
- 完整播放控制
- 收藏、下载、评论功能入口

### 公共组件
- **MiniPlayer** - 迷你播放器（固定在底部）
- **SongList** - 歌曲列表组件（可复用）

## 🛠 技术架构

### 技术栈
- **框架**: UniApp
- **状态管理**: Vuex
- **音频**: UniApp InnerAudioContext API
- **API**: 网易云音乐 API

### 项目结构
```
Uniapp_iMusic/
├── pages/                  # 页面目录
│   ├── discover/          # 发现页
│   ├── search/            # 搜索页
│   ├── mine/              # 我的音乐
│   ├── player/            # 播放详情页
│   └── index/             # 旧版页面（保留）
├── components/            # 公共组件
│   ├── MiniPlayer.vue    # 迷你播放器
│   └── SongList.vue      # 歌曲列表
├── store/                 # 状态管理
│   └── index.js          # Vuex store
├── static/               # 静态资源
│   ├── logo.png         # 应用图标
│   └── tabs/            # 底部导航图标
├── App.vue              # 应用入口
├── main.js              # 主入口文件
├── pages.json           # 页面配置
└── manifest.json        # 应用配置
```

## 🚀 快速开始

### 1. 安装依赖
```bash
npm install
# 或
yarn install
```

### 2. 配置图标
请参考 `static/tabs/README.md` 文件，准备底部导航栏图标。

临时解决方案：可以复制 `static/logo.png` 为以下文件名作为占位符：
- discover.png / discover-active.png
- search.png / search-active.png
- mine.png / mine-active.png

### 3. 运行项目

#### H5端
```bash
npm run dev:h5
```

#### 微信小程序
```bash
npm run dev:mp-weixin
```

#### App端
```bash
npm run dev:app
```

### 4. 使用 HBuilderX
1. 使用 HBuilderX 打开项目
2. 选择运行 -> 运行到浏览器/小程序/手机
3. 等待编译完成即可

## 📝 状态管理说明

### Vuex Store 状态
```javascript
{
  audioContext: null,      // 音频上下文
  currentSong: null,       // 当前播放歌曲
  isPlaying: false,        // 播放状态
  playlist: [],            // 播放列表
  currentIndex: 0,         // 当前播放索引
  playMode: 0,             // 播放模式 (0:列表循环 1:单曲循环 2:随机)
  currentTime: 0,          // 当前播放时间
  duration: 0,             // 歌曲总时长
  favorites: [],           // 收藏列表
  history: []              // 播放历史
}
```

### 主要 Actions
- `playSong()` - 播放歌曲
- `togglePlay()` - 播放/暂停切换
- `playNext()` - 播放下一首
- `playPrevious()` - 播放上一首
- `togglePlayMode()` - 切换播放模式
- `toggleFavorite()` - 切换收藏状态

## 🎨 UI 设计

### 配色方案
- 主色调：紫色渐变 `#667eea -> #764ba2`
- 辅助色：蓝色 `#1890ff`
- 背景色：浅灰 `#f5f5f5`
- 文字色：深灰 `#333` / 浅灰 `#999`

### 设计特点
- 现代化扁平设计
- 流畅的过渡动画
- 毛玻璃效果（backdrop-filter）
- 渐变色彩运用
- 圆角卡片设计

## 📌 待扩展功能

以下功能已预留接口，可根据需要进行开发：

### 高优先级
- [ ] 播放列表管理（添加/删除/排序）
- [ ] 歌单详情页
- [ ] 艺人详情页
- [ ] 专辑详情页
- [ ] 音乐下载功能
- [ ] 本地音乐管理

### 中优先级
- [ ] 每日推荐功能
- [ ] 排行榜功能
- [ ] 私人电台功能
- [ ] 音乐评论功能
- [ ] 分享功能
- [ ] 用户系统（登录/注册）

### 低优先级
- [ ] 个性化推荐
- [ ] 听歌识曲
- [ ] 音效设置
- [ ] 定时关闭
- [ ] 桌面歌词
- [ ] 皮肤主题切换

## ⚠️ 注意事项

### API 使用
本项目使用网易云音乐的公开 API，仅供学习和研究使用。如需商业使用，请：
1. 获取官方授权
2. 使用合法的音乐版权资源
3. 遵守相关法律法规

### VIP 歌曲
部分歌曲需要 VIP 权限才能播放，会显示"VIP"标签。播放这些歌曲可能失败。

### 跨域问题
H5 端可能遇到跨域问题，建议：
1. 开发时使用代理配置
2. 部署时配置 CORS
3. 或使用自己的后端服务转发请求

## 📄 License

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📮 联系方式

如有问题或建议，请提交 Issue。

---

**享受音乐，享受编程！** 🎵✨

