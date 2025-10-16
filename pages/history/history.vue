<template>
	<view class="history-page">
		<!-- 顶部统计 -->
		<view class="stats-section">
			<view class="stats-card">
				<text class="stats-icon">🎵</text>
				<view class="stats-info">
					<text class="stats-value">{{ history.length }}</text>
					<text class="stats-label">首歌曲</text>
					<text class="stats-sub" v-if="totalHistoryInDB > history.length">
						数据库: {{ totalHistoryInDB }}首
					</text>
				</view>
			</view>
			<view class="stats-card">
				<text class="stats-icon">⏰</text>
				<view class="stats-info">
					<text class="stats-value">{{ todayCount }}</text>
					<text class="stats-label">今日播放</text>
					<text class="stats-sub" v-if="failedCount > 0">
						⚠️ {{ failedCount }}首加载失败
					</text>
				</view>
			</view>
		</view>
		
		<!-- 操作栏 -->
		<view class="action-bar">
			<view class="action-left">
				<text class="action-title">播放历史</text>
				<text class="action-subtitle">最多保存100首</text>
			</view>
			<view class="action-right">
				<view class="action-btn" @click="playAll" v-if="history.length > 0">
					<text class="action-btn-icon">▶️</text>
					<text class="action-btn-text">播放全部</text>
				</view>
				<view class="action-btn danger" @click="clearHistory" v-if="history.length > 0">
					<text class="action-btn-icon">🗑️</text>
					<text class="action-btn-text">清空</text>
				</view>
			</view>
		</view>
		
		<!-- 歌曲列表 -->
		<view class="list-section" v-if="history.length > 0">
			<SongList :songs="history" :showCover="true" />
		</view>
		
		<!-- 加载中状态 -->
		<view class="loading-section" v-else-if="isLoading">
			<text class="loading-icon">⏳</text>
			<text class="loading-text">正在加载播放历史...</text>
		</view>
		
		<!-- 空状态 -->
		<view class="empty-section" v-else>
			<text class="empty-icon">🎧</text>
			<text class="empty-text">还没有播放记录</text>
			<text class="empty-desc">快去发现好音乐吧~</text>
			<view class="empty-btn" @click="goToDiscover">
				<text class="empty-btn-text">去发现音乐</text>
			</view>
		</view>
		
		<!-- 迷你播放器 -->
		<MiniPlayer />
	</view>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import MiniPlayer from '@/components/MiniPlayer.vue'
import SongList from '@/components/SongList.vue'

export default {
	name: 'HistoryPage',
	components: { MiniPlayer, SongList },
	data() {
		return {
			todayCount: 0,
			totalHistoryInDB: 0, // 数据库中的历史总数
			failedCount: 0, // 加载失败的数量
			isLoading: false // 是否正在加载
		}
	},
	computed: {
		...mapState(['history', 'userId']),
		...mapGetters(['getHistory'])
	},
	watch: {
		// 监听 Vuex 中的 history 变化，同步统计数据
		'$store.state.history': {
			handler(newHistory) {
				if (!this.isLoading) {
					this.calculateTodayCount()
				}
			},
			deep: true
		}
	},
	onLoad() {
		this.loadHistoryData()
		this.calculateTodayCount()
	},
	onShow() {
		// 每次显示页面时刷新数据
		this.calculateTodayCount()
	},
	methods: {
		// 加载播放历史数据
		loadHistoryData() {
			// 从Vuex store获取历史数据
			// store中已经处理了数据的加载和同步
		},
		
		// 计算今日播放数量
		calculateTodayCount() {
			const today = new Date()
			today.setHours(0, 0, 0, 0)
			
			// 由于我们的历史记录没有时间戳，这里暂时显示总数
			// 如果需要精确的今日播放数，需要在store中为每条历史记录添加时间戳
			this.todayCount = this.history.length
		},
		
		// 播放全部历史歌曲
		playAll() {
			if (this.history.length === 0) {
				uni.showToast({ title: '暂无历史记录', icon: 'none' })
				return
			}
			
			// 播放第一首，并将整个历史列表作为播放列表
			this.$store.dispatch('playSong', {
				song: this.history[0],
				playlist: this.history
			})
			
			uni.showToast({ title: '开始播放', icon: 'success' })
		},
		
		// 清空播放历史
		clearHistory() {
			uni.showModal({
				title: '提示',
				content: '确定清空所有播放历史吗？',
				success: async (res) => {
					if (res.confirm) {
						try {
							await this.$store.dispatch('clearHistory')
							uni.showToast({ title: '已清空播放历史', icon: 'success' })
						} catch (err) {
							console.error('清空历史失败', err)
							uni.showToast({ title: '清空失败', icon: 'none' })
						}
					}
				}
			})
		},
		
		// 跳转到发现页面
		goToDiscover() {
			uni.switchTab({ url: '/pages/discover/discover' })
		}
	}
}
</script>

