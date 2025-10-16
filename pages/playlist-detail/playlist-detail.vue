<template>
	<view class="playlist-detail-page">
		<!-- 顶部信息 -->
		<view class="header-section">
			<!-- 背景模糊层 -->
			<image class="bg-blur" :src="playlist.cover" mode="aspectFill"></image>
			
			<view class="header-content">
				<!-- 歌单封面 -->
				<view class="cover-wrapper">
					<image class="playlist-cover" :src="playlist.cover" mode="aspectFill"></image>
					<view class="play-count">
						<text class="icon">▶</text>
						<text>{{ formatPlayCount(playlist.playCount) }}</text>
					</view>
				</view>
				
				<!-- 歌单信息 -->
				<view class="playlist-info">
					<text class="playlist-name">{{ playlist.name }}</text>
					<text class="playlist-desc" v-if="playlist.description">{{ playlist.description }}</text>
					<view class="playlist-stats">
						<text>歌曲：{{ songList.length }}</text>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 操作按钮 -->
		<view class="action-buttons">
			<view class="action-btn primary" @click="playAll">
				<text class="btn-icon">▶</text>
				<text>播放全部</text>
			</view>
			<view class="action-btn" @click="collectPlaylist">
				<text class="btn-icon">❤</text>
				<text>收藏</text>
			</view>
		</view>
		
		<!-- 歌曲列表 -->
		<view class="song-list-section">
			<view class="section-title">歌曲列表</view>
			<view class="api-notice">由于网易云API限制，非官方歌单只能获取前10/20首歌曲。如遇服务器繁忙请下拉刷新</view>
			
			<view v-if="loading" class="loading-wrapper">
				<text class="loading-text">加载中...</text>
			</view>
			
			<view v-else-if="songList.length > 0" class="song-list">
				<view 
					class="song-item" 
					v-for="(song, index) in songList" 
					:key="song.id"
					@click="playSong(song, index)"
				>
					<view class="song-index">{{ index + 1 }}</view>
					<image class="song-cover" :src="song.albumPic" mode="aspectFill"></image>
					<view class="song-info">
						<text class="song-name">{{ song.name }}</text>
						<text class="song-artist">{{ song.artistName }}</text>
					</view>
					<text class="song-more">⋯</text>
				</view>
			</view>
			
			<view v-else class="empty-wrapper">
				<text class="empty-text">暂无歌曲</text>
			</view>
		</view>
		
		<!-- 迷你播放器 -->
		<MiniPlayer />
	</view>
</template>

<script>
import { mapActions } from 'vuex'
import MiniPlayer from '@/components/MiniPlayer.vue'
import { getPlaylistDetail, getBatchSongDetails } from '@/utils/api.js'
import { PlaylistDetailCache } from '@/utils/cache.js'

