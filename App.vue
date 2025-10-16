<script>
	import store from './store/index.js'
	
	export default {
		onLaunch: function() {
			console.log('🚀 [DEBUG-应用] App Launch')
			
			// 检查本地存储的用户信息
			const currentUser = uni.getStorageSync('currentUser')
			console.log('  ├─ 本地存储的用户信息:', currentUser)
			
			if (currentUser && currentUser.id) {
				console.log('  ├─ 恢复用户登录状态')
				console.log('  ├─ 用户ID:', currentUser.id, '类型:', typeof currentUser.id)
				store.commit('SET_USER_ID', currentUser.id)
				console.log('  └─ ✅ Vuex userId已恢复:', store.state.userId)
			} else {
				console.log('  └─ ⚠️ 未找到登录用户信息，userId为空')
			}
			
			// 初始化音频上下文
			store.dispatch('initAudioContext')
			
			// 加载本地数据（收藏、历史）
			store.dispatch('loadLocalData')
			
			// 监听音频事件
			const audioContext = store.state.audioContext
			if (audioContext) {
				// 播放开始
				audioContext.onPlay(() => {
					store.commit('SET_PLAY_STATE', true)
				})
				
				// 暂停
				audioContext.onPause(() => {
					store.commit('SET_PLAY_STATE', false)
				})
				
				// 播放结束
				audioContext.onEnded(() => {
					store.commit('SET_PLAY_STATE', false)
					// 根据播放模式决定是否播放下一首
					if (store.state.playMode === 1) {
						// 单曲循环
						audioContext.play()
					} else {
						// 列表循环或随机播放
						store.dispatch('playNext')
					}
				})
				
				// 播放错误
				audioContext.onError((res) => {
					console.error('音频播放错误:', res)
					uni.showToast({
						title: '播放失败',
						icon: 'none'
					})
					store.commit('SET_PLAY_STATE', false)
				})
				
				// 时间更新
				audioContext.onTimeUpdate(() => {
					store.commit('SET_CURRENT_TIME', audioContext.currentTime)
					store.commit('SET_DURATION', audioContext.duration)
				})
			}
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style>
	/* 全局样式 */
	page {
		background-color: #f5f5f5;
	}
	
	/* 重置默认样式 */
	view, text, image {
		box-sizing: border-box;
	}
	
	/* 滚动条样式 */
	::-webkit-scrollbar {
		width: 0;
		height: 0;
		background: transparent;
	}
	
	/* 按钮重置 */
	button {
		border: none;
		outline: none;
		background: none;
		padding: 0;
		margin: 0;
	}
	
	button::after {
		border: none;
	}
	
	/* 输入框重置 */
	input {
		outline: none;
		border: none;
	}
	
	/* 通用动画 */
	.fade-in {
		animation: fadeIn 0.3s ease-in;
	}
	
	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	
	.slide-up {
		animation: slideUp 0.3s ease-out;
	}
	
	@keyframes slideUp {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}
	
	/* 工具类 */
	.text-ellipsis {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	
	.text-ellipsis-2 {
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
	}
	
	.flex-center {
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.flex-between {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
</style>
