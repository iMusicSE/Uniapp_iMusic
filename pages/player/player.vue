<template>
	<view class="player-page" :style="{ background: bgColor }">
		<!-- 顶部栏 -->
		<view class="top-bar">
			<text class="back-icon" @click="goBack">＜</text>
			<view class="song-title">
				<text class="title">{{ currentSong ? currentSong.name : '暂无播放' }}</text>
				<text class="subtitle">{{ currentSong ? currentSong.artistName : '' }}</text>
			</view>
			<text class="share-icon" @click="share">⋯</text>
		</view>
		
		<!-- 封面区域 -->
		<view class="cover-section">
			<view class="cover-container" :class="{ 'rotating': isPlaying }">
				<image 
					class="cover-image" 
					:src="currentSong ? currentSong.albumPic : '/static/logo.png'" 
					mode="aspectFill"
				></image>
				<view class="cover-disc"></view>
			</view>
		</view>
		
		<!-- 歌词区域 -->
		<view class="lyrics-section" v-if="showLyrics">
			<scroll-view 
				class="lyrics-scroll" 
				scroll-y 
				:scroll-top="lyricsScrollTop"
				:scroll-with-animation="true"
			>
				<view class="lyrics-list">
					<view 
						class="lyric-line" 
						v-for="(line, index) in lyrics" 
						:key="index"
						:class="{ 'active': currentLyricIndex === index }"
					>
						{{ line.text }}
					</view>
					<view class="lyrics-end">- END -</view>
				</view>
			</scroll-view>
		</view>
		
		<!-- 操作栏 -->
		<view class="action-bar">
			<text class="action-icon" :class="{ 'active': isFavorite(currentSong?.id) }" @click="toggleFavorite(currentSong)">
				{{ isFavorite(currentSong?.id) ? '❤️' : '🤍' }}
			</text>
			<text class="action-icon" @click="downloadSong">⬇️</text>
			<text class="action-icon" @click="comment">💬</text>
			<text class="action-icon" @click="toggleLyrics">📄</text>
		</view>
		
		<!-- 进度条 -->
		<view class="progress-section">
			<text class="time-text">{{ formatTime(currentTime) }}</text>
			<slider 
				class="progress-slider" 
				:value="currentTime" 
				:max="duration || 100" 
				:block-size="12"
				activeColor="#fff"
				backgroundColor="rgba(255, 255, 255, 0.3)"
				@changing="onSliderChanging"
				@change="onSliderChange"
			/>
			<text class="time-text">{{ formatTime(duration) }}</text>
		</view>
		
		<!-- 控制栏 -->
		<view class="control-section">
			<view class="control-btn" @click="togglePlayMode">
				<text class="control-icon">{{ playModeIcon }}</text>
			</view>
			<view class="control-btn" @click="playPrevious">
				<text class="control-icon large">⏮</text>
			</view>
			<view class="control-btn play-btn" @click="togglePlay">
				<text class="control-icon extra-large">{{ isPlaying ? '⏸' : '▶' }}</text>
			</view>
			<view class="control-btn" @click="playNext">
				<text class="control-icon large">⏭</text>
			</view>
			<view class="control-btn" @click="showPlaylist">
				<text class="control-icon">📑</text>
			</view>
		</view>
		
		<!-- 播放列表弹窗 -->
		<Playlist :visible="playlistVisible" @close="playlistVisible = false" />
	</view>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import Playlist from '@/components/Playlist.vue'

