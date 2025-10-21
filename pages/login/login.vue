<template>
  <view class="login-container">
    <view class="login-card">
      <text class="title">🎵 欢迎登录</text>
      
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
      </view>

      <button class="login-btn" @click="login">登录</button>
      
      <button class="guest-btn" @click="guestVisit">游客访问</button>

      <view class="footer">
        <text class="footer-text">还没有账号？</text>
        <text class="link" @click="toRegister">去注册</text>
      </view>
    </view>
  </view>
</template>

<script>
import store from '@/store/index.js'
import { getApiUrl } from '@/utils/config.js'

export default {
  data() {
    return {
      username: '',
      password: ''
    }
  },
  methods: {
    async login() {
      if (!this.username || !this.password) {
        return uni.showToast({ title: '请输入完整信息', icon: 'none' });
      }

      const res = await uni.request({
        url: getApiUrl('/login'),
        method: 'POST',
        data: {
          username: this.username,
          password: this.password
        }
      });

      if (res.data.success) {
        const user = res.data.user;
        console.log('✅ [DEBUG-登录] 登录成功');
        console.log('  ├─ 用户信息:', user);
        console.log('  └─ 用户ID:', user.id, '类型:', typeof user.id);
        
        uni.showToast({ title: '登录成功', icon: 'success' });
        
		try {
			console.log('  ├─ 开始加载用户收藏和历史数据...');
			const [favRes, hisRes] = await Promise.all([
			      uni.request({ url: getApiUrl(`/favorites/${user.id}`), method: 'GET' }),
			      uni.request({ url: getApiUrl(`/history/${user.id}`), method: 'GET' })
			    ]);
			
			console.log('  ├─ 收藏数据响应:', favRes.data);
			console.log('  ├─ 历史数据响应:', hisRes.data);
			
			const fullUser = {
			  ...user,
			  isGuest: false,  // 已登录用户
			  favorites: (favRes.data.data || []).map(item => item.musicId),  
			  history: (hisRes.data.data || []).map(item => item.musicId)
			};
			
			console.log('  ├─ 准备设置Vuex中的用户信息...');
			store.dispatch('user/setUserInfo', fullUser);
			console.log('  ├─ ✅ Vuex 用户信息已设置:', store.state.user);
			
			store.commit('favorites/SET_FAVORITES', fullUser.favorites);
			store.commit('history/CLEAR_HISTORY');
			fullUser.history.forEach(musicId => {
				store.commit('history/ADD_HISTORY', { id: musicId });
			});
			
			console.log('  └─ ✅ 用户数据已保存');
		} catch (err) {
			console.error('  └─ ❌ 加载用户数据失败:', err);
			// 即使加载数据失败，也允许登录
			const basicUser = { ...user, isGuest: false };
			store.dispatch('user/setUserInfo', basicUser);
			console.log('  └─ ⚠️ 已设置基本用户信息（忽略数据加载失败）');
		}

        // 跳转到mine页面
        setTimeout(() => {
          uni.switchTab({
            url: '/pages/mine/mine'
          });
        }, 800);
      } else {
        uni.showToast({ title: res.data.message, icon: 'none' });
      }
    },

    toRegister() {
      uni.navigateTo({ url: '/pages/register/register' });
    },

    // ✅ 新增：游客访问逻辑
    guestVisit() {
      console.log('👤 [DEBUG-登录] 游客访问');
      const guestUser = {
        id: null,
        username: '未登录',
        avatar: '/static/logo.png',
        isGuest: true
      };

      console.log('  ├─ 游客用户ID:', guestUser.id, '类型:', typeof guestUser.id);
      console.log('  └─ ⚠️ 未登录模式下userId为null，不会同步数据到数据库');
      
      // 设置到 Vuex
      store.dispatch('user/setUserInfo', guestUser);
      uni.showToast({ title: '以游客身份进入', icon: 'none' });

      setTimeout(() => {
        uni.switchTab({
          url: '/pages/discover/discover'
        });
      }, 800);
    }
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa, #c3cfe2);
  padding: 30rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.login-card {
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

.login-btn {
  width: 100%;
  height: 80rpx;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  border: none;
  border-radius: 15rpx;
  font-size: 32rpx;
  text-align: center;
  line-height: 80rpx;
  margin-top: 20rpx;
  box-shadow: 0 6rpx 10rpx rgba(102, 126, 234, 0.3);
  transition: all 0.2s;
}

.login-btn:active {
  transform: scale(0.97);
  opacity: 0.9;
}

.guest-btn {
  width: 100%;
  height: 80rpx;
  background: linear-gradient(135deg, #f093fb, #f5576c);
  color: #fff;
  border: none;
  border-radius: 15rpx;
  font-size: 32rpx;
  text-align: center;
  line-height: 80rpx;
  margin-top: 20rpx;
  box-shadow: 0 6rpx 10rpx rgba(245, 87, 108, 0.3);
  transition: all 0.2s;
}

.guest-btn:active {
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
  color: #667eea;
  margin-left: 10rpx;
  font-weight: bold;
}
</style>
