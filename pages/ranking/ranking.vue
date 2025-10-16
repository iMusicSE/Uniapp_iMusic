<template>
	<view class="ranking-page">
		<!-- 页面标题 -->
		<view class="page-header">
			<text class="header-title">音乐排行榜</text>
			<text class="header-subtitle">全球热门榜单 · 实时更新</text>
		</view>
		
		<!-- 官方榜单 -->
		<view class="section">
			<view class="section-header">
				<view class="header-line"></view>
				<text class="section-title">官方榜</text>
				<view class="header-line"></view>
			</view>
			
			<view class="ranking-list">
				<view 
					class="ranking-item" 
					v-for="(rank, index) in officialRankings" 
					:key="rank.id"
					@click="goToRankDetail(rank)"
				>
					<image 
						class="ranking-cover" 
						:src="rank.cover || '/static/logo.png'" 
						mode="aspectFill"
					></image>
					<view class="ranking-info">
						<view class="ranking-name-row">
							<text class="ranking-name">{{ rank.name }}</text>
							<text class="ranking-update">{{ rank.updateFrequency }}</text>
						</view>
						<text class="ranking-desc">{{ rank.description }}</text>
						<view class="top-songs" v-if="rank.topSongs && rank.topSongs.length > 0">
							<view 
								class="top-song-item" 
								v-for="(song, idx) in rank.topSongs.slice(0, 3)" 
								:key="idx"
							>
								<text class="song-index">{{ idx + 1 }}.</text>
								<text class="song-info">{{ song.name }} - {{ song.artist }}</text>
							</view>
						</view>
					</view>
					<view class="ranking-badge" :style="{ background: getBadgeColor(index) }">
						<text class="badge-text">TOP</text>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 特色榜单 -->
		<view class="section">
			<view class="section-header">
				<view class="header-line"></view>
				<text class="section-title">特色榜</text>
				<view class="header-line"></view>
			</view>
			
			<view class="ranking-grid">
				<view 
					class="grid-item" 
					v-for="rank in specialRankings" 
					:key="rank.id"
					@click="goToRankDetail(rank)"
				>
					<view class="grid-cover-wrapper">
						<image 
							class="grid-cover" 
							:src="rank.cover || '/static/logo.png'" 
							mode="aspectFill"
						></image>
						<view class="play-count" v-if="rank.playCount">
							<text class="icon">▶</text>
							<text>{{ formatPlayCount(rank.playCount) }}</text>
						</view>
					</view>
					<text class="grid-name">{{ rank.name }}</text>
				</view>
			</view>
		</view>
		
		<!-- 迷你播放器 -->
		<MiniPlayer />
	</view>
</template>

<script>
import MiniPlayer from '@/components/MiniPlayer.vue'
import { getPlaylistDetail } from '@/utils/api.js'

export default {
	components: {
		MiniPlayer
	},
	data() {
		return {
			// 官方榜单（前4个）
			officialRankings: [
				{
					id: 19723756,
					name: '飙升榜',
					description: '根据最新数据实时更新',
					updateFrequency: '每日更新',
					cover: '',
					topSongs: []
				},
				{
					id: 3779629,
					name: '新歌榜',
					description: '最新上线的热门歌曲',
					updateFrequency: '每日更新',
					cover: '',
					topSongs: []
				},
				{
					id: 2884035,
					name: '原创榜',
					description: '原创音乐人气榜单',
					updateFrequency: '每周更新',
					cover: '',
					topSongs: []
				},
				{
					id: 3778678,
					name: '热歌榜',
					description: '全网最热门歌曲榜',
					updateFrequency: '每日更新',
					cover: '',
					topSongs: []
				}
			],
			// 特色榜单（扩展）
			specialRankings: [
				{
					id: 71384707,
					name: '古典音乐榜',
					description: '经典古典音乐',
					cover: '',
					playCount: 0
				},
				{
					id: 1978921795,
					name: '电音榜',
					description: '热门电子音乐',
					cover: '',
					playCount: 0
				},
				{
					id: 14028249541,
					name: '全球说唱榜',
					description: '全球说唱音乐',
					cover: '',
					playCount: 0
				},
				{
					id: 60131,
					name: '日本Oricon榜',
					description: '日本公信榜',
					cover: '',
					playCount: 0
				}
			]
		}
	},
	onLoad() {
		this.loadRankingData()
	},
	methods: {
		// 加载榜单数据
		async loadRankingData() {
			uni.showLoading({
				title: '加载中...',
				mask: true
			})
			
			try {
				// 并行加载所有榜单
				const allRankings = [...this.officialRankings, ...this.specialRankings]
				const promises = allRankings.map(rank => this.loadRankingDetail(rank.id))
				const results = await Promise.all(promises)
				
				// 更新官方榜单数据
				this.officialRankings.forEach((rank, index) => {
					const data = results[index]
					if (data) {
						rank.cover = data.cover
						rank.playCount = data.playCount
						rank.topSongs = data.topSongs
					}
				})
				
				// 更新特色榜单数据
				this.specialRankings.forEach((rank, index) => {
					const data = results[this.officialRankings.length + index]
					if (data) {
						rank.cover = data.cover
						rank.playCount = data.playCount
					}
				})
				
				console.log('榜单数据加载成功')
			} catch (error) {
				console.error('加载榜单失败:', error)
				uni.showToast({
					title: '加载失败，请重试',
					icon: 'none'
				})
			} finally {
				uni.hideLoading()
			}
		},
		
		// 加载单个榜单详情
		async loadRankingDetail(id) {
			try {
				const res = await getPlaylistDetail(id)
				
				if (res.statusCode === 200 && res.data?.result) {
					const playlist = res.data.result
					const tracks = playlist.tracks || []
					
					return {
						cover: playlist.coverImgUrl || '/static/logo.png',
						playCount: playlist.playCount || 0,
						topSongs: tracks.slice(0, 3).map(track => ({
							name: track.name,
							artist: track.artists?.map(a => a.name).join(', ') || '未知歌手'
						}))
					}
				}
				return null
			} catch (error) {
				console.error(`加载榜单 ${id} 失败:`, error)
				return null
			}
		},
		
		// 播放量格式化
		formatPlayCount(count) {
			if (count >= 100000000) {
				return (count / 100000000).toFixed(1) + '亿'
			} else if (count >= 10000) {
				return (count / 10000).toFixed(1) + '万'
			}
			return count
		},
		
		// 获取徽章颜色
		getBadgeColor(index) {
			const colors = [
				'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
				'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
				'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
				'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
			]
			return colors[index % colors.length]
		},
		
		// 跳转到榜单详情
		goToRankDetail(rank) {
			uni.navigateTo({
				url: `/pages/playlist-detail/playlist-detail?id=${rank.id}`
			})
		}
	}
}
</script>

