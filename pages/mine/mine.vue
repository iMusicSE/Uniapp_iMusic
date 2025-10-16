<template>
	<view class="mine-page">
		<!-- 用户信息 -->
		<view class="user-section">
			<view class="user-header">
				<image class="avatar" :src="user.avatar || '/static/logo.png'" mode="aspectFill"></image>
				<view class="user-info">
					<text class="username">{{ user.username || '音乐爱好者' }}</text>
					<text class="user-desc">发现好音乐，享受好生活</text>
				</view>
				<text class="setting-icon" @click="goToSetting">⚙️</text>
			</view>
			
			<view class="user-stats">
				<view class="stat-item">
					<text class="stat-value">{{ favorites.length }}</text>
					<text class="stat-label">收藏</text>
				</view>
				<view class="stat-divider"></view>
				<view class="stat-item">
					<text class="stat-value">{{ history.length }}</text>
					<text class="stat-label">历史</text>
				</view>
				<view class="stat-divider"></view>
				<view class="stat-item">
					<text class="stat-value">{{ playlist.length }}</text>
					<text class="stat-label">播放列表</text>
				</view>
			</view>
		</view>
		
		<!-- 快捷功能 -->
		<view class="quick-menu">
			<view class="menu-item" @click="goToRecent">
				<text class="menu-icon">⏰</text>
				<text class="menu-text">最近播放</text>
			</view>
			<view class="menu-item" @click="goToDownload">
				<text class="menu-icon">📥</text>
				<text class="menu-text">下载管理</text>
			</view>
			<view class="menu-item" @click="goToRadio">
				<text class="menu-icon">📻</text>
				<text class="menu-text">我的电台</text>
			</view>
			<view class="menu-item" @click="goToCollection">
				<text class="menu-icon">📁</text>
				<text class="menu-text">收藏专辑</text>
			</view>
		</view>
		
		<!-- 我的收藏 -->
		<view class="section">
			<view class="section-header">
				<text class="section-title">我的收藏</text>
				<view class="section-info" v-if="loadingFavorites || failedFavoritesCount > 0">
					<text class="loading-text" v-if="loadingFavorites">
						正在加载... ({{ favoritesProgress.processed }}/{{ favoritesProgress.total }})
					</text>
					<view class="error-info" v-if="!loadingFavorites && failedFavoritesCount > 0">
						<text class="error-text">⚠️ {{ failedFavoritesCount }}首加载失败</text>
						<text class="retry-btn" @click="reloadFavorites">重试</text>
					</view>
					<text class="success-text" v-if="!loadingFavorites && totalFavoritesInDB > 0 && failedFavoritesCount === 0">
						✓ {{ favorites.length }}/{{ totalFavoritesInDB }}
					</text>
				</view>
				<text class="section-action" @click="clearFavorites" v-if="favorites.length > 0 && !loadingFavorites">清空</text>
			</view>
			<view class="section-content" v-if="favorites.length > 0">
				<SongList :songs="favorites" :showCover="true" />
			</view>
			<view class="loading-section" v-else-if="loadingFavorites">
				<text class="loading-icon">⏳</text>
				<text class="loading-text">正在加载收藏列表...</text>
				<text class="loading-progress">{{ favoritesProgress.processed }}/{{ favoritesProgress.total }}</text>
			</view>
			<view class="empty-section" v-else>
				<text class="empty-icon">💔</text>
				<text class="empty-text">还没有收藏的歌曲</text>
			</view>
		</view>
		
		<!-- 播放历史 -->
		<view class="section">
			<view class="section-header">
				<text class="section-title">播放历史</text>
				<view class="section-info" v-if="loadingHistory || failedHistoryCount > 0">
					<text class="loading-text" v-if="loadingHistory">
						正在加载... ({{ historyProgress.processed }}/{{ historyProgress.total }})
					</text>
					<view class="error-info" v-if="!loadingHistory && failedHistoryCount > 0">
						<text class="error-text">⚠️ {{ failedHistoryCount }}首加载失败</text>
						<text class="retry-btn" @click="reloadHistory">重试</text>
					</view>
					<text class="success-text" v-if="!loadingHistory && totalHistoryInDB > 0 && failedHistoryCount === 0">
						✓ {{ history.length }}/{{ totalHistoryInDB }}
					</text>
				</view>
				<text class="section-action" @click="clearHistory" v-if="history.length > 0 && !loadingHistory">清空</text>
			</view>
			<view class="section-content" v-if="history.length > 0">
				<SongList :songs="history.slice(0, 20)" :showCover="true" />
			</view>
			<view class="loading-section" v-else-if="loadingHistory">
				<text class="loading-icon">⏳</text>
				<text class="loading-text">正在加载播放历史...</text>
				<text class="loading-progress">{{ historyProgress.processed }}/{{ historyProgress.total }}</text>
			</view>
			<view class="empty-section" v-else>
				<text class="empty-icon">🎵</text>
				<text class="empty-text">还没有播放记录</text>
			</view>
		</view>
		
		<!-- 迷你播放器 -->
		<MiniPlayer />
	</view>
