// 播放器状态模块
import { getSongDetail } from '@/utils/api.js'

const state = {
	audioContext: null,
	currentSong: null,
	isPlaying: false,
	playlist: [],
	currentIndex: 0,
	playMode: 0, // 0: 列表循环, 1: 单曲循环, 2: 随机播放
	currentTime: 0,
	duration: 0
}

const getters = {
	getCurrentSong: state => state.currentSong,
	getPlayState: state => state.isPlaying,
	getPlaylist: state => state.playlist
}

const mutations = {
	SET_AUDIO_CONTEXT(state, context) {
		state.audioContext = context
	},
	SET_CURRENT_SONG(state, song) {
		state.currentSong = song
	},
	SET_PLAY_STATE(state, isPlaying) {
		state.isPlaying = isPlaying
	},
	SET_PLAYLIST(state, playlist) {
		state.playlist = playlist
	},
	SET_CURRENT_INDEX(state, index) {
		state.currentIndex = index
	},
	SET_PLAY_MODE(state, mode) {
		state.playMode = mode
	},
	SET_CURRENT_TIME(state, time) {
		state.currentTime = time
	},
	SET_DURATION(state, duration) {
		state.duration = duration
	},
	REMOVE_FROM_PLAYLIST(state, index) {
		state.playlist.splice(index, 1)
		if (index < state.currentIndex) {
			state.currentIndex--
		} else if (index === state.currentIndex) {
			if (state.currentIndex >= state.playlist.length) {
				state.currentIndex = state.playlist.length - 1
			}
		}
	},
	CLEAR_PLAYLIST(state) {
		state.playlist = []
		state.currentIndex = 0
	},
	ADD_TO_PLAYLIST(state, song) {
		const exists = state.playlist.some(item => item.id === song.id)
		if (!exists) {
			state.playlist.push(song)
		}
	},
	INSERT_TO_PLAYLIST(state, song) {
		const existIndex = state.playlist.findIndex(item => item.id === song.id)
		if (existIndex >= 0) {
			state.playlist.splice(existIndex, 1)
			if (existIndex <= state.currentIndex) {
				state.currentIndex--
			}
		}
		const insertIndex = state.currentIndex + 1
		state.playlist.splice(insertIndex, 0, song)
	}
}

