// API配置文件 - 处理跨域问题

// 获取基础URL
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

// 获取通用请求头
function getHeaders() {
	return {
		'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
		'Referer': 'http://music.163.com/'
	}
}

// 搜索音乐
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

// 获取歌词
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

export default {
	searchMusic,
	getLyrics,
	getBaseURL
}

