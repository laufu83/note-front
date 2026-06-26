import { defineStore } from 'pinia'
import { ref } from 'vue'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'
import type { Resp } from '@/types/response'

export const useUserStore = defineStore('user', () => {
  // ===== State =====
  const accessToken = ref(localStorage.getItem('accessToken') || '')
  const refreshToken = ref(localStorage.getItem('refreshToken') || '')
  const uid = ref(Number(localStorage.getItem('uid')) || 0)
  const role = ref(localStorage.getItem('role') || 'user')

  // ===== 设置 Token =====
  function setToken(access: string, refresh: string, userId: number, userRole: string) {
    accessToken.value = access
    refreshToken.value = refresh
    uid.value = userId
    role.value = userRole
    localStorage.setItem('accessToken', access)
    localStorage.setItem('refreshToken', refresh)
    localStorage.setItem('uid', String(userId))
    localStorage.setItem('role', userRole)
  }

  // ===== 刷新 Token =====
  async function refreshUserToken(): Promise<boolean> {
    const refresh = refreshToken.value
    if (!refresh) {
      logout()
      return false
    }

    try {
      // 使用 axios 直接请求，避免拦截器循环
      const { default: axios } = await import('axios')
      const baseURL = import.meta.env.VITE_API_BASE_URL

      const res = await axios.post<Resp<{ accessToken: string }>>(
        `${baseURL}/api/user/refresh-token`,
        { refreshToken: refresh },
        { headers: { 'Content-Type': 'application/json' } }
      )

      if (res.data?.code === 0 && res.data?.data?.accessToken) {
        const newAccessToken = res.data.data.accessToken
        // 更新 accessToken，保留 refreshToken
        accessToken.value = newAccessToken
        localStorage.setItem('accessToken', newAccessToken)
        return true
      }

      // 刷新失败，退出登录
      logout()
      return false
    } catch (error) {
      console.error('刷新Token失败', error)
      logout()
      return false
    }
  }

  // ===== 退出登录 =====
  function logout() {
    accessToken.value = ''
    refreshToken.value = ''
    uid.value = 0
    role.value = 'user'
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('uid')
    localStorage.removeItem('role')
    ElMessage.info('已退出登录')
    // 跳转到登录页
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
  }

  // ===== 恢复 Token（应用启动时调用） =====
  function restoreToken() {
    const access = localStorage.getItem('accessToken')
    const refresh = localStorage.getItem('refreshToken')
    const userId = localStorage.getItem('uid')
    const userRole = localStorage.getItem('role')

    if (access && refresh) {
      accessToken.value = access
      refreshToken.value = refresh
      uid.value = Number(userId) || 0
      role.value = userRole || 'user'
    }
  }

  return {
    accessToken,
    refreshToken,
    uid,
    role,
    setToken,
    refreshUserToken,
    logout,
    restoreToken
  }
})