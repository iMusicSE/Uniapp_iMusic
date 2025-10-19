<template>
  <view class="downloads-page">
    <!-- 顶部统计 -->
    <view class="stats-section">
      <view class="stats-card">
        <text class="stats-icon">💾</text>
        <view class="stats-info">
          <text class="stats-value">{{ downloads.length }}</text>
          <text class="stats-label">已下载歌曲</text>
          <text class="stats-sub" v-if="downloads.length > 0">共 {{ downloads.length }} 首</text>
        </view>
      </view>
      <view class="stats-card">
        <text class="stats-icon">🕒</text>
        <view class="stats-info">
          <text class="stats-value">{{ recentCount }}</text>
          <text class="stats-label">最近下载</text>
          <text class="stats-sub" v-if="downloads.length > 0">
            {{ formatTime(downloads[0]?.downloadTime) }}
          </text>
        </view>
      </view>
    </view>

    <!-- 操作栏 -->
    <view class="action-bar">
      <view class="action-left">
        <text class="action-title">下载列表</text>
        <text class="action-subtitle">记录你的所有下载歌曲</text>
      </view>
      <view class="action-right">
        <view class="action-btn" @click="playAll" v-if="downloads.length > 0">
          <text class="action-btn-icon">▶️</text>
          <text class="action-btn-text">播放全部</text>
        </view>
        <view class="action-btn danger" @click="clearAll" v-if="downloads.length > 0">
          <text class="action-btn-icon">🗑️</text>
          <text class="action-btn-text">清空</text>
        </view>
      </view>
    </view>

    <!-- 下载列表 -->
    <scroll-view v-if="downloads.length > 0" scroll-y class="list-section">
      <view v-for="item in downloads" :key="item.downloadId" class="list-item">
        <image :src="item.coverUrl || '/static/default_cover.png'" class="cover"></image>
        <view class="info">
          <text class="name">{{ item.songName }}</text>
          <text class="artist">{{ item.artist || '未知歌手' }}</text>
          <text class="time">下载时间：{{ formatTime(item.downloadTime) }}</text>
        </view>

        <view class="actions">
          <button class="btn" @click="playSong(item)">▶️</button>
          <button class="btn danger" @click="deleteDownload(item.downloadId)">🗑️</button>
        </view>
      </view>
    </scroll-view>

    <!-- 加载中 -->
    <view class="loading-section" v-else-if="isLoading">
      <text class="loading-icon">⏳</text>
      <text class="loading-text">正在加载下载记录...</text>
    </view>

    <!-- 空状态 -->
    <view class="empty-section" v-else>
      <text class="empty-icon">💿</text>
      <text class="empty-text">暂无下载歌曲</text>
      <text class="empty-desc">下载喜欢的音乐，离线畅听！</text>
      <view class="empty-btn" @click="goDiscover">
        <text class="empty-btn-text">去发现音乐</text>
      </view>
    </view>
	
	<MiniPlayer />
  </view>
</template>

<script>
import { mapState } from 'vuex'
import { getApiUrl } from '@/utils/config.js'
import MiniPlayer from '@/components/MiniPlayer.vue'

