// src/utils/common.ts
// 公共工具函数

import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

// ============================================================
// 时间格式化
// ============================================================

/**
 * 格式化时间
 */
export function formatTime(time: string | Date | null | undefined): string {
  if (!time) return '-'
  const date = typeof time === 'string' ? new Date(time) : time
  if (isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

/**
 * 格式化日期（不含时间）
 */
export function formatDate(time: string | Date | null | undefined): string {
  if (!time) return '-'
  const date = typeof time === 'string' ? new Date(time) : time
  if (isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

/**
 * 格式化相对时间
 */
export function formatRelativeTime(time: string | Date): string {
  const date = typeof time === 'string' ? new Date(time) : time
  if (isNaN(date.getTime())) return '-'
  
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  if (hours < 24) return `${hours} 小时前`
  if (days < 30) return `${days} 天前`
  return formatDate(time)
}

// ============================================================
// 文件大小格式化
// ============================================================

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`
}

// ============================================================
// 数组比较
// ============================================================

/**
 * 判断两个数组是否相等（浅比较）
 */
export function isArrayEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false
  return JSON.stringify(a) === JSON.stringify(b)
}

// ============================================================
// 删除确认弹窗
// ============================================================

/**
 * 删除确认弹窗
 */
export async function confirmDelete(
  message: string = '确定要删除吗？',
  title: string = '提示'
): Promise<boolean> {
  try {
    await ElMessageBox.confirm(message, title, {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    return true
  } catch {
    return false
  }
}

/**
 * 危险操作确认弹窗
 */
export async function confirmDanger(
  message: string,
  title: string = '警告'
): Promise<boolean> {
  try {
    await ElMessageBox.confirm(message, title, {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'error',
      confirmButtonClass: 'el-button--danger'
    })
    return true
  } catch {
    return false
  }
}

// ============================================================
// 复制到剪贴板
// ============================================================

/**
 * 复制文本到剪贴板
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制到剪贴板')
    return true
  } catch {
    ElMessage.error('复制失败，请手动复制')
    return false
  }
}

// ============================================================
// 表单校验工具
// ============================================================

/**
 * 校验表单并返回结果
 */
export async function validateForm(formRef: FormInstance | null): Promise<boolean> {
  if (!formRef) return false
  try {
    await formRef.validate()
    return true
  } catch {
    return false
  }
}

// ============================================================
// 通用表单规则
// ============================================================

/**
 * 通用表单规则
 */
export const commonRules = {
  // 必填
  required: (message: string = '此项为必填') => ({
    required: true,
    message,
    trigger: 'blur'
  }),
  
  // 长度限制
  length: (min: number, max: number, message?: string) => ({
    min,
    max,
    message: message || `长度在 ${min} 到 ${max} 个字符`,
    trigger: 'blur'
  }),
  
  // 用户名规则
  username: (min: number = 2, max: number = 20) => [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min, max, message: `用户名长度在 ${min} 到 ${max} 个字符`, trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, message: '用户名只能包含字母、数字、下划线和中文', trigger: 'blur' }
  ],
  
  // 邮箱规则
  email: () => [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  
  // 密码规则
  password: (min: number = 6) => [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min, message: `密码至少 ${min} 位`, trigger: 'blur' }
  ],
  
  // 确认密码规则
  confirmPassword: (getPassword: () => string) => [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (rule: any, value: string, callback: (error?: Error) => void) => {
        if (value !== getPassword()) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  
  // 配置键名规则
  configKey: (min: number = 2, max: number = 50) => [
    { required: true, message: '请输入配置键名', trigger: 'blur' },
    { min, max, message: `长度在 ${min} 到 ${max} 个字符`, trigger: 'blur' },
    { pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/, message: '只能包含字母、数字、下划线，且以字母或下划线开头', trigger: 'blur' }
  ]
}

// ============================================================
// 获取文件图标
// ============================================================

/**
 * 根据 MIME 类型获取文件图标名称
 */
export function getFileIcon(mimeType: string): string {
  if (!mimeType) return 'Document'
  if (mimeType.startsWith('image/')) return 'Picture'
  if (mimeType.includes('video/')) return 'VideoCamera'
  if (mimeType.includes('audio/')) return 'Headset'
  if (mimeType.includes('pdf')) return 'Files'
  return 'Document'
}

/**
 * 根据 MIME 类型获取文件图标颜色
 */
export function getFileIconColor(mimeType: string): string {
  if (!mimeType) return 'var(--text-secondary)'
  if (mimeType.startsWith('image/')) return '#409EFF'
  if (mimeType.includes('video/')) return '#E6A23C'
  if (mimeType.includes('audio/')) return '#67C23A'
  if (mimeType.includes('pdf')) return '#F56C6C'
  return 'var(--text-secondary)'
}

/**
 * 根据 MIME 类型获取文件类型标签
 */
export function getFileTypeLabel(mimeType: string): string {
  if (!mimeType) return '未知'
  if (mimeType.startsWith('image/')) return '图片'
  if (mimeType.includes('video/')) return '视频'
  if (mimeType.includes('audio/')) return '音频'
  if (mimeType.includes('pdf')) return 'PDF'
  if (mimeType.includes('word')) return '文档'
  if (mimeType.includes('excel')) return '表格'
  if (mimeType.includes('text')) return '文本'
  return '其他'
}

/**
 * 判断是否为图片
 */
export function isImage(mimeType: string): boolean {
  return mimeType?.startsWith('image/')
}

// ============================================================
// 配置类型工具
// ============================================================

/**
 * 获取配置类型标签
 */
export function getConfigTypeLabel(type: string): string {
  const map: Record<string, string> = {
    bool: '布尔',
    int: '数字',
    string: '字符串',
    json: 'JSON'
  }
  return map[type] || type
}

/**
 * 获取配置类型标签颜色
 */
export function getConfigTypeColor(type: string): string {
  const map: Record<string, string> = {
    bool: 'success',
    int: 'warning',
    string: 'info',
    json: 'primary'
  }
  return map[type] || 'info'
}

// ============================================================
// 判断是否过期
// ============================================================

/**
 * 判断时间是否过期
 */
export function isExpired(time: string | Date | null | undefined): boolean {
  if (!time) return false
  const date = typeof time === 'string' ? new Date(time) : time
  if (isNaN(date.getTime())) return false
  return date < new Date()
}

/**
 * 计算剩余天数
 */
export function getRemainingDays(time: string | Date | null | undefined): number {
  if (!time) return 0
  const date = typeof time === 'string' ? new Date(time) : time
  if (isNaN(date.getTime())) return 0
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  return days > 0 ? days : 0
}