# 在本UniApp中所使用到的网易云API

## 📖 文档说明

本文档详细说明了 iMusic 音乐播放器项目中使用的所有网易云音乐 API 接口，包括接口地址、请求参数、返回数据格式以及在项目中的实际应用场景。

## 🌐 API 基础配置

### 基础URL配置

项目通过 `utils/api.js` 统一管理网易云API的基础URL：

```javascript
function getBaseURL() {
    // #ifdef H5
    // H5平台使用代理，避免跨域问题
    return '/api'
    // #endif
    
    // #ifndef H5
    // 其他平台直接访问
    return 'http://music.163.com/api'
    // #endif
}
```

### 通用请求头

```javascript
function getHeaders() {
    return {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'http://music.163.com/'
    }
}
```

## 📡 API 接口详情

### 1. 搜索音乐 API

#### 接口信息
- **接口地址**: `/search/get/web`
- **请求方法**: `GET`
- **功能描述**: 搜索歌曲、专辑、歌手等音乐资源

#### 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| s | String | 是 | - | 搜索关键词 |
| type | Number | 否 | 1 | 搜索类型（1: 单曲, 10: 专辑, 100: 歌手, 1000: 歌单） |
| offset | Number | 否 | 0 | 偏移量，用于分页 |
| limit | Number | 否 | 30 | 返回数量限制 |

#### 代码实现

```javascript
export function searchMusic(keyword, offset = 0, limit = 30) {
    return uni.request({
        url: `${getBaseURL()}/search/get/web`,
        method: 'GET',
        data: {
            s: keyword,
            type: 1,
            offset: offset,
            limit: limit
        },
        header: getHeaders()
    })
}
```

#### 返回数据结构

```json
{
    "result": {
        "songs": [
            {
                "id": 123456,
                "name": "歌曲名称",
                "artists": [
                    {
                        "id": 789,
                        "name": "歌手名称"
                    }
                ],
                "album": {
                    "id": 456,
                    "name": "专辑名称",
                    "picUrl": "专辑封面URL",
                    "blurPicUrl": "模糊封面URL"
                },
                "duration": 240000,
                "fee": 0
            }
        ],
        "songCount": 100
    },
    "code": 200
}
```

#### 使用场景
- **页面**: `pages/search/search.vue`
- **功能**: 用户在搜索页面输入关键词，搜索歌曲
- **处理逻辑**: 将返回的歌曲数据转换为应用内统一的歌曲格式

```javascript
// 使用示例
const res = await searchMusic('晴天', 0, 30)
if (res.statusCode === 200 && res.data.result) {
    const songs = res.data.result.songs || []
    this.searchResults = songs.map(song => ({
        id: song.id,
        name: song.name,
        artistName: song.artists.map(artist => artist.name).join(', '),
        albumName: song.album.name,
        albumPic: song.album.picUrl || song.album.blurPicUrl || '/static/logo.png',
        url: `http://music.163.com/song/media/outer/url?id=${song.id}.mp3`,
        vip: song.fee === 1
    }))
}
```

---

### 2. 获取歌词 API

#### 接口信息
- **接口地址**: `/song/lyric`
- **请求方法**: `GET`
- **功能描述**: 根据歌曲ID获取歌词信息

#### 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | Number | 是 | - | 歌曲ID |
| lv | Number | 否 | -1 | 歌词版本 |
| kv | Number | 否 | -1 | 卡拉OK版本 |
| tv | Number | 否 | -1 | 翻译版本 |

#### 代码实现

```javascript
export function getLyrics(songId) {
    return uni.request({
        url: `${getBaseURL()}/song/lyric`,
        method: 'GET',
        data: {
            id: songId,
            lv: -1,
            kv: -1,
            tv: -1
        },
        header: getHeaders()
    })
}
```

#### 返回数据结构

```json
{
    "lrc": {
        "version": 5,
        "lyric": "[00:00.00] 作词 : 作词人\n[00:01.00] 作曲 : 作曲人\n[00:15.20]第一句歌词\n[00:20.50]第二句歌词\n..."
    },
    "klyric": {
        "version": 0,
        "lyric": null
    },
    "tlyric": {
        "version": 0,
        "lyric": null
    },
    "code": 200
}
```

#### 歌词格式说明

歌词采用 LRC 格式，标准格式为：`[mm:ss.xx]歌词内容`

- `mm`: 分钟（两位数）
- `ss`: 秒（两位数）
- `xx`: 毫秒（两位或三位数）

#### 使用场景
- **页面**: `pages/player/player.vue`
- **功能**: 播放器页面显示滚动歌词
- **处理逻辑**: 解析LRC格式歌词，按时间轴同步显示

```javascript
// 使用示例
async loadLyrics(songId) {
    try {
        const res = await getLyrics(songId)
        if (res.statusCode === 200 && res.data && res.data.lrc && res.data.lrc.lyric) {
            this.parseLyrics(res.data.lrc.lyric)
        }
    } catch (error) {
        console.error('加载歌词错误:', error)
    }
}

