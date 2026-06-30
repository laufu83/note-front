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
            placeholder="请设置用户名（2-12个字符，仅限字母、数字、下划线）"
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
            placeholder="请设置密码（至少6位，含字母和数字）"
            size="large"
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <!-- 确认密码 -->
        <el-form-item prop="confirmPassword">
          <el-input
            v-model="regForm.confirmPassword"
            placeholder="请再次输入密码"
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

        <!-- 用户协议 -->
        <div class="agreement">
          <el-checkbox v-model="agreeTerms" size="default">
            <span>我已阅读并同意</span>
            <el-link 
              type="primary" 
              underline="never" 
              @click.stop="showTerms"
              class="agreement-link"
            >
              《用户协议》
            </el-link>
            <span>和</span>
            <el-link 
              type="primary" 
              underline="never" 
              @click.stop="showPrivacy"
              class="agreement-link"
            >
              《隐私政策》
            </el-link>
          </el-checkbox>
        </div>

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

        <!-- 登录入口 -->
        <div class="login-link">
          <span>已有账号？</span>
          <el-link type="primary" @click="$router.push('/login')" underline="never">立即登录</el-link>
        </div>
      </el-form>

      <!-- 底部 -->
      <div class="footer-info">
        <span>© 2026 智慧笔记 · 安全高效</span>
      </div>
    </el-card>

    <!-- 用户协议弹窗 -->
    <el-dialog 
      v-model="termsVisible" 
      title="用户协议" 
      width="560px" 
      class="custom-dialog"
      :close-on-click-modal="false"
    >
      <div class="terms-content">
        <h4>一、服务条款</h4>
        <p>欢迎使用智慧笔记服务。请您仔细阅读以下条款...</p>
        <h4>二、用户义务</h4>
        <p>用户应遵守中华人民共和国相关法律法规...</p>
        <h4>三、隐私保护</h4>
        <p>我们重视用户的隐私保护，详情请查看隐私政策...</p>
        <h4>四、免责声明</h4>
        <p>在法律允许的范围内，本平台不承担...</p>
      </div>
      <template #footer>
        <el-button type="primary" @click="termsVisible = false">我已阅读并同意</el-button>
      </template>
    </el-dialog>

    <!-- 隐私政策弹窗 -->
    <el-dialog 
      v-model="privacyVisible" 
      title="隐私政策" 
      width="560px" 
      class="custom-dialog"
      :close-on-click-modal="false"
    >
      <div class="terms-content">
        <h4>一、信息收集</h4>
        <p>我们收集的信息包括：用户名、邮箱地址、密码（加密存储）...</p>
        <h4>二、信息使用</h4>
        <p>我们使用您的信息来提供、维护和改进服务...</p>
        <h4>三、信息保护</h4>
        <p>我们采用行业标准的加密技术保护您的数据...</p>
        <h4>四、用户权利</h4>
        <p>您有权随时访问、修改或删除您的个人信息...</p>
      </div>
      <template #footer>
        <el-button type="primary" @click="privacyVisible = false">我已阅读并同意</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { getCaptcha, verifyCaptcha, register } from '@/api'
import { ElMessage, ElForm, type FormRules, type FormInstance } from 'element-plus'
import { Document, User, Lock, Message, Refresh } from '@element-plus/icons-vue'

const router = useRouter()
const regLoading = ref(false)
const agreeTerms = ref(false)
const termsVisible = ref(false)
const privacyVisible = ref(false)

// 验证码
let regCaptchaKey = ''
const regCaptchaUrl = ref('')

// 加载注册验证码
const refreshRegCaptcha = async () => {
  try {
    const res = await getCaptcha()
    if (!res.data) {
      ElMessage.error('服务端返回数据异常，请稍后重试')
      return
    }
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
const regRef = ref<FormInstance>()
const regForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  captchaCode: '',
  captchaToken: ''
})