export default {
	
    components: {
	 MiniPlayer
     },
  data() {
    return {
      downloads: [],
      isLoading: false,
      recentCount: 0
    }
  },
  computed: {
    ...mapState('user', ['userId'])
  },
  onShow() {
    this.fetchDownloads()
  },
  methods: { 
	  
    async fetchDownloads() {
      if (!this.userId) {
        return uni.showToast({ title: '请先登录', icon: 'none' })
      }

      this.isLoading = true
      try {
        const res = await uni.request({
          url: getApiUrl(`/downloads/${this.userId}`),
          method: 'GET'
        })
        console.log('下载列表接口返回', res)

        if (res.data.success) {
          this.downloads = res.data.data
          this.downloads.sort((a,b)=>new Date(b.downloadTime) - new Date(a.downloadTime));
          this.recentCount = this.downloads.length;

        } else {
          uni.showToast({ title: '加载失败', icon: 'none' })
        }
      } catch (err) {
        console.error('❌ 获取下载列表失败:', err)
        uni.showToast({ title: '网络错误', icon: 'none' })
      } finally {
        this.isLoading = false
      }
    },

    async deleteDownload(downloadId) {
      const confirm = await new Promise(resolve => {
        uni.showModal({
          title: '确认删除',
          content: '确定要删除这首下载歌曲吗？',
          success: res => resolve(res.confirm)
        })
      })
      if (!confirm) return

      try {
        const res = await uni.request({
          url: getApiUrl('/downloads/delete'),
          method: 'POST',
          data: { downloadId }
        })
        if (res.data.success) {
          uni.showToast({ title: '删除成功', icon: 'success' })
          this.downloads = this.downloads.filter(d => d.downloadId !== downloadId)
        } else {
          uni.showToast({ title: '删除失败', icon: 'none' })
        }
      } catch (err) {
        console.error('❌ 删除失败:', err)
      }
    },

    playAll() {
      if (this.downloads.length === 0) {
        uni.showToast({ title: '暂无下载歌曲', icon: 'none' })
        return
      }
      
      // 播放第一首，并将整个下载列表作为播放列表
      const firstSong = {
        downloadId: this.downloads[0].downloadId,
        songId: this.downloads[0].musicId,
        name: this.downloads[0].songName,
        url: this.downloads[0].localPath,
        artistName: this.downloads[0].artist || '未知歌手',
        albumPic: this.downloads[0].coverUrl || '/static/logo.png',
        albumName: this.downloads[0].album || '',
        lyricsPath: this.downloads[0].lyricsPath || ''
      }
      
      uni.navigateTo({
        url: `/pages/player/player?song=${encodeURIComponent(JSON.stringify(firstSong))}`
      })
      
      uni.showToast({ title: '开始播放', icon: 'success' })
    },
	formatTime(time) {
	  if (!time) return '未知时间';
	  const date = new Date(time);  
	  const Y = date.getFullYear();
	  const M = (date.getMonth() + 1).toString().padStart(2, '0');
	  const D = date.getDate().toString().padStart(2, '0');
	  const h = date.getHours().toString().padStart(2, '0');
	  const m = date.getMinutes().toString().padStart(2, '0');
	  const s = date.getSeconds().toString().padStart(2, '0');
	  return `${Y}-${M}-${D} ${h}:${m}:${s}`;
	},
	goDiscover() {
	  uni.switchTab({
	    url: '/pages/discover/discover'
	  });
	},
		
		
	 async clearAll() {
	   if (!this.userId) {
	     return uni.showToast({ title: '请先登录', icon: 'none' });
	   }
	 
	   const confirm = await new Promise(resolve => {
	     uni.showModal({
	       title: '确认清空',
	       content: '确定要清空所有下载记录吗？',
	       success: res => resolve(res.confirm)
	     });
	   });
	   if (!confirm) return;
	 
	   try {
	     const res = await uni.request({
	       url: getApiUrl('/downloads/clear'),
	       method: 'POST',
	       data: { userId: this.userId }
	     });
	 
	     if (res.data.success) {
	       this.downloads = [];
	       uni.showToast({ title: '已清空下载记录', icon: 'success' });
	     } else {
	       uni.showToast({ title: '清空失败', icon: 'none' });
	     }
	   } catch (err) {
	     console.error('❌ 清空下载失败:', err);
	     uni.showToast({ title: '网络错误', icon: 'none' });
	   }
	 },

	
	playSong(item) {
	  const songData = {
	   downloadId: item.downloadId,
		songId: item.musicId,
	    name: item.songName,
	    url: item.localPath,        // 本地文件路径
	    artistName: item.artist || '未知歌手',
	    albumPic: item.coverUrl || '/static/logo.png',
	    albumName: item.album || '',
		 lyricsPath: item.lyricsPath || '', 
	  }
	
	  uni.navigateTo({
	    url: `/pages/player/player?song=${encodeURIComponent(JSON.stringify(songData))}`
	  })
	}

	
	
	
  }
}
</script>

<style scoped>
.downloads-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 200rpx;
}

/* 统计卡片 */
.stats-section {
  display: flex;
  gap: 20rpx;
  padding: 30rpx;
  background: white;
}