export default {
	components: {
		Playlist
	},
	data() {
		return {
			bgColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
			lyrics: [],
			currentLyricIndex: 0,
			lyricsScrollTop: 0,
			showLyrics: false,
			loadingLyrics: false,
			playlistVisible: false
		}
	},
	computed: {
		...mapState(['currentSong', 'isPlaying', 'currentTime', 'duration', 'playMode', 'audioContext']),
		...mapGetters(['isFavorite']),
		
		playModeIcon() {
			const icons = ['🔁', '🔂', '🔀']
			return icons[this.playMode]
		}
	},
	watch: {
		currentSong(newSong) {
			if (newSong) {
				this.loadLyrics(newSong.id)
			}
		},
		currentTime() {
			this.updateCurrentLyric()
		}
	},
	onLoad() {
		if (this.currentSong) {
			this.loadLyrics(this.currentSong.id)
		}
		
		// 监听音频上下文更新
		if (this.audioContext) {
			this.audioContext.onTimeUpdate(() => {
				this.$store.commit('SET_CURRENT_TIME', this.audioContext.currentTime)
				this.$store.commit('SET_DURATION', this.audioContext.duration)
			})
		}
	},
	methods: {
		...mapActions(['togglePlay', 'playNext', 'playPrevious', 'togglePlayMode', 'toggleFavorite']),
		
		goBack() {
			uni.navigateBack()
		},
		
		share() {
			uni.showActionSheet({
				itemList: ['分享到微信', '分享到QQ', '复制链接'],
				success: (res) => {
					uni.showToast({
						title: '分享功能待开发',
						icon: 'none'
					})
				}
			})
		},
		
		downloadSong() {
			uni.showToast({
				title: '下载功能待开发',
				icon: 'none'
			})
		},
		
		comment() {
			uni.showToast({
				title: '评论功能待开发',
				icon: 'none'
			})
		},
		
		toggleLyrics() {
			this.showLyrics = !this.showLyrics
		},
		
		showPlaylist() {
			this.playlistVisible = true
		},
		
		// 加载歌词
		async loadLyrics(songId) {
			this.loadingLyrics = true
			this.lyrics = []
			this.currentLyricIndex = 0
			
			try {
				const res = await uni.request({
					url: 'http://music.163.com/api/song/lyric',
					method: 'GET',
					data: {
						id: songId,
						lv: -1,
						kv: -1,
						tv: -1
					},
					header: {
						'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
						'Referer': 'http://music.163.com/'
					}
				})
				
				if (res.statusCode === 200 && res.data && res.data.lrc && res.data.lrc.lyric) {
					this.parseLyrics(res.data.lrc.lyric)
				}
			} catch (error) {
				console.error('加载歌词错误:', error)
			} finally {
				this.loadingLyrics = false
			}
		},
		
		// 解析歌词
		parseLyrics(lrcText) {
			const lines = lrcText.split('\n')
			const lyricsArray = []
			
			const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g
			
			lines.forEach(line => {
				const matches = [...line.matchAll(timeRegex)]
				if (matches.length > 0) {
					const text = line.replace(timeRegex, '').trim()
					if (text) {
						matches.forEach(match => {
							const minutes = parseInt(match[1])
							const seconds = parseInt(match[2])
							const milliseconds = parseInt(match[3])
							const time = minutes * 60 + seconds + milliseconds / (match[3].length === 2 ? 100 : 1000)
							
							lyricsArray.push({
								time: time,
								text: text
							})
						})
					}
				}
			})
			
			lyricsArray.sort((a, b) => a.time - b.time)
			this.lyrics = lyricsArray
		},
		
		// 更新当前歌词
		updateCurrentLyric() {
			if (this.lyrics.length === 0) return
			
			for (let i = 0; i < this.lyrics.length; i++) {
				if (this.currentTime < this.lyrics[i].time) {
					this.currentLyricIndex = i - 1
					if (this.currentLyricIndex >= 0) {
						this.lyricsScrollTop = this.currentLyricIndex * 80 - 200
					}
					return
				}
			}
			this.currentLyricIndex = this.lyrics.length - 1
		},
		
		// 进度条拖动中
		onSliderChanging(e) {
			this.$store.commit('SET_CURRENT_TIME', e.detail.value)
		},
		
		// 进度条拖动结束
		onSliderChange(e) {
			if (this.audioContext) {
				this.audioContext.seek(e.detail.value)
			}
		},
		
		// 格式化时间
		formatTime(seconds) {
			if (isNaN(seconds) || seconds === 0) return '00:00'
			const mins = Math.floor(seconds / 60)
			const secs = Math.floor(seconds % 60)
			return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
		}
	}
}
</script>

