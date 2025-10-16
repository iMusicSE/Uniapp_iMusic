// 全局状态管理 - 模块化拆分版本
// #ifndef VUE3
import Vue from 'vue'
import Vuex from 'vuex'
Vue.use(Vuex)
// #endif

// #ifdef VUE3
import { createStore } from 'vuex'
// #endif

// 导入各个模块
import player from './modules/player'
import user from './modules/user'
import favorites from './modules/favorites'
import history from './modules/history'

// #ifndef VUE3
const store = new Vuex.Store({
// #endif

// #ifdef VUE3
const store = createStore({
// #endif
	modules: {
		player,
		user,
		favorites,
		history
	},
	
	// 全局 actions
	actions: {
		// 加载本地数据
		loadLocalData({ dispatch }) {
			dispatch('favorites/loadFavorites')
			dispatch('history/loadHistory')
		}
	}
})

export default store
