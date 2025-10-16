// 用户状态模块

const state = {
	userId: null // 当前登录用户ID
}

const getters = {
	getUserId: state => state.userId,
	isLoggedIn: state => !!state.userId
}

const mutations = {
	SET_USER_ID(state, userId) {
		state.userId = userId
	},
	CLEAR_USER_ID(state) {
		state.userId = null
	}
}

const actions = {
	setUserId({ commit }, userId) {
		commit('SET_USER_ID', userId)
	},
	clearUserId({ commit }) {
		commit('CLEAR_USER_ID')
	}
}

export default {
	namespaced: true,
	state,
	getters,
	mutations,
	actions
}

