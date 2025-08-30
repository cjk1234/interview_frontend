import { defineStore } from 'pinia'
import { authApi } from '@/services/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('userInfo')) || null, // 从localStorage恢复
    token: localStorage.getItem('token')
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    userInfo: (state) => state.user
  },

  actions: {
    async login(credentials) {
      const response = await authApi.login(credentials)
      this.token = response.data.token
      this.user = response.data.user
      localStorage.setItem('token', this.token)
      localStorage.setItem('userInfo', JSON.stringify(this.user)) // 保存用户信息
      return response
    },

    async register(userData) {
      const response = await authApi.register(userData)
      this.token = response.data.token
      this.user = response.data.user
      localStorage.setItem('token', this.token)
      localStorage.setItem('userInfo', JSON.stringify(this.user)) // 保存用户信息
      return response
    },

    async logout() {
      this.token = null
      this.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo') // 清除用户信息
    },

    async fetchUserInfo() {
      if (!this.token) return
      
      const response = await authApi.getUserInfo()
      this.user = response.data
      localStorage.setItem('userInfo', JSON.stringify(this.user)) // 更新localStorage
    }
  }
})