<template>
  <view class="settings-container">
    <view class="settings-card">
      <text class="title">账户设置</text>

      <!-- 头像 -->
      <view class="item avatar-item" @click="changeAvatar">
        <text class="label">头像</text>
        <image :src="user.avatar || '/static/logo.png'" class="avatar"></image>
      </view>

      <!-- 用户名 -->
      <view class="item">
        <text class="label">用户名</text>
        <input v-model="user.username" placeholder="请输入用户名" class="input" />
      </view>

      <!-- 旧密码 -->
      <view class="item">
        <text class="label">旧密码</text>
        <input v-model="oldPassword" type="password" placeholder="请输入旧密码" class="input" />
      </view>

      <!-- 新密码 -->
      <view class="item">
        <text class="label">新密码</text>
        <input v-model="newPassword" type="password" placeholder="请输入新密码" class="input" />
      </view>

      <button class="save-btn" @click="saveSettings">保存修改</button>

      <!-- 退出登录 -->
      <button class="logout-btn" @click="logout">退出当前账户</button>
    </view>
    
    <!-- 缓存管理 -->
    <view class="settings-card cache-card">
      <text class="title">缓存管理</text>
      
      <view class="cache-info">
        <view class="cache-item">
          <text class="cache-label">歌曲详情缓存</text>
          <text class="cache-value">{{ cacheInfo.songDetailCount }} 个</text>
        </view>
        <view class="cache-item">
          <text class="cache-label">搜索结果缓存</text>
          <text class="cache-value">{{ cacheInfo.searchResultCount }} 个</text>
        </view>
        <view class="cache-item">
          <text class="cache-label">排行榜缓存</text>
          <text class="cache-value">{{ cacheInfo.rankListCount }} 个</text>
        </view>
        <view class="cache-item">
          <text class="cache-label">总缓存数</text>
          <text class="cache-value">{{ cacheInfo.totalKeys }} 个</text>
        </view>
      </view>
      
      <view class="cache-actions">
        <button class="cache-btn clear-expired-btn" @click="clearExpiredCache">
          清理过期缓存
        </button>
        <button class="cache-btn clear-all-btn" @click="clearAllCache">
          清空所有缓存
        </button>
      </view>
      
      <view class="cache-tip">
        <text class="tip-text">💡 缓存可以加快应用加载速度，建议定期清理过期缓存即可</text>
      </view>
    </view>
  </view>
</template>

<script>
import { getApiUrl } from '@/utils/config.js'
import { CacheManager, SongDetailCache, SearchResultCache, RankListCache } from '@/utils/cache.js'

