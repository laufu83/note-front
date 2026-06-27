// utils/request.ts
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

const { VITE_USE_PROXY, VITE_API_BASE_URL, VITE_API_PREFIX } = import.meta.env
declare module 'axios' {
  interface AxiosInstance {
    get<T>(url: string, config?: AxiosRequestConfig): Promise<T>
    post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>
  }
}

let isRefreshing = false
const waitQueue: Array<{
  resolve: (value: any) => void
  config: any
}> = []

const service = axios.create({
  // 开启代理用相对路径，否则用完整线上地址
  baseURL: VITE_USE_PROXY === 'true' ? '' : VITE_API_BASE_URL,
  timeout: 15000
})

// ===== 请求拦截器 =====
service.interceptors.request.use(config => {
  const userStore = useUserStore()
  if (userStore.accessToken) {
    config.headers.Authorization = `Bearer ${userStore.accessToken}`
  }
  return config
})

// ===== 响应拦截器 =====
service.interceptors.response.use(
  res => {
    const data = res.data
    if (data.code !== 0) {
      ElMessage.error(data.msg)
      return Promise.reject(data)
    }
    return data
  },
  async err => {
    const res = err.response
    const config = err.config
    const userStore = useUserStore()

    // 防止无限重试
    if (config?._retry) {
      return Promise.reject(err)
    }

    // 401 处理
    if (res?.status === 401) {
      // 正在刷新中，加入队列
      if (isRefreshing) {
        return new Promise((resolve) => {
          waitQueue.push({ resolve, config })
        })
      }

      config._retry = true
      isRefreshing = true

      try {
        const success = await userStore.refreshUserToken()

        if (success) {
          const newToken = userStore.accessToken
          config.headers.Authorization = `Bearer ${newToken}`

          // 处理等待队列
          waitQueue.forEach(({ resolve, config: waitingConfig }) => {
            waitingConfig.headers.Authorization = `Bearer ${newToken}`
            resolve(service(waitingConfig))
          })
          waitQueue.length = 0

          return service(config)
        }

        // 刷新失败
        waitQueue.length = 0
        userStore.logout()
        return Promise.reject(err)
      } catch (refreshErr) {
        waitQueue.length = 0
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }

    const msg = res?.data?.msg || err.message || '网络请求失败'
    if (res?.status !== 401) {
      ElMessage.error(msg)
    }
    return Promise.reject(err)
  }
)

export default service