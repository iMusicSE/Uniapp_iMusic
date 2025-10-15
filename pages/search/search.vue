<template>
	<view class="search-page">
		<!-- 搜索框 -->
		<view class="search-header">
			<view class="search-box">
				<text class="search-icon">🔍</text>
				<input 
					class="search-input" 
					v-model="keyword" 
					placeholder="搜索歌曲、歌手、专辑"
					@confirm="handleSearch"
					confirm-type="search"
					focus
				/>
				<text class="clear-icon" v-if="keyword" @click="clearKeyword">✕</text>
			</view>
			<text class="search-btn" @click="handleSearch">搜索</text>
		</view>
		
		<!-- 搜索历史 -->
		<view class="search-history" v-if="!keyword && searchHistory.length > 0">
			<view class="history-header">
				<text class="history-title">搜索历史</text>
				<text class="clear-btn" @click="clearHistory">清空</text>
			</view>
			<view class="history-tags">
				<view 
					class="history-tag" 
					v-for="(item, index) in searchHistory" 
					:key="index"
					@click="selectHistory(item)"
				>
					{{ item }}
				</view>
			</view>
		</view>
		
		<!-- 热门搜索 -->
		<view class="hot-search" v-if="!keyword && !searching">
			<view class="hot-header">
				<text class="hot-title">热门搜索</text>
				<text class="refresh-icon" @click="refreshHotSearch">🔄</text>
			</view>
			<view class="hot-list">
				<view 
					class="hot-item" 
					v-for="(item, index) in hotSearchList" 
					:key="index"
					@click="selectHotSearch(item)"
				>
					<view class="hot-index" :class="{ 'top-three': index < 3 }">{{ index + 1 }}</view>
					<view class="hot-content">
						<text class="hot-keyword">{{ item.keyword }}</text>
						<text class="hot-desc" v-if="item.desc">{{ item.desc }}</text>
					</view>
					<text class="hot-tag" v-if="item.hot">🔥</text>
				</view>
			</view>
		</view>
		
		<!-- 搜索中 -->
		<view class="loading-state" v-if="searching">
			<text class="loading-text">搜索中...</text>
		</view>
		
		<!-- 搜索结果 -->
		<view class="search-results" v-if="keyword && !searching && searchResults.length > 0">
			<view class="result-tabs">
				<view 
					class="tab-item" 
					v-for="tab in tabs" 
					:key="tab.type"
					:class="{ 'active': currentTab === tab.type }"
					@click="switchTab(tab.type)"
				>
					{{ tab.name }}
				</view>
			</view>
			
			<!-- 歌曲列表 -->
			<view class="result-content" v-if="currentTab === 'song'">
				<SongList :songs="searchResults" :showCover="false" />
			</view>
			
			<!-- 其他类型待扩展 -->
			<view class="result-content" v-else>
				<view class="empty-tip">该功能待扩展</view>
			</view>
		</view>
		
		<!-- 无结果 -->
		<view class="empty-state" v-if="keyword && !searching && searchResults.length === 0">
			<text class="empty-icon">🔍</text>
			<text class="empty-text">未找到相关结果</text>
			<text class="empty-tip">换个关键词试试吧</text>
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
			keyword: '',
			searching: false,
			searchResults: [],
			searchHistory: [],
			hotSearchList: [
				{ keyword: '晴天', desc: '周杰伦', hot: true },
				{ keyword: '稻香', desc: '周杰伦', hot: true },
				{ keyword: '七里香', desc: '周杰伦', hot: false },
				{ keyword: '夜曲', desc: '周杰伦', hot: false },
				{ keyword: '青花瓷', desc: '周杰伦', hot: true },
				{ keyword: 'The Foggy Dew', desc: '爱尔兰民歌', hot: false },
				{ keyword: 'Clair de lune', desc: '德彪西', hot: false },
				{ keyword: '孤勇者', desc: '陈奕迅', hot: true }
			],
			currentTab: 'song',
			tabs: [
				{ type: 'song', name: '单曲' },
				{ type: 'artist', name: '歌手' },
				{ type: 'album', name: '专辑' },
				{ type: 'playlist', name: '歌单' }
			]
		}
	},
	onLoad() {
		this.loadSearchHistory()
	},
	methods: {
		// 搜索
		async handleSearch() {
			if (!this.keyword.trim()) {
				uni.showToast({
					title: '请输入搜索关键词',
					icon: 'none'
				})
				return
			}
			
			this.searching = true
			this.addToHistory(this.keyword)
			
			try {
				const res = await searchMusic(this.keyword, 0, 30)
				
				if (res.statusCode === 200 && res.data.result) {
					const songs = res.data.result.songs || []
					this.searchResults = songs.map(song => ({
						id: song.id,
						name: song.name,
						artistName: song.artists.map(artist => artist.name).join(', '),
						albumName: song.album.name,
						albumPic: song.album.picUrl || song.album.blurPicUrl || '/static/logo.png',
						url: `http://music.163.com/song/media/outer/url?id=${song.id}.mp3`,
						vip: song.fee === 1
					}))
				} else {
					this.searchResults = []
				}
			} catch (error) {
				console.error('搜索出错:', error)
				uni.showToast({
					title: '搜索失败',
					icon: 'none'
				})
			} finally {
				this.searching = false
			}
		},
		
		// 清空关键词
		clearKeyword() {
			this.keyword = ''
			this.searchResults = []
		},
		
		// 加载搜索历史
		loadSearchHistory() {
			const history = uni.getStorageSync('searchHistory')
			if (history) {
				this.searchHistory = history
			}
		},
		
		// 添加到搜索历史
		addToHistory(keyword) {
			// 移除已存在的
			this.searchHistory = this.searchHistory.filter(item => item !== keyword)
			// 添加到开头
			this.searchHistory.unshift(keyword)
			// 限制数量
			if (this.searchHistory.length > 10) {
				this.searchHistory = this.searchHistory.slice(0, 10)
			}
			// 保存
			uni.setStorageSync('searchHistory', this.searchHistory)
		},
		
		// 清空历史
		clearHistory() {
			uni.showModal({
				title: '提示',
				content: '确定清空搜索历史吗？',
				success: (res) => {
					if (res.confirm) {
						this.searchHistory = []
						uni.removeStorageSync('searchHistory')
					}
				}
			})
		},
		
		// 选择历史
		selectHistory(keyword) {
			this.keyword = keyword
			this.handleSearch()
		},
		
		// 选择热搜
		selectHotSearch(item) {
			this.keyword = item.keyword
			this.handleSearch()
		},
		
		// 刷新热搜
		refreshHotSearch() {
			uni.showToast({
				title: '热搜已刷新',
				icon: 'success'
			})
		},
		
		// 切换标签
		switchTab(type) {
			this.currentTab = type
			if (type !== 'song') {
				uni.showToast({
					title: '该功能待扩展',
					icon: 'none'
				})
			}
		}
	}
}
</script>

