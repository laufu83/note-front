<!-- src/views/Login.vue - 添加冻结状态处理 -->

<template>
  <div class="login-wrap">
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
    </div>

    <el-card class="login-card" shadow="never">
      <!-- 品牌标识 -->
      <div class="brand-header">
        <div class="logo-icon">
          <el-icon :size="28"><Document /></el-icon>
        </div>
        <h1 class="brand-title">智慧笔记</h1>
        <p class="brand-subtitle">记录灵感 · 高效生活</p>
      </div>

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
            clearable
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
              @keyup.enter="handleLogin"
            />
            <div class="captcha-box" @click="refreshLoginCaptcha">
              <img 
                class="captcha-img"
                :src="loginCaptchaUrl"
                alt="点击刷新验证码"
                title="点击刷新"
              />
              <el-icon class="refresh-icon"><Refresh /></el-icon>
            </div>
          </div>
        </el-form-item>

        <div class="form-options">
          <el-checkbox v-model="rememberMe" size="default">记住我</el-checkbox>
          <el-link type="primary" :underline="false" @click="openForgotDialog">忘记密码？</el-link>
        </div>

        <el-button
          type="primary"
          size="large"
          class="submit-btn"
          @click="handleLogin"
          :loading="loginLoading"
          block
        >
          {{ loginLoading ? '登录中...' : '登 录' }}
        </el-button>

        <!-- 注册入口 - 移到按钮下方 -->
        <div class="register-link">
          <span>还没有账号？</span>
          <el-link type="primary" @click="$router.push('/register')" :underline="false">立即注册</el-link>
        </div>
      </el-form>

      <!-- 底部 -->
      <div class="footer-info">
        <span>© 2026 智慧笔记 · 安全高效</span>
      </div>
    </el-card>

    <!-- 忘记密码弹窗 -->
    <el-dialog v-model="forgotVisible" title="找回密码" width="420px" class="custom-dialog">
      <el-form ref="forgotRef" :model="forgotForm" :rules="forgotRules" label-width="80px">
        <el-form-item label="注册邮箱" prop="email">
          <el-input v-model="forgotForm.email" placeholder="请输入注册时的邮箱" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="forgotVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSendResetPwd" :loading="forgotLoading">发送重置邮件</el-button>
      </template>
    </el-dialog>

    <!-- 账号未激活弹窗 -->
    <el-dialog v-model="resendVisible" title="账号尚未激活" width="420px" class="custom-dialog">
      <div class="dialog-tip">
        <el-icon :size="36" color="#E6A23C"><Warning /></el-icon>
        <p>您的账号还未完成邮箱激活，暂时无法登录。</p>
        <p>请前往注册邮箱查收激活邮件，若未收到可重新发送。</p>
      </div>
      <el-form ref="resendRef" :model="resendForm" label-width="80px" class="mt-4">
        <el-form-item label="注册邮箱" prop="email">
          <el-input v-model="resendForm.email" placeholder="输入注册邮箱" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resendVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleResendActivate" :loading="resendLoading">重新发送激活邮件</el-button>
      </template>
    </el-dialog>

    <!-- 账号被冻结弹窗 -->
    <el-dialog v-model="frozenVisible" title="账号已冻结" width="420px" class="custom-dialog">
      <div class="dialog-tip">
        <el-icon :size="36" color="#F56C6C"><Warning /></el-icon>
        <p>您的账号已被管理员冻结，暂时无法登录。</p>
        <p>如有疑问，请联系系统管理员。</p>
      </div>
      <template #footer>
        <el-button type="primary" @click="frozenVisible = false">我知道了</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { getCaptcha, verifyCaptcha, login, sendResetPasswordEmail, resendActivateEmail } from '@/api'
import { ElMessage, ElMessageBox, ElForm, type FormRules } from 'element-plus'
import { Document, User, Lock, Refresh, Warning } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

const rememberMe = ref(true)
const loginLoading = ref(false)

// 验证码
let loginCaptchaKey = ''
const loginCaptchaUrl = ref('')

// 弹窗状态
const frozenVisible = ref(false)

