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
	computed: {
		...mapState(['currentSong']),
		...mapGetters(['isFavorite'])
	},
	methods: {
		...mapActions(['playSong', 'toggleFavorite']),
		
		handlePlay(song, index) {
			this.playSong({
				song,
				playlist: this.songs
			})
		},
		
		showMore(song) {
			uni.showActionSheet({
				itemList: ['添加到播放列表', '查看专辑', '分享'],
				success: (res) => {
					if (res.tapIndex === 0) {
						uni.showToast({
							title: '功能待开发',
							icon: 'none'
						})
					}
				}
			})
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

