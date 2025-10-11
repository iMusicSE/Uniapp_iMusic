// 全局状态管理 - 音乐播放器状态
// #ifndef VUE3
import Vue from 'vue'
import Vuex from 'vuex'
Vue.use(Vuex)
// #endif

// #ifdef VUE3
import { createStore } from 'vuex'
// #endif

// #ifndef VUE3
const store = new Vuex.Store({
// #endif

// #ifdef VUE3
const store = createStore({
// #endif
	state: {
		// 音频上下文
		audioContext: null,
		// 当前播放歌曲
		currentSong: null,
		// 播放状态
		isPlaying: false,
		// 播放列表
		playlist: [],
		// 当前播放索引
		currentIndex: 0,
		// 播放模式: 0-列表循环 1-单曲循环 2-随机播放
		playMode: 0,
		// 播放时间
		currentTime: 0,
		duration: 0,
		// 收藏列表
		favorites: [],
		// 播放历史
		history: []
	},
	
	getters: {
		// 获取当前歌曲
		getCurrentSong: state => state.currentSong,
		// 获取播放状态
		getPlayState: state => state.isPlaying,
		// 获取播放列表
		getPlaylist: state => state.playlist,
		// 获取收藏列表
		getFavorites: state => state.favorites,
		// 获取播放历史
		getHistory: state => state.history,
		// 检查是否已收藏
		isFavorite: state => songId => {
			return state.favorites.some(song => song.id === songId)
		}
	},
	
	mutations: {
		// 设置音频上下文
		SET_AUDIO_CONTEXT(state, context) {
			state.audioContext = context
		},
		
		// 设置当前歌曲
		SET_CURRENT_SONG(state, song) {
			state.currentSong = song
		},
		
		// 设置播放状态
		SET_PLAY_STATE(state, isPlaying) {
			state.isPlaying = isPlaying
		},
		
		// 设置播放列表
		SET_PLAYLIST(state, playlist) {
			state.playlist = playlist
		},
		
		// 设置当前播放索引
		SET_CURRENT_INDEX(state, index) {
			state.currentIndex = index
		},
		
		// 设置播放模式
		SET_PLAY_MODE(state, mode) {
			state.playMode = mode
		},
		
		// 设置播放时间
		SET_CURRENT_TIME(state, time) {
			state.currentTime = time
		},
		
		// 设置总时长
		SET_DURATION(state, duration) {
			state.duration = duration
		},
		
		// 添加到收藏
		ADD_FAVORITE(state, song) {
			if (!state.favorites.some(item => item.id === song.id)) {
				state.favorites.unshift(song)
				// 保存到本地存储
				uni.setStorageSync('favorites', state.favorites)
			}
		},
		
		// 从收藏移除
		REMOVE_FAVORITE(state, songId) {
			state.favorites = state.favorites.filter(song => song.id !== songId)
			uni.setStorageSync('favorites', state.favorites)
		},
		
		// 添加到历史记录
		ADD_HISTORY(state, song) {
			// 移除已存在的记录
			state.history = state.history.filter(item => item.id !== song.id)
			// 添加到开头
			state.history.unshift(song)
			// 限制历史记录数量
			if (state.history.length > 100) {
				state.history = state.history.slice(0, 100)
			}
			// 保存到本地存储
			uni.setStorageSync('history', state.history)
		},
		
		// 清空历史记录
		CLEAR_HISTORY(state) {
			state.history = []
			uni.removeStorageSync('history')
		},
		
		// 从本地存储加载数据
		LOAD_LOCAL_DATA(state) {
			const favorites = uni.getStorageSync('favorites')
			const history = uni.getStorageSync('history')
			if (favorites) {
				state.favorites = favorites
			}
			if (history) {
				state.history = history
			}
		},
		
		// 设置收藏列表（用于清空）
		SET_FAVORITES(state, favorites) {
			state.favorites = favorites
		}
	},
	
	actions: {
		// 初始化音频上下文
		initAudioContext({ commit, state }) {
			if (!state.audioContext) {
				const audioContext = uni.createInnerAudioContext()
				commit('SET_AUDIO_CONTEXT', audioContext)
			}
		},
		
		// 播放歌曲
		playSong({ commit, state }, { song, playlist }) {
			// 设置当前歌曲
			commit('SET_CURRENT_SONG', song)
			
			// 如果提供了播放列表，更新播放列表
			if (playlist && playlist.length > 0) {
				commit('SET_PLAYLIST', playlist)
				const index = playlist.findIndex(item => item.id === song.id)
				commit('SET_CURRENT_INDEX', index >= 0 ? index : 0)
			}
			
			// 添加到历史记录
			commit('ADD_HISTORY', song)
			
			// 播放音乐
			if (state.audioContext) {
				state.audioContext.src = song.url
				state.audioContext.play()
				commit('SET_PLAY_STATE', true)
			}
		},
		
		// 暂停/继续
		togglePlay({ commit, state }) {
			if (state.audioContext) {
				if (state.isPlaying) {
					state.audioContext.pause()
					commit('SET_PLAY_STATE', false)
				} else {
					state.audioContext.play()
					commit('SET_PLAY_STATE', true)
				}
			}
		},
		
		// 上一首
		playPrevious({ commit, state, dispatch }) {
			if (state.playlist.length === 0) return
			
			let newIndex = state.currentIndex - 1
			if (newIndex < 0) {
				newIndex = state.playlist.length - 1
			}
			
			commit('SET_CURRENT_INDEX', newIndex)
			const song = state.playlist[newIndex]
			dispatch('playSong', { song })
		},
		
		// 下一首
		playNext({ commit, state, dispatch }) {
			if (state.playlist.length === 0) return
			
			let newIndex
			
			// 根据播放模式决定下一首
			if (state.playMode === 2) {
				// 随机播放
				newIndex = Math.floor(Math.random() * state.playlist.length)
			} else {
				// 列表循环或单曲循环
				newIndex = state.currentIndex + 1
				if (newIndex >= state.playlist.length) {
					newIndex = 0
				}
			}
			
			commit('SET_CURRENT_INDEX', newIndex)
			const song = state.playlist[newIndex]
			dispatch('playSong', { song })
		},
		
		// 切换播放模式
		togglePlayMode({ commit, state }) {
			const newMode = (state.playMode + 1) % 3
			commit('SET_PLAY_MODE', newMode)
			
			const modeText = ['列表循环', '单曲循环', '随机播放']
			uni.showToast({
				title: modeText[newMode],
				icon: 'none',
				duration: 1500
			})
		},
		
		// 切换收藏状态
		toggleFavorite({ commit, state, getters }, song) {
			if (getters.isFavorite(song.id)) {
				commit('REMOVE_FAVORITE', song.id)
				uni.showToast({
					title: '已取消收藏',
					icon: 'none'
				})
			} else {
				commit('ADD_FAVORITE', song)
				uni.showToast({
					title: '已添加到收藏',
					icon: 'success'
				})
			}
		},
		
		// 加载本地数据
		loadLocalData({ commit }) {
			commit('LOAD_LOCAL_DATA')
		}
	}
})

export default store

