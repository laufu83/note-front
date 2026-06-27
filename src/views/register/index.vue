<template>
  <div class="register-wrap">
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
    </div>

    <el-card class="register-card" shadow="never">
      <!-- 品牌标识 -->
      <div class="brand-header">
        <div class="logo-icon">
          <el-icon :size="28"><Document /></el-icon>
        </div>
        <h1 class="brand-title">智慧笔记</h1>
        <p class="brand-subtitle">记录灵感 · 高效生活</p>
      </div>

      <el-form
        ref="regRef"
        :model="regForm"
        :rules="regRules"
        label-width="0"
        class="register-form"
      >
        <el-form-item prop="username">
          <el-input
            v-model="regForm.username"
            placeholder="请设置用户名（2-12个字符）"
            size="large"
            prefix-icon="User"
            clearable
          />
        </el-form-item>
        <el-form-item prop="email">
          <el-input
            v-model="regForm.email"
            placeholder="请输入邮箱地址"
            size="large"
            prefix-icon="Message"
            clearable
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
              @keyup.enter="handleRegister"
            />
            <div class="captcha-box" @click="refreshRegCaptcha">
              <img 
                class="captcha-img"
                :src="regCaptchaUrl"
                alt="点击刷新验证码"
                title="点击刷新"
              />
              <el-icon class="refresh-icon"><Refresh /></el-icon>
            </div>
          </div>
        </el-form-item>

        <el-button
          type="primary"
          size="large"
          class="submit-btn"
          @click="handleRegister"
          :loading="regLoading"
          block
        >
          {{ regLoading ? '注册中...' : '注 册' }}
        </el-button>

        <!-- 登录入口 - 移到按钮下方 -->
        <div class="login-link">
          <span>已有账号？</span>
          <el-link type="primary" @click="$router.push('/login')" :underline="false">立即登录</el-link>
        </div>
      </el-form>

      <!-- 底部 -->
      <div class="footer-info">
        <span>© 2026 智慧笔记 · 安全高效</span>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getCaptcha, verifyCaptcha, register } from '@/api'
import { ElMessage, ElForm, type FormRules } from 'element-plus'
import { Document, User, Lock, Message, Refresh } from '@element-plus/icons-vue'

const router = useRouter()
const regLoading = ref(false)

// 验证码
let regCaptchaKey = ''
const regCaptchaUrl = ref('')

// 加载注册验证码
const refreshRegCaptcha = async () => {
  try {
    const res = await getCaptcha()
    regCaptchaKey = res.data.key
    regCaptchaUrl.value = `data:image/svg+xml;utf8,${encodeURIComponent(res.data.svg)}`
    regForm.captchaCode = ''
  } catch (err) {
    ElMessage.error('验证码加载失败，请刷新页面')
  }
}

onMounted(() => {
  refreshRegCaptcha()
})

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
const validateCaptcha = async (key: string, code: string): Promise<string | null> => {
  try {
    const res = await verifyCaptcha({ key, code: code.toUpperCase() })
    return res.data
  } catch {
    refreshRegCaptcha()
    return null
  }
}

// 注册 - 已全部使用 API 模块
async function handleRegister() {
  try {
    await regRef.value?.validate()
    regLoading.value = true

    const token = await validateCaptcha(regCaptchaKey, regForm.captchaCode)
    if (!token) return
    regForm.captchaToken = token

    await register(regForm)
    ElMessage.success('注册成功，请前往邮箱激活账号')
    router.push({
      path: '/login',
      query: { username: regForm.username }
    })
  } finally {
    regLoading.value = false
  }
}
</script>

<style scoped>
/* ===== 全局 ===== */
.register-wrap {
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

/* ===== 注册卡片 ===== */
.register-card {
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

.register-card:hover {
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
.register-form {
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

/* ===== 注册按钮 ===== */
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

/* ===== 登录链接 - 移到按钮下方 ===== */
.login-link {
  text-align: center;
  margin-top: 18px;
  font-size: 14px;
  color: #6b7280;
}

.login-link .el-link {
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

/* ===== 响应式 ===== */
@media (max-width: 480px) {
  .register-card {
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