const actions = {
	initAudioContext({ commit, state }) {
		if (!state.audioContext) {
			const audioContext = uni.createInnerAudioContext()
			commit('SET_AUDIO_CONTEXT', audioContext)
		}
	},

	async playSong({ commit, state, dispatch, rootState }, { song, playlist }) {
		console.log('▶️  [DEBUG-前端] playSong 被调用')
		console.log('  ├─ song:', song)
		console.log('  ├─ song.id:', song?.id)
		console.log('  └─ 当前 userId:', rootState.user.userId)
		
		let enrichedSong = song
		
		// 如果歌曲封面不完整，先获取详细信息
		if (!song.albumPic || song.albumPic === '/static/logo.png') {
			try {
				const res = await getSongDetail(song.id)
				
				if (res.statusCode === 200 && res.data?.songs?.length > 0) {
					const detailSong = res.data.songs[0]
					
					enrichedSong = {
						...song,
						id: Number(detailSong.id),
						name: detailSong.name,
						artistName: (detailSong.ar && detailSong.ar.length > 0)
							? detailSong.ar.map(a => a.name).join(', ')
							: (detailSong.artists && detailSong.artists.length > 0)
								? detailSong.artists.map(a => a.name).join(', ')
								: song.artistName || '未知歌手',
						albumName: detailSong.al?.name || detailSong.album?.name || song.albumName || '未知专辑',
						albumPic: detailSong.al?.picUrl || detailSong.album?.picUrl || song.albumPic || '/static/logo.png',
						url: song.url || `https://music.163.com/song/media/outer/url?id=${detailSong.id}.mp3`
					}
					
					// 更新播放列表中的歌曲信息
					if (playlist && playlist.length > 0) {
						const index = playlist.findIndex(item => item.id === song.id)
						if (index >= 0) {
							playlist[index] = enrichedSong
						}
					}
				}
			} catch (error) {
				console.error('获取歌曲详情失败:', error)
				// 继续使用原始歌曲信息
			}
		}
		
		commit('SET_CURRENT_SONG', enrichedSong)
		if (playlist && playlist.length > 0) {
			commit('SET_PLAYLIST', playlist)
			const index = playlist.findIndex(item => item.id === enrichedSong.id)
			commit('SET_CURRENT_INDEX', index >= 0 ? index : 0)
		}

		console.log('  ├─ 准备添加到播放历史并同步到数据库...')
		dispatch('history/addHistory', enrichedSong, { root: true })
		dispatch('history/syncHistory', enrichedSong, { root: true })

		if (state.audioContext) {
			state.audioContext.src = enrichedSong.url
			state.audioContext.play()
			commit('SET_PLAY_STATE', true)
			console.log('  └─ ✅ 歌曲开始播放')
		}
	},

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

	playPrevious({ commit, state, dispatch }) {
		if (state.playlist.length === 0) return
		let newIndex = state.currentIndex - 1
		if (newIndex < 0) newIndex = state.playlist.length - 1
		commit('SET_CURRENT_INDEX', newIndex)
		dispatch('playSong', { song: state.playlist[newIndex] })
	},

	playNext({ commit, state, dispatch }) {
		if (state.playlist.length === 0) return
		let newIndex
		if (state.playMode === 2) {
			newIndex = Math.floor(Math.random() * state.playlist.length)
		} else {
			newIndex = state.currentIndex + 1
			if (newIndex >= state.playlist.length) newIndex = 0
		}
		commit('SET_CURRENT_INDEX', newIndex)
		dispatch('playSong', { song: state.playlist[newIndex] })
	},

	togglePlayMode({ commit, state }) {
		const newMode = (state.playMode + 1) % 3
		commit('SET_PLAY_MODE', newMode)
		const modeText = ['列表循环', '单曲循环', '随机播放']
		uni.showToast({ title: modeText[newMode], icon: 'none', duration: 1500 })
	},

	removeFromPlaylist({ commit, state, dispatch }, index) {
		if (index < 0 || index >= state.playlist.length) return
		const isCurrentSong = index === state.currentIndex
		commit('REMOVE_FROM_PLAYLIST', index)
		if (isCurrentSong && state.playlist.length > 0) {
			dispatch('playSong', { song: state.playlist[state.currentIndex] })
		} else if (state.playlist.length === 0) {
			commit('SET_CURRENT_SONG', null)
			commit('SET_PLAY_STATE', false)
			if (state.audioContext) state.audioContext.stop()
		}
		uni.showToast({ title: '已从播放列表移除', icon: 'none' })
	},

	clearPlaylist({ commit, state }) {
		commit('CLEAR_PLAYLIST')
		commit('SET_CURRENT_SONG', null)
		commit('SET_PLAY_STATE', false)
		if (state.audioContext) state.audioContext.stop()
		uni.showToast({ title: '已清空播放列表', icon: 'success' })
	},

	addToPlaylist({ commit }, song) {
		commit('ADD_TO_PLAYLIST', song)
		uni.showToast({ title: '已添加到播放列表', icon: 'success' })
	},

	insertToPlaylist({ commit, state }, song) {
		if (state.playlist.length === 0) {
			commit('SET_PLAYLIST', [song])
			commit('SET_CURRENT_INDEX', 0)
			commit('SET_CURRENT_SONG', song)
		} else {
			commit('INSERT_TO_PLAYLIST', song)
		}
		uni.showToast({ title: '将在下一首播放', icon: 'success' })
	}
}

export default {
	namespaced: true,
	state,
	getters,
	mutations,
	actions
}

