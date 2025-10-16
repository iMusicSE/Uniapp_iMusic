<template>
	<view class="song-list">
		<view 
			class="song-item" 
			v-for="(song, index) in songs" 
			:key="song.id"
			@click="handlePlay(song, index)"
			:class="{ 'active': currentSong && currentSong.id === song.id }"
		>
			<!-- 序号或封面 -->
			<view class="song-left">
				<view class="song-index" v-if="!showCover">{{ index + 1 }}</view>
				<image v-else class="song-cover" :src="song.albumPic" mode="aspectFill"></image>
			</view>
			
			<!-- 歌曲信息 -->
			<view class="song-info">
				<view class="song-name-row">
					<text class="song-name">{{ song.name }}</text>
					<text class="vip-tag" v-if="song.vip">VIP</text>
				</view>
				<text class="song-artist">{{ song.artistName }}</text>
			</view>
			
			<!-- 操作按钮 -->
			<view class="song-actions">
				<view class="action-btn" @click.stop="toggleFavorite(song)">
					<text class="icon">{{ isFavorite(song.id) ? '❤️' : '🤍' }}</text>
				</view>
				<view class="action-btn" @click.stop="showMore(song)">
					<text class="icon">⋮</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import { getSongDetail } from '@/utils/api.js'

export default {
	name: 'SongList',
	props: {
		songs: {
			type: Array,
			default: () => []
		},
		showCover: {
			type: Boolean,
			default: false
		}
	},
	data() {
		return {
			// 本地缓存：存储已加载详细信息的歌曲
			enrichedSongsCache: {}
		}
	},
	computed: {
		...mapState(['currentSong']),
		...mapGetters(['isFavorite'])
	},
	methods: {
		...mapActions(['playSong', 'toggleFavorite', 'addToPlaylist']),
		
		// 播放歌曲 - 按需加载详细信息
		async handlePlay(song, index) {
			try {
				// 检查缓存中是否已有详细信息
				let songToPlay = this.enrichedSongsCache[song.id] || song
				
				// 如果歌曲封面是默认图且未在缓存中，需要获取详细信息
				const needDetail = (!songToPlay.albumPic || songToPlay.albumPic === '/static/logo.png') 
					&& !this.enrichedSongsCache[song.id]
				
				if (needDetail) {
					uni.showLoading({ title: '加载中...', mask: true })
					songToPlay = await this.enrichSongDetail(song)
					// 缓存详细信息
					this.enrichedSongsCache[song.id] = songToPlay
					uni.hideLoading()
				}
				
				// 播放歌曲
				this.playSong({
					song: songToPlay,
					playlist: this.songs
				})
			} catch (error) {
				uni.hideLoading()
				console.error('播放歌曲失败:', error)
				// 即使获取详情失败，也尝试播放原始歌曲
				this.playSong({
					song,
					playlist: this.songs
				})
			}
		},
		
		async showMore(song) {
			uni.showActionSheet({
				itemList: ['添加到播放列表', '下一首播放', '查看专辑', '分享'],
				success: async (res) => {
					if (res.tapIndex === 0) {
						// 添加到播放列表 - 按需加载详细信息
						uni.showLoading({ title: '加载中...', mask: true })
						const enrichedSong = await this.getEnrichedSong(song)
						this.addToPlaylist(enrichedSong)
						uni.hideLoading()
					} else if (res.tapIndex === 1) {
						// 下一首播放 - 按需加载详细信息
						uni.showLoading({ title: '加载中...', mask: true })
						const enrichedSong = await this.getEnrichedSong(song)
						this.playNext(enrichedSong)
						uni.hideLoading()
					} else if (res.tapIndex === 2) {
						// 查看专辑
						uni.showToast({
							title: '功能待开发',
							icon: 'none'
						})
					} else if (res.tapIndex === 3) {
						// 分享
						uni.showToast({
							title: '功能待开发',
							icon: 'none'
						})
					}
				}
			})
		},
		
		// 获取完整歌曲信息（使用缓存）
		async getEnrichedSong(song) {
			// 如果缓存中已有，直接返回
			if (this.enrichedSongsCache[song.id]) {
				return this.enrichedSongsCache[song.id]
			}
			
			// 否则获取并缓存
			const enrichedSong = await this.enrichSongDetail(song)
			this.enrichedSongsCache[song.id] = enrichedSong
			return enrichedSong
		},
		
		// 获取歌曲完整信息
		async enrichSongDetail(song) {
			// 如果已有完整封面，直接返回
			if (song.albumPic && song.albumPic !== '/static/logo.png') {
				return song
			}
			
			try {
				const res = await getSongDetail(song.id)
				
				if (res.statusCode === 200 && res.data?.songs?.length > 0) {
					const detailSong = res.data.songs[0]
					
					return {
						...song,
						id: Number(detailSong.id),
						name: detailSong.name,
						artistName: (detailSong.ar && detailSong.ar.length > 0)
							? detailSong.ar.map(a => a.name).join(', ')
							: (detailSong.artists && detailSong.artists.length > 0)
								? detailSong.artists.map(a => a.name).join(', ')
								: song.artistName || '未知歌手',
						albumName: detailSong.al?.name || detailSong.album?.name || song.albumName || '未知专辑',
						albumPic: detailSong.al?.picUrl || detailSong.album?.picUrl || song.albumPic || '/static/logo.png',
						url: song.url || `https://music.163.com/song/media/outer/url?id=${detailSong.id}.mp3`
					}
				}
			} catch (error) {
				console.error('获取歌曲详情失败:', error)
			}
			
			return song
		},
		
		// 下一首播放（插入到当前歌曲后面）
		playNext(song) {
			this.$store.dispatch('insertToPlaylist', song)
		}
	}
}
</script>

<style scoped>
.song-list {
	background: white;
}

.song-item {
	display: flex;
	align-items: center;
	padding: 20rpx 30rpx;
	gap: 20rpx;
	border-bottom: 1rpx solid #f0f0f0;
	transition: background 0.2s;
}

.song-item:active {
	background: #f5f5f5;
}

.song-item.active {
	background: #e6f7ff;
}

.song-left {
	width: 80rpx;
	height: 80rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.song-index {
	font-size: 28rpx;
	color: #999;
	font-weight: 500;
}

.song-cover {
	width: 80rpx;
	height: 80rpx;
	border-radius: 12rpx;
}

.song-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 8rpx;
	overflow: hidden;
}

.song-name-row {
	display: flex;
	align-items: center;
	gap: 10rpx;
}

.song-name {
	font-size: 28rpx;
	color: #333;
	font-weight: 500;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.vip-tag {
	padding: 2rpx 8rpx;
	background: linear-gradient(90deg, #ff6b6b, #ff8e53);
	color: white;
	font-size: 18rpx;
	border-radius: 4rpx;
	flex-shrink: 0;
}

.song-artist {
	font-size: 22rpx;
	color: #999;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.song-actions {
	display: flex;
	align-items: center;
	gap: 20rpx;
}

.action-btn {
	width: 50rpx;
	height: 50rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.icon {
	font-size: 32rpx;
	color: #666;
}
</style>

