<template>
  <div class="login-wrap">
    <el-card class="login-card" shadow="hover">
      <!-- 品牌标识 -->
      <div class="brand-header">
        <div class="logo-icon">
          <el-icon :size="32"><Document /></el-icon>
        </div>
        <h1 class="brand-title">智慧笔记</h1>
        <p class="brand-subtitle">记录灵感，高效生活</p>
      </div>

      <!-- Tabs -->
      <el-tabs v-model="activeTab" class="login-tabs" stretch>
        <el-tab-pane label="登录" name="login">
          <el-form
            ref="loginRef"
            :model="loginForm"
            :rules="loginRules"
            label-width="0"
            class="login-form"
          >
            <el-form-item prop="username">
              <el-input
                v-model="loginForm.username"
                placeholder="请输入用户名"
                size="large"
                prefix-icon="User"
              />
            </el-form-item>
            <el-form-item prop="password">
              <el-input
                v-model="loginForm.password"
                placeholder="请输入密码"
                size="large"
                prefix-icon="Lock"
                show-password
              />
            </el-form-item>
            <div class="form-options">
              <el-checkbox v-model="rememberMe">记住我</el-checkbox>
              <el-link type="primary" :underline="false" @click="openForgotDialog">忘记密码？</el-link>
            </div>
            <el-button
              type="primary"
              size="large"
              class="submit-btn"
              @click="login"
              :loading="loginLoading"
              block
            >
              {{ loginLoading ? '登录中...' : '登 录' }}
            </el-button>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="注册" name="register">
          <el-form
            ref="regRef"
            :model="regForm"
            :rules="regRules"
            label-width="0"
            class="login-form"
          >
            <el-form-item prop="username">
              <el-input
                v-model="regForm.username"
                placeholder="请设置用户名（2-12个字符）"
                size="large"
                prefix-icon="User"
              />
            </el-form-item>
            <el-form-item prop="email">
              <el-input
                v-model="regForm.email"
                placeholder="请输入邮箱地址"
                size="large"
                prefix-icon="Message"
              />
            </el-form-item>
            <el-form-item prop="password">
              <el-input
                v-model="regForm.password"
                placeholder="请设置密码（至少6位）"
                size="large"
                prefix-icon="Lock"
                show-password
              />
            </el-form-item>
            <el-button
              type="primary"
              size="large"
              class="submit-btn"
              @click="register"
              :loading="regLoading"
              block
            >
              {{ regLoading ? '注册中...' : '注 册' }}
            </el-button>
          </el-form>
        </el-tab-pane>
      </el-tabs>

      <!-- 底部 -->
      <div class="footer-info">
        <span>© 2025 智慧笔记 · 安全高效</span>
      </div>
    </el-card>

    <!-- 忘记密码弹窗 -->
    <el-dialog v-model="forgotVisible" title="找回密码" width="420px">
      <el-form ref="forgotRef" :model="forgotForm" :rules="forgotRules" label-width="80px">
        <el-form-item label="注册邮箱" prop="email">
          <el-input v-model="forgotForm.email" placeholder="请输入注册时的邮箱"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="forgotVisible = false">取消</el-button>
        <el-button type="primary" @click="sendResetPwdMail" :loading="forgotLoading">发送重置邮件</el-button>
      </template>
    </el-dialog>

    <!-- 账号未激活弹窗 -->
    <el-dialog v-model="resendVisible" title="账号尚未激活" width="420px">
      <p>您的账号还未完成邮箱激活，暂时无法登录。</p>
      <p>请前往注册邮箱查收激活邮件，若未收到可重新发送。</p>
      <el-form ref="resendRef" :model="resendForm" label-width="80px" class="mt-4">
        <el-form-item label="注册邮箱" prop="email">
          <el-input v-model="resendForm.email" placeholder="输入注册邮箱"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resendVisible = false">关闭</el-button>
        <el-button type="primary" @click="resendActivateMail" :loading="resendLoading">重新发送激活邮件</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import request from '@/utils/request'
import { ElMessage, ElForm, type FormRules } from 'element-plus'
import { Document, User, Lock, Message } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

const activeTab = ref('login')
const rememberMe = ref(true)
const loginLoading = ref(false)
const regLoading = ref(false)

const loginRef = ref<InstanceType<typeof ElForm>>()
const loginForm = reactive({ username: '', password: '' })
const loginRules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

