// 收藏管理模块
import { getApiUrl } from '@/utils/config.js'

const state = {
	favorites: []
}

const getters = {
	getFavorites: state => state.favorites,
	isFavorite: state => songId => {
		return state.favorites.some(song => Number(song.id) === Number(songId))
	}
}

const mutations = {
	ADD_FAVORITE(state, song) {
		if (!state.favorites.some(item => item.id === song.id)) {
			state.favorites.unshift(song)
			uni.setStorageSync('favorites', state.favorites)
		}
	},
	REMOVE_FAVORITE(state, songId) {
		state.favorites = state.favorites.filter(song => song.id !== songId)
		uni.setStorageSync('favorites', state.favorites)
	},
	CLEAR_FAVORITES(state) {
		state.favorites = []
		uni.removeStorageSync('favorites')
	},
	SET_FAVORITES(state, favorites) {
		state.favorites = favorites
	},
	LOAD_FAVORITES(state) {
		const favorites = uni.getStorageSync('favorites')
		if (favorites) state.favorites = favorites
	}
}

const actions = {
	async syncFavorite({ rootState }, song) {
		console.log('🎵 [DEBUG-前端] syncFavorite 被调用')
		console.log('  ├─ userId:', rootState.user.userId, '类型:', typeof rootState.user.userId)
		console.log('  ├─ song:', song)
		console.log('  └─ song.id:', song.id, '类型:', typeof song.id)
		
		if (!rootState.user.userId) {
			console.warn('  └─ ⚠️ userId 为空，无法同步收藏')
			return
		}
		
		try {
			const url = getApiUrl('/favorites/add')
			const data = { userId: rootState.user.userId, musicId: song.id }
			console.log('  ├─ 请求URL:', url)
			console.log('  ├─ 请求数据:', data)
			
			const result = await uni.request({
				url: url,
				method: 'POST',
				data: data
			})
			
			console.log('  ├─ 服务器响应:', result)
			console.log('  └─ ✅ 收藏同步成功')
		} catch (err) {
			console.error('  └─ ❌ 同步收藏失败', err)
		}
	},

	async removeFavoriteDB({ rootState }, songId) {
		console.log('🗑️  [DEBUG-前端] removeFavoriteDB 被调用')
		console.log('  ├─ userId:', rootState.user.userId, '类型:', typeof rootState.user.userId)
		console.log('  └─ songId:', songId, '类型:', typeof songId)
		
		if (!rootState.user.userId) {
			console.warn('  └─ ⚠️ userId 为空，无法同步删除收藏')
			return
		}
		
		try {
			const url = getApiUrl('/favorites/delete')
			const data = { userId: rootState.user.userId, musicId: songId }
			console.log('  ├─ 请求URL:', url)
			console.log('  ├─ 请求数据:', data)
			
			const result = await uni.request({
				url: url,
				method: 'POST',
				data: data
			})
			
			console.log('  ├─ 服务器响应:', result)
			console.log('  └─ ✅ 删除收藏同步成功')
		} catch (err) {
			console.error('  └─ ❌ 同步取消收藏失败', err)
		}
	},

	async clearFavorites({ commit, rootState }) {
		commit('CLEAR_FAVORITES')
		if (!rootState.user.userId) return
		try {
			await uni.request({
				url: getApiUrl('/favorites/clear'),
				method: 'POST',
				data: { userId: rootState.user.userId }
			})
			uni.showToast({ title: '已清空收藏', icon: 'success' })
		} catch (err) {
			console.error('清空收藏失败', err)
			uni.showToast({ title: '清空收藏失败', icon: 'none' })
		}
	},

	toggleFavorite({ commit, getters, dispatch, rootState }, song) {
		console.log('❤️ [DEBUG-前端] toggleFavorite 被调用')
		console.log('  ├─ song:', song)
		console.log('  ├─ song.id:', song?.id)
		console.log('  ├─ 当前是否已收藏:', getters.isFavorite(song.id))
		console.log('  └─ 当前 userId:', rootState.user.userId)
		
		if (getters.isFavorite(song.id)) {
			console.log('  ├─ 执行取消收藏操作...')
			commit('REMOVE_FAVORITE', song.id)
			dispatch('removeFavoriteDB', song.id)
			uni.showToast({ title: '已取消收藏', icon: 'none' })
		} else {
			console.log('  ├─ 执行添加收藏操作...')
			commit('ADD_FAVORITE', song)
			dispatch('syncFavorite', song)
			uni.showToast({ title: '已添加到收藏', icon: 'success' })
		}
	},

	loadFavorites({ commit }) {
		commit('LOAD_FAVORITES')
	}
}

export default {
	namespaced: true,
	state,
	getters,
	mutations,
	actions
}

