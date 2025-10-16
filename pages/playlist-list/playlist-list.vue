<template>
	<view class="playlist-list-page">
		<!-- 推荐歌单 -->
		<view class="section">
			<view class="section-header">
				<text class="section-title">推荐歌单</text>
			</view>
			
			<view v-if="loading" class="loading-wrapper">
				<text class="loading-text">加载中...</text>
			</view>
			
			<view v-else-if="playlists.length > 0" class="playlist-grid">
				<view 
					class="playlist-item" 
					v-for="playlist in playlists" 
					:key="playlist.id"
					@click="goToPlaylistDetail(playlist)"
				>
					<view class="playlist-cover-wrapper">
						<image class="playlist-cover" :src="playlist.cover" mode="aspectFill"></image>
						<view class="play-count">
							<text class="icon">▶</text>
							<text>{{ formatPlayCount(playlist.playCount) }}</text>
						</view>
					</view>
					<text class="playlist-name">{{ playlist.name }}</text>
				</view>
			</view>
			
			<view v-else class="empty-wrapper">
				<text class="empty-icon">📁</text>
				<text class="empty-text">暂无歌单</text>
			</view>
		</view>
		
		<!-- 迷你播放器 -->
		<MiniPlayer />
	</view>
</template>

<script>
import MiniPlayer from '@/components/MiniPlayer.vue'
import { getBatchPlaylistDetails } from '@/utils/api.js'

export default {
	components: {
		MiniPlayer
	},
	data() {
		return {
			playlists: [],
			loading: false,
			// 更多推荐歌单ID
			playlistIds: [
				1997190595, 14096260145, 5017390341, 2374577728,
				3778678, 19723756, 3779629, 2884035
			]
		}
	},
	onLoad() {
		this.loadPlaylists()
	},
	// 下拉刷新
	onPullDownRefresh() {
		this.loadPlaylists(true)
	},
	methods: {
		async loadPlaylists(isRefresh = false) {
			try {
				this.loading = true
				
				if (!isRefresh) {
					uni.showLoading({
						title: '加载中...',
						mask: true
					})
				}
				
				const playlists = await getBatchPlaylistDetails(this.playlistIds)
				
				if (!isRefresh) {
					uni.hideLoading()
				}
				
				if (playlists && playlists.length > 0) {
					this.playlists = playlists
					console.log('成功加载歌单:', playlists.length, '个')
					
					if (playlists.length < this.playlistIds.length) {
						uni.showToast({
							title: `加载了 ${playlists.length}/${this.playlistIds.length} 个歌单`,
							icon: 'none',
							duration: 2000
						})
					}
				} else {
					uni.showToast({
						title: '暂无歌单数据',
						icon: 'none'
					})
				}
			} catch (error) {
				console.error('加载歌单失败:', error)
				uni.hideLoading()
				uni.showToast({
					title: '加载失败，请重试',
					icon: 'none'
				})
			} finally {
				this.loading = false
				if (isRefresh) {
					uni.stopPullDownRefresh()
				}
			}
		},
		
		goToPlaylistDetail(playlist) {
			uni.navigateTo({
				url: `/pages/playlist-detail/playlist-detail?id=${playlist.id}`
			})
		},
		
		formatPlayCount(count) {
			if (count >= 100000000) {
				return (count / 100000000).toFixed(1) + '亿'
			} else if (count >= 10000) {
				return (count / 10000).toFixed(1) + '万'
			}
			return count
		}
	}
}
</script>

<style scoped>
.playlist-list-page {
	min-height: 100vh;
	background: #f5f5f5;
	padding-bottom: 200rpx;
}

/* 板块 */
.section {
	background: white;
	padding: 30rpx;
}

.section-header {
	margin-bottom: 30rpx;
}

.section-title {
	font-size: 36rpx;
	font-weight: bold;
	color: #333;
}

/* 加载和空状态 */
.loading-wrapper,
.empty-wrapper {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 100rpx 0;
	gap: 20rpx;
}

.loading-text {
	font-size: 28rpx;
	color: #999;
}

.empty-icon {
	font-size: 100rpx;
	opacity: 0.3;
}

.empty-text {
	font-size: 28rpx;
	color: #999;
}

/* 歌单网格 */
.playlist-grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 30rpx;
}

.playlist-item {
	display: flex;
	flex-direction: column;
}

.playlist-cover-wrapper {
	position: relative;
	width: 100%;
	padding-bottom: 100%;
}

.playlist-cover {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	border-radius: 16rpx;
}

.play-count {
	position: absolute;
	top: 10rpx;
	right: 10rpx;
	display: flex;
	align-items: center;
	gap: 5rpx;
	color: white;
	font-size: 20rpx;
	padding: 5rpx 10rpx;
	background: rgba(0, 0, 0, 0.5);
	border-radius: 20rpx;
}

.play-count .icon {
	font-size: 18rpx;
}

.playlist-name {
	margin-top: 15rpx;
	font-size: 26rpx;
	color: #333;
	line-height: 1.4;
	overflow: hidden;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
}
</style>