// 自定义验证：确认密码
const validateConfirmPassword = (rule: any, value: string, callback: (error?: Error) => void) => {
  if (!value) {
    callback(new Error('请再次输入密码'))
  } else if (value !== regForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

// 自定义验证：用户名格式 - 只允许字母、数字、下划线
const validateUsername = (rule: any, value: string, callback: (error?: Error) => void) => {
  if (!value) {
    callback(new Error('请输入用户名'))
  } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
    callback(new Error('用户名只能包含字母、数字和下划线'))
  } else {
    callback()
  }
}

// 自定义验证：密码强度
const validatePassword = (rule: any, value: string, callback: (error?: Error) => void) => {
  if (!value) {
    callback(new Error('请设置密码'))
  } else if (value.length < 6) {
    callback(new Error('密码至少6位'))
  } else if (!/^(?=.*[a-zA-Z])(?=.*\d)/.test(value)) {
    callback(new Error('密码必须包含字母和数字'))
  } else {
    callback()
  }
}

// 自定义验证：邮箱
const validateEmail = (rule: any, value: string, callback: (error?: Error) => void) => {
  if (!value) {
    callback(new Error('请输入邮箱'))
  } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) {
    callback(new Error('请输入正确的邮箱格式'))
  } else {
    callback()
  }
}

const regRules: FormRules = {
  username: [
    { validator: validateUsername, trigger: 'blur' },
    { min: 2, max: 12, message: '用户名长度2-12位', trigger: 'blur' }
  ],
  email: [
    { validator: validateEmail, trigger: 'blur' }
  ],
  password: [
    { validator: validatePassword, trigger: 'blur' }
  ],
  confirmPassword: [
    { validator: validateConfirmPassword, trigger: 'blur' }
  ],
  captchaCode: [
    { required: true, message: '请输入图形验证码', trigger: 'blur' },
    { min: 4, max: 4, message: '验证码为4位', trigger: 'blur' }
  ]
}

// 校验验证码
const validateCaptcha = async (key: string, code: string): Promise<string | null> => {
  try {
    const res = await verifyCaptcha({ key, code: code.toUpperCase() })
    if (!res.data) {
      ElMessage.error('服务端返回数据异常，请稍后重试')
      return null
    }
    return res.data
  } catch {
    refreshRegCaptcha()
    return null
  }
}

// 显示协议
const showTerms = (e: Event) => {
  e.stopPropagation()
  termsVisible.value = true
}

const showPrivacy = (e: Event) => {
  e.stopPropagation()
  privacyVisible.value = true
}

