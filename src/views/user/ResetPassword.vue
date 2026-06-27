<!-- src/views/ResetPassword.vue - 使用分离的 API -->

<template>
  <div class="reset-wrap">
    <el-card class="reset-card" shadow="hover">
      <div class="brand-header">
        <div class="logo-icon">
          <el-icon :size="32"><Document /></el-icon>
        </div>
        <h1 class="brand-title">密码重置</h1>
        <p class="brand-subtitle">设置新的登录密码</p>
      </div>

      <el-form
        ref="resetRef"
        :model="resetForm"
        :rules="resetRules"
        label-width="0"
        class="reset-form"
      >
        <el-form-item prop="newPwd">
          <el-input
            v-model="resetForm.newPwd"
            placeholder="请设置新密码（至少6位）"
            size="large"
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        <el-form-item prop="confirmPwd">
          <el-input
            v-model="resetForm.confirmPwd"
            placeholder="请再次输入新密码"
            size="large"
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        <el-button
          type="primary"
          size="large"
          class="submit-btn"
          block
          :loading="loading"
          @click="handleResetPassword"
        >
          {{ loading ? '提交中...' : '确认重置密码' }}
        </el-button>
      </el-form>

      <div class="back-login">
        <el-link type="primary" @click="$router.push('/login')">返回登录页</el-link>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElForm, type FormRules } from 'element-plus'
import { Document, Lock } from '@element-plus/icons-vue'
import { resetPassword } from '@/api'

const route = useRoute()
const router = useRouter()
const token = ref(route.query.token as string)

// 检查 token 是否存在
if (!token.value) {
  ElMessage.error('重置参数缺失，请重新从邮箱链接进入')
  router.replace('/login')
}

const loading = ref(false)
const resetRef = ref<InstanceType<typeof ElForm>>()
const resetForm = reactive({
  newPwd: '',
  confirmPwd: ''
})

const resetRules: FormRules = {
  newPwd: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ],
  confirmPwd: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== resetForm.newPwd) {
          callback(new Error('两次输入密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// ===== 提交重置密码 =====
async function handleResetPassword() {
  try {
    await resetRef.value?.validate()
    loading.value = true

    await resetPassword({
      token: token.value,
      newPwd: resetForm.newPwd
    })

    ElMessage.success('密码重置成功，请重新登录')
    router.replace('/login')
  } catch (error) {
    // 错误已由拦截器处理
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.reset-wrap {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f2f5;
  padding: 20px;
}

.reset-card {
  width: 420px;
  max-width: 100%;
  padding: 10px 20px 20px;
  border-radius: 12px;
}

:deep(.reset-card .el-card__body) {
  padding: 10px 0;
}

.brand-header {
  text-align: center;
  margin-bottom: 20px;
}

.logo-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  background: #409EFF;
  border-radius: 16px;
  color: #fff;
  margin-bottom: 10px;
}

.brand-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  color: #303133;
}

.brand-subtitle {
  font-size: 14px;
  color: #909399;
  margin: 4px 0 0;
}

.reset-form {
  padding: 0 2px;
}

:deep(.el-input__wrapper) {
  border-radius: 8px;
}

:deep(.el-form-item) {
  margin-bottom: 18px;
}

.submit-btn {
  height: 44px;
  font-size: 16px;
  letter-spacing: 2px;
  border-radius: 8px;
}

.back-login {
  text-align: center;
  margin-top: 16px;
}

@media (max-width: 500px) {
  .reset-card {
    width: 92%;
    padding: 10px 12px 16px;
  }
  .brand-title {
    font-size: 20px;
  }
  .logo-icon {
    width: 48px;
    height: 48px;
  }
}
</style>