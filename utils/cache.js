/**
 * 缓存工具类
 * 提供带过期时间的 localStorage 缓存功能
 */

// 缓存配置
const CACHE_CONFIG = {
	// 歌曲详情缓存：7天
	SONG_DETAIL: {
		prefix: 'song_detail_',
		expire: 7 * 24 * 60 * 60 * 1000 // 7天（毫秒）
	},
	// 搜索结果缓存：30分钟
	SEARCH_RESULT: {
		prefix: 'search_result_',
		expire: 30 * 60 * 1000 // 30分钟
	},
	// 排行榜缓存：1小时
	RANK_LIST: {
		prefix: 'rank_list_',
		expire: 60 * 60 * 1000 // 1小时
	},
	// 歌单详情缓存：3天
	PLAYLIST_DETAIL: {
		prefix: 'playlist_detail_',
		expire: 3 * 24 * 60 * 60 * 1000 // 3天（毫秒）
	}
}

class CacheManager {
	/**
	 * 设置缓存
	 * @param {string} key - 缓存键
	 * @param {any} value - 缓存值
	 * @param {number} expire - 过期时间（毫秒），默认7天
	 */
	static set(key, value, expire = 7 * 24 * 60 * 60 * 1000) {
		try {
			const cacheData = {
				value: value,
				expire: expire,
				createTime: Date.now()
			}
			uni.setStorageSync(key, JSON.stringify(cacheData))
			return true
		} catch (error) {
			console.error('设置缓存失败:', error)
			return false
		}
	}
	
	/**
	 * 获取缓存
	 * @param {string} key - 缓存键
	 * @returns {any|null} 缓存值，如果过期或不存在则返回 null
	 */
	static get(key) {
		try {
			const cacheStr = uni.getStorageSync(key)
			if (!cacheStr) {
				return null
			}
			
			const cacheData = JSON.parse(cacheStr)
			const now = Date.now()
			
			// 检查是否过期
			if (cacheData.expire > 0 && (now - cacheData.createTime) > cacheData.expire) {
				// 过期，删除缓存
				this.remove(key)
				return null
			}
			
			return cacheData.value
		} catch (error) {
			console.error('获取缓存失败:', error)
			return null
		}
	}
	
	/**
	 * 删除缓存
	 * @param {string} key - 缓存键
	 */
	static remove(key) {
		try {
			uni.removeStorageSync(key)
			return true
		} catch (error) {
			console.error('删除缓存失败:', error)
			return false
		}
	}
	
	/**
	 * 清空指定前缀的所有缓存
	 * @param {string} prefix - 缓存键前缀
	 */
	static clearByPrefix(prefix) {
		try {
			const storageInfo = uni.getStorageInfoSync()
			const keys = storageInfo.keys || []
			
			keys.forEach(key => {
				if (key.startsWith(prefix)) {
					uni.removeStorageSync(key)
				}
			})
			return true
		} catch (error) {
			console.error('清空缓存失败:', error)
			return false
		}
	}
	
	/**
	 * 清空所有过期缓存
	 */
	static clearExpired() {
		try {
			const storageInfo = uni.getStorageInfoSync()
			const keys = storageInfo.keys || []
			const now = Date.now()
			let clearedCount = 0
			
			keys.forEach(key => {
				try {
					const cacheStr = uni.getStorageSync(key)
					if (!cacheStr) return
					
					const cacheData = JSON.parse(cacheStr)
					// 如果数据结构包含 expire 和 createTime，则检查是否过期
					if (cacheData.expire && cacheData.createTime) {
						if ((now - cacheData.createTime) > cacheData.expire) {
							uni.removeStorageSync(key)
							clearedCount++
						}
					}
				} catch (e) {
					// 忽略解析错误，可能不是缓存数据
				}
			})
			
			console.log(`清理了 ${clearedCount} 个过期缓存`)
			return clearedCount
		} catch (error) {
			console.error('清理过期缓存失败:', error)
			return 0
		}
	}
	
	/**
	 * 获取缓存信息
	 */
	static getInfo() {
		try {
			const storageInfo = uni.getStorageInfoSync()
			const keys = storageInfo.keys || []
			const now = Date.now()
			
			let songDetailCount = 0
			let searchResultCount = 0
			let rankListCount = 0
			let playlistDetailCount = 0
			let otherCount = 0
			
			keys.forEach(key => {
				if (key.startsWith(CACHE_CONFIG.SONG_DETAIL.prefix)) {
					songDetailCount++
				} else if (key.startsWith(CACHE_CONFIG.SEARCH_RESULT.prefix)) {
					searchResultCount++
				} else if (key.startsWith(CACHE_CONFIG.RANK_LIST.prefix)) {
					rankListCount++
				} else if (key.startsWith(CACHE_CONFIG.PLAYLIST_DETAIL.prefix)) {
					playlistDetailCount++
				} else {
					otherCount++
				}
			})
			
			return {
				totalKeys: keys.length,
				currentSize: storageInfo.currentSize,
				limitSize: storageInfo.limitSize,
				songDetailCount,
				searchResultCount,
				rankListCount,
				playlistDetailCount,
				otherCount
			}
		} catch (error) {
			console.error('获取缓存信息失败:', error)
			return null
		}
	}
}

/**
 * 歌曲详情缓存
 */
