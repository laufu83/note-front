// src/api/auth.ts - 认证相关接口
import request from '@/utils/request'
import type { Resp } from '@/types/response'
// ===== 类型定义 =====
export interface CaptchaInfo {
  key: string
  svg: string
}

export interface CaptchaVerifyParams {
  key: string
  code: string
}

export interface LoginParams {
  username: string
  password: string
  captchaCode: string
  captchaToken: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  uid: number
  role: string
}

export interface RegisterParams {
  username: string
  email: string
  password: string
  captchaCode: string
  captchaToken: string
}

export interface ForgotPasswordParams {
  email: string
}
export interface ResetPasswordParams {
  token: string
  newPwd: string
}

export interface ResendActivateParams {
  email: string
}

export interface ActivateParams {
  token: string
}

export interface RefreshTokenResponse {
  accessToken: string
}
// ===== API 接口 =====

/**
 * 获取图形验证码
 */
export const getCaptcha = () => {
  return request.get<Resp<CaptchaInfo>>('/api/captcha/img', {
    headers: { Authorization: '' }
  })
}

/**
 * 校验图形验证码
 */
export const verifyCaptcha = (params: CaptchaVerifyParams) => {
  return request.post<Resp<string>>('/api/captcha/verify', params, {
    headers: { Authorization: '' }
  })
}

/**
 * 用户登录
 */
export const login = (params: LoginParams) => {
  return request.post<Resp<LoginResponse>>('/api/user/login', params, {
    headers: { Authorization: '' }
  })
}

/**
 * 用户注册
 */
export const register = (params: RegisterParams) => {
  return request.post<Resp<null>>('/api/user/register', params, {
    headers: { Authorization: '' }
  })
}
/**
 * 重置密码（通过 token）
 */
export const resetPassword = (params: ResetPasswordParams) => {
  return request.post<Resp<null>>('/api/user/reset-pwd', params, {
    headers: { Authorization: '' }
  })
}
/**
 * 发送密码重置邮件
 */
export const sendResetPasswordEmail = (params: ForgotPasswordParams) => {
  return request.post<Resp<null>>('/api/user/reset-pwd-send', params, {
    headers: { Authorization: '' }
  })
}

/**
 * 重新发送激活邮件
 */
export const resendActivateEmail = (params: ResendActivateParams) => {
  return request.post<Resp<null>>('/api/user/resend-activate', params, {
    headers: { Authorization: '' }
  })
}

/**
 * 激活账号
 */
export const activateAccount = (params: ActivateParams) => {
  return request.get<Resp<null>>(`/api/user/activate?token=${encodeURIComponent(params.token)}`, {
    headers: { Authorization: '' }
  })
}

/**
 * 刷新 Token
 */
export const refreshToken = (refreshToken: string) => {
  return request.post<Resp<RefreshTokenResponse>>(
    '/api/user/refresh-token',
    { refreshToken },
    { headers: { Authorization: '' } }
  )
}