<template>
  <view class="register-container">
    <view class="register-card">
      <text class="title">📝 注册账号</text>
      
      <view class="form-section">
        <!-- 用户名 -->
        <view class="item">
          <text class="label">👤 用户名</text>
          <input v-model="username" placeholder="请输入用户名" class="input" />
        </view>

        <!-- 密码 -->
        <view class="item">
          <text class="label">🔒 密码</text>
          <input v-model="password" placeholder="请输入密码" class="input" password />
        </view>

        <!-- 确认密码 -->
        <view class="item">
          <text class="label">✅ 确认密码</text>
          <input v-model="confirmPassword" placeholder="请确认密码" class="input" password />
        </view>
      </view>

      <button class="register-btn" @click="register">立即注册</button>

      <view class="footer">
        <text class="footer-text">已有账号？</text>
        <text class="link" @click="goLogin">去登录</text>
      </view>
      
      <view class="tip-box">
        <text class="tip-icon">💡</text>
        <text class="tip-text">注册后即可同步收藏和播放历史</text>
      </view>
    </view>
  </view>
</template>

<script>
import { getApiUrl } from '@/utils/config.js'

export default {
  data() {
    return {
      username: '',
      password: '',
      confirmPassword: ''
    };
  },
  methods: {
    async register() {
      if (!this.username || !this.password || !this.confirmPassword) {
        return uni.showToast({ title: '请输入完整信息', icon: 'none' });
      }

      if (this.password !== this.confirmPassword) {
        return uni.showToast({ title: '两次密码不一致', icon: 'none' });
      }

      const res = await uni.request({
        url: getApiUrl('/register'),
        method: 'POST',
        data: {
          username: this.username,
          password: this.password
        }
      });

      if (res.data.success) {
        uni.showToast({ title: '注册成功', icon: 'success' });
        uni.navigateTo({ url: '/pages/login/login' });
      } else {
        uni.showToast({ title: res.data.message, icon: 'none' });
      }
    },
    goLogin() {
      uni.navigateTo({ url: '/pages/login/login' });
    }
  }
};
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa, #c3cfe2);
  padding: 30rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.register-card {
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
  display: block;
}

.form-section {
  margin-bottom: 30rpx;
}

.item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30rpx;
  border-bottom: 1rpx solid #eee;
  padding-bottom: 20rpx;
}

.label {
  font-size: 30rpx;
  color: #555;
  white-space: nowrap;
  margin-right: 20rpx;
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

.register-btn {
  width: 100%;
  height: 80rpx;
  background: linear-gradient(135deg, #42b983, #2e8b57);
  color: #fff;
  border: none;
  border-radius: 15rpx;
  font-size: 32rpx;
  text-align: center;
  line-height: 80rpx;
  margin-top: 20rpx;
  box-shadow: 0 6rpx 10rpx rgba(66, 185, 131, 0.3);
  transition: all 0.2s;
}

.register-btn:active {
  transform: scale(0.97);
  opacity: 0.9;
}

.footer {
  margin-top: 40rpx;
  text-align: center;
}

.footer-text {
  font-size: 28rpx;
  color: #666;
}

.link {
  font-size: 28rpx;
  color: #42b983;
  margin-left: 10rpx;
  font-weight: bold;
}

.tip-box {
  margin-top: 30rpx;
  padding: 20rpx;
  background: #f8f9fa;
  border-radius: 10rpx;
  border-left: 4rpx solid #42b983;
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.tip-icon {
  font-size: 32rpx;
}

.tip-text {
  font-size: 24rpx;
  color: #666;
  line-height: 1.6;
}
</style>
