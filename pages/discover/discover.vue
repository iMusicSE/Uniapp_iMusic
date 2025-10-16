<template>
	<view class="discover-page">
		<!-- 轮播图 -->
		<view class="banner-section">
			<swiper class="banner-swiper" indicator-dots autoplay circular>
				<swiper-item v-for="(banner, index) in banners" :key="index">
					<image class="banner-image" :src="banner.image" mode="aspectFill"></image>
				</swiper-item>
			</swiper>
		</view>
		
		<!-- 快捷入口 -->
		<view class="quick-actions">
			<view class="action-item" @click="goToSearch">
				<view class="action-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
					<text class="icon">🔍</text>
				</view>
				<text class="action-text">搜索音乐</text>
			</view>
	<view class="action-item" @click="goToCategoryRecommend">
		<view class="action-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
			<text class="icon">📅</text>
		</view>
		<text class="action-text">分类推荐</text>
	</view>
		<view class="action-item" @click="goToRank">
			<view class="action-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
				<text class="icon">📊</text>
			</view>
			<text class="action-text">排行榜</text>
		</view>
			<view class="action-item" @click="goToRadio">
				<view class="action-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
					<text class="icon">📻</text>
				</view>
				<text class="action-text">私人电台</text>
			</view>
		</view>
		
		<!-- 推荐歌单 -->
		<view class="section">
			<view class="section-header">
				<text class="section-title">推荐歌单</text>
				<text class="section-more" @click="showMore">更多 ></text>
			</view>
			<scroll-view class="playlist-scroll" scroll-x>
				<view class="playlist-list">
					<view class="playlist-item" v-for="playlist in playlists" :key="playlist.id" @click="goToPlaylist(playlist)">
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
			</scroll-view>
		</view>
		
		<!-- 新歌推荐 -->
		<view class="section">
			<view class="section-header">
				<text class="section-title">新歌推荐</text>
				<text class="section-more" @click="showMore">更多 ></text>
			</view>
			<view class="new-songs">
				<SongList :songs="newSongs" :showCover="true" />
			</view>
		</view>
		
		<!-- 迷你播放器 -->
		<MiniPlayer />
	</view>
</template>

<script>
import MiniPlayer from '@/components/MiniPlayer.vue'
import SongList from '@/components/SongList.vue'
import { searchMusic, getBatchSongDetails, getBatchPlaylistDetails } from '@/utils/api.js'
import { NewSongsCache } from '@/utils/cache.js'