// 加载登录验证码
const refreshLoginCaptcha = async () => {
  try {
    const res = await getCaptcha()
     // 类型守卫：严格判断data存在
    if (!res.data) {
      ElMessage.error('服务端返回数据异常，请稍后重试')
      return
    }
    loginCaptchaKey = res.data.key
    loginCaptchaUrl.value = `data:image/svg+xml;utf8,${encodeURIComponent(res.data.svg)}`
    loginForm.captchaCode = ''
  } catch (err) {
    ElMessage.error('验证码加载失败，请刷新页面')
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

// 校验验证码
const validateCaptcha = async (key: string, code: string): Promise<string | null> => {
  try {
    const res = await verifyCaptcha({ key, code: code.toUpperCase() })
    return res.data||null
  } catch {
    refreshLoginCaptcha()
    return null
  }
}

// ===== 登录 =====
async function handleLogin() {
  try {
    await loginRef.value?.validate()
    loginLoading.value = true

    const token = await validateCaptcha(loginCaptchaKey, loginForm.captchaCode)
    if (!token) return
    loginForm.captchaToken = token

    const res = await login(loginForm)
     // 类型守卫：严格判断data存在
    if (!res.data) {
      ElMessage.error('服务端返回数据异常，请稍后重试')
      return
    }
    userStore.setToken(res.data.accessToken, res.data.refreshToken, res.data.uid, res.data.role)
    ElMessage.success('登录成功')
    router.replace('/dashboard')
  } catch (err: any) {
    console.log(err.msg)
    // 处理账号被冻结的情况
    if (err?.msg?.includes('冻结')) {
      frozenVisible.value = true
      return
    }
    
    // 处理账号未激活
    if (err?.msg?.includes('激活')) {
      openResendDialog()
      return
    }
    
    // 其他错误由拦截器处理
  } finally {
    loginLoading.value = false
  }
}

// ===== 忘记密码 =====
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
const handleSendResetPwd = async () => {
  try {
    await forgotRef.value?.validate()
    forgotLoading.value = true
    await sendResetPasswordEmail(forgotForm)
    ElMessage.success('重置邮件已发送')
    forgotVisible.value = false
  } finally {
    forgotLoading.value = false
  }
}

// ===== 重发激活邮件 =====
const resendVisible = ref(false)
const resendLoading = ref(false)
const resendRef = ref<InstanceType<typeof ElForm>>()
const resendForm = reactive({ email: '' })
const openResendDialog = () => {
  resendForm.email = ''
  resendVisible.value = true
}
const handleResendActivate = async () => {
  try {
    await resendRef.value?.validate()
    resendLoading.value = true
    await resendActivateEmail(resendForm)
    ElMessage.success('激活邮件已重发')
    resendVisible.value = false
  } finally {
    resendLoading.value = false
  }
}
</script>

<style scoped>
/* ===== 全局 ===== */
.login-wrap {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f6fa;
  padding: 20px;
  position: relative;
}

/* ===== 背景装饰 ===== */
.bg-decoration {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.20;
}

.orb-1 {
  width: 400px;
  height: 400px;
  background: #4f6ef7;
  top: -120px;
  right: -80px;
}

.orb-2 {
  width: 320px;
  height: 320px;
  background: #a78bfa;
  bottom: -100px;
  left: -60px;
}

/* ===== 登录卡片 ===== */
.login-card {
  width: 420px;
  max-width: 100%;
  border-radius: 16px;
  background: #ffffff;
  border: 1px solid #e8ecf1;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  position: relative;
  z-index: 1;
  transition: box-shadow 0.3s ease;
}

.login-card:hover {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.10);
}

:deep(.el-card__body) {
  padding: 32px 36px 28px;
}

/* ===== 品牌区域 ===== */
.brand-header {
  text-align: center;
  margin-bottom: 24px;
}

.logo-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  background: #4f6ef7;
  border-radius: 14px;
  color: #fff;
  margin-bottom: 12px;
}

.brand-title {
  font-size: 24px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 2px;
  letter-spacing: -0.3px;
}

.brand-subtitle {
  font-size: 14px;
  color: #8b8fa7;
  margin: 0;
}

/* ===== 表单 ===== */
.login-form {
  margin-top: 4px;
  width: 100%;
}

:deep(.el-form-item) {
  margin-bottom: 18px;
  width: 100%;
}

