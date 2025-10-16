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

// 获取歌曲详情
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

// 批量获取歌曲详情
export async function getBatchSongDetails(songIds) {
	if (!songIds || songIds.length === 0) return []
	
	const results = []
	for (const id of songIds) {
		try {
			const res = await getSongDetail(id)
			
			if (res.statusCode === 200 && res.data?.songs?.length > 0) {
				const song = res.data.songs[0]
				
				// 防空处理 artistName、albumName、albumPic
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

export default {
	searchMusic,
	getLyrics,
	getSongDetail,
	getBatchSongDetails,
	getBaseURL
}

