<template>
	<view class="rank-page">
		<!-- 页面标题 -->
		<view class="page-header">
			<text class="header-title">音乐排行榜</text>
			<text class="header-subtitle">发现最热门的音乐</text>
		</view>
		
		<!-- 排行榜列表 -->
		<view class="rank-list">
			<view 
				class="rank-card" 
				v-for="(rank, index) in rankList" 
				:key="rank.id"
				@click="expandRank(rank)"
			>
				<!-- 榜单头部 -->
				<view class="rank-header">
					<view class="rank-icon" :style="{ background: rank.gradient }">
						<text class="icon">{{ rank.icon }}</text>
					</view>
					<view class="rank-info">
						<text class="rank-name">{{ rank.name }}</text>
						<text class="rank-desc">{{ rank.desc }}</text>
						<text class="update-time">{{ rank.updateTime }}</text>
					</view>
					<view class="rank-arrow">
						<text class="arrow">{{ rank.expanded ? '▲' : '▼' }}</text>
					</view>
				</view>
				
				<!-- 榜单歌曲（展开时显示） -->
				<view v-if="rank.expanded" class="rank-songs">
					<view v-if="rank.loading" class="loading-box">
						<text class="loading-text">加载中...</text>
					</view>
					<view v-else-if="rank.songs && rank.songs.length > 0">
						<SongList :songs="rank.songs" :showCover="false" />
					</view>
					<view v-else class="empty-box">
						<text class="empty-text">暂无数据</text>
					</view>
				</view>
				
				<!-- 预览（未展开时显示前3首） -->
				<view v-if="!rank.expanded && rank.preview && rank.preview.length > 0" class="rank-preview">
					<view 
						class="preview-item" 
						v-for="(song, idx) in rank.preview.slice(0, 3)" 
						:key="idx"
					>
						<text class="preview-index">{{ idx + 1 }}</text>
						<text class="preview-name">{{ song }}</text>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 迷你播放器 -->
		<MiniPlayer />
	</view>
</template>

<script>
import MiniPlayer from '@/components/MiniPlayer.vue'
import SongList from '@/components/SongList.vue'
import { searchMusic } from '@/utils/api.js'

export default {
	components: {
		MiniPlayer,
		SongList
	},
	data() {
		return {
			rankList: [
				{
					id: 1,
					name: '🔥 华语热歌榜',
					desc: '最热门的华语流行音乐',
					icon: '🎵',
					gradient: 'linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%)',
					keyword: '华语热歌',
					updateTime: '每日更新',
					expanded: false,
					loading: false,
					songs: [],
					preview: ['告白气球', '晴天', '七里香']
				},
				{
					id: 2,
					name: '🌍 欧美流行榜',
					desc: '全球最火的欧美金曲',
					icon: '🎸',
					gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
					keyword: '欧美流行',
					updateTime: '每周更新',
					expanded: false,
					loading: false,
					songs: [],
					preview: ['Shape of You', 'Blinding Lights', 'Someone Like You']
				},
				{
					id: 3,
					name: '🇯🇵 日韩精选榜',
					desc: '人气日韩音乐排行',
					icon: '🎤',
					gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
					keyword: '日韩',
					updateTime: '每周更新',
					expanded: false,
					loading: false,
					songs: [],
					preview: ['Lemon', '前前前世', 'Dynamite']
				},
				{
					id: 4,
					name: '🆕 新歌榜',
					desc: '最新发布的热门单曲',
					icon: '✨',
					gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
					keyword: '新歌',
					updateTime: '每日更新',
					expanded: false,
					loading: false,
					songs: [],
					preview: []
				},
				{
					id: 5,
					name: '🎹 抖音热歌榜',
					desc: '抖音最火的BGM',
					icon: '🎶',
					gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
					keyword: '抖音热歌',
					updateTime: '实时更新',
					expanded: false,
					loading: false,
					songs: [],
					preview: []
				},
				{
					id: 6,
					name: '🎼 经典老歌榜',
					desc: '经典永流传',
					icon: '📻',
					gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
					keyword: '经典老歌',
					updateTime: '每月更新',
					expanded: false,
					loading: false,
					songs: [],
					preview: ['月亮代表我的心', '甜蜜蜜', '童话']
				},
				{
					id: 7,
					name: '🎧 电音榜',
					desc: '动感节奏，燃爆全场',
					icon: '⚡',
					gradient: 'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
					keyword: '电音',
					updateTime: '每周更新',
					expanded: false,
					loading: false,
					songs: [],
					preview: []
				},
				{
					id: 8,
					name: '🌙 轻音乐榜',
					desc: '放松心情，舒缓压力',
					icon: '🎹',
					gradient: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
					keyword: '轻音乐',
					updateTime: '每周更新',
					expanded: false,
					loading: false,
					songs: [],
					preview: []
				}
			]
		}
	},
	onLoad() {
		// 页面加载时不自动加载任何数据，等用户点击时再加载
		console.log('排行榜页面加载完成，等待用户交互')
	},
	methods: {
		// 展开/收起排行榜 - 按需加载
		async expandRank(rank) {
			// 切换展开状态
			rank.expanded = !rank.expanded
			
			// 如果是展开且还没加载过数据，则加载
			if (rank.expanded && rank.songs.length === 0) {
				await this.loadRankSongs(rank)
			}
		},
		
		// 加载排行榜歌曲 - 按需加载实现
		async loadRankSongs(rank) {
			rank.loading = true
			
			try {
				console.log(`开始加载 ${rank.name} 的歌曲`)
				
				// 使用搜索API获取歌曲（只获取基础信息）
				const res = await searchMusic(rank.keyword, 0, 20)
				
				if (res.statusCode === 200 && res.data && res.data.result) {
					const songs = res.data.result.songs || []
					
					// 只保存基础信息，使用默认封面
					// 详细信息（如完整封面）在用户点击播放时才加载
					rank.songs = songs.map(song => ({
						id: song.id,
						name: song.name,
						artistName: song.artists?.map(artist => artist.name).join(', ') || '未知歌手',
						albumName: song.album?.name || song.al?.name || '未知专辑',
						albumPic: '/static/logo.png', // 使用默认封面，点击播放时再加载完整封面
						url: `https://music.163.com/song/media/outer/url?id=${song.id}.mp3`,
						vip: song.fee === 1
					}))
					
					console.log(`${rank.name} 加载完成，共 ${rank.songs.length} 首歌曲`)
					
					// 更新预览列表
					if (rank.songs.length > 0) {
						rank.preview = rank.songs.slice(0, 3).map(song => song.name)
					}
				} else {
					console.log(`${rank.name} 未获取到数据`)
					uni.showToast({
						title: '暂无数据',
						icon: 'none'
					})
				}
			} catch (error) {
				console.error(`${rank.name} 加载失败:`, error)
				uni.showToast({
					title: '加载失败，请重试',
					icon: 'none'
				})
			} finally {
				rank.loading = false
			}
		},
		
		// 刷新排行榜
		async refreshRank(rank) {
			rank.songs = []
			await this.loadRankSongs(rank)
		}
	},
	
	// 下拉刷新
	onPullDownRefresh() {
		// 刷新所有已展开的榜单
		const promises = this.rankList
			.filter(rank => rank.expanded)
			.map(rank => this.refreshRank(rank))
		
		Promise.all(promises).then(() => {
			uni.stopPullDownRefresh()
			uni.showToast({
				title: '刷新成功',
				icon: 'success'
			})
		})
	}
}
</script>