export default {
	components: {
		MiniPlayer,
		SongList
	},
	data() {
		return {
			banners: [
				{ id: 1, image: '/static/logo.png' },
				{ id: 2, image: '/static/logo.png' },
				{ id: 3, image: '/static/logo.png' }
			],
			playlists: [],
			newSongs: [],
			// 推荐歌单ID列表
			playlistIds: [1997190595, 14096260145, 5017390341, 2374577728]
		}
	},
	onLoad() {
		this.loadPlaylists()
		this.loadNewSongs()
	},
	
	// 下拉刷新
	onPullDownRefresh() {
		this.refreshData()
	},
	methods: {
		async loadPlaylists() {
			try {
				console.log('开始加载推荐歌单...')
				
				// 显示加载提示
				uni.showLoading({
					title: '加载中...',
					mask: true
				})
				
				const playlists = await getBatchPlaylistDetails(this.playlistIds)
				
				// 隐藏加载提示
				uni.hideLoading()
				
				if (playlists && playlists.length > 0) {
					this.playlists = playlists
					console.log('成功加载推荐歌单:', playlists.length, '个')
					
					// 显示加载结果提示
					if (playlists.length < this.playlistIds.length) {
						uni.showToast({
							title: `加载了 ${playlists.length}/${this.playlistIds.length} 个歌单`,
							icon: 'none',
							duration: 2000
						})
					}
				} else {
					console.log('未获取到歌单数据')
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
			}
		},
		
	async loadNewSongs() {
		try {
		// 第一步：尝试从缓存加载
		const cachedSongs = NewSongsCache.get()
		if (cachedSongs && cachedSongs.length > 0) {
			console.log(`✅ 新歌推荐从缓存加载 (共${cachedSongs.length}首)`)
			this.newSongs = cachedSongs
			return
		}
			
			// 第二步：从网络加载
			console.log('🌐 新歌推荐从网络加载')
			
			uni.showLoading({
				title: '加载中...',
				mask: true
			})
			
			const res = await searchMusic('热门', 0, 10)
			
			if (res.statusCode === 200 && res.data && res.data.result) {
				const songs = res.data.result.songs || []
				
				// 先显示基础信息（使用默认封面）
				this.newSongs = songs.map(song => ({
					id: song.id,
					name: song.name,
					artistName: song.artists?.map(artist => artist.name).join(', ') || '未知歌手',
					albumName: song.album?.name || '未知专辑',
					albumPic: '/static/logo.png', // 搜索接口不返回封面，统一使用默认图
					url: `https://music.163.com/song/media/outer/url?id=${song.id}.mp3`
				}))
				console.log('成功加载新歌基础信息:', this.newSongs.length, '首')
				
			// 批量获取歌曲详细信息（包含完整封面）
			const songIds = songs.map(song => song.id)
			const result = await getBatchSongDetails(songIds)
			
			// 更新为完整信息
			if (result && result.songs && result.songs.length > 0) {
				this.newSongs = result.songs
				console.log('成功获取歌曲完整信息（含封面）:', result.songs.length, '首')
				
				// 如果有加载失败的歌曲，显示提示
				if (result.failedCount > 0) {
					console.warn(`部分歌曲加载失败: ${result.failedCount}首`)
				}
				
				// 第三步：保存到缓存
				NewSongsCache.set(this.newSongs)
				console.log('💾 新歌推荐已缓存')
			}
			} else {
				console.log('未获取到歌曲数据，响应:', res)
				uni.showToast({
					title: '暂无歌曲数据',
					icon: 'none'
				})
			}
		} catch (error) {
			console.error('加载新歌失败:', error)
			uni.showToast({
				title: '加载失败，请重试',
				icon: 'none'
			})
		} finally {
			uni.hideLoading()
		}
	},
		
		formatPlayCount(count) {
			if (count >= 100000000) {
				return (count / 100000000).toFixed(1) + '亿'
			} else if (count >= 10000) {
				return (count / 10000).toFixed(1) + '万'
			}
			return count
		},
		
		goToSearch() {
			uni.switchTab({
				url: '/pages/search/search'
			})
		},
		
goToCategoryRecommend() {
	uni.navigateTo({
		url: '/pages/category-recommend/category-recommend'
	})
},
	
goToRank() {
	uni.showToast({
		title: '功能开发中',
		icon: 'none'
	})
},
		
		goToRadio() {
			uni.showToast({
				title: '功能开发中',
				icon: 'none'
			})
		},
		
	goToPlaylist(playlist) {
		uni.navigateTo({
			url: `/pages/playlist-detail/playlist-detail?id=${playlist.id}`
		})
	},
		
	showMore() {
		uni.showToast({
			title: '更多内容待开发',
			icon: 'none'
		})
	},
	
	// 刷新数据（清除缓存并重新加载）
	async refreshData() {
		try {
			console.log('🔄 刷新发现页，清除缓存...')
			
			// 清除新歌推荐缓存
			NewSongsCache.remove()
			
			// 重置数据
			this.newSongs = []
			
			// 重新加载
			await Promise.all([
				this.loadPlaylists(),
				this.loadNewSongs()
			])
			
			uni.showToast({
				title: '刷新成功',
				icon: 'success'
			})
		} catch (error) {
			console.error('刷新失败:', error)
			uni.showToast({
				title: '刷新失败',
				icon: 'none'
			})
		} finally {
			uni.stopPullDownRefresh()
		}
	}
	}
}
</script>

<style scoped>
.discover-page {
	min-height: 100vh;
	background: #f5f5f5;
	padding-bottom: 200rpx;
}

/* 轮播图 */
.banner-section {
	background: white;
	padding: 20rpx;
}

.banner-swiper {
	height: 300rpx;
	border-radius: 16rpx;
	overflow: hidden;
}

.banner-image {
	width: 100%;
	height: 100%;
}

/* 快捷入口 */
.quick-actions {
	display: flex;
	justify-content: space-around;
	padding: 40rpx 30rpx;
	background: white;
	margin-top: 20rpx;
}

.action-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 15rpx;
}

.action-icon {
	width: 100rpx;
	height: 100rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.1);
}

.action-icon .icon {
	font-size: 48rpx;
}

.action-text {
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

.section-more {
	font-size: 24rpx;
	color: #999;
}

/* 歌单列表 */
.playlist-scroll {
	white-space: nowrap;
}

.playlist-list {
	display: inline-flex;
	gap: 20rpx;
	padding: 0 30rpx;
}

.playlist-item {
	display: inline-flex;
	flex-direction: column;
	width: 220rpx;
}

.playlist-cover-wrapper {
	position: relative;
	width: 220rpx;
	height: 220rpx;
}

.playlist-cover {
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

.playlist-name {
	margin-top: 10rpx;
	font-size: 26rpx;
	color: #333;
	overflow: hidden;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	line-height: 1.4;
}

/* 新歌推荐 */
.new-songs {
	padding: 0;
}
</style>

