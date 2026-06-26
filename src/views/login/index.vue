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
      <el-tabs v-model="activeTab" class="login-tabs" stretch @tab-change="handleTabChange">
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

            <!-- 图形验证码 -->
            <el-form-item prop="captchaCode">
              <div class="captcha-row">
                <el-input
                  v-model="loginForm.captchaCode"
                  placeholder="请输入4位验证码"
                  size="large"
                  maxlength="4"
                  @keyup.enter="login"
                />
                <img 
                  class="captcha-img"
                  :src="loginCaptchaUrl"
                  @click="refreshLoginCaptcha"
                  alt="点击刷新验证码"
                  title="点击刷新"
                />
              </div>
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

            <!-- 图形验证码 -->
            <el-form-item prop="captchaCode">
              <div class="captcha-row">
                <el-input
                  v-model="regForm.captchaCode"
                  placeholder="请输入4位验证码"
                  size="large"
                  maxlength="4"
                  @keyup.enter="register"
                />
                <img 
                  class="captcha-img"
                  :src="regCaptchaUrl"
                  @click="refreshRegCaptcha"
                  alt="点击刷新验证码"
                  title="点击刷新"
                />
              </div>
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
        <span>© 2026 智慧笔记 · 安全高效</span>
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
import { ref, reactive, onMounted } from 'vue'
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

// 验证码
let loginCaptchaKey = ''
let regCaptchaKey = ''
const loginCaptchaUrl = ref('')
const regCaptchaUrl = ref('')

interface Resp<T> {
  code: number
  msg: string
  data: T
}

type CaptchaInfoResp = Resp<{
  key: string
  svg: string
}>

// 加载登录验证码
const refreshLoginCaptcha = async () => {
  try {
    const res = await request.get<CaptchaInfoResp>('/api/captcha/img', {
      headers: { Authorization: '' }
    })
    loginCaptchaKey = res.data.key
    // SVG 转为 data URL 显示
    loginCaptchaUrl.value = `data:image/svg+xml;utf8,${encodeURIComponent(res.data.svg)}`
    loginForm.captchaCode = ''
  } catch (err) {
    ElMessage.error('验证码加载失败，请刷新页面')
  }
}

// 加载注册验证码
const refreshRegCaptcha = async () => {
  try {
    const res = await request.get<CaptchaInfoResp>('/api/captcha/img', {
      headers: { Authorization: '' }
    })
    regCaptchaKey = res.data.key
    regCaptchaUrl.value = `data:image/svg+xml;utf8,${encodeURIComponent(res.data.svg)}`
    regForm.captchaCode = ''
  } catch (err) {
    ElMessage.error('验证码加载失败，请刷新页面')
  }
}

const handleTabChange = () => {
  if (activeTab.value === 'login') {
    refreshLoginCaptcha()
  } else {
    refreshRegCaptcha()
  }
}

onMounted(() => {
  refreshLoginCaptcha()
})

// 登录表单
const loginRef = ref<InstanceType<typeof ElForm>>()
const loginForm = reactive({
  username: '',
  password: '',
  captchaCode: '',
  captchaToken: ''
})
const loginRules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  captchaCode: [{ required: true, message: '请输入图形验证码', trigger: 'blur' }]
}

// 注册表单
const regRef = ref<InstanceType<typeof ElForm>>()
const regForm = reactive({
  username: '',
  email: '',
  password: '',
  captchaCode: '',
  captchaToken: ''
})
const regRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 12, message: '用户名长度2-12位', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式错误', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请设置密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ],
  captchaCode: [{ required: true, message: '请输入图形验证码', trigger: 'blur' }]
}

// 校验验证码
const verifyCaptcha = async (key: string, code: string): Promise<string | null> => {
  try {
    const res = await request.post('/api/captcha/verify',
      { key, code: code.toUpperCase() },
      { headers: { Authorization: '' } }
    )
    return res.data
  } catch {
    activeTab.value === 'login' ? refreshLoginCaptcha() : refreshRegCaptcha()
    return null
  }
}

// 登录
async function login() {
  try {
    await loginRef.value?.validate()
    loginLoading.value = true

    const token = await verifyCaptcha(loginCaptchaKey, loginForm.captchaCode)
    if (!token) return
    loginForm.captchaToken = token

    const res = await request.post('/api/user/login', loginForm, {
      headers: { Authorization: '' }
    })
    userStore.setToken(res.data.accessToken, res.data.refreshToken, res.data.uid, res.data.role)
    ElMessage.success('登录成功')
    router.replace('/dashboard')
  } catch (err: any) {
    if (err.msg?.includes('账号尚未激活')) openResendDialog()
  } finally {
    loginLoading.value = false
  }
}

// 注册
async function register() {
  try {
    await regRef.value?.validate()
    regLoading.value = true

    const token = await verifyCaptcha(regCaptchaKey, regForm.captchaCode)
    if (!token) return
    regForm.captchaToken = token

    await request.post('/api/user/register', regForm, {
      headers: { Authorization: '' }
    })
    ElMessage.success('注册成功，请前往邮箱激活账号')
    activeTab.value = 'login'
    loginForm.username = regForm.username
    refreshLoginCaptcha()
  } finally {
    regLoading.value = false
  }
}

// 忘记密码
const forgotVisible = ref(false)
const forgotLoading = ref(false)
const forgotRef = ref<InstanceType<typeof ElForm>>()
const forgotForm = reactive({ email: '' })
const forgotRules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式错误', trigger: 'blur' }
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
    ElMessage.success('重置邮件已发送')
    forgotVisible.value = false
  } finally {
    forgotLoading.value = false
  }
}

// 重发激活邮件
const resendVisible = ref(false)
const resendLoading = ref(false)
const resendRef = ref<InstanceType<typeof ElForm>>()
const resendForm = reactive({ email: '' })
const openResendDialog = () => {
  resendForm.email = ''
  resendVisible.value = true
}
const resendActivateMail = async () => {
  await resendRef.value?.validate()
  resendLoading.value = true
  try {
    await request.post('/api/user/resend-activate', resendForm, { headers: { Authorization: '' } })
    ElMessage.success('激活邮件已重发')
    resendVisible.value = false
  } finally {
    resendLoading.value = false
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
  width: 460px;
  padding: 10px 20px 20px;
  border-radius: 12px;
}

:deep(.el-card__body) {
  padding: 10px 0 0;
}

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

.login-form {
  padding: 0 2px;
}

:deep(.el-input__wrapper) {
  border-radius: 8px;
}

:deep(.el-input__inner) {
  height: 42px;
}

/* ===== 验证码 ===== */
.captcha-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.captcha-row .el-input {
  flex: 1;
}

.captcha-img {
  width: 120px;
  height: 42px;
  flex-shrink: 0;
  cursor: pointer;
  border-radius: 6px;
  border: 1px solid #dcdfe6;
  background: #f5f7fa;
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

@media (max-width: 500px) {
  .login-card {
    width: 96%;
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
  .captcha-img {
    width: 90px;
    height: 36px;
  }
}
</style>