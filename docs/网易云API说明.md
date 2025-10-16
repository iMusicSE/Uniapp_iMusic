# 网易云 API 说明

## 项目中使用的 API

本文档记录了 iMusic 项目中实际使用的网易云音乐 API，**已根据真实 API 测试返回结果更新**。

> **更新说明**：本文档已根据 `API真实测试返回结果` 目录下的实际测试数据进行更新，确保所有接口说明、参数、返回字段均与真实 API 保持一致。

## API 概览

| API | 接口地址 | 说明 |
|-----|---------|------|
| 搜索音乐 | `/api/search/get/web` | 根据关键词搜索歌曲 |
| 获取歌词 | `/api/song/lyric` | 获取歌曲的歌词信息 |
| 获取歌曲详情 | `/api/song/detail` | 获取歌曲的详细信息（含音质） |
| 获取播放地址 | `/song/media/outer/url` | 构造歌曲播放链接 |

---

## 1. 搜索音乐

**接口地址**
```
GET http://music.163.com/api/search/get/web
```

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| s | string | 是 | 搜索关键词 |
| type | number | 是 | 搜索类型，1: 单曲 |
| limit | number | 否 | 返回数量，默认 10 |

**测试链接示例**
```
http://music.163.com/api/search/get/web?s=晴天&type=1&limit=10
```

**返回示例**
```json
{
  "result": {
    "songs": [
      {
        "id": 2652820720,
        "name": "晴天(深情版)",
        "artists": [
          {
            "id": 96154669,
            "name": "Lucky小爱",
            "img1v1Url": "http://p2.music.126.net/...",
            "alias": [],
            "albumSize": 0,
            "picId": 0
          }
        ],
        "album": {
          "id": 255723258,
          "name": "晴天(深情版)",
          "publishTime": 1733068800000,
          "size": 1,
          "picId": 109951170218252280,
          "copyrightId": 1416729,
          "status": 1,
          "mark": 0
        },
        "duration": 278961,
        "fee": 1,
        "mvid": 0,
        "copyrightId": 1416729,
        "alias": [],
        "status": 0,
        "mark": 17179877376
      }
    ],
    "songCount": 300
  },
  "code": 200
}
```

**返回字段说明**
- `id`: 歌曲 ID
- `name`: 歌曲名称
- `artists`: 艺术家数组
- `album`: 专辑信息
  - `publishTime`: 发布时间（时间戳）
  - `picId`: 封面图片 ID 注：暂时不清楚如何解析为URL，因此暂无法使用
- `duration`: 歌曲时长（毫秒）
- `fee`: 费用类型（0: 免费, 1: VIP, 8: 付费）
- `mvid`: MV ID（0 表示无 MV）
- `status`: 歌曲状态
- `songCount`: 搜索结果总数

---

## 2. 获取歌词

**接口地址**
```
GET http://music.163.com/api/song/lyric
```

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | number | 是 | 歌曲 ID |
| lv | number | 否 | 歌词版本，-1 表示获取所有版本 |
| kv | number | 否 | 是否包含逐字歌词，-1 表示包含 |
| tv | number | 否 | 是否包含翻译歌词，-1 表示包含 |

**测试链接示例**
```
http://music.163.com/api/song/lyric?id=25706282&lv=-1&kv=-1&tv=-1
```

**返回示例**
```json
{
  "sgc": false,
  "sfy": false,
  "qfy": false,
  "lrc": {
    "version": 156,
    "lyric": "[00:00.000] 作词 : 毛川/李赤\n[00:01.000] 作曲 : 毛川\n[00:17.680]夜空中最亮的星 能否听清\n..."
  },
  "klyric": {
    "version": 0,
    "lyric": ""
  },
  "tlyric": {
    "version": 0,
    "lyric": ""
  },
  "code": 200
}
```

**返回字段说明**
- `sgc`: 是否有伴唱歌词
- `sfy`: 是否有繁体歌词
- `qfy`: 是否有其他语言歌词
- `lrc`: 原始歌词对象
  - `version`: 歌词版本号
  - `lyric`: 歌词内容（LRC 格式）
- `klyric`: 逐字歌词对象（卡拉OK歌词）
- `tlyric`: 翻译歌词对象

**歌词格式说明**
- 格式：`[mm:ss.xxx]歌词文本`
- 时间标签可以有多个（一行多个时间戳）
- 歌词包含作词作曲等元信息

---

## 3. 获取歌曲详情

**接口地址**
```
GET http://music.163.com/api/song/detail
```

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| ids | string | 是 | 歌曲 ID，格式：`[id1,id2,...]` |

**测试链接示例**
```
http://music.163.com/api/song/detail?ids=[25706282]
```