</template>

<script>
import { mapState } from 'vuex'
import MiniPlayer from '@/components/MiniPlayer.vue'
import SongList from '@/components/SongList.vue'
import { getApiUrl } from '@/utils/config.js'
import { getBatchSongDetails } from '@/utils/api.js'

export default {
  components: { MiniPlayer, SongList },
  data() {
    return {
      user: {},
      favorites: [],
      history: [],
      // 加载状态
      loadingFavorites: false,
      loadingHistory: false,
      // 统计信息
      totalFavoritesInDB: 0,
      totalHistoryInDB: 0,
      failedFavoritesCount: 0,
      failedHistoryCount: 0,
      // 进度信息
      favoritesProgress: { processed: 0, total: 0 },
      historyProgress: { processed: 0, total: 0 },
      // 失败的歌曲ID列表
      failedFavoriteIds: [],
      failedHistoryIds: []
    }
  },
  computed: {
    ...mapState(['playlist'])
  },
  async onShow() {
    const userInfo = uni.getStorageSync('currentUser')
    if (userInfo) this.user = { ...userInfo }

    if (!userInfo || userInfo.isGuest) {
      // 游客模式：加载本地存储的数据
      this.loadLocalData()
      return
    }

    await this.loadUserData(userInfo.id)
  },
  methods: {
    // 加载本地存储的数据（用于游客模式或网络失败时）
    loadLocalData() {
      try {
        this.favorites = this.$store.state.favorites || []
        this.history = this.$store.state.history || []
        console.log('从本地加载数据:', this.favorites.length, this.history.length)
      } catch (err) {
        console.error('加载本地数据失败:', err)
      }
    },
    
    async loadUserData(userId) {
      try {
        // 显示加载状态
        this.loadingFavorites = true
        this.loadingHistory = true
        
        const [favRes, hisRes] = await Promise.all([
          uni.request({ url: getApiUrl(`/favorites/${userId}`), method: 'GET' }),
          uni.request({ url: getApiUrl(`/history/${userId}`), method: 'GET' })
        ])

        const favoriteIds = (favRes.data?.data || []).map(i => i.musicId)
        const historyIds = (hisRes.data?.data || []).map(i => i.musicId)
        
        // 记录数据库中的总数
        this.totalFavoritesInDB = favoriteIds.length
        this.totalHistoryInDB = historyIds.length
        
        console.log(`📊 数据库记录 - 收藏: ${this.totalFavoritesInDB}首, 历史: ${this.totalHistoryInDB}首`)

        // 加载收藏详情
        const favResult = await this.fetchSongDetails(favoriteIds, (progress) => {
          this.favoritesProgress = progress
        })
        this.favorites = favResult.songs
        this.failedFavoritesCount = favResult.failedCount
        this.failedFavoriteIds = favResult.failed || [] // 保存失败的ID
        this.favorites.forEach(f => f.isFavorite = true)
        this.$store.commit('SET_FAVORITES', this.favorites)
        this.loadingFavorites = false
        
        console.log(`✅ 收藏加载完成 - 成功: ${favResult.successCount}首, 失败: ${favResult.failedCount}首`)
        if (favResult.failedCount > 0) {
          console.warn('失败的歌曲ID:', favResult.failed)
        }
		
        // 加载历史详情
        const hisResult = await this.fetchSongDetails(historyIds, (progress) => {
          this.historyProgress = progress
        })
        this.history = hisResult.songs
        this.failedHistoryCount = hisResult.failedCount
        this.failedHistoryIds = hisResult.failed || [] // 保存失败的ID
        this.$store.commit('CLEAR_HISTORY') // 先清空
        this.history.forEach(h => this.$store.commit('ADD_HISTORY', h)) // 加入历史
        this.loadingHistory = false
        
        console.log(`✅ 历史加载完成 - 成功: ${hisResult.successCount}首, 失败: ${hisResult.failedCount}首`)
        if (hisResult.failedCount > 0) {
          console.warn('失败的歌曲ID:', hisResult.failed)
        }
        
        // 显示加载结果提示
        if (favResult.failedCount > 0 || hisResult.failedCount > 0) {
          uni.showToast({
            title: `部分歌曲加载失败 (收藏:${favResult.failedCount} 历史:${hisResult.failedCount})`,
            icon: 'none',
            duration: 3000
          })
        } else {
          uni.showToast({
            title: '数据加载成功',
            icon: 'success',
            duration: 1500
          })
        }
		
      } catch (err) {
        console.error('❌ 加载用户收藏和历史失败:', err)
        this.loadingFavorites = false
        this.loadingHistory = false
        
        // 网络请求失败时，尝试从本地存储加载
        console.log('尝试从本地存储加载数据...')
        this.loadLocalData()
        uni.showToast({ title: '网络错误，已从本地加载数据', icon: 'none', duration: 2000 })
      }
    },

    async fetchSongDetails(ids, onProgress) {
      // 使用统一的 API 方法，支持跨域代理 + 进度回调
      return await getBatchSongDetails(ids, onProgress)
    },

    goToSetting() {
      uni.navigateTo({ url: '/pages/settings/settings' })
    },

    goToRecent() {
      uni.navigateTo({ url: '/pages/history/history' })
    },

    goToDownload() {
      uni.showToast({ title: '下载管理功能开发中', icon: 'none' })
    },

    goToRadio() {
      uni.showToast({ title: '我的电台功能开发中', icon: 'none' })
    },

      goToCollection() {
      uni.showToast({ title: '收藏专辑功能开发中', icon: 'none' })
    },
    
    // 重新加载失败的收藏
    async reloadFavorites() {
      if (this.failedFavoriteIds.length === 0) return
      
      this.loadingFavorites = true
      console.log('🔄 重新加载失败的收藏:', this.failedFavoriteIds)
      
      try {
        const retryResult = await this.fetchSongDetails(this.failedFavoriteIds, (progress) => {
          this.favoritesProgress = progress
        })
        
        // 合并成功的歌曲
        this.favorites = [...this.favorites, ...retryResult.songs]
        this.failedFavoriteIds = retryResult.failed || []
        this.failedFavoritesCount = retryResult.failedCount
        
        // 更新 Vuex
        this.favorites.forEach(f => f.isFavorite = true)
        this.$store.commit('SET_FAVORITES', this.favorites)
        
        if (retryResult.failedCount === 0) {
          uni.showToast({ title: '重新加载成功', icon: 'success' })
        } else {
          uni.showToast({ 
            title: `成功加载 ${retryResult.successCount} 首，仍有 ${retryResult.failedCount} 首失败`, 
            icon: 'none',
            duration: 2000
          })
        }
      } catch (err) {
        console.error('重新加载收藏失败:', err)
        uni.showToast({ title: '重新加载失败', icon: 'none' })
      } finally {
        this.loadingFavorites = false
      }
    },
    
    // 重新加载失败的历史
    async reloadHistory() {
      if (this.failedHistoryIds.length === 0) return
      
      this.loadingHistory = true
      console.log('🔄 重新加载失败的历史:', this.failedHistoryIds)
      
      try {
        const retryResult = await this.fetchSongDetails(this.failedHistoryIds, (progress) => {
          this.historyProgress = progress
        })
        
        // 合并成功的歌曲
        this.history = [...this.history, ...retryResult.songs]
        this.failedHistoryIds = retryResult.failed || []
        this.failedHistoryCount = retryResult.failedCount
        
        // 更新 Vuex
        retryResult.songs.forEach(h => this.$store.commit('ADD_HISTORY', h))
        
        if (retryResult.failedCount === 0) {
          uni.showToast({ title: '重新加载成功', icon: 'success' })
        } else {
          uni.showToast({ 
            title: `成功加载 ${retryResult.successCount} 首，仍有 ${retryResult.failedCount} 首失败`, 
            icon: 'none',
            duration: 2000
          })
        }
      } catch (err) {
        console.error('重新加载历史失败:', err)
        uni.showToast({ title: '重新加载失败', icon: 'none' })
      } finally {
        this.loadingHistory = false
      }
    },

      async clearFavorites() {
         if (!this.user.id) return
         uni.showModal({
           title: '提示',
           content: '确定清空所有收藏吗？',
           success: async (res) => {
             if (res.confirm) {
               try {
                 // 调用 Vuex 全局 action
                 await this.$store.dispatch('clearFavorites')
                 // 页面数据同步
                 this.favorites = this.$store.state.favorites
               } catch (err) {
                 console.error('清空收藏失败', err)
                 uni.showToast({ title: '清空收藏失败', icon: 'none' })
               }
             }
           }
         })
       },
     
       async clearHistory() {
         if (!this.user.id) return
         uni.showModal({
           title: '提示',
           content: '确定清空播放历史吗？',
           success: async (res) => {
             if (res.confirm) {
               try {
                 await this.$store.dispatch('clearHistory')
                 this.history = this.$store.state.history
               } catch (err) {
                 console.error('清空历史失败', err)
                 uni.showToast({ title: '清空历史失败', icon: 'none' })
               }
             }
           }
         })
       }
  }
}
</script>


