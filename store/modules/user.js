// 用户状态模块

const state = {
	userId: null,           // 当前登录用户ID
	username: '未登录',      // 用户名，默认为"未登录"
	avatar: '/static/logo.png',  // 用户头像，默认使用logo
	isGuest: true           // 是否为游客模式，默认为true
}

const getters = {
	getUserId: state => state.userId,
	isLoggedIn: state => !!state.userId && !state.isGuest,
	getUsername: state => state.username || '未登录',
	getAvatar: state => state.avatar || '/static/logo.png',
	isGuest: state => state.isGuest,
	getUserInfo: state => ({
		id: state.userId,
		username: state.username,
		avatar: state.avatar,
		isGuest: state.isGuest
	})
}

const mutations = {
	SET_USER_ID(state, userId) {
		state.userId = userId
	},
	CLEAR_USER_ID(state) {
		state.userId = null
	},
	SET_USER_INFO(state, userInfo) {
		state.userId = userInfo.id || null
		state.username = userInfo.username || '未登录'
		state.avatar = userInfo.avatar || '/static/logo.png'
		state.isGuest = userInfo.isGuest !== undefined ? userInfo.isGuest : true
	},
	CLEAR_USER_INFO(state) {
		state.userId = null
		state.username = '未登录'
		state.avatar = '/static/logo.png'
		state.isGuest = true
	},
	UPDATE_USERNAME(state, username) {
		state.username = username || '未登录'
	},
	UPDATE_AVATAR(state, avatar) {
		state.avatar = avatar || '/static/logo.png'
	}
}

const actions = {
	setUserId({ commit }, userId) {
		commit('SET_USER_ID', userId)
	},
	clearUserId({ commit }) {
		commit('CLEAR_USER_ID')
	},
	setUserInfo({ commit }, userInfo) {
		commit('SET_USER_INFO', userInfo)
		// 同步到本地存储
		uni.setStorageSync('currentUser', userInfo)
	},
	clearUserInfo({ commit }) {
		commit('CLEAR_USER_INFO')
		// 清除本地存储
		uni.removeStorageSync('currentUser')
	},
	updateUsername({ commit, state }, username) {
		commit('UPDATE_USERNAME', username)
		// 更新本地存储
		const userInfo = uni.getStorageSync('currentUser') || {}
		userInfo.username = username
		uni.setStorageSync('currentUser', userInfo)
	},
	updateAvatar({ commit, state }, avatar) {
		commit('UPDATE_AVATAR', avatar)
		// 更新本地存储
		const userInfo = uni.getStorageSync('currentUser') || {}
		userInfo.avatar = avatar
		uni.setStorageSync('currentUser', userInfo)
	}
}

export default {
	namespaced: true,
	state,
	getters,
	mutations,
	actions
}

