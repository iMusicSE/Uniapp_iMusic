<template>
	<view class="mini-player" v-if="showPlayer" @click="goToPlayer">
		<view class="player-content">
			<!-- 封面/图标 -->
			<image v-if="!isRadioMode" class="cover" :src="currentSong.albumPic" mode="aspectFill"></image>
			<view v-else class="radio-icon">📻</view>
			
			<!-- 歌曲/电台信息 -->
			<view class="song-info">
				<text class="song-name">{{ displayName }}</text>
				<text class="artist-name">{{ displayArtist }}</text>
			</view>
			
			<!-- 播放控制 -->
			<view class="controls">
				<view class="control-btn" @click.stop="togglePlay">
					<text class="icon">{{ isPlaying ? '⏸' : '▶' }}</text>
				</view>
				<view v-if="!isRadioMode" class="control-btn" @click.stop="playNext">
					<text class="icon">⏭</text>
				</view>
				<view v-else class="control-btn" @click.stop="stopRadio">
					<text class="icon">⏹</text>
				</view>
			</view>
		</view>
		
		<!-- 进度条 (只在音乐模式显示) -->
		<view v-if="!isRadioMode" class="progress-bar">
			<view class="progress" :style="{ width: progressPercent + '%' }"></view>
		</view>
	</view>
</template>

<script>
import { mapState, mapActions } from 'vuex'

export default {
	name: 'MiniPlayer',
	computed: {
		...mapState('player', [
			'currentSong', 
			'isPlaying', 
			'currentTime', 
			'duration',
			'isRadioMode',
			'currentRadio'
		]),
		
		// 是否显示播放器
		showPlayer() {
			return this.currentSong || this.currentRadio
		},
		
		// 显示的名称
		displayName() {
			if (this.isRadioMode && this.currentRadio) {
				return this.currentRadio.name
			}
			return this.currentSong ? this.currentSong.name : ''
		},
		
		// 显示的艺术家/电台信息
		displayArtist() {
			if (this.isRadioMode && this.currentRadio) {
				return `${this.currentRadio.country || ''} ${this.currentRadio.bitrate || ''}kbps`
			}
			return this.currentSong ? this.currentSong.artistName : ''
		},
		
		progressPercent() {
			if (this.duration === 0) return 0
			return (this.currentTime / this.duration) * 100
		}
	},
	methods: {
		...mapActions('player', [
			'togglePlay',
			'playNext',
			'stopRadio'
		]),
		
		goToPlayer() {
		  if (this.isRadioMode) {
		    // 电台模式下，可以跳转到播放器页面展示电台信息
		    uni.navigateTo({
		      url: '/pages/player/player?radioMode=true'
		    })
		    return
		  }
		  
		  if (!this.currentSong) return;
		
		  uni.navigateTo({
		    url: `/pages/player/player?song=${encodeURIComponent(JSON.stringify(this.currentSong))}`
		  })
		}
	}
}
</script>

<style scoped>
.mini-player {
	position: fixed;
	bottom: 100rpx;
	left: 0;
	right: 0;
	background: rgba(255, 255, 255, 0.98);
	backdrop-filter: blur(20rpx);
	box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.1);
	z-index: 999;
}

.player-content {
	display: flex;
	align-items: center;
	padding: 20rpx 30rpx;
	gap: 20rpx;
}

.cover {
	width: 80rpx;
	height: 80rpx;
	border-radius: 12rpx;
	flex-shrink: 0;
}

.radio-icon {
	width: 80rpx;
	height: 80rpx;
	border-radius: 12rpx;
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	font-size: 40rpx;
	animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
	0%, 100% {
		transform: scale(1);
	}
	50% {
		transform: scale(1.05);
	}
}

.song-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 8rpx;
	overflow: hidden;
}

.song-name {
	font-size: 28rpx;
	color: #333;
	font-weight: 500;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.artist-name {
	font-size: 22rpx;
	color: #999;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.controls {
	display: flex;
	align-items: center;
	gap: 30rpx;
}

.control-btn {
	width: 60rpx;
	height: 60rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.icon {
	font-size: 32rpx;
	color: #333;
}

.progress-bar {
	height: 4rpx;
	background: #f0f0f0;
	position: relative;
}

.progress {
	height: 100%;
	background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
	transition: width 0.3s ease;
}
</style>