<style scoped>
.mine-page {
	min-height: 100vh;
	background: #f5f5f5;
	padding-bottom: 200rpx;
}

/* 用户信息 */
.user-section {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	padding: 40rpx 30rpx;
	color: white;
}

.user-header {
	display: flex;
	align-items: center;
	gap: 25rpx;
	margin-bottom: 40rpx;
}

.avatar {
	width: 120rpx;
	height: 120rpx;
	border-radius: 60rpx;
	border: 4rpx solid rgba(255, 255, 255, 0.5);
}

.user-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 10rpx;
}

.username {
	font-size: 36rpx;
	font-weight: bold;
}

.user-desc {
	font-size: 24rpx;
	opacity: 0.9;
}

.setting-icon {
	font-size: 48rpx;
	padding: 10rpx;
}

.user-stats {
	display: flex;
	align-items: center;
	justify-content: space-around;
	background: rgba(255, 255, 255, 0.2);
	border-radius: 16rpx;
	padding: 30rpx 0;
	backdrop-filter: blur(10rpx);
}

.stat-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 10rpx;
}

.stat-value {
	font-size: 40rpx;
	font-weight: bold;
}

.stat-label {
	font-size: 24rpx;
	opacity: 0.9;
}

.stat-divider {
	width: 1rpx;
	height: 60rpx;
	background: rgba(255, 255, 255, 0.3);
}

