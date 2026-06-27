// src/api/tag.ts - 标签管理相关接口

import request from '@/utils/request'
import type { Resp } from '@/types/response'

// ===== 类型定义 =====
export interface Tag {
  id: number
  name: string
  created_at: string
  updated_at?: string
}

export interface CreateTagParams {
  name: string
}

export type TagListResponse = Tag[]

// ===== API 接口 =====

/**
 * 获取标签列表
 */
export const getTagList = () => {
  return request.get<Resp<TagListResponse>>('/api/tag')
}

/**
 * 创建标签
 */
export const createTag = (params: CreateTagParams) => {
  return request.post<Resp<Tag>>('/api/tag', params)
}

/**
 * 删除标签
 */
export const deleteTag = (id: number) => {
  return request.delete<Resp<null>>(`/api/tag/${id}`)
}