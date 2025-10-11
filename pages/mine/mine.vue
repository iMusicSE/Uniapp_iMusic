<template>
	<view class="mine-page">
		<!-- 用户信息 -->
		<view class="user-section">
			<view class="user-header">
				<image class="avatar" src="/static/logo.png" mode="aspectFill"></image>
				<view class="user-info">
					<text class="username">音乐爱好者</text>
					<text class="user-desc">发现好音乐，享受好生活</text>
				</view>
				<text class="setting-icon" @click="goToSetting">⚙️</text>
			</view>
			
			<view class="user-stats">
				<view class="stat-item">
					<text class="stat-value">{{ favorites.length }}</text>
					<text class="stat-label">收藏</text>
				</view>
				<view class="stat-divider"></view>
				<view class="stat-item">
					<text class="stat-value">{{ history.length }}</text>
					<text class="stat-label">历史</text>
				</view>
				<view class="stat-divider"></view>
				<view class="stat-item">
					<text class="stat-value">{{ playlist.length }}</text>
					<text class="stat-label">播放列表</text>
				</view>
			</view>
		</view>
		
		<!-- 快捷功能 -->
		<view class="quick-menu">
			<view class="menu-item" @click="goToRecent">
				<text class="menu-icon">⏰</text>
				<text class="menu-text">最近播放</text>
			</view>
			<view class="menu-item" @click="goToDownload">
				<text class="menu-icon">📥</text>
				<text class="menu-text">下载管理</text>
			</view>
			<view class="menu-item" @click="goToRadio">
				<text class="menu-icon">📻</text>
				<text class="menu-text">我的电台</text>
			</view>
			<view class="menu-item" @click="goToCollection">
				<text class="menu-icon">📁</text>
				<text class="menu-text">收藏专辑</text>
			</view>
		</view>
		
		<!-- 我的收藏 -->
		<view class="section">
			<view class="section-header">
				<text class="section-title">我的收藏</text>
				<text class="section-action" @click="clearFavorites" v-if="favorites.length > 0">清空</text>
			</view>
			<view class="section-content" v-if="favorites.length > 0">
				<SongList :songs="favorites" :showCover="true" />
			</view>
			<view class="empty-section" v-else>
				<text class="empty-icon">💔</text>
				<text class="empty-text">还没有收藏的歌曲</text>
			</view>
		</view>
		
		<!-- 播放历史 -->
		<view class="section">
			<view class="section-header">
				<text class="section-title">播放历史</text>
				<text class="section-action" @click="clearHistory" v-if="history.length > 0">清空</text>
			</view>
			<view class="section-content" v-if="history.length > 0">
				<SongList :songs="history.slice(0, 20)" :showCover="true" />
			</view>
			<view class="empty-section" v-else>
				<text class="empty-icon">🎵</text>
				<text class="empty-text">还没有播放记录</text>
			</view>
		</view>
		
		<!-- 迷你播放器 -->
		<MiniPlayer />
	</view>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import MiniPlayer from '@/components/MiniPlayer.vue'
import SongList from '@/components/SongList.vue'

export default {
	components: {
		MiniPlayer,
		SongList
	},
	computed: {
		...mapState(['favorites', 'history', 'playlist'])
	},
	onShow() {
		// 每次显示页面时刷新数据
		this.$store.dispatch('loadLocalData')
	},
	methods: {
		goToSetting() {
			uni.showToast({
				title: '设置功能待开发',
				icon: 'none'
			})
		},
		
		goToRecent() {
			uni.showToast({
				title: '最近播放功能待开发',
				icon: 'none'
			})
		},
		
		goToDownload() {
			uni.showToast({
				title: '下载管理功能待开发',
				icon: 'none'
			})
		},
		
		goToRadio() {
			uni.showToast({
				title: '我的电台功能待开发',
				icon: 'none'
			})
		},
		
		goToCollection() {
			uni.showToast({
				title: '收藏专辑功能待开发',
				icon: 'none'
			})
		},
		
		clearFavorites() {
			uni.showModal({
				title: '提示',
				content: '确定清空所有收藏吗？',
				success: (res) => {
					if (res.confirm) {
						this.$store.commit('SET_FAVORITES', [])
						uni.removeStorageSync('favorites')
						uni.showToast({
							title: '已清空收藏',
							icon: 'success'
						})
					}
				}
			})
		},
		
		clearHistory() {
			uni.showModal({
				title: '提示',
				content: '确定清空播放历史吗？',
				success: (res) => {
					if (res.confirm) {
						this.$store.commit('CLEAR_HISTORY')
						uni.showToast({
							title: '已清空历史',
							icon: 'success'
						})
					}
				}
			})
		}
	}
}
</script>

<style scoped>
.mine-page {
	min-height: 100vh;
	background: #f5f5f5;
	padding-bottom: 200rpx;
}

/* 用户信息 */
.user-section {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	padding: 40rpx 30rpx;
	color: white;
}

.user-header {
	display: flex;
	align-items: center;
	gap: 25rpx;
	margin-bottom: 40rpx;
}

.avatar {
	width: 120rpx;
	height: 120rpx;
	border-radius: 60rpx;
	border: 4rpx solid rgba(255, 255, 255, 0.5);
}

.user-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 10rpx;
}

.username {
	font-size: 36rpx;
	font-weight: bold;
}

.user-desc {
	font-size: 24rpx;
	opacity: 0.9;
}

.setting-icon {
	font-size: 48rpx;
	padding: 10rpx;
}

.user-stats {
	display: flex;
	align-items: center;
	justify-content: space-around;
	background: rgba(255, 255, 255, 0.2);
	border-radius: 16rpx;
	padding: 30rpx 0;
	backdrop-filter: blur(10rpx);
}

.stat-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 10rpx;
}

.stat-value {
	font-size: 40rpx;
	font-weight: bold;
}

.stat-label {
	font-size: 24rpx;
	opacity: 0.9;
}

.stat-divider {
	width: 1rpx;
	height: 60rpx;
	background: rgba(255, 255, 255, 0.3);
}

/* 快捷功能 */
.quick-menu {
	display: flex;
	justify-content: space-around;
	background: white;
	margin-top: 20rpx;
	padding: 40rpx 30rpx;
}

.menu-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 15rpx;
}

.menu-icon {
	font-size: 48rpx;
}

.menu-text {
	font-size: 24rpx;
	color: #666;
}

/* 板块 */
.section {
	background: white;
	margin-top: 20rpx;
	padding: 30rpx 0;
}

.section-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0 30rpx 20rpx;
}

.section-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
}

.section-action {
	font-size: 26rpx;
	color: #667eea;
}

.section-content {
	max-height: 800rpx;
	overflow-y: auto;
}

.empty-section {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 100rpx 0;
	gap: 20rpx;
}

.empty-icon {
	font-size: 100rpx;
	opacity: 0.3;
}

.empty-text {
	font-size: 28rpx;
	color: #999;
}
</style>