<style scoped>
.rank-page {
	min-height: 100vh;
	background: #f5f5f5;
	padding-bottom: 200rpx;
}

/* 页面头部 */
.page-header {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	padding: 60rpx 30rpx 40rpx;
	color: white;
}

.header-title {
	font-size: 48rpx;
	font-weight: bold;
	display: block;
	margin-bottom: 10rpx;
}

.header-subtitle {
	font-size: 24rpx;
	opacity: 0.9;
	display: block;
}

/* 排行榜列表 */
.rank-list {
	padding: 20rpx 20rpx 0;
}

.rank-card {
	background: white;
	border-radius: 20rpx;
	margin-bottom: 20rpx;
	overflow: hidden;
	box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
	transition: transform 0.3s;
}

.rank-card:active {
	transform: scale(0.98);
}

/* 榜单头部 */
.rank-header {
	display: flex;
	align-items: center;
	padding: 30rpx;
	gap: 20rpx;
}

.rank-icon {
	width: 100rpx;
	height: 100rpx;
	border-radius: 20rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 48rpx;
	box-shadow: 0 8rpx 16rpx rgba(0, 0, 0, 0.1);
	flex-shrink: 0;
}

.rank-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 8rpx;
}

.rank-name {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
}

.rank-desc {
	font-size: 24rpx;
	color: #999;
}

.update-time {
	font-size: 22rpx;
	color: #ccc;
	margin-top: 5rpx;
}

.rank-arrow {
	width: 60rpx;
	height: 60rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.arrow {
	font-size: 24rpx;
	color: #999;
	transition: transform 0.3s;
}

/* 预览列表 */
.rank-preview {
	padding: 0 30rpx 30rpx;
	border-top: 1rpx solid #f0f0f0;
	margin-top: 10rpx;
	padding-top: 20rpx;
}

.preview-item {
	display: flex;
	align-items: center;
	padding: 15rpx 0;
	gap: 20rpx;
}

.preview-index {
	width: 40rpx;
	font-size: 24rpx;
	color: #999;
	font-weight: 500;
	text-align: center;
}

.preview-name {
	flex: 1;
	font-size: 26rpx;
	color: #666;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

/* 榜单歌曲 */
.rank-songs {
	border-top: 1rpx solid #f0f0f0;
	margin-top: 10rpx;
}

/* 加载状态 */
.loading-box {
	padding: 60rpx 30rpx;
	text-align: center;
}

.loading-text {
	font-size: 28rpx;
	color: #999;
}

/* 空状态 */
.empty-box {
	padding: 60rpx 30rpx;
	text-align: center;
}

.empty-text {
	font-size: 28rpx;
	color: #ccc;
}
</style>

