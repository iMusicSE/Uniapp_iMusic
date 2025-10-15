# 浏览器运行说明

## 问题描述

当程序在UniApp内置浏览器中运行时一切正常，但在Chrome等外部浏览器中运行时会出现以下错误：

- 搜索音乐时无法获取结果
- 无法加载歌词
- 控制台出现CORS跨域错误

## 问题原因

这是由于**浏览器的同源策略（CORS - Cross-Origin Resource Sharing）**导致的：

### 1. 跨域限制
- 程序直接请求网易云音乐API：`http://music.163.com/api/...`
- Chrome浏览器会阻止这种跨域请求
- UniApp内置浏览器没有这种限制

### 2. HTTP vs HTTPS 混合内容
- 如果开发服务器运行在HTTPS环境
- 访问HTTP协议的API会被浏览器阻止

## 解决方案

### 已实施的修复

#### 1. 配置开发服务器代理
在 `manifest.json` 中添加了H5配置：

```json
"h5": {
    "devServer": {
        "port": 8080,
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
```

**说明：**
- `target`: 目标API服务器地址
- `changeOrigin`: 修改请求头中的origin，绕过跨域检查
- `secure`: 是否验证SSL证书
- `pathRewrite`: 路径重写规则

#### 2. 创建统一API配置
创建了 `utils/api.js` 文件：

```javascript
function getBaseURL() {
    // #ifdef H5
    // H5平台使用代理
    return '/api'
    // #endif
    
    // #ifndef H5
    // 其他平台直接访问
    return 'http://music.163.com/api'
    // #endif
}
```

**说明：**
- H5平台：请求会发送到 `/api`，由开发服务器代理转发
- 其他平台：直接访问网易云API

#### 3. 更新页面代码
- `pages/search/search.vue`: 使用 `searchMusic()` 方法
- `pages/player/player.vue`: 使用 `getLyrics()` 方法

## 使用方法

### 1. 开发环境运行

```bash
# 启动H5开发服务器
npm run dev:h5
```

然后在Chrome浏览器中访问：
```
http://localhost:8080
```

### 2. 生产环境部署

**重要提示：** 代理配置只在开发环境有效！

生产环境需要：

#### 方案1：使用Nginx反向代理
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location /api {
        proxy_pass http://music.163.com/api;
        proxy_set_header Host music.163.com;
        proxy_set_header Referer http://music.163.com/;
    }
    
    location / {
        root /path/to/your/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

#### 方案2：使用后端服务转发
创建一个后端服务（Node.js/Python/Java等）作为中间层：

```javascript
// Node.js + Express 示例
const express = require('express');
const axios = require('axios');
const app = express();

app.get('/api/*', async (req, res) => {
    const apiUrl = `http://music.163.com${req.path}${req.url.slice(req.path.length)}`;
    try {
        const response = await axios.get(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0...',
                'Referer': 'http://music.163.com/'
            }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

#### 方案3：使用第三方API（推荐）
使用已经支持CORS的第三方音乐API服务，如：
- NeteaseCloudMusicApi (https://github.com/Binaryify/NeteaseCloudMusicApi)
- 自建API服务器

## 验证修复

### 1. 检查控制台
打开Chrome开发者工具（F12），查看：
- Network标签：请求是否成功
- Console标签：是否还有CORS错误

### 2. 测试功能
- ✅ 搜索音乐
- ✅ 播放音乐
- ✅ 显示歌词

### 3. 查看请求URL
在Network标签中，请求应该是：
- ✅ 开发环境：`http://localhost:8080/api/search/get/web`
- ❌ 错误示例：`http://music.163.com/api/search/get/web` (会被CORS阻止)

## 其他平台运行

### 小程序
无需特殊配置，直接运行：
```bash
npm run dev:mp-weixin
```

### App
无需特殊配置，直接运行：
```bash
npm run dev:app
```

## 常见问题

### Q1: 开发服务器启动后仍然报CORS错误？
**A:** 确保：
1. 重启开发服务器
2. 清除浏览器缓存
3. 检查manifest.json配置是否正确

### Q2: 生产环境部署后无法使用？
**A:** 必须配置Nginx代理或使用后端服务转发，开发代理配置在生产环境无效。

### Q3: 能否完全避免代理？
**A:** 可以使用已支持CORS的第三方API，或自建支持CORS的API服务器。

## 技术原理

### CORS工作流程
```
1. 浏览器发起请求 → 检查同源策略
2. 不同源 → 发送预检请求(OPTIONS)
3. 服务器返回CORS头 → 允许/拒绝
4. 浏览器根据响应决定是否发送实际请求
```

### 代理原理
```
浏览器 → 本地代理服务器 → 目标API服务器
         (同源，允许)      (服务器间，无限制)
```

## 更新日志

**2025-10-15 v2**
- ✅ 修复 `pages/discover/discover.vue` 中的 request 调用
- ✅ 修复 `pages/index/index.vue` 中的 request 调用
- ✅ 统一所有页面使用 `utils/api.js` 的 API 方法
- ✅ 解决 "加载新歌失败: {errMsg: "request:fail"}" 错误

**2025-10-15 v1**
- ✅ 添加H5开发服务器代理配置
- ✅ 创建统一API配置文件
- ✅ 更新搜索和播放器页面
- ✅ 添加平台条件编译支持

## 参考资料

- [UniApp H5配置文档](https://uniapp.dcloud.net.cn/collocation/manifest.html#h5)
- [CORS 跨域资源共享](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CORS)
- [Vite 代理配置](https://cn.vitejs.dev/config/server-options.html#server-proxy)

