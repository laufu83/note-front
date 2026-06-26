import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'

const baseURL = import.meta.env.VITE_API_BASE_URL
// 全局刷新锁
let isRefreshing = false
// 等待刷新队列（暂存401请求）
const waitQueue: Array<(token: string) => void> = []

const service = axios.create({
  baseURL,
  timeout: 15000
})

// 请求拦截器
service.interceptors.request.use(config => {
  const userStore = useUserStore()
  if (userStore.accessToken) {
    config.headers.Authorization = `Bearer ${userStore.accessToken}`
  }
  return config
})

// 响应拦截器
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
    const userStore = useUserStore()
    // 只有401未授权处理
    if (res?.status === 401) {
      // 情况1：正在刷新中，加入等待队列
      if (isRefreshing) {
        return new Promise(resolve => {
          waitQueue.push((newToken) => {
            res.config.headers.Authorization = `Bearer ${newToken}`
            resolve(service(res.config))
          })
        })
      }

      // 情况2：开始刷新Token
      isRefreshing = true
      try {
        // 刷新令牌
        const refreshRes = await userStore.refreshUserToken()
        if (refreshRes) {
          // 刷新成功，执行队列里所有等待请求
          waitQueue.forEach(fn => fn(userStore.accessToken))
          waitQueue.length = 0
          // 重试当前请求
          res.config.headers.Authorization = `Bearer ${userStore.accessToken}`
          return service(res.config)
        }
      } catch {
        // 刷新失败，清空队列，退出登录+跳转登录页
        waitQueue.length = 0
        userStore.logout()
        // 必须在刷新失败后获取路由实例跳转
        const router = useRouter()
        ElMessage.error('登录令牌失效，请重新登录')
        router.replace('/login')
      } finally {
        isRefreshing = false
      }
      return Promise.reject(err)
    }

    ElMessage.error(err.message || '网络请求失败')
    return Promise.reject(err)
  }
)

export default service