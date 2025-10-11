<template>
	<view class="container">
		<!-- 搜索区域 -->
		<view class="search-section">
			<view class="search-box">
				<input 
					class="search-input" 
					v-model="keyword" 
					placeholder="请输入歌曲名称或歌手"
					@confirm="searchMusic"
				/>
				<button class="search-btn" @click="searchMusic" :disabled="searching">
					{{ searching ? '搜索中...' : '搜索' }}
				</button>
			</view>
		</view>

		<!-- 搜索结果列表 -->
		<view class="result-section" v-if="searchResults.length > 0">
			<view class="section-title">搜索结果 (点击播放)</view>
			<scroll-view class="result-list" scroll-y>
				<view 
					class="result-item" 
					v-for="(song, index) in searchResults" 
					:key="song.id"
					@click="playSong(song, index)"
					:class="{ 'active': currentSong && currentSong.id === song.id }"
				>
					<view class="song-index">{{ index + 1 }}</view>
					<view class="song-info">
						<text class="song-name">{{ song.name }}</text>
						<text class="song-artist">{{ song.artistName }}</text>
					</view>
					<view class="song-album">{{ song.albumName }}</view>
				</view>
			</scroll-view>
		</view>

		<!-- 播放器区域 -->
		<view class="player-section" v-if="currentSong">
			<!-- 歌曲信息 -->
			<view class="now-playing">
				<view class="song-cover">
					<image :src="currentSong.albumPic" mode="aspectFill"></image>
				</view>
				<view class="song-detail">
					<text class="playing-name">{{ currentSong.name }}</text>
					<text class="playing-artist">{{ currentSong.artistName }}</text>
				</view>
			</view>

			<!-- 歌词显示区域 -->
			<view class="lyrics-section" v-if="lyrics.length > 0">
				<scroll-view 
					class="lyrics-scroll" 
					scroll-y 
					:scroll-top="lyricsScrollTop"
					:scroll-with-animation="true"
				>
					<view class="lyrics-container">
						<view 
							class="lyric-line" 
							v-for="(line, index) in lyrics" 
							:key="index"
							:class="{ 'active': currentLyricIndex === index }"
							:id="'lyric-' + index"
						>
							{{ line.text }}
						</view>
					</view>
				</scroll-view>
			</view>
			<view class="no-lyrics" v-else>
				<text>{{ loadingLyrics ? '加载歌词中...' : '暂无歌词' }}</text>
			</view>

			<!-- 播放进度条 -->
			<view class="progress-section">
				<text class="time">{{ formatTime(currentTime) }}</text>
				<slider 
					class="progress-slider" 
					:value="currentTime" 
					:max="duration" 
					:block-size="12"
					activeColor="#1890ff"
					backgroundColor="#e5e5e5"
					@changing="onSliderChanging"
					@change="onSliderChange"
				/>
				<text class="time">{{ formatTime(duration) }}</text>
			</view>

			<!-- 播放控制按钮 -->
			<view class="control-section">
				<view class="control-btn" @click="previousSong">
					<text class="iconfont">⏮</text>
				</view>
				<view class="control-btn play-btn" @click="togglePlay">
					<text class="iconfont">{{ isPlaying ? '⏸' : '▶' }}</text>
				</view>
				<view class="control-btn" @click="nextSong">
					<text class="iconfont">⏭</text>
				</view>
			</view>
		</view>

		<!-- 空状态 -->
		<view class="empty-state" v-else>
			<image class="empty-icon" src="/static/logo.png"></image>
			<text class="empty-text">搜索音乐，开始播放</text>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			keyword: '',
			searching: false,
			searchResults: [],
			currentSong: null,
			currentSongIndex: 0,
			isPlaying: false,
			currentTime: 0,
			duration: 0,
			lyrics: [],
			currentLyricIndex: 0,
			loadingLyrics: false,
			lyricsScrollTop: 0,
			innerAudioContext: null,
			progressTimer: null
		}
	},
	onLoad() {
		// 创建音频上下文
		this.innerAudioContext = uni.createInnerAudioContext();
		
		// 监听音频播放事件
		this.innerAudioContext.onPlay(() => {
			this.isPlaying = true;
			this.startProgressTimer();
		});
		
		this.innerAudioContext.onPause(() => {
			this.isPlaying = false;
			this.stopProgressTimer();
		});
		
		this.innerAudioContext.onEnded(() => {
			this.isPlaying = false;
			this.stopProgressTimer();
			// 自动播放下一首
			this.nextSong();
		});
		
		this.innerAudioContext.onError((res) => {
			console.error('音频播放错误:', res);
			uni.showToast({
				title: '播放失败，可能需要VIP',
				icon: 'none'
			});
			this.isPlaying = false;
			this.stopProgressTimer();
		});
		
		this.innerAudioContext.onTimeUpdate(() => {
			this.currentTime = this.innerAudioContext.currentTime;
			this.duration = this.innerAudioContext.duration;
			// 更新歌词
			this.updateCurrentLyric();
		});
	},
	onUnload() {
		// 页面卸载时销毁音频上下文
		if (this.innerAudioContext) {
			this.innerAudioContext.destroy();
		}
		this.stopProgressTimer();
	},
	methods: {
		// 搜索音乐
		async searchMusic() {
			if (!this.keyword.trim()) {
				uni.showToast({
					title: '请输入搜索关键词',
					icon: 'none'
				});
				return;
			}
			
			this.searching = true;
			
			try {
				const res = await uni.request({
					url: 'http://music.163.com/api/search/get/web',
					method: 'GET',
					data: {
						s: this.keyword,
						type: 1,
						offset: 0,
						limit: 20
					},
					header: {
						'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
						'Referer': 'http://music.163.com/'
					}
				});
				
				// 检查响应状态
				if (res.statusCode !== 200) {
					console.error('搜索错误: 状态码', res.statusCode);
					uni.showToast({
						title: '搜索失败，请重试',
						icon: 'none'
					});
					return;
				}
				
				// 解析响应数据
				const data = res.data;
				
				if (data.code === 200 && data.result) {
					const songs = data.result.songs || [];
					this.searchResults = songs.map(song => ({
						id: song.id,
						name: song.name,
						artistName: song.artists.map(artist => artist.name).join(', '),
						albumName: song.album.name,
						albumPic: song.album.picUrl || song.album.blurPicUrl || '/static/logo.png',
						url: `http://music.163.com/song/media/outer/url?id=${song.id}.mp3`
					}));
					
					if (this.searchResults.length === 0) {
						uni.showToast({
							title: '未找到相关歌曲',
							icon: 'none'
						});
					}
				} else {
					uni.showToast({
						title: '未找到相关歌曲',
						icon: 'none'
					});
				}
			} catch (error) {
				console.error('搜索异常:', error);
				uni.showToast({
					title: '搜索出错',
					icon: 'none'
				});
			} finally {
				this.searching = false;
			}
		},
		
		// 播放歌曲
		playSong(song, index) {
			this.currentSong = song;
			this.currentSongIndex = index;
			this.innerAudioContext.src = song.url;
			this.innerAudioContext.title = song.name;
			this.innerAudioContext.play();
			
			// 加载歌词
			this.loadLyrics(song.id);
		},
		
		// 加载歌词
		async loadLyrics(songId) {
			this.loadingLyrics = true;
			this.lyrics = [];
			this.currentLyricIndex = 0;
			
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
				});
				
				// 检查响应并解析歌词
				if (res.statusCode === 200 && res.data && res.data.lrc && res.data.lrc.lyric) {
					this.parseLyrics(res.data.lrc.lyric);
				}
			} catch (error) {
				console.error('加载歌词错误:', error);
			} finally {
				this.loadingLyrics = false;
			}
		},
		
		// 解析歌词
		parseLyrics(lrcText) {
			const lines = lrcText.split('\n');
			const lyricsArray = [];
			
			const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g;
			
			lines.forEach(line => {
				const matches = [...line.matchAll(timeRegex)];
				if (matches.length > 0) {
					const text = line.replace(timeRegex, '').trim();
					if (text) {
						matches.forEach(match => {
							const minutes = parseInt(match[1]);
							const seconds = parseInt(match[2]);
							const milliseconds = parseInt(match[3]);
							const time = minutes * 60 + seconds + milliseconds / (match[3].length === 2 ? 100 : 1000);
							
							lyricsArray.push({
								time: time,
								text: text
							});
						});
					}
				}
			});
			
			// 按时间排序
			lyricsArray.sort((a, b) => a.time - b.time);
			this.lyrics = lyricsArray;
		},
		
		// 更新当前歌词
		updateCurrentLyric() {
			if (this.lyrics.length === 0) return;
			
			for (let i = 0; i < this.lyrics.length; i++) {
				if (this.currentTime < this.lyrics[i].time) {
					this.currentLyricIndex = i - 1;
					// 滚动到当前歌词
					if (this.currentLyricIndex >= 0) {
						this.lyricsScrollTop = this.currentLyricIndex * 80 - 150;
					}
					return;
				}
			}
			this.currentLyricIndex = this.lyrics.length - 1;
		},
		
		// 切换播放/暂停
		togglePlay() {
			if (this.isPlaying) {
				this.innerAudioContext.pause();
			} else {
				this.innerAudioContext.play();
			}
		},
		
		// 上一首
		previousSong() {
			if (this.searchResults.length === 0) return;
			
			let newIndex = this.currentSongIndex - 1;
			if (newIndex < 0) {
				newIndex = this.searchResults.length - 1;
			}
			this.playSong(this.searchResults[newIndex], newIndex);
		},
		
		// 下一首
		nextSong() {
			if (this.searchResults.length === 0) return;
			
			let newIndex = this.currentSongIndex + 1;
			if (newIndex >= this.searchResults.length) {
				newIndex = 0;
			}
			this.playSong(this.searchResults[newIndex], newIndex);
		},
		
		// 进度条拖动中
		onSliderChanging(e) {
			this.currentTime = e.detail.value;
		},
		
		// 进度条拖动结束
		onSliderChange(e) {
			this.innerAudioContext.seek(e.detail.value);
		},
		
		// 格式化时间
		formatTime(seconds) {
			if (isNaN(seconds) || seconds === 0) return '00:00';
			const mins = Math.floor(seconds / 60);
			const secs = Math.floor(seconds % 60);
			return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
		},
		
		// 开始进度定时器
		startProgressTimer() {
			this.stopProgressTimer();
			this.progressTimer = setInterval(() => {
				if (this.innerAudioContext) {
					this.currentTime = this.innerAudioContext.currentTime;
					this.duration = this.innerAudioContext.duration;
				}
			}, 500);
		},
		
		// 停止进度定时器
		stopProgressTimer() {
			if (this.progressTimer) {
				clearInterval(this.progressTimer);
				this.progressTimer = null;
			}
		}
	}
}
</script>

