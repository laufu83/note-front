// src/api/share.ts - 更新分享管理相关接口

import request from '@/utils/request'
import type { Resp } from '@/types/response'

// ===== 类型定义 =====
export interface ShareItem {
  id: number
  note_id: number
  title?: string
  share_code: string
  access_password?: string
  created_at: string
  expire_at?: string
}

export interface ShareDetail {
  id: number
  note_id: number
  title: string
  content: string
  updated_at: string
  view_count: number
}

export interface CreateShareParams {
  noteId: number
  password?: string
  permission?: string
  expireDays?: number
}

export interface ShareResponse {
  shareUrl: string
  shareCode: string
}

export interface VerifyShareParams {
  code: string
  pwd?: string
}

export type ShareListResponse = ShareItem[]

// ===== API 接口 =====

/**
 * 获取分享列表
 */
export const getShareList = () => {
  return request.get<Resp<ShareListResponse>>('/api/share/list')
}

/**
 * 创建分享
 */
export const createShare = (params: CreateShareParams) => {
  return request.post<Resp<ShareResponse>>('/api/share/create', params)
}

/**
 * 获取分享详情（用于公开访问）
 * @param code - 分享码
 * @param pwd - 访问密码（可选）
 */
export const getShareDetail = (code: string, pwd?: string) => {
  const params: Record<string, string> = {}
  if (pwd) params.pwd = pwd
  return request.get<Resp<ShareDetail>>(`/api/share/${code}`, { params })
}

/**
 * 验证分享密码
 */
export const verifySharePassword = (code: string, password: string) => {
  return request.post<Resp<{ valid: boolean }>>(`/api/share/${code}/verify`, { password })
}

/**
 * 销毁分享
 */
export const deleteShare = (id: number) => {
  return request.delete<Resp<null>>(`/api/share/${id}`)
}