// 忘记密码弹窗
const forgotVisible = ref(false)
const forgotLoading = ref(false)
const forgotRef = ref<InstanceType<typeof ElForm>>()
const forgotForm = reactive({ email: '' })
const forgotRules: FormRules = {
  email: [
    { required: true, message: '请输入注册邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ]
}
const openForgotDialog = () => {
  forgotForm.email = ''
  forgotVisible.value = true
}
const sendResetPwdMail = async () => {
  await forgotRef.value?.validate()
  forgotLoading.value = true
  try {
    await request.post('/api/user/reset-pwd-send', forgotForm, { headers: { Authorization: '' } })
    ElMessage.success('密码重置邮件已发送，请前往邮箱查收')
    forgotVisible.value = false
  } finally {
    forgotLoading.value = false
  }
}

// 重发激活邮件弹窗
const resendVisible = ref(false)
const resendLoading = ref(false)
const resendRef = ref<InstanceType<typeof ElForm>>()
const resendForm = reactive({ email: '' })
const openResendDialog = (email?: string) => {
  resendForm.email = email || ''
  resendVisible.value = true
}
const resendActivateMail = async () => {
  await resendRef.value?.validate()
  resendLoading.value = true
  try {
    await request.post('/api/user/resend-activate', resendForm, { headers: { Authorization: '' } })
    ElMessage.success('激活邮件已重新发送，请查收')
    resendVisible.value = false
  } finally {
    resendLoading.value = false
  }
}

async function login() {
  try {
    await loginRef.value?.validate()
    loginLoading.value = true

    const config = { headers: { Authorization: '' } }
    const res = await request.post('/api/user/login', loginForm, config)

    userStore.setToken(res.data.accessToken, res.data.refreshToken, res.data.uid)
    ElMessage.success('登录成功，欢迎回来！')
    router.replace('/dashboard')
  } catch (err: any) {
    // 捕获未激活错误，弹出重发激活弹窗
    if (err?.msg?.includes('账号尚未激活')) {
      openResendDialog()
    }
  } finally {
    loginLoading.value = false
  }
}

const regRef = ref<InstanceType<typeof ElForm>>()
const regForm = reactive({ username: '', email: '', password: '' })
const regRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 12, message: '用户名长度在 2 到 12 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请设置密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' }
  ]
}

async function register() {
  try {
    await regRef.value?.validate()
    regLoading.value = true

    const config = { headers: { Authorization: '' } }
    await request.post('/api/user/register', regForm, config)

    ElMessage.success('注册成功，请前往邮箱激活账号后登录')
    activeTab.value = 'login'
    loginForm.username = regForm.username
    loginForm.password = ''
  } catch (error) {
    // 错误已由拦截器处理
  } finally {
    regLoading.value = false
  }
}
</script>

<style scoped>
.login-wrap {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f2f5;
}

.login-card {
  width: 420px;
  padding: 10px 20px 20px;
  border-radius: 12px;
}

:deep(.el-card__body) {
  padding: 10px 0 0;
}

/* ===== 品牌 ===== */
.brand-header {
  text-align: center;
  margin-bottom: 20px;
  padding-top: 4px;
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
  color: #303133;
  margin: 0;
  line-height: 1.3;
}

.brand-subtitle {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

/* ===== Tabs ===== */
.login-tabs {
  margin-top: 4px;
}

:deep(.el-tabs__header) {
  margin-bottom: 20px;
}

:deep(.el-tabs__item) {
  font-size: 16px;
  font-weight: 500;
}

/* ===== 表单 ===== */
.login-form {
  padding: 0 2px;
}

:deep(.el-input__wrapper) {
  border-radius: 8px;
}

:deep(.el-input__inner) {
  height: 42px;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 4px 0 20px;
  padding: 0 2px;
}

.submit-btn {
  height: 44px;
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 2px;
  border-radius: 8px;
}

/* ===== 底部 ===== */
.footer-info {
  text-align: center;
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid #ebeef5;
  color: #c0c4cc;
  font-size: 13px;
}

.mt-4 {
  margin-top: 16px;
}

/* ===== 响应式 ===== */
@media (max-width: 500px) {
  .login-card {
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

  .logo-icon .el-icon {
    font-size: 24px !important;
  }
}
</style>