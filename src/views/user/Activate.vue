<template>
  <div class="activate-wrap">
    <el-card class="loading-card" shadow="hover">
      <div class="loading-box">
        <el-spinner size="40"></el-spinner>
        <p class="tip">正在校验激活链接，请稍候...</p>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const route = useRoute()
const router = useRouter()

onMounted(async () => {
  const token = route.query.token as string
  if (!token) {
    ElMessage.error('激活参数缺失，请从邮件内链接访问')
    router.replace('/login')
    return
  }

  try {
    await request.get(`/api/user/activate?token=${encodeURIComponent(token)}`, {
      headers: { Authorization: '' }
    })
    // 激活成功跳成功页
    router.replace('/activate-success')
  } catch (err: any) {
    // 激活失败携带错误提示跳转失败页
    const msg = err?.msg || '激活链接无效或已过期，请重新注册'
    router.replace({
      path: '/activate-fail',
      query: { msg }
    })
  }
})
</script>

<style scoped>
.activate-wrap {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f2f5;
}
.loading-card {
  padding: 40px 60px;
  border-radius: 12px;
}
.loading-box {
  text-align: center;
}
.tip {
  margin-top: 16px;
  font-size: 15px;
  color: #666;
}
</style>