// ===== 注册 - 完整校验流程 =====
async function handleRegister() {
  // 1. 检查是否同意协议
  if (!agreeTerms.value) {
    ElMessage.warning('请先阅读并同意用户协议和隐私政策')
    // 滚动到协议位置
    const agreementEl = document.querySelector('.agreement')
    if (agreementEl) {
      agreementEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    return
  }

  // 2. 表单基础校验
  try {
    await regRef.value?.validate()
  } catch (error) {
    // 表单校验失败，显示第一个错误字段
    ElMessage.warning('请完善注册信息')
    return
  }

  // 3. 额外校验：确认密码（再次确保）
  if (regForm.password !== regForm.confirmPassword) {
    ElMessage.error('两次输入的密码不一致')
    // 聚焦到确认密码字段
    const confirmInput = document.querySelector('input[placeholder="请再次输入密码"]') as HTMLInputElement
    if (confirmInput) {
      confirmInput.focus()
    }
    return
  }

  // 4. 开始注册
  regLoading.value = true

  try {
    // 4.1 验证图形验证码
    const token = await validateCaptcha(regCaptchaKey, regForm.captchaCode)
    if (!token) {
      regLoading.value = false
      return
    }
    regForm.captchaToken = token

    // 4.2 准备注册数据
    const registerData = {
      username: regForm.username.trim(),
      email: regForm.email.trim(),
      password: regForm.password,
      captchaCode: regForm.captchaCode,
      captchaToken: regForm.captchaToken
    }

    // 4.3 提交注册
    await register(registerData)
    
    ElMessage.success({
      message: '🎉 注册成功！请前往邮箱激活账号',
      duration: 5000
    })
    
    // 4.4 跳转到登录页
    setTimeout(() => {
      router.push({
        path: '/login',
        query: { username: regForm.username }
      })
    }, 1500)
    
  } catch (err: any) {
    console.error('注册失败:', err)
    const errorMsg = err?.msg || err?.message || err?.data?.msg || ''
    
    // 处理不同类型的错误
    if (errorMsg.includes('已存在') || errorMsg.includes('already')) {
      if (errorMsg.includes('用户名')) {
        ElMessage.error('用户名已被注册，请更换')
        // 聚焦到用户名输入框
        const usernameInput = document.querySelector('input[placeholder*="用户名"]') as HTMLInputElement
        if (usernameInput) {
          usernameInput.focus()
        }
      } else if (errorMsg.includes('邮箱')) {
        ElMessage.error('邮箱已被注册，请更换')
        const emailInput = document.querySelector('input[placeholder*="邮箱"]') as HTMLInputElement
        if (emailInput) {
          emailInput.focus()
        }
      } else {
        ElMessage.error('用户名或邮箱已被注册，请更换')
      }
    } else if (errorMsg.includes('验证码') || errorMsg.includes('captcha')) {
      refreshRegCaptcha()
      ElMessage.error('验证码错误，请重新输入')
      // 聚焦到验证码输入框
      const captchaInput = document.querySelector('input[placeholder*="验证码"]') as HTMLInputElement
      if (captchaInput) {
        captchaInput.focus()
      }
    } else if (errorMsg.includes('密码')) {
      ElMessage.error('密码格式不正确，请重新设置')
      const passwordInput = document.querySelector('input[placeholder*="密码"][type="password"]') as HTMLInputElement
      if (passwordInput) {
        passwordInput.focus()
      }
    } else {
      ElMessage.error(errorMsg || '注册失败，请稍后重试')
    }
  } finally {
    regLoading.value = false
  }
}

// ===== 表单校验辅助方法 =====
// 手动触发表单校验（可用于失焦时校验）
const validateField = async (field: string) => {
  try {
    await regRef.value?.validateField(field)
    return true
  } catch {
    return false
  }
}

// 清空表单校验状态
const clearValidate = () => {
  regRef.value?.clearValidate()
}

// 重置表单
const resetForm = () => {
  regRef.value?.resetFields()
  regForm.captchaCode = ''
  agreeTerms.value = false
  refreshRegCaptcha()
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

/* ===== 用户协议 ===== */
.agreement {
  margin: 4px 0 20px;
  font-size: 13px;
  color: #6b7280;
  user-select: none;
}

.agreement .agreement-link {
  font-size: 13px;
  cursor: pointer;
  padding: 0 2px;
}

.agreement .agreement-link:hover {
  color: #3b5de7;
}

:deep(.agreement .el-checkbox) {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

:deep(.agreement .el-checkbox__label) {
  font-size: 13px;
  color: #6b7280;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 2px;
}

:deep(.agreement .el-checkbox__label span) {
  display: inline;
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

/* ===== 登录链接 ===== */
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

.terms-content {
  max-height: 400px;
  overflow-y: auto;
  padding-right: 8px;
  color: #475569;
  line-height: 1.8;
}

.terms-content h4 {
  color: #1a1a2e;
  margin: 16px 0 8px;
  font-weight: 600;
}

.terms-content h4:first-child {
  margin-top: 0;
}

.terms-content p {
  margin: 0 0 8px 0;
  font-size: 14px;
}

/* ===== 表单校验错误样式增强 ===== */
:deep(.el-form-item.is-error .el-input__wrapper) {
  border-color: #f56c6c !important;
  box-shadow: 0 0 0 3px rgba(245, 108, 108, 0.10) !important;
}

:deep(.el-form-item.is-success .el-input__wrapper) {
  border-color: #67c23a !important;
}

:deep(.el-form-item .el-form-item__error) {
  font-size: 12px;
  padding-top: 4px;
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
  .agreement {
    font-size: 12px;
  }
  .agreement .agreement-link {
    font-size: 12px;
  }
  .terms-content {
    max-height: 300px;
  }
}
</style>