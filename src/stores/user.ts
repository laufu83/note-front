import { defineStore } from 'pinia'
import { ref } from 'vue'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'

export const useUserStore = defineStore('user', () => {
  const accessToken = ref(localStorage.getItem('accessToken') || '')
  const refreshToken = ref(localStorage.getItem('refreshToken') || '')
  const uid = ref(Number(localStorage.getItem('uid')) || 0)

  function setToken(access: string, refresh: string, userId: number) {
    accessToken.value = access
    refreshToken.value = refresh
    uid.value = userId
    localStorage.setItem('accessToken', access)
    localStorage.setItem('refreshToken', refresh)
    localStorage.setItem('uid', String(userId))
  }

  /**
   * 刷新Token，成功返回true，失败返回false
   */
  async function refreshUserToken() {
    try {
      const res = await request.post('/api/user/refresh-token', {
        refreshToken: refreshToken.value
      })
      accessToken.value = res.data.accessToken
      localStorage.setItem('accessToken', accessToken.value)
      return true
    } catch {
      ElMessage.error('登录已过期，请重新登录')
      logout()
      return false
    }
  }

  function logout() {
    accessToken.value = ''
    refreshToken.value = ''
    uid.value = 0
    localStorage.clear()
    // 防止路由循环，直接跳转登录页
    location.replace('/login')
    ElMessage.success('已退出登录')
  }

  return {
    accessToken,
    refreshToken,
    uid,
    setToken,
    refreshUserToken,
    logout
  }
})