export default {
	components: {
		MiniPlayer
	},
	data() {
		return {
			playlistId: null,
			playlist: {
				id: 0,
				name: '加载中...',
				cover: '/static/logo.png',
				playCount: 0,
				description: '',
				tracks: []
			},
			songList: [],
			loading: true,
			fromCache: false // 标记是否从缓存加载
		}
	},
	onLoad(options) {
		if (options.id) {
			this.playlistId = options.id
			this.loadPlaylistDetail()
		} else {
			uni.showToast({
				title: '歌单ID缺失',
				icon: 'none'
			})
			setTimeout(() => {
				uni.navigateBack()
			}, 1500)
		}
	},
	
	// 下拉刷新
	onPullDownRefresh() {
		this.refreshPlaylist()
	},
	methods: {
		...mapActions('player', ['playSong']),
		
	async loadPlaylistDetail() {
		try {
			this.loading = true
			
		// 第一步：尝试从缓存加载
		const cached = PlaylistDetailCache.get(this.playlistId)
		if (cached && cached.songList && cached.songList.length > 0) {
			console.log(`✅ 歌单 ${this.playlistId} 从缓存加载 (含${cached.songList.length}首歌曲)`)
			
			this.playlist = {
				id: cached.id,
				name: cached.name,
				cover: cached.cover,
				playCount: cached.playCount,
				description: cached.description,
				tracks: cached.tracks || []
			}
			this.songList = cached.songList
			this.fromCache = true
			
			// 设置页面标题
			uni.setNavigationBarTitle({
				title: this.playlist.name
			})
			
			this.loading = false
			return
		}
			
			// 第二步：从网络加载
			console.log(`🌐 歌单 ${this.playlistId} 从网络加载`)
			
			uni.showLoading({
				title: '加载中...',
				mask: true
			})
			
			// 获取歌单详情
			const res = await getPlaylistDetail(this.playlistId)
			
			if (res.statusCode === 200 && res.data?.result) {
				const data = res.data.result
				
				this.playlist = {
					id: data.id,
					name: data.name,
					cover: data.coverImgUrl || '/static/logo.png',
					playCount: data.playCount || 0,
					description: data.description || '',
					tracks: data.tracks || []
				}
				
				// 设置页面标题
				uni.setNavigationBarTitle({
					title: this.playlist.name
				})
				
				// 批量获取歌曲详细信息
				if (this.playlist.tracks && this.playlist.tracks.length > 0) {
					await this.loadSongDetails()
					
					// 第三步：保存到缓存（包含歌曲列表）
					const cacheData = {
						id: this.playlist.id,
						name: this.playlist.name,
						cover: this.playlist.cover,
						playCount: this.playlist.playCount,
						description: this.playlist.description,
						tracks: this.playlist.tracks,
						songList: this.songList // 缓存已加载的歌曲详情
					}
					PlaylistDetailCache.set(this.playlistId, cacheData)
					console.log(`💾 歌单 ${this.playlistId} 已缓存 (含${this.songList.length}首歌曲)`)
				}
			} else {
				throw new Error('获取歌单详情失败')
			}
		} catch (error) {
			console.error('加载歌单详情失败:', error)
			uni.showToast({
				title: '加载失败，请重试',
				icon: 'none'
			})
		} finally {
			this.loading = false
			uni.hideLoading()
		}
	},
		
		async loadSongDetails() {
			try {
				// 提取歌曲ID列表
				const songIds = this.playlist.tracks.map(track => track.id)
				
				// 批量获取歌曲详情
				const result = await getBatchSongDetails(songIds, (progress) => {
					// 更新加载进度
					console.log(`加载进度: ${progress.processed}/${progress.total}`)
				})
				
				if (result && result.songs && result.songs.length > 0) {
					this.songList = result.songs
					console.log('成功加载歌曲:', this.songList.length, '首')
					
					// 如果有加载失败的歌曲，显示提示
					if (result.failedCount > 0) {
						uni.showToast({
							title: `部分歌曲加载失败 (${result.failedCount}首)`,
							icon: 'none',
							duration: 2000
						})
					}
				} else {
					// 如果批量获取失败，使用tracks中的基础信息
					this.songList = this.playlist.tracks.map(track => ({
						id: track.id,
						name: track.name,
						artistName: track.artists?.map(a => a.name).join(', ') || '未知歌手',
						albumName: track.album?.name || '未知专辑',
						albumPic: track.album?.picUrl || '/static/logo.png',
						url: `https://music.163.com/song/media/outer/url?id=${track.id}.mp3`
					}))
				}
			} catch (error) {
				console.error('加载歌曲详情失败:', error)
				// 使用tracks中的基础信息作为备用
				this.songList = this.playlist.tracks.map(track => ({
					id: track.id,
					name: track.name,
					artistName: track.artists?.map(a => a.name).join(', ') || '未知歌手',
					albumName: track.album?.name || '未知专辑',
					albumPic: track.album?.picUrl || '/static/logo.png',
					url: `https://music.163.com/song/media/outer/url?id=${track.id}.mp3`
				}))
			}
		},
		
		playSong(song, index) {
			// 播放歌曲，传入当前歌单作为播放列表
			this.$store.dispatch('player/playSong', {
				song: song,
				playlist: this.songList
			})
		},
		
		playAll() {
			if (this.songList.length === 0) {
				uni.showToast({
					title: '歌单为空',
					icon: 'none'
				})
				return
			}
			
			// 播放第一首歌，传入完整歌单
			this.$store.dispatch('player/playSong', {
				song: this.songList[0],
				playlist: this.songList
			})
			
			uni.showToast({
				title: '开始播放',
				icon: 'success'
			})
		},
		
		collectPlaylist() {
			uni.showToast({
				title: '收藏功能开发中',
				icon: 'none'
			})
		},
		
	formatPlayCount(count) {
		if (count >= 100000000) {
			return (count / 100000000).toFixed(1) + '亿'
		} else if (count >= 10000) {
			return (count / 10000).toFixed(1) + '万'
		}
		return count
	},
	
	// 刷新歌单（清除缓存并重新加载）
	async refreshPlaylist() {
		try {
			console.log('🔄 刷新歌单，清除缓存...')
			
			// 清除该歌单的缓存
			PlaylistDetailCache.remove(this.playlistId)
			
			// 重置状态
			this.fromCache = false
			this.songList = []
			
			// 重新加载
			await this.loadPlaylistDetail()
			
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
.playlist-detail-page {
	min-height: 100vh;
	background: #f5f5f5;
	padding-bottom: 200rpx;
}

/* 顶部信息区 */
.header-section {
	position: relative;
	padding: 40rpx 30rpx;
	overflow: hidden;
}

.bg-blur {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	filter: blur(40rpx);
	opacity: 0.6;
	transform: scale(1.2);
}

.header-content {
	position: relative;
	display: flex;
	gap: 30rpx;
	z-index: 1;
}

.cover-wrapper {
	position: relative;
	width: 260rpx;
	height: 260rpx;
	flex-shrink: 0;
}

.playlist-cover {
	width: 100%;
	height: 100%;
	border-radius: 16rpx;
	box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.3);
}

.play-count {
	position: absolute;
	top: 10rpx;
	right: 10rpx;
	display: flex;
	align-items: center;
	gap: 5rpx;
	color: white;
	font-size: 22rpx;
	padding: 6rpx 12rpx;
	background: rgba(0, 0, 0, 0.5);
	border-radius: 20rpx;
}

.playlist-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 15rpx;
	color: white;
}

.playlist-name {
	font-size: 32rpx;
	font-weight: bold;
	line-height: 1.4;
}

.playlist-desc {
	font-size: 24rpx;
	opacity: 0.9;
	line-height: 1.5;
	display: -webkit-box;
	-webkit-line-clamp: 3;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.playlist-stats {
	margin-top: auto;
	font-size: 24rpx;
	opacity: 0.8;
}

/* 操作按钮 */
.action-buttons {
	display: flex;
	gap: 20rpx;
	padding: 30rpx;
}

.action-btn {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 10rpx;
	height: 80rpx;
	background: white;
	border-radius: 40rpx;
	font-size: 28rpx;
	color: #333;
	box-shadow: 0 4rpx 15rpx rgba(0, 0, 0, 0.1);
}

.action-btn.primary {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
}

.btn-icon {
	font-size: 32rpx;
}

/* 歌曲列表 */
.song-list-section {
	background: white;
	margin-top: 20rpx;
	padding: 30rpx 0;
}

.section-title {
	padding: 0 30rpx 20rpx;
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
}

.api-notice {
	padding: 0 30rpx 20rpx;
	font-size: 24rpx;
	color: #999;
	line-height: 1.5;
}

.loading-wrapper,
.empty-wrapper {
	padding: 100rpx 0;
	text-align: center;
}

.loading-text,
.empty-text {
	color: #999;
	font-size: 28rpx;
}

.song-list {
	/* padding: 0 30rpx; */
}

.song-item {
	display: flex;
	align-items: center;
	gap: 20rpx;
	padding: 20rpx 30rpx;
	transition: background 0.3s;
}

.song-item:active {
	background: #f5f5f5;
}

.song-index {
	width: 60rpx;
	text-align: center;
	font-size: 28rpx;
	color: #999;
}

.song-cover {
	width: 100rpx;
	height: 100rpx;
	border-radius: 12rpx;
}

.song-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 10rpx;
	min-width: 0;
}

.song-name {
	font-size: 28rpx;
	color: #333;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.song-artist {
	font-size: 24rpx;
	color: #999;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.song-more {
	font-size: 40rpx;
	color: #999;
	padding: 0 10rpx;
}
</style>