.stats-card {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 30rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16rpx;
  color: white;
  box-shadow: 0 8rpx 20rpx rgba(102, 126, 234, 0.25);
  transition: all 0.3s;
}

.stats-card:active {
  transform: translateY(2rpx);
  box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.3);
}

.stats-icon {
  font-size: 60rpx;
}

.stats-info {
  display: flex;
  flex-direction: column;
  gap: 5rpx;
}

.stats-value {
  font-size: 40rpx;
  font-weight: bold;
}

.stats-label {
  font-size: 24rpx;
  opacity: 0.9;
}

.stats-sub {
  font-size: 20rpx;
  opacity: 0.8;
  margin-top: 5rpx;
}

/* 操作栏 */
.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  background: white;
  margin-top: 20rpx;
}

.action-left {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.action-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.action-subtitle {
  font-size: 22rpx;
  color: #999;
}

.action-right {
  display: flex;
  gap: 15rpx;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 24rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 40rpx;
  color: white;
  box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.3);
  transition: all 0.3s;
}

.action-btn:active {
  transform: scale(0.95);
  box-shadow: 0 2rpx 8rpx rgba(102, 126, 234, 0.4);
}

.action-btn.danger {
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);
  box-shadow: 0 4rpx 12rpx rgba(255, 107, 107, 0.3);
}

.action-btn.danger:active {
  box-shadow: 0 2rpx 8rpx rgba(255, 107, 107, 0.4);
}

.action-btn-icon {
  font-size: 24rpx;
}

.action-btn-text {
  font-size: 24rpx;
  font-weight: 500;
}

/* 列表 */
.list-section {
  margin-top: 20rpx;
  background: white;
}

.list-item {
  display: flex;
  align-items: center;
  padding: 25rpx 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
  transition: background-color 0.3s;
}

.list-item:active {
  background-color: #f8f8f8;
}

.cover {
  width: 120rpx;
  height: 120rpx;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.15);
}

.info {
  flex: 1;
  margin-left: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.name {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.artist {
  font-size: 24rpx;
  color: #999;
}

.time {
  font-size: 22rpx;
  color: #bbb;
}

.actions {
  display: flex;
  flex-direction: row;
  gap: 12rpx;
}

.btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 24rpx;
  border-radius: 30rpx;
  padding: 12rpx 24rpx;
  border: none;
  box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.25);
  transition: all 0.3s;
}

.btn:active {
  transform: scale(0.95);
  box-shadow: 0 2rpx 8rpx rgba(102, 126, 234, 0.3);
}

.btn.danger {
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);
  box-shadow: 0 4rpx 12rpx rgba(255, 107, 107, 0.25);
}

.btn.danger:active {
  transform: scale(0.95);
  box-shadow: 0 2rpx 8rpx rgba(255, 107, 107, 0.3);
}

/* 空状态 */
.empty-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 150rpx 60rpx;
  background: white;
  margin-top: 20rpx;
  border-radius: 20rpx;
  margin: 20rpx 30rpx 0;
}

.empty-icon {
  font-size: 160rpx;
  opacity: 0.3;
  margin-bottom: 30rpx;
}

.empty-text {
  font-size: 32rpx;
  color: #333;
  font-weight: 500;
  margin-bottom: 10rpx;
}

.empty-desc {
  font-size: 26rpx;
  color: #999;
  margin-bottom: 60rpx;
}

.empty-btn {
  padding: 20rpx 60rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 40rpx;
  color: white;
  box-shadow: 0 8rpx 20rpx rgba(102, 126, 234, 0.3);
  transition: all 0.3s;
}

.empty-btn:active {
  transform: translateY(2rpx);
  box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.4);
}

.empty-btn-text {
  font-size: 28rpx;
  color: white;
  font-weight: 500;
}

/* 加载状态 */
.loading-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 150rpx 60rpx;
  background: white;
  margin-top: 20rpx;
  border-radius: 20rpx;
  margin: 20rpx 30rpx 0;
  gap: 20rpx;
}

.loading-icon {
  font-size: 120rpx;
  animation: rotate 2s linear infinite;
}

.loading-text {
  font-size: 28rpx;
  color: #667eea;
  font-weight: 500;
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