**返回示例**
```json
{
  "songs": [
    {
      "id": 25706282,
      "name": "夜空中最亮的星",
      "artists": [
        {
          "id": 12977,
          "name": "逃跑计划",
          "picUrl": "http://p2.music.126.net/...",
          "img1v1Url": "http://p2.music.126.net/...",
          "alias": [],
          "albumSize": 0,
          "musicSize": 0
        }
      ],
      "album": {
        "id": 2285010,
        "name": "世界",
        "type": "专辑",
        "size": 10,
        "picId": 109951168111472442,
        "picUrl": "http://p2.music.126.net/625-tE8OzdM-rWO37PgqlQ==/109951168111472442.jpg",
        "publishTime": 1325347200000,
        "company": "北京意视互动广告有限公司",
        "copyrightId": 22036,
        "status": 1,
        "subType": "录音室版"
      },
      "duration": 252235,
      "popularity": 100.0,
      "score": 100,
      "fee": 1,
      "mvid": 382555,
      "hMusic": {
        "id": 7238161402,
        "size": 10091668,
        "extension": "mp3",
        "bitrate": 320000,
        "sr": 44100,
        "playTime": 252235,
        "volumeDelta": -42621.0
      },
      "mMusic": {
        "id": 7238161404,
        "size": 6055018,
        "extension": "mp3",
        "bitrate": 192000,
        "playTime": 252235
      },
      "lMusic": {
        "id": 7238161399,
        "size": 4036693,
        "extension": "mp3",
        "bitrate": 128000,
        "playTime": 252235
      },
      "sqMusic": {
        "id": 8175359607,
        "size": 32271488,
        "extension": "flac",
        "bitrate": 1023533,
        "sr": 44100,
        "playTime": 252235
      }
    }
  ],
  "code": 200
}
```

**返回字段说明**
- `id`: 歌曲 ID
- `name`: 歌曲名称
- `artists`: 艺术家信息数组
- `album`: 专辑详细信息
  - `type`: 专辑类型（专辑/EP/单曲等）
  - `publishTime`: 发布时间（时间戳）
  - `company`: 发行公司
  - `subType`: 专辑子类型
- `duration`: 歌曲时长（毫秒）
- `popularity`: 流行度
- `fee`: 费用类型
- `mvid`: MV ID（0 表示无 MV）
- **音质信息**：
  - `sqMusic`: 无损品质（FLAC）
  - `hMusic`: 高品质（320kbps MP3）
  - `mMusic`: 中品质（192kbps MP3）
  - `lMusic`: 低品质（128kbps MP3）
  - `bMusic`: 基础品质

---

## 4. 获取歌曲播放地址

**接口地址**
```
https://music.163.com/song/media/outer/url?id={songId}.mp3
```

**说明**
- 直接使用歌曲 ID 构造播放 URL
- 适用于非 VIP 歌曲
- 使用 HTTPS 协议

**测试链接示例**
```
https://music.163.com/song/media/outer/url?id=25706282.mp3
```

**使用示例**
```javascript
// 构造播放 URL
const songId = 25706282;
const playUrl = `https://music.163.com/song/media/outer/url?id=${songId}.mp3`;

// 在 audio 标签中使用
<audio :src="playUrl" controls></audio>
```

**注意事项**
- 此方法仅适用于非 VIP 和非付费歌曲（fee=0 或部分 fee=1）
- VIP 歌曲（fee=8）和部分付费歌曲可能无法播放
- 建议配合歌曲详情接口的 `fee` 字段判断是否可播放

**获取专辑封面图片**

**方式1：从歌曲详情API获取（推荐）**
- 歌曲详情接口返回的 `album.picUrl` 是完整可用的图片URL
- 示例：`http://p2.music.126.net/625-tE8OzdM-rWO37PgqlQ==/109951168111472442.jpg`

**方式2：从搜索API的picId转换（不推荐）**
- 搜索接口只返回 `album.picId`（数字ID）
- picId无法直接转换为完整URL，因为缺少hash签名部分
- 建议使用歌曲详情API获取完整URL

## 跨域处理

### H5 平台
在 H5 平台使用代理避免跨域：
```javascript
// 开发环境配置（vite.config.js）
proxy: {
  '/api': {
    target: 'http://music.163.com/api',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, '')
  }
}
```

### 其他平台
App 和小程序平台可直接访问 `http://music.163.com/api`

---

## 请求头配置

建议添加以下请求头以提高兼容性：
```javascript
{
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Referer': 'http://music.163.com/'
}
```

---

## 注意事项

1. **版权限制**：部分歌曲可能因版权原因无法播放或获取详情
2. **请求频率**：避免短时间内大量请求，建议添加防抖和节流
3. **错误处理**：API 返回 code !== 200 时需要适当的错误处理
4. **接口稳定性**：网易云非官方 API，可能存在调整或失效的风险