<style scoped>
.player-page {
	min-height: 100vh;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	padding: 40rpx 30rpx;
	display: flex;
	flex-direction: column;
	color: white;
}

/* 顶部栏 */
.top-bar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 60rpx;
}

.back-icon, .share-icon {
	font-size: 40rpx;
	padding: 10rpx;
}

.song-title {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 5rpx;
}

.title {
	font-size: 32rpx;
	font-weight: bold;
}

.subtitle {
	font-size: 24rpx;
	opacity: 0.8;
}

/* 封面区域 */
.cover-section {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 60rpx 0;
}

.cover-container {
	width: 550rpx;
	height: 550rpx;
	position: relative;
}

.cover-container.rotating .cover-image {
	animation: rotate 20s linear infinite;
}

@keyframes rotate {
	from { transform: rotate(0deg); }
	to { transform: rotate(360deg); }
}

.cover-image {
	width: 100%;
	height: 100%;
	border-radius: 50%;
	box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.3);
}

.cover-disc {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	width: 180rpx;
	height: 180rpx;
	border-radius: 50%;
	background: rgba(0, 0, 0, 0.5);
	backdrop-filter: blur(10rpx);
}

/* 歌词区域 */
.lyrics-section {
	position: absolute;
	top: 300rpx;
	left: 0;
	right: 0;
	bottom: 400rpx;
	background: rgba(0, 0, 0, 0.3);
	backdrop-filter: blur(20rpx);
	border-radius: 30rpx;
	margin: 0 30rpx;
	overflow: hidden;
}

.lyrics-scroll {
	height: 100%;
	padding: 40rpx 0;
}

.lyrics-list {
	padding: 0 40rpx;
}

.lyric-line {
	text-align: center;
	padding: 20rpx 0;
	font-size: 28rpx;
	color: rgba(255, 255, 255, 0.5);
	line-height: 1.6;
	transition: all 0.3s;
}

.lyric-line.active {
	font-size: 36rpx;
	color: white;
	font-weight: bold;
	transform: scale(1.1);
}

.lyrics-end {
	text-align: center;
	padding: 40rpx 0;
	font-size: 24rpx;
	color: rgba(255, 255, 255, 0.3);
}

/* 操作栏 */
.action-bar {
	display: flex;
	justify-content: space-around;
	padding: 40rpx 0;
}

.action-icon {
	font-size: 48rpx;
	padding: 10rpx;
	opacity: 0.8;
	transition: all 0.3s;
}

.action-icon.active {
	opacity: 1;
	transform: scale(1.2);
}

/* 进度条 */
.progress-section {
	display: flex;
	align-items: center;
	gap: 20rpx;
	margin-bottom: 40rpx;
}

.time-text {
	font-size: 22rpx;
	width: 80rpx;
	text-align: center;
	opacity: 0.8;
}

.progress-slider {
	flex: 1;
}

/* 控制栏 */
.control-section {
	display: flex;
	justify-content: space-around;
	align-items: center;
	padding: 20rpx 0;
}

.control-btn {
	width: 90rpx;
	height: 90rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.2);
	backdrop-filter: blur(10rpx);
	transition: all 0.3s;
}

.control-btn:active {
	transform: scale(0.95);
	background: rgba(255, 255, 255, 0.3);
}

.play-btn {
	width: 120rpx;
	height: 120rpx;
	background: rgba(255, 255, 255, 0.9);
}

.control-icon {
	font-size: 36rpx;
	color: white;
}

.control-icon.large {
	font-size: 44rpx;
}

.control-icon.extra-large {
	font-size: 56rpx;
	color: #667eea;
}

.play-btn .control-icon {
	color: #667eea;
}
</style>