<style scoped>
.ranking-page {
	min-height: 100vh;
	background: linear-gradient(to bottom, #667eea 0%, #f5f5f5 30%);
	padding-bottom: 200rpx;
}

/* 页面头部 */
.page-header {
	padding: 60rpx 40rpx 40rpx;
	text-align: center;
}

.header-title {
	display: block;
	font-size: 48rpx;
	font-weight: bold;
	color: white;
	margin-bottom: 15rpx;
}

.header-subtitle {
	font-size: 24rpx;
	color: rgba(255, 255, 255, 0.8);
}

/* 板块 */
.section {
	margin: 30rpx 0;
	padding: 0 30rpx;
}

.section-header {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 20rpx;
	margin-bottom: 30rpx;
}

.header-line {
	flex: 1;
	height: 2rpx;
	background: rgba(255, 255, 255, 0.3);
	max-width: 100rpx;
}

.section-title {
	font-size: 32rpx;
	font-weight: bold;
	color: white;
	padding: 0 20rpx;
}

/* 官方榜单列表 */
.ranking-list {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.ranking-item {
	display: flex;
	background: white;
	border-radius: 20rpx;
	padding: 20rpx;
	gap: 20rpx;
	box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.08);
	position: relative;
	overflow: hidden;
	transition: transform 0.3s;
}

.ranking-item:active {
	transform: scale(0.98);
}

.ranking-cover {
	width: 200rpx;
	height: 200rpx;
	border-radius: 16rpx;
	flex-shrink: 0;
}

.ranking-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 12rpx;
}

.ranking-name-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.ranking-name {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
}

.ranking-update {
	font-size: 22rpx;
	color: #999;
	background: #f5f5f5;
	padding: 4rpx 12rpx;
	border-radius: 20rpx;
}

.ranking-desc {
	font-size: 24rpx;
	color: #666;
}

.top-songs {
	display: flex;
	flex-direction: column;
	gap: 8rpx;
	margin-top: 8rpx;
}

.top-song-item {
	display: flex;
	align-items: center;
	gap: 10rpx;
}

.song-index {
	font-size: 20rpx;
	color: #999;
	width: 30rpx;
}

.song-info {
	font-size: 22rpx;
	color: #666;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	flex: 1;
}

.ranking-badge {
	position: absolute;
	top: 20rpx;
	right: 20rpx;
	padding: 8rpx 20rpx;
	border-radius: 30rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
}

.badge-text {
	font-size: 20rpx;
	font-weight: bold;
	color: white;
}

/* 特色榜单网格 */
.ranking-grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 20rpx;
}

.grid-item {
	background: white;
	border-radius: 16rpx;
	overflow: hidden;
	transition: transform 0.3s;
	box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.08);
}

.grid-item:active {
	transform: scale(0.98);
}

.grid-cover-wrapper {
	position: relative;
	width: 100%;
	padding-top: 100%;
}

.grid-cover {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
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

.grid-name {
	display: block;
	padding: 20rpx;
	font-size: 26rpx;
	color: #333;
	font-weight: 500;
	text-align: center;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
</style>