<style scoped>
.search-page {
	min-height: 100vh;
	background: #f5f5f5;
	padding-bottom: 200rpx;
}

/* 搜索头部 */
.search-header {
	display: flex;
	align-items: center;
	gap: 20rpx;
	padding: 20rpx 30rpx;
	background: white;
	box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.search-box {
	flex: 1;
	display: flex;
	align-items: center;
	gap: 15rpx;
	height: 70rpx;
	padding: 0 25rpx;
	background: #f5f5f5;
	border-radius: 35rpx;
}

.search-icon {
	font-size: 32rpx;
	color: #999;
}

.search-input {
	flex: 1;
	font-size: 28rpx;
	color: #333;
}

.clear-icon {
	font-size: 32rpx;
	color: #999;
	padding: 5rpx;
}

.search-btn {
	font-size: 28rpx;
	color: #667eea;
	padding: 0 10rpx;
}

/* 搜索历史 */
.search-history {
	background: white;
	margin-top: 20rpx;
	padding: 30rpx;
}

.history-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20rpx;
}

.history-title {
	font-size: 28rpx;
	font-weight: bold;
	color: #333;
}

.clear-btn {
	font-size: 24rpx;
	color: #999;
}

.history-tags {
	display: flex;
	flex-wrap: wrap;
	gap: 20rpx;
}

.history-tag {
	padding: 15rpx 30rpx;
	background: #f5f5f5;
	border-radius: 30rpx;
	font-size: 26rpx;
	color: #666;
}

/* 热门搜索 */
.hot-search {
	background: white;
	margin-top: 20rpx;
	padding: 30rpx;
}

.hot-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20rpx;
}

.hot-title {
	font-size: 28rpx;
	font-weight: bold;
	color: #333;
}

.refresh-icon {
	font-size: 32rpx;
	color: #999;
}

.hot-list {
	display: flex;
	flex-direction: column;
}

.hot-item {
	display: flex;
	align-items: center;
	gap: 20rpx;
	padding: 20rpx 0;
	border-bottom: 1rpx solid #f0f0f0;
}

.hot-item:last-child {
	border-bottom: none;
}

.hot-index {
	width: 50rpx;
	height: 50rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 24rpx;
	color: #999;
	font-weight: bold;
}

.hot-index.top-three {
	color: #ff6b6b;
}

.hot-content {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 5rpx;
}

.hot-keyword {
	font-size: 28rpx;
	color: #333;
}

.hot-desc {
	font-size: 22rpx;
	color: #999;
}

.hot-tag {
	font-size: 28rpx;
}

/* 加载状态 */
.loading-state {
	display: flex;
	justify-content: center;
	padding: 100rpx 0;
}

.loading-text {
	font-size: 28rpx;
	color: #999;
}

/* 搜索结果 */
.search-results {
	background: white;
	margin-top: 20rpx;
}

.result-tabs {
	display: flex;
	border-bottom: 1rpx solid #f0f0f0;
}

.tab-item {
	flex: 1;
	text-align: center;
	padding: 30rpx 0;
	font-size: 28rpx;
	color: #666;
	position: relative;
}

.tab-item.active {
	color: #667eea;
	font-weight: bold;
}

.tab-item.active::after {
	content: '';
	position: absolute;
	bottom: 0;
	left: 50%;
	transform: translateX(-50%);
	width: 60rpx;
	height: 4rpx;
	background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
	border-radius: 2rpx;
}

.result-content {
	min-height: 300rpx;
}

.empty-tip {
	text-align: center;
	padding: 100rpx 0;
	font-size: 28rpx;
	color: #999;
}

/* 空状态 */
.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 150rpx 0;
	gap: 20rpx;
}

.empty-icon {
	font-size: 120rpx;
	opacity: 0.3;
}

.empty-text {
	font-size: 32rpx;
	color: #666;
}

.empty-tip {
	font-size: 26rpx;
	color: #999;
}
</style>