export default {
  data() {
    return {
      user: {},
      oldPassword: '',
      newPassword: '',
      cacheInfo: {
        totalKeys: 0,
        songDetailCount: 0,
        searchResultCount: 0,
        rankListCount: 0,
        otherCount: 0
      }
    }
  },
  onShow() {
    const userInfo = uni.getStorageSync('currentUser')
    if (userInfo) this.user = { ...userInfo }
    // 加载缓存信息
    this.loadCacheInfo()
  },
  methods: {
    // 修改头像
    changeAvatar() {
      uni.chooseImage({
        count: 1,
        success: (res) => {
          const filePath = res.tempFilePaths[0];
          uni.uploadFile({
            url: getApiUrl('/uploadAvatar'),
            filePath: filePath,
            name: 'avatar',
            formData: {
              id: this.user.id
            },
            success: (uploadRes) => {
              const data = JSON.parse(uploadRes.data);
              if (data.success) {
                this.user.avatar = data.avatarUrl;
                uni.setStorageSync('currentUser', this.user);
                uni.showToast({ title: '头像更新成功' });
              } else {
                uni.showToast({ title: data.message, icon: 'none' });
              }
            },
            fail: (err) => {
              console.error(err);
              uni.showToast({ title: '上传失败', icon: 'none' });
            }
          });
        }
      });
    },

    // 保存修改
    saveSettings() {
      if (!this.user.username) {
        return uni.showToast({ title: '用户名不能为空', icon: 'none' })
      }
      if (this.newPassword && !this.oldPassword) {
        return uni.showToast({ title: '请输入旧密码', icon: 'none' })
      }

      if (this.newPassword) {
        uni.request({
          url: getApiUrl('/login'),
          method: 'POST',
          data: {
            username: this.user.username,
            password: this.oldPassword
          },
          success: (res) => {
            if (res.data.success) {
              this.updateUser()
            } else {
              uni.showToast({ title: '旧密码错误', icon: 'none' })
            }
          },
          fail: () => {
            uni.showToast({ title: '验证失败，请稍后再试', icon: 'none' })
          }
        })
      } else {
        this.updateUser()
      }
    },

    // 更新用户信息
    updateUser() {
      uni.request({
        url: getApiUrl('/updateUser'),
        method: 'POST',
        data: {
          id: this.user.id,
          username: this.user.username,
          avatar: this.user.avatar,
          password: this.newPassword || ''
        },
        success: (res) => {
          if (res.data.success) {
            uni.setStorageSync('currentUser', this.user)
            uni.showToast({ title: '更新成功' })
            this.oldPassword = ''
            this.newPassword = ''
          } else {
            uni.showToast({ title: res.data.message, icon: 'none' })
          }
        },
        fail: (err) => {
          console.error(err)
          uni.showToast({ title: '保存失败', icon: 'none' })
        }
      })
    },

    // 退出登录
    logout() {
      uni.showModal({
        title: '确认退出',
        content: '确定要退出当前账户吗？',
        success: (res) => {
          if (res.confirm) {
            // ✅ 清除用户与缓存数据
            uni.removeStorageSync('currentUser');
            uni.removeStorageSync('favorites');
            uni.removeStorageSync('history');
    
            // ✅ 清空 Vuex 状态
            const store = this.$store;
            store.commit('favorites/CLEAR_FAVORITES');
            store.commit('history/CLEAR_HISTORY');
            store.commit('user/SET_USER_ID', null);
    
            // ✅ 跳转登录页
            uni.reLaunch({
              url: '/pages/login/login'
            });
          }
        }
      });
    },
    
    // 加载缓存信息
    loadCacheInfo() {
      const info = CacheManager.getInfo()
      if (info) {
        this.cacheInfo = info
      }
    },
    
    // 清理过期缓存
    clearExpiredCache() {
      uni.showLoading({ title: '清理中...' })
      
      setTimeout(() => {
        const clearedCount = CacheManager.clearExpired()
        uni.hideLoading()
        
        uni.showToast({
          title: `清理了 ${clearedCount} 个过期缓存`,
          icon: 'success'
        })
        
        // 刷新缓存信息
        this.loadCacheInfo()
      }, 500)
    },
    
    // 清空所有缓存
    clearAllCache() {
      uni.showModal({
        title: '确认清空',
        content: '清空所有缓存后，下次加载歌曲信息可能会稍慢。确定要清空吗？',
        success: (res) => {
          if (res.confirm) {
            uni.showLoading({ title: '清理中...' })
            
            setTimeout(() => {
              // 清空各类缓存
              SongDetailCache.clear()
              SearchResultCache.clear()
              RankListCache.clear()
              
              uni.hideLoading()
              uni.showToast({
                title: '缓存已清空',
                icon: 'success'
              })
              
              // 刷新缓存信息
              this.loadCacheInfo()
            }, 500)
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.settings-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa, #c3cfe2);
  padding: 30rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30rpx;
}

.settings-card {
  width: 85%;
  background-color: #fff;
  border-radius: 20rpx;
  box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.1);
  padding: 50rpx 40rpx;
}

.title {
  text-align: center;
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 40rpx;
}

.item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30rpx;
  border-bottom: 1rpx solid #eee;
  padding-bottom: 20rpx;
}

.avatar-item {
  justify-content: space-between;
}

.label {
  font-size: 30rpx;
  color: #555;
}

.input {
  flex: 1;
  text-align: right;
  font-size: 28rpx;
  border: none;
  outline: none;
  color: #333;
  padding: 10rpx;
}

.avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  border: 2rpx solid #ddd;
}

.save-btn {
  width: 100%;
  height: 80rpx;
  background: linear-gradient(135deg, #42b983, #2e8b57);
  color: #fff;
  border: none;
  border-radius: 15rpx;
  font-size: 32rpx;
  text-align: center;
  line-height: 80rpx;
  margin-top: 50rpx;
  box-shadow: 0 6rpx 10rpx rgba(66, 185, 131, 0.3);
  transition: all 0.2s;
}
.save-btn:active {
  transform: scale(0.97);
  opacity: 0.9;
}

/* 新增退出按钮样式 */
.logout-btn {
  width: 100%;
  height: 80rpx;
  margin-top: 30rpx;
  background: linear-gradient(135deg, #ff5f6d, #ffc371);
  color: white;
  border: none;
  border-radius: 15rpx;
  font-size: 32rpx;
  text-align: center;
  line-height: 80rpx;
  box-shadow: 0 6rpx 10rpx rgba(255, 95, 109, 0.3);
  transition: all 0.2s;
}
.logout-btn:active {
  transform: scale(0.97);
  opacity: 0.9;
}

/* 缓存管理样式 */
.cache-card {
  margin-bottom: 30rpx;
}

.cache-info {
  margin: 30rpx 0;
}

.cache-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.cache-item:last-child {
  border-bottom: none;
  padding-top: 30rpx;
  margin-top: 10rpx;
  border-top: 2rpx solid #e0e0e0;
}

.cache-label {
  font-size: 28rpx;
  color: #555;
}

.cache-value {
  font-size: 28rpx;
  color: #42b983;
  font-weight: bold;
}

.cache-actions {
  display: flex;
  gap: 20rpx;
  margin-top: 30rpx;
}

.cache-btn {
  flex: 1;
  height: 70rpx;
  border: none;
  border-radius: 12rpx;
  font-size: 28rpx;
  text-align: center;
  line-height: 70rpx;
  transition: all 0.2s;
}

.clear-expired-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  box-shadow: 0 4rpx 10rpx rgba(102, 126, 234, 0.3);
}

.clear-expired-btn:active {
  transform: scale(0.97);
  opacity: 0.9;
}

.clear-all-btn {
  background: linear-gradient(135deg, #f093fb, #f5576c);
  color: white;
  box-shadow: 0 4rpx 10rpx rgba(245, 87, 108, 0.3);
}

.clear-all-btn:active {
  transform: scale(0.97);
  opacity: 0.9;
}

.cache-tip {
  margin-top: 30rpx;
  padding: 20rpx;
  background: #f8f9fa;
  border-radius: 10rpx;
  border-left: 4rpx solid #42b983;
}

.tip-text {
  font-size: 24rpx;
  color: #666;
  line-height: 1.6;
}
</style>
