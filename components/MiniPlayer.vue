<template>
	<view class="mini-player" v-if="currentSong" @click="goToPlayer">
		<view class="player-content">
			<!-- 封面 -->
			<image class="cover" :src="currentSong.albumPic" mode="aspectFill"></image>
			
			<!-- 歌曲信息 -->
			<view class="song-info">
				<text class="song-name">{{ currentSong.name }}</text>
				<text class="artist-name">{{ currentSong.artistName }}</text>
			</view>
			
			<!-- 播放控制 -->
			<view class="controls">
				<view class="control-btn" @click.stop="togglePlay">
					<text class="icon">{{ isPlaying ? '⏸' : '▶' }}</text>
				</view>
				<view class="control-btn" @click.stop="playNext">
					<text class="icon">⏭</text>
				</view>
			</view>
		</view>
		
		<!-- 进度条 -->
		<view class="progress-bar">
			<view class="progress" :style="{ width: progressPercent + '%' }"></view>
		</view>
	</view>
</template>

<script>
import { mapState, mapActions } from 'vuex'

export default {
	name: 'MiniPlayer',
	computed: {
		...mapState('player', ['currentSong', 'isPlaying', 'currentTime', 'duration']),
		
		progressPercent() {
			if (this.duration === 0) return 0
			return (this.currentTime / this.duration) * 100
		}
	},
	methods: {
		...mapActions({
			togglePlay: 'player/togglePlay',
			playNext: 'player/playNext'
		}),
		
		goToPlayer() {
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