export const SongDetailCache = {
	/**
	 * 保存歌曲详情
	 * @param {number|string} songId - 歌曲ID
	 * @param {object} songDetail - 歌曲详情
	 */
	set(songId, songDetail) {
		const key = CACHE_CONFIG.SONG_DETAIL.prefix + songId
		return CacheManager.set(key, songDetail, CACHE_CONFIG.SONG_DETAIL.expire)
	},
	
	/**
	 * 获取歌曲详情
	 * @param {number|string} songId - 歌曲ID
	 * @returns {object|null} 歌曲详情
	 */
	get(songId) {
		const key = CACHE_CONFIG.SONG_DETAIL.prefix + songId
		return CacheManager.get(key)
	},
	
	/**
	 * 删除歌曲详情
	 * @param {number|string} songId - 歌曲ID
	 */
	remove(songId) {
		const key = CACHE_CONFIG.SONG_DETAIL.prefix + songId
		return CacheManager.remove(key)
	},
	
	/**
	 * 清空所有歌曲详情缓存
	 */
	clear() {
		return CacheManager.clearByPrefix(CACHE_CONFIG.SONG_DETAIL.prefix)
	}
}

/**
 * 搜索结果缓存
 */
export const SearchResultCache = {
	/**
	 * 保存搜索结果
	 * @param {string} keyword - 搜索关键词
	 * @param {array} result - 搜索结果
	 */
	set(keyword, result) {
		const key = CACHE_CONFIG.SEARCH_RESULT.prefix + keyword
		return CacheManager.set(key, result, CACHE_CONFIG.SEARCH_RESULT.expire)
	},
	
	/**
	 * 获取搜索结果
	 * @param {string} keyword - 搜索关键词
	 * @returns {array|null} 搜索结果
	 */
	get(keyword) {
		const key = CACHE_CONFIG.SEARCH_RESULT.prefix + keyword
		return CacheManager.get(key)
	},
	
	/**
	 * 删除搜索结果
	 * @param {string} keyword - 搜索关键词
	 */
	remove(keyword) {
		const key = CACHE_CONFIG.SEARCH_RESULT.prefix + keyword
		return CacheManager.remove(key)
	},
	
	/**
	 * 清空所有搜索结果缓存
	 */
	clear() {
		return CacheManager.clearByPrefix(CACHE_CONFIG.SEARCH_RESULT.prefix)
	}
}

/**
 * 排行榜缓存
 */
export const RankListCache = {
	/**
	 * 保存排行榜数据
	 * @param {string} rankId - 排行榜ID
	 * @param {array} data - 排行榜数据
	 */
	set(rankId, data) {
		const key = CACHE_CONFIG.RANK_LIST.prefix + rankId
		return CacheManager.set(key, data, CACHE_CONFIG.RANK_LIST.expire)
	},
	
	/**
	 * 获取排行榜数据
	 * @param {string} rankId - 排行榜ID
	 * @returns {array|null} 排行榜数据
	 */
	get(rankId) {
		const key = CACHE_CONFIG.RANK_LIST.prefix + rankId
		return CacheManager.get(key)
	},
	
	/**
	 * 删除排行榜数据
	 * @param {string} rankId - 排行榜ID
	 */
	remove(rankId) {
		const key = CACHE_CONFIG.RANK_LIST.prefix + rankId
		return CacheManager.remove(key)
	},
	
	/**
	 * 清空所有排行榜缓存
	 */
	clear() {
		return CacheManager.clearByPrefix(CACHE_CONFIG.RANK_LIST.prefix)
	}
}

/**
 * 歌单详情缓存
 */
export const PlaylistDetailCache = {
	/**
	 * 保存歌单详情
	 * @param {number|string} playlistId - 歌单ID
	 * @param {object} playlistDetail - 歌单详情
	 */
	set(playlistId, playlistDetail) {
		const key = CACHE_CONFIG.PLAYLIST_DETAIL.prefix + playlistId
		return CacheManager.set(key, playlistDetail, CACHE_CONFIG.PLAYLIST_DETAIL.expire)
	},
	
	/**
	 * 获取歌单详情
	 * @param {number|string} playlistId - 歌单ID
	 * @returns {object|null} 歌单详情
	 */
	get(playlistId) {
		const key = CACHE_CONFIG.PLAYLIST_DETAIL.prefix + playlistId
		return CacheManager.get(key)
	},
	
	/**
	 * 删除歌单详情
	 * @param {number|string} playlistId - 歌单ID
	 */
	remove(playlistId) {
		const key = CACHE_CONFIG.PLAYLIST_DETAIL.prefix + playlistId
		return CacheManager.remove(key)
	},
	
	/**
	 * 清空所有歌单详情缓存
	 */
	clear() {
		return CacheManager.clearByPrefix(CACHE_CONFIG.PLAYLIST_DETAIL.prefix)
	}
}

/**
 * 新歌推荐缓存
 */
export const NewSongsCache = {
	/**
	 * 保存新歌推荐列表
	 * @param {array} songs - 新歌列表
	 */
	set(songs) {
		const key = 'new_songs_recommend'
		// 新歌推荐缓存1小时
		return CacheManager.set(key, songs, 60 * 60 * 1000)
	},
	
	/**
	 * 获取新歌推荐列表
	 * @returns {array|null} 新歌列表
	 */
	get() {
		const key = 'new_songs_recommend'
		return CacheManager.get(key)
	},
	
	/**
	 * 删除新歌推荐缓存
	 */
	remove() {
		const key = 'new_songs_recommend'
		return CacheManager.remove(key)
	}
}

// 导出缓存管理器
export { CacheManager, CACHE_CONFIG }

// 导出默认对象
export default {
	CacheManager,
	SongDetailCache,
	SearchResultCache,
	RankListCache,
	PlaylistDetailCache,
	NewSongsCache,
	CACHE_CONFIG
}