<style scoped>
.history-page {
	min-height: 100vh;
	background: #f5f5f5;
	padding-bottom: 200rpx;
}

/* 统计卡片 */
.stats-section {
	display: flex;
	gap: 20rpx;
	padding: 30rpx;
	background: white;
}

.stats-card {
	flex: 1;
	display: flex;
	align-items: center;
	gap: 20rpx;
	padding: 30rpx;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	border-radius: 16rpx;
	color: white;
}

.stats-icon {
	font-size: 60rpx;
}

.stats-info {
	display: flex;
	flex-direction: column;
	gap: 5rpx;
}

.stats-value {
	font-size: 40rpx;
	font-weight: bold;
}

.stats-label {
	font-size: 24rpx;
	opacity: 0.9;
}

.stats-sub {
	font-size: 20rpx;
	opacity: 0.8;
	margin-top: 5rpx;
}

/* 操作栏 */
.action-bar {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 30rpx;
	background: white;
	margin-top: 20rpx;
}

.action-left {
	display: flex;
	flex-direction: column;
	gap: 8rpx;
}

.action-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
}

.action-subtitle {
	font-size: 22rpx;
	color: #999;
}

.action-right {
	display: flex;
	gap: 15rpx;
}

.action-btn {
	display: flex;
	align-items: center;
	gap: 8rpx;
	padding: 12rpx 24rpx;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	border-radius: 40rpx;
	color: white;
}

.action-btn.danger {
	background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);
}

.action-btn-icon {
	font-size: 24rpx;
}

.action-btn-text {
	font-size: 24rpx;
	font-weight: 500;
}

/* 列表区域 */
.list-section {
	margin-top: 20rpx;
	background: white;
}

/* 空状态 */
.empty-section {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 150rpx 60rpx;
	background: white;
	margin-top: 20rpx;
	border-radius: 20rpx;
	margin: 20rpx 30rpx 0;
}

.empty-icon {
	font-size: 160rpx;
	opacity: 0.3;
	margin-bottom: 30rpx;
}

.empty-text {
	font-size: 32rpx;
	color: #333;
	font-weight: 500;
	margin-bottom: 10rpx;
}

.empty-desc {
	font-size: 26rpx;
	color: #999;
	margin-bottom: 60rpx;
}

.empty-btn {
	padding: 20rpx 60rpx;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	border-radius: 40rpx;
	color: white;
}

.empty-btn-text {
	font-size: 28rpx;
	color: white;
	font-weight: 500;
}

/* 加载状态 */
.loading-section {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 150rpx 60rpx;
	background: white;
	margin-top: 20rpx;
	border-radius: 20rpx;
	margin: 20rpx 30rpx 0;
	gap: 20rpx;
}

.loading-icon {
	font-size: 120rpx;
	animation: rotate 2s linear infinite;
}

.loading-text {
	font-size: 28rpx;
	color: #667eea;
	font-weight: 500;
}

@keyframes rotate {
	from {
		transform: rotate(0deg);
	}
	to {
		transform: rotate(360deg);
	}
}
</style>

