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

// 获取歌单详情
export function getPlaylistDetail(playlistId) {
	return uni.request({
		url: `${getBaseURL()}/playlist/detail`,
		method: 'GET',
		data: {
			id: playlistId
		},
		header: getHeaders()
	})
}

// 批量获取歌单详情
export async function getBatchPlaylistDetails(playlistIds) {
	if (!playlistIds || playlistIds.length === 0) return []
	
	try {
		const requests = playlistIds.map(id => getPlaylistDetail(id))
		const responses = await Promise.all(requests)
		
		const playlists = []
		responses.forEach(res => {
			if (res.statusCode === 200 && res.data?.result) {
				const playlist = res.data.result
				playlists.push({
					id: playlist.id,
					name: playlist.name,
					cover: playlist.coverImgUrl || '/static/logo.png',
					playCount: playlist.playCount || 0,
					description: playlist.description || '',
					tracks: playlist.tracks || []
				})
			}
		})
		
		return playlists
	} catch (error) {
		console.error('批量获取歌单失败:', error)
		return []
	}
}

// 批量获取歌曲详情（优化版：并行请求 + 重试机制）
export async function getBatchSongDetails(songIds, onProgress) {
	if (!songIds || songIds.length === 0) return { songs: [], failed: [] }
	
	const BATCH_SIZE = 10 // 每批并行请求10个，避免API限流
	const MAX_RETRIES = 2 // 最多重试2次
	const TIMEOUT = 5000 // 5秒超时
	
	// 单个歌曲请求（带重试）
	const fetchWithRetry = async (id, retries = MAX_RETRIES) => {
		try {
			const res = await Promise.race([
				getSongDetail(id),
				new Promise((_, reject) => 
					setTimeout(() => reject(new Error('请求超时')), TIMEOUT)
				)
			])
			
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
				
				return {
					success: true,
					data: {
						id: Number(song.id),
						name: song.name,
						artistName,
						albumName,
						albumPic,
						url: `https://music.163.com/song/media/outer/url?id=${song.id}.mp3`
					}
				}
			}
			return { success: false, id }
		} catch (err) {
			if (retries > 0) {
				console.warn(`歌曲 ${id} 请求失败，剩余重试次数: ${retries}`, err.message)
				await new Promise(resolve => setTimeout(resolve, 500)) // 等待500ms后重试
				return fetchWithRetry(id, retries - 1)
			}
			console.error(`歌曲 ${id} 最终获取失败:`, err.message)
			return { success: false, id }
		}
	}
	
	const results = []
	const failedIds = []
	let processedCount = 0
	
	// 分批并行请求
	for (let i = 0; i < songIds.length; i += BATCH_SIZE) {
		const batch = songIds.slice(i, i + BATCH_SIZE)
		const batchResults = await Promise.all(batch.map(id => fetchWithRetry(id)))
		
		batchResults.forEach(result => {
			if (result.success) {
				results.push(result.data)
			} else {
				failedIds.push(result.id)
			}
		})
		
		processedCount += batch.length
		
		// 回调进度（如果提供了回调函数）
		if (onProgress && typeof onProgress === 'function') {
			onProgress({
				processed: processedCount,
				total: songIds.length,
				success: results.length,
				failed: failedIds.length
			})
		}
	}
	
	return {
		songs: results,
		failed: failedIds,
		total: songIds.length,
		successCount: results.length,
		failedCount: failedIds.length
	}
}

export default {
	searchMusic,
	getLyrics,
	getSongDetail,
	getBatchSongDetails,
	getPlaylistDetail,
	getBatchPlaylistDetails,
	getBaseURL
}

