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
	duration: 0,
	shuffledIndexes: [], // 随机播放模式下的打乱索引顺序
	shuffledPosition: 0,  // 在打乱序列中的当前位置
	isRadioMode: false, // 是否是电台模式
	currentRadio: null // 当前播放的电台
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
	SET_RADIO_MODE(state, isRadioMode) {
		state.isRadioMode = isRadioMode
	},
	SET_CURRENT_RADIO(state, radio) {
		state.currentRadio = radio
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
	},
	GENERATE_SHUFFLED_INDEXES(state) {
		// 生成打乱的索引数组
		const indexes = Array.from({ length: state.playlist.length }, (_, i) => i)
		// Fisher-Yates 洗牌算法
		for (let i = indexes.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[indexes[i], indexes[j]] = [indexes[j], indexes[i]]
		}
		state.shuffledIndexes = indexes
		// 找到当前歌曲在打乱序列中的位置
		state.shuffledPosition = indexes.indexOf(state.currentIndex)
		if (state.shuffledPosition === -1) state.shuffledPosition = 0
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
		console.log('  ├─ song.url:', song?.url)
		console.log('  └─ 当前 userId:', rootState.user.userId)
		
		let enrichedSong = song
		
		// 如果是下载的本地文件，跳过获取详细信息
		const isLocalFile = song.url && !song.url.startsWith('http')
		
		// 如果歌曲封面不完整且不是本地文件，先获取详细信息
		if (!isLocalFile && (!song.albumPic || song.albumPic === '/static/logo.png')) {
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
			// 如果是随机播放模式，重新生成打乱的播放顺序
			if (state.playMode === 2) {
				commit('GENERATE_SHUFFLED_INDEXES')
			}
		}

		console.log('  ├─ 准备添加到播放历史并同步到数据库...')
		dispatch('history/addHistory', enrichedSong, { root: true })
		dispatch('history/syncHistory', enrichedSong, { root: true })

		// 初始化或更新 audioContext
		if (!state.audioContext) {
			const audioContext = uni.createInnerAudioContext()
			commit('SET_AUDIO_CONTEXT', audioContext)
		}
		
		if (state.audioContext) {
			state.audioContext.src = enrichedSong.url
			state.audioContext.play()
			commit('SET_PLAY_STATE', true)
			console.log('  └─ ✅ 歌曲开始播放:', enrichedSong.url)
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
		let newIndex
		if (state.playMode === 2) {
			// 随机播放：按打乱的顺序向前播放
			if (state.shuffledIndexes.length === 0) {
				commit('GENERATE_SHUFFLED_INDEXES')
			}
			const prevShuffledPosition = state.shuffledPosition - 1 < 0 
				? state.shuffledIndexes.length - 1 
				: state.shuffledPosition - 1
			state.shuffledPosition = prevShuffledPosition
			newIndex = state.shuffledIndexes[prevShuffledPosition]
		} else {
			newIndex = state.currentIndex - 1
			if (newIndex < 0) newIndex = state.playlist.length - 1
		}
		commit('SET_CURRENT_INDEX', newIndex)
		dispatch('playSong', { song: state.playlist[newIndex] })
	},

	playNext({ commit, state, dispatch }) {
		if (state.playlist.length === 0) return
		let newIndex
		if (state.playMode === 2) {
			// 随机播放：按打乱的顺序播放
			if (state.shuffledIndexes.length === 0) {
				commit('GENERATE_SHUFFLED_INDEXES')
			}
			const nextShuffledPosition = (state.shuffledPosition + 1) % state.shuffledIndexes.length
			state.shuffledPosition = nextShuffledPosition
			newIndex = state.shuffledIndexes[nextShuffledPosition]
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
		// 切换到随机播放模式时，生成打乱的播放顺序
		if (newMode === 2 && state.playlist.length > 0) {
			commit('GENERATE_SHUFFLED_INDEXES')
		}
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
	},
	
	// 播放电台
	playRadio({ commit, state }, radio) {
		console.log('▶️  播放电台:', radio.name, radio.url)
		
		// 切换到电台模式
		commit('SET_RADIO_MODE', true)
		commit('SET_CURRENT_RADIO', radio)
		
		// 清空当前歌曲信息
		commit('SET_CURRENT_SONG', null)
		
		// 初始化或更新 audioContext
		if (!state.audioContext) {
			const audioContext = uni.createInnerAudioContext()
			commit('SET_AUDIO_CONTEXT', audioContext)
		}
		
		// 停止当前播放
		if (state.audioContext) {
			state.audioContext.stop()
		}
		
		// 设置电台URL并播放
		state.audioContext.src = radio.url
		
		// 显示加载提示
		uni.showLoading({
			title: '连接中...',
			mask: true
		})
		
		// 开始播放
		try {
			state.audioContext.play()
			commit('SET_PLAY_STATE', true)
			console.log('✅ 电台开始播放:', radio.url)
			
			// 5秒后自动隐藏加载提示
			setTimeout(() => {
				uni.hideLoading()
			}, 5000)
		} catch (error) {
			console.error('播放电台异常:', error)
			uni.hideLoading()
			uni.showToast({
				title: '播放失败',
				icon: 'none'
			})
		}
	},
	
	// 停止电台
	stopRadio({ commit, state }) {
		if (state.audioContext) {
			state.audioContext.stop()
		}
		commit('SET_PLAY_STATE', false)
		commit('SET_RADIO_MODE', false)
		commit('SET_CURRENT_RADIO', null)
	},
	
	// 切换回音乐模式
	switchToMusicMode({ commit, state }) {
		commit('SET_RADIO_MODE', false)
		commit('SET_CURRENT_RADIO', null)
		if (state.audioContext) {
			state.audioContext.stop()
		}
		commit('SET_PLAY_STATE', false)
	}
}

export default {
	namespaced: true,
	state,
	getters,
	mutations,
	actions
}