:deep(.el-form-item .el-form-item__content) {
  width: 100%;
}

:deep(.el-input__wrapper) {
  border-radius: 8px;
  background: #f7f9fc;
  border: 1px solid #e2e8f0;
  box-shadow: none !important;
  transition: all 0.2s ease;
  width: 100%;
}

:deep(.el-input__wrapper:hover) {
  background: #f7f9fc;
  border-color: #cbd5e1;
}

:deep(.el-input__wrapper.is-focus) {
  background: #ffffff;
  border-color: #4f6ef7;
  box-shadow: 0 0 0 3px rgba(79, 110, 247, 0.10) !important;
}

:deep(.el-input__inner) {
  height: 42px;
  font-size: 14px;
}

:deep(.el-input__prefix-inner) {
  color: #9aa3b5;
}

/* ===== 验证码 ===== */
.captcha-row {
  display: flex;
  gap: 10px;
  align-items: center;
  width: 100%;
}

.captcha-row .el-input {
  flex: 1;
}

.captcha-box {
  position: relative;
  flex-shrink: 0;
  width: 120px;
  height: 42px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  background: #f7f9fc;
  cursor: pointer;
  transition: border-color 0.2s;
}

.captcha-box:hover {
  border-color: #cbd5e1;
}

.captcha-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.refresh-icon {
  position: absolute;
  bottom: 4px;
  right: 4px;
  font-size: 14px;
  color: #94a3b8;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 50%;
  padding: 3px;
  transition: all 0.25s ease;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.captcha-box:hover .refresh-icon {
  color: #4f6ef7;
  transform: rotate(60deg);
}

/* ===== 选项栏 ===== */
.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 2px 0 22px;
}

:deep(.el-checkbox__label) {
  font-weight: 400;
  color: #4b5563;
}

:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background: #4f6ef7;
  border-color: #4f6ef7;
}

:deep(.el-link) {
  font-weight: 500;
}

/* ===== 登录按钮 ===== */
.submit-btn {
  width: 100% !important;
  height: 44px;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 1px;
  border-radius: 8px;
  background: #4f6ef7;
  border: none;
  transition: all 0.25s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.submit-btn:hover {
  background: #3b5de7;
  box-shadow: 0 4px 16px rgba(79, 110, 247, 0.30);
}

.submit-btn:active {
  transform: scale(0.98);
}

:deep(.el-button--block) {
  width: 100% !important;
}

/* ===== 注册链接 - 移到按钮下方 ===== */
.register-link {
  text-align: center;
  margin-top: 18px;
  font-size: 14px;
  color: #6b7280;
}

.register-link .el-link {
  font-weight: 500;
  margin-left: 4px;
}

/* ===== 底部 ===== */
.footer-info {
  text-align: center;
  margin-top: 22px;
  padding-top: 16px;
  border-top: 1px solid #eceff3;
  color: #b0b8c9;
  font-size: 13px;
}

/* ===== 弹窗 ===== */
:deep(.custom-dialog .el-dialog) {
  border-radius: 16px;
}

:deep(.custom-dialog .el-dialog__header) {
  padding: 20px 24px 8px;
}

:deep(.custom-dialog .el-dialog__title) {
  font-weight: 600;
  font-size: 17px;
  color: #1e293b;
}

:deep(.custom-dialog .el-dialog__body) {
  padding: 16px 24px 8px;
}

:deep(.custom-dialog .el-dialog__footer) {
  padding: 16px 24px 24px;
}

.dialog-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 6px;
  margin-bottom: 12px;
}

.dialog-tip p {
  margin: 0;
  color: #475569;
  font-size: 14px;
  line-height: 1.6;
}

.mt-4 {
  margin-top: 12px;
}

/* ===== 响应式 ===== */
@media (max-width: 480px) {
  .login-card {
    width: 100%;
  }
  :deep(.el-card__body) {
    padding: 24px 20px 20px;
  }
  .brand-title {
    font-size: 20px;
  }
  .logo-icon {
    width: 48px;
    height: 48px;
  }
  .captcha-box {
    width: 96px;
    height: 38px;
  }
  .submit-btn {
    height: 40px;
    font-size: 14px;
  }
}
</style>