/* 快捷功能 */
.quick-menu {
	display: flex;
	justify-content: space-around;
	background: white;
	margin-top: 20rpx;
	padding: 40rpx 30rpx;
}

.menu-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 15rpx;
}

.menu-icon {
	font-size: 48rpx;
}

.menu-text {
	font-size: 24rpx;
	color: #666;
}

/* 板块 */
.section {
	background: white;
	margin-top: 20rpx;
	padding: 30rpx 0;
}

.section-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0 30rpx 20rpx;
}

.section-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
}

.section-action {
	font-size: 26rpx;
	color: #667eea;
}

.section-content {
	max-height: 800rpx;
	overflow-y: auto;
}

.empty-section {
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
	font-size: 28rpx;
	color: #999;
}

/* 加载状态 */
.section-info {
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	gap: 5rpx;
	flex: 1;
	margin: 0 20rpx;
}

.loading-text {
	font-size: 22rpx;
	color: #667eea;
	font-weight: 500;
}

.error-text {
	font-size: 22rpx;
	color: #ff6b6b;
	font-weight: 500;
}

.success-text {
	font-size: 22rpx;
	color: #51cf66;
	font-weight: 500;
}

.error-info {
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: 10rpx;
}

.retry-btn {
	font-size: 22rpx;
	color: #667eea;
	font-weight: 600;
	padding: 4rpx 12rpx;
	background: rgba(102, 126, 234, 0.1);
	border-radius: 8rpx;
	border: 1rpx solid #667eea;
}

.loading-section {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 100rpx 0;
	gap: 20rpx;
}

.loading-icon {
	font-size: 100rpx;
	animation: rotate 2s linear infinite;
}

.loading-progress {
	font-size: 24rpx;
	color: #667eea;
	font-weight: bold;
}

@keyframes rotate {
	from {
		transform: rotate(0deg);
	}
	to {
		transform: rotate(360deg);
	}
}
</style>