<style scoped>
.container {
	display: flex;
	flex-direction: column;
	height: 100vh;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* 搜索区域 */
.search-section {
	padding: 30rpx 30rpx 20rpx;
	background: rgba(255, 255, 255, 0.95);
	box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.search-box {
	display: flex;
	align-items: center;
	gap: 20rpx;
}

.search-input {
	flex: 1;
	height: 80rpx;
	padding: 0 30rpx;
	background: #f5f5f5;
	border-radius: 40rpx;
	font-size: 28rpx;
}

.search-btn {
	width: 140rpx;
	height: 80rpx;
	line-height: 80rpx;
	background: #1890ff;
	color: white;
	border-radius: 40rpx;
	font-size: 28rpx;
	text-align: center;
	padding: 0;
	margin: 0;
}

.search-btn:disabled {
	background: #ccc;
}

/* 搜索结果区域 */
.result-section {
	flex: 1;
	display: flex;
	flex-direction: column;
	background: rgba(255, 255, 255, 0.95);
	margin: 20rpx;
	border-radius: 20rpx;
	overflow: hidden;
	box-shadow: 0 4rpx 15rpx rgba(0, 0, 0, 0.1);
}

.section-title {
	padding: 30rpx;
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
	border-bottom: 2rpx solid #f0f0f0;
}

.result-list {
	flex: 1;
	padding: 0 20rpx;
}

.result-item {
	display: flex;
	align-items: center;
	padding: 25rpx 20rpx;
	border-bottom: 1rpx solid #f0f0f0;
	transition: background 0.3s;
}

.result-item.active {
	background: #e6f7ff;
}

.song-index {
	width: 60rpx;
	font-size: 28rpx;
	color: #999;
	text-align: center;
}

.song-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 10rpx;
	margin: 0 20rpx;
}

.song-name {
	font-size: 30rpx;
	color: #333;
	font-weight: 500;
}

.song-artist {
	font-size: 24rpx;
	color: #999;
}

.song-album {
	font-size: 24rpx;
	color: #999;
	max-width: 150rpx;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

/* 播放器区域 */
.player-section {
	background: rgba(255, 255, 255, 0.95);
	margin: 20rpx;
	border-radius: 20rpx;
	padding: 30rpx;
	box-shadow: 0 4rpx 15rpx rgba(0, 0, 0, 0.1);
}

.now-playing {
	display: flex;
	align-items: center;
	gap: 30rpx;
	margin-bottom: 30rpx;
}

.song-cover {
	width: 120rpx;
	height: 120rpx;
	border-radius: 15rpx;
	overflow: hidden;
	box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.2);
}

.song-cover image {
	width: 100%;
	height: 100%;
}

.song-detail {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 15rpx;
}

.playing-name {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
}

.playing-artist {
	font-size: 26rpx;
	color: #666;
}

/* 歌词区域 */
.lyrics-section {
	height: 300rpx;
	margin-bottom: 30rpx;
}

.lyrics-scroll {
	height: 100%;
}

.lyrics-container {
	padding: 20rpx 0;
}

.lyric-line {
	text-align: center;
	padding: 15rpx 20rpx;
	font-size: 26rpx;
	color: #999;
	transition: all 0.3s;
	line-height: 1.5;
}

.lyric-line.active {
	font-size: 32rpx;
	color: #1890ff;
	font-weight: bold;
}

.no-lyrics {
	height: 300rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	color: #999;
	font-size: 28rpx;
}

/* 进度条 */
.progress-section {
	display: flex;
	align-items: center;
	gap: 20rpx;
	margin-bottom: 30rpx;
}

.time {
	font-size: 22rpx;
	color: #999;
	width: 80rpx;
	text-align: center;
}

.progress-slider {
	flex: 1;
}

/* 控制按钮 */
.control-section {
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 80rpx;
}

.control-btn {
	width: 80rpx;
	height: 80rpx;
	border-radius: 50%;
	background: #f5f5f5;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
	transition: all 0.3s;
}

.control-btn:active {
	transform: scale(0.95);
	box-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.1);
}

.play-btn {
	width: 100rpx;
	height: 100rpx;
	background: #1890ff;
}

.play-btn .iconfont {
	color: white;
	font-size: 40rpx;
}

.control-btn .iconfont {
	font-size: 36rpx;
	color: #333;
}

/* 空状态 */
.empty-state {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 40rpx;
}

.empty-icon {
	width: 200rpx;
	height: 200rpx;
	opacity: 0.5;
}

.empty-text {
	font-size: 32rpx;
	color: rgba(255, 255, 255, 0.8);
}
</style>
