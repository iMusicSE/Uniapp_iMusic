// 历史记录模块
import { getApiUrl } from '@/utils/config.js'

const state = {
	history: []
}

const getters = {
	getHistory: state => state.history
}

const mutations = {
	ADD_HISTORY(state, song) {
		state.history = state.history.filter(item => item.id !== song.id)
		state.history.unshift(song)
		if (state.history.length > 100) state.history = state.history.slice(0, 100)
		uni.setStorageSync('history', state.history)
	},
	CLEAR_HISTORY(state) {
		state.history = []
		uni.removeStorageSync('history')
	},
	LOAD_HISTORY(state) {
		const history = uni.getStorageSync('history')
		if (history) state.history = history
	}
}

const actions = {
	async syncHistory({ rootState }, song) {
		console.log('🕒 [DEBUG-前端] syncHistory 被调用')
		console.log('  ├─ userId:', rootState.user.userId, '类型:', typeof rootState.user.userId)
		console.log('  ├─ song:', song)
		console.log('  └─ song.id:', song.id, '类型:', typeof song.id)
		
		if (!rootState.user.userId) {
			console.warn('  └─ ⚠️ userId 为空，无法同步播放历史')
			return
		}
		
		try {
			const url = getApiUrl('/history/add')
			const data = { userId: rootState.user.userId, musicId: song.id }
			console.log('  ├─ 请求URL:', url)
			console.log('  ├─ 请求数据:', data)
			
			const result = await uni.request({
				url: url,
				method: 'POST',
				data: data
			})
			
			console.log('  ├─ 服务器响应:', result)
			console.log('  └─ ✅ 播放历史同步成功')
		} catch (err) {
			console.error('  └─ ❌ 同步历史失败', err)
		}
	},

	async clearHistory({ commit, rootState }) {
		commit('CLEAR_HISTORY')
		if (!rootState.user.userId) return
		try {
			await uni.request({
				url: getApiUrl('/history/clear'),
				method: 'POST',
				data: { userId: rootState.user.userId }
			})
			uni.showToast({ title: '已清空播放历史', icon: 'success' })
		} catch (err) {
			console.error('清空历史失败', err)
			uni.showToast({ title: '清空历史失败', icon: 'none' })
		}
	},

	addHistory({ commit }, song) {
		commit('ADD_HISTORY', song)
	},

	loadHistory({ commit }) {
		commit('LOAD_HISTORY')
	}
}

export default {
	namespaced: true,
	state,
	getters,
	mutations,
	actions
}

