// src/api/user.ts - 更新用户管理相关接口（添加密码修改和账号注销）

import request from '@/utils/request'
import type { Resp } from '@/types/response'

// ===== 类型定义 =====
export interface UserItem {
  id: number
  username: string
  email?: string
  avatar?:string
  role: 'admin' | 'user'
  status: 'active' | 'inactive'
  is_frozen: boolean
  created_at: string
  updated_at?: string
}

export interface UpdateUserParams {
  userId: number
  role?: 'admin' | 'user'
  isFrozen?: boolean
}

export interface AdminResetPwdParams {
  userId: number
  newPwd: string
}

export interface ChangePasswordParams {
  oldPwd: string
  newPwd: string
}
export interface UpdateUserInfoParams {
  email?: string
  username?: string
  avatar?:string
}
export type UserListResponse = UserItem[]

// ===== API 接口 =====

/**
 * 获取当前用户信息
 */
export const getCurrentUserInfo = () => {
  return request.get<Resp<UserItem>>('/api/user/info')
}

/**
 * 获取用户列表（管理员）
 */
export const getUserListApi = () => {
  return request.get<Resp<UserListResponse>>('/api/user/list')
}

/**
 * 更新用户信息（管理员）
 */
export const updateUserApi = (params: UpdateUserParams) => {
  return request.post<Resp<null>>(`/api/user/update`, params)
}

/**
 * 重置用户密码（管理员）
 */
export const adminResetUserPwdApi = (params: AdminResetPwdParams) => {
  return request.post<Resp<null>>(`/api/user/admin-reset-pwd`, params)
}

/**
 * 删除用户（管理员）
 */
export const deleteUserApi = (userId: number) => {
  return request.delete<Resp<null>>(`/api/users/${userId}`)
}

/**
 * 修改当前用户密码
 */
export const changePassword = (params: ChangePasswordParams) => {
  return request.post<Resp<null>>('/api/user/change-pwd', params)
}

/**
 * 注销当前用户账号
 */
export const destroyAccount = () => {
  return request.delete<Resp<null>>('/api/user/destroy')
}

/**
 * 更新当前用户信息
 */
export const updateCurrentUserInfo = (params: UpdateUserInfoParams) => {
  return request.post<Resp<string>>('/api/user/profile', params)
}
