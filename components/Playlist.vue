<template>
	<view class="playlist-mask" v-if="visible" @click="close">
		<view class="playlist-container" @click.stop>
			<!-- 头部 -->
			<view class="playlist-header">
				<view class="header-left">
					<text class="title">播放列表</text>
					<text class="count">({{ playlist.length }})</text>
				</view>
				<view class="header-right">
					<view class="mode-btn" @click="togglePlayMode">
						<text class="mode-icon">{{ playModeIcon }}</text>
						<text class="mode-text">{{ playModeText }}</text>
					</view>
					<view class="clear-btn" @click="clearPlaylist">
						<text class="icon">🗑️</text>
					</view>
				</view>
			</view>
			
			<!-- 列表内容 -->
			<scroll-view class="playlist-scroll" scroll-y>
				<view 
					class="song-item" 
					v-for="(song, index) in playlist" 
					:key="song.id"
					:class="{ 'active': currentIndex === index }"
					@click="playSongByIndex(index)"
				>
					<!-- 左侧：播放中图标或序号 -->
					<view class="song-left">
						<text v-if="currentIndex === index && isPlaying" class="playing-icon">🎵</text>
						<text v-else class="song-index">{{ index + 1 }}</text>
					</view>
					
					<!-- 中间：歌曲信息 -->
					<view class="song-info">
						<view class="song-name-row">
							<text class="song-name" :class="{ 'active-text': currentIndex === index }">
								{{ song.name }}
							</text>
							<text class="vip-tag" v-if="song.vip">VIP</text>
						</view>
						<text class="song-artist">{{ song.artistName }}</text>
					</view>
					
					<!-- 右侧：删除按钮 -->
					<view class="song-actions">
						<view class="action-btn" @click.stop="removeSong(index)">
							<text class="remove-icon">×</text>
						</view>
					</view>
				</view>
				
				<!-- 空状态 -->
				<view class="empty-state" v-if="playlist.length === 0">
					<text class="empty-icon">🎵</text>
					<text class="empty-text">播放列表为空</text>
					<text class="empty-hint">快去搜索你喜欢的音乐吧</text>
				</view>
			</scroll-view>
			
			<!-- 底部关闭按钮 -->
			<view class="playlist-footer">
				<view class="close-btn" @click="close">
					<text>关闭</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { mapState, mapActions } from 'vuex'

export default {
	name: 'Playlist',
	props: {
		visible: {
			type: Boolean,
			default: false
		}
	},
	computed: {
		...mapState('player', ['playlist', 'currentIndex', 'playMode', 'isPlaying']),
		
		playModeIcon() {
			const icons = ['🔁', '🔂', '🔀']
			return icons[this.playMode]
		},
		
		playModeText() {
			const texts = ['列表循环', '单曲循环', '随机播放']
			return texts[this.playMode]
		}
	},
	methods: {
		...mapActions({
			togglePlayMode: 'player/togglePlayMode',
			playSong: 'player/playSong'
		}),
		
		close() {
			this.$emit('close')
		},
		
		// 播放指定索引的歌曲
		playSongByIndex(index) {
			if (index === this.currentIndex && this.isPlaying) {
				// 如果点击当前正在播放的歌曲，则暂停
				this.$store.dispatch('player/togglePlay')
			} else {
				// 播放指定歌曲
				this.$store.commit('player/SET_CURRENT_INDEX', index)
				const song = this.playlist[index]
				this.playSong({ song })
			}
		},
		
		// 从播放列表移除歌曲
		removeSong(index) {
			this.$store.dispatch('player/removeFromPlaylist', index)
		},
		
		// 清空播放列表
		clearPlaylist() {
			uni.showModal({
				title: '提示',
				content: '确定要清空播放列表吗？',
				success: (res) => {
					if (res.confirm) {
						this.$store.dispatch('player/clearPlaylist')
						this.close()
					}
				}
			})
		}
	}
}
</script>

<style scoped>
.playlist-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	z-index: 9999;
	display: flex;
	flex-direction: column;
	justify-content: flex-end;
}

.playlist-container {
	background: white;
	border-radius: 30rpx 30rpx 0 0;
	max-height: 80vh;
	display: flex;
	flex-direction: column;
	animation: slideUp 0.3s ease;
}

@keyframes slideUp {
	from {
		transform: translateY(100%);
	}
	to {
		transform: translateY(0);
	}
}

/* 头部 */
.playlist-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 30rpx;
	border-bottom: 1rpx solid #f0f0f0;
}

.header-left {
	display: flex;
	align-items: center;
	gap: 10rpx;
}

.title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
}

.count {
	font-size: 24rpx;
	color: #999;
}

.header-right {
	display: flex;
	align-items: center;
	gap: 30rpx;
}

.mode-btn {
	display: flex;
	align-items: center;
	gap: 8rpx;
	padding: 8rpx 16rpx;
	background: #f5f5f5;
	border-radius: 20rpx;
}

.mode-icon {
	font-size: 28rpx;
}

.mode-text {
	font-size: 24rpx;
	color: #666;
}

.clear-btn {
	padding: 8rpx;
}

.icon {
	font-size: 32rpx;
}

/* 列表内容 */
.playlist-scroll {
	flex: 1;
	overflow-y: auto;
}

.song-item {
	display: flex;
	align-items: center;
	padding: 20rpx 30rpx;
	gap: 20rpx;
	transition: background 0.2s;
}

.song-item:active {
	background: #f5f5f5;
}

.song-item.active {
	background: #f0f7ff;
}

.song-left {
	width: 60rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.playing-icon {
	font-size: 32rpx;
	animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
	0%, 100% {
		opacity: 1;
		transform: scale(1);
	}
	50% {
		opacity: 0.7;
		transform: scale(0.95);
	}
}

.song-index {
	font-size: 24rpx;
	color: #999;
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
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.song-name.active-text {
	color: #667eea;
	font-weight: 500;
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
}

.action-btn {
	width: 50rpx;
	height: 50rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.remove-icon {
	font-size: 48rpx;
	color: #999;
	font-weight: 300;
	line-height: 1;
}

/* 空状态 */
.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 100rpx 0;
	gap: 20rpx;
}

.empty-icon {
	font-size: 100rpx;
	opacity: 0.3;
}

.empty-text {
	font-size: 32rpx;
	color: #666;
}

.empty-hint {
	font-size: 24rpx;
	color: #999;
}

/* 底部关闭按钮 */
.playlist-footer {
	padding: 30rpx;
	border-top: 1rpx solid #f0f0f0;
}

.close-btn {
	width: 100%;
	height: 80rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #667eea;
	color: white;
	font-size: 30rpx;
	border-radius: 40rpx;
	transition: all 0.3s;
}

.close-btn:active {
	opacity: 0.8;
	transform: scale(0.98);
}
</style>