// 歌词解析
parseLyrics(lrcText) {
    const lines = lrcText.split('\n')
    const lyricsArray = []
    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g
    
    lines.forEach(line => {
        const matches = [...line.matchAll(timeRegex)]
        if (matches.length > 0) {
            const text = line.replace(timeRegex, '').trim()
            if (text) {
                matches.forEach(match => {
                    const minutes = parseInt(match[1])
                    const seconds = parseInt(match[2])
                    const milliseconds = parseInt(match[3])
                    const time = minutes * 60 + seconds + milliseconds / (match[3].length === 2 ? 100 : 1000)
                    
                    lyricsArray.push({
                        time: time,
                        text: text
                    })
                })
            }
        }
    })
    
    lyricsArray.sort((a, b) => a.time - b.time)
    this.lyrics = lyricsArray
}
```

---

### 3. 获取歌曲详情 API

#### 接口信息
- **接口地址**: `/song/detail`
- **请求方法**: `GET`
- **功能描述**: 根据歌曲ID获取详细信息

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| ids | String | 是 | 歌曲ID数组的JSON字符串，格式：`"[123456]"` 或 `"[123456,789012]"` |

#### 代码实现

```javascript
export function getSongDetail(songId) {
    return uni.request({
        url: `${getBaseURL()}/song/detail`,
        method: 'GET',
        data: {
            ids: `[${songId}]`
        },
        header: getHeaders()
    })
}
```

#### 返回数据结构

```json
{
    "songs": [
        {
            "id": 123456,
            "name": "歌曲名称",
            "ar": [
                {
                    "id": 789,
                    "name": "歌手名称"
                }
            ],
            "al": {
                "id": 456,
                "name": "专辑名称",
                "picUrl": "专辑封面URL"
            },
            "dt": 240000,
            "fee": 0
        }
    ],
    "privileges": [
        {
            "id": 123456,
            "fee": 0,
            "st": 0
        }
    ],
    "code": 200
}
```

#### 批量获取歌曲详情

项目中封装了批量获取歌曲详情的方法：

```javascript
export async function getBatchSongDetails(songIds) {
    if (!songIds || songIds.length === 0) return []
    
    const results = []
    for (const id of songIds) {
        try {
            const res = await getSongDetail(id)
            
            if (res.statusCode === 200 && res.data?.songs?.length > 0) {
                const song = res.data.songs[0]
                
                // 防空处理
                const artistName = (song.ar && song.ar.length > 0)
                    ? song.ar.map(a => a.name).join(', ')
                    : (song.artists && song.artists.length > 0)
                        ? song.artists.map(a => a.name).join(', ')
                        : '未知歌手'
                
                const albumName = song.al?.name || song.album?.name || '未知专辑'
                const albumPic = song.al?.picUrl || song.album?.picUrl || '/static/logo.png'
                
                results.push({
                    id: Number(song.id),
                    name: song.name,
                    artistName,
                    albumName,
                    albumPic,
                    url: `https://music.163.com/song/media/outer/url?id=${song.id}.mp3`
                })
            }
        } catch (err) {
            console.warn(`获取歌曲 ${id} 失败`, err)
        }
    }
    return results
}
```

#### 使用场景
- **页面**: `pages/mine/mine.vue`
- **功能**: 获取用户收藏和播放历史的歌曲详情
- **处理逻辑**: 根据存储的歌曲ID批量获取完整信息

---

### 4. 音频播放 URL

#### URL格式
```
https://music.163.com/song/media/outer/url?id={songId}.mp3
```

#### 参数说明

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | Number | 是 | 歌曲ID |

#### 特点说明
- **无需认证**: 该接口是网易云提供的外链音频接口，无需登录或认证
- **无跨域问题**: 音频资源可以直接跨域访问
- **格式固定**: 统一返回 MP3 格式
- **限制说明**: 
  - VIP歌曲可能无法播放
  - 部分地区可能有访问限制
  - 外链可能定期失效

#### 使用场景
- **全局使用**: 所有需要播放音乐的地方
- **主要组件**:
  - `store/index.js` - Vuex音乐播放状态管理
  - `components/MiniPlayer.vue` - 迷你播放器
  - `pages/player/player.vue` - 播放器页面
  - `components/SongList.vue` - 歌曲列表

#### 代码示例

```javascript
// 生成播放URL
const playUrl = `https://music.163.com/song/media/outer/url?id=${songId}.mp3`

