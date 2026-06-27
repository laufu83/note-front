import { defineConfig , loadEnv} from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  // 加载当前环境变量
  const env = loadEnv(mode, process.cwd())
  const useProxy = env.VITE_USE_PROXY === 'true'
  const apiPrefix = env.VITE_API_PREFIX
  const apiTarget = env.VITE_API_BASE_URL

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },
    server: {
      port: 3000,
      open: true,
      cors: true,
      // 只有开启代理时才配置proxy
      proxy: useProxy
        ? {
            [apiPrefix]: {
              target: apiTarget,
              changeOrigin: true,
              //rewrite: (path) => path.replace(new RegExp(`^${apiPrefix}`), '')
            }
          }
        : {}
    },
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler'
        }
      }
    }
  }
})