// Vuex 中的播放逻辑
playSong({ commit, state }, song) {
    // 创建音频上下文
    const audioContext = uni.createInnerAudioContext()
    audioContext.src = song.url  // 使用网易云外链URL
    audioContext.autoplay = true
    
    // 监听播放事件
    audioContext.onPlay(() => {
        commit('SET_IS_PLAYING', true)
    })
    
    audioContext.onPause(() => {
        commit('SET_IS_PLAYING', false)
    })
    
    // 监听时间更新
    audioContext.onTimeUpdate(() => {
        commit('SET_CURRENT_TIME', audioContext.currentTime)
        commit('SET_DURATION', audioContext.duration)
    })
    
    // 播放结束自动下一曲
    audioContext.onEnded(() => {
        dispatch('playNext')
    })
    
    commit('SET_CURRENT_SONG', song)
    commit('SET_AUDIO_CONTEXT', audioContext)
}
```

## 🔧 跨域问题解决方案

### H5 环境配置

在 `manifest.json` 中配置开发服务器代理：

```json
{
    "h5": {
        "devServer": {
            "proxy": {
                "/api": {
                    "target": "http://music.163.com",
                    "changeOrigin": true,
                    "secure": false,
                    "pathRewrite": {
                        "^/api": "/api"
                    }
                }
            }
        }
    }
}
```

### 条件编译处理

项目通过 UniApp 的条件编译实现不同平台的兼容：

```javascript
// H5 平台使用代理
// #ifdef H5
return '/api'
// #endif

// App、小程序等平台直接访问
// #ifndef H5
return 'http://music.163.com/api'
// #endif
```

### 生产环境部署建议

1. **Nginx 反向代理**
```nginx
location /api/ {
    proxy_pass http://music.163.com/api/;
    proxy_set_header Host music.163.com;
    proxy_set_header Referer http://music.163.com/;
}
```

2. **后端服务转发**
```javascript
// 在 Express 后端添加转发接口
app.get('/netease-api/*', async (req, res) => {
    const targetUrl = `http://music.163.com/api${req.params[0]}`
    // 转发请求并返回结果
})
```

## 📊 API 使用统计

| API 接口 | 使用位置 | 调用频率 | 重要程度 |
|---------|---------|---------|---------|
| 搜索音乐 | search.vue | 用户触发 | ⭐⭐⭐⭐⭐ |
| 获取歌词 | player.vue | 播放时加载 | ⭐⭐⭐⭐ |
| 歌曲详情 | mine.vue, api.js | 批量加载 | ⭐⭐⭐⭐ |
| 音频URL | 全局使用 | 每次播放 | ⭐⭐⭐⭐⭐ |

## ⚠️ 注意事项

### 1. API 限制
- 网易云音乐API可能存在调用频率限制
- 建议添加请求缓存机制
- 避免短时间内大量请求

### 2. 版权问题
- 部分歌曲需要VIP会员才能播放
- 使用 `fee` 字段判断歌曲权限（0: 免费, 1: VIP）
- 建议提示用户版权限制

### 3. 数据处理
- API返回的数据结构可能不一致（如 `ar` vs `artists`）
- 需要做好防空处理和兼容性处理
- 统一数据格式便于应用内使用

### 4. 错误处理
```javascript
try {
    const res = await searchMusic(keyword)
    if (res.statusCode === 200) {
        // 处理成功响应
    } else {
        // 处理错误状态码
        uni.showToast({
            title: '请求失败',
            icon: 'none'
        })
    }
} catch (error) {
    // 处理网络错误
    console.error('API错误:', error)
    uni.showToast({
        title: '网络错误',
        icon: 'none'
    })
}
```

## 🔗 相关链接

- [网易云音乐 API 非官方文档](https://binaryify.github.io/NeteaseCloudMusicApi/)
- [UniApp 官方文档](https://uniapp.dcloud.net.cn/)
- [项目 API 配置文件](../utils/api.js)
- [跨域问题说明](./跨域问题及API统一说明.md)

---

**文档维护**: iMusic 开发团队  
**最后更新**: 2025年10月16日

