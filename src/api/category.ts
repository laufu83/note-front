// src/api/category.ts - 分类管理相关接口

import request from '@/utils/request'
import type { Resp } from '@/types/response'

// ===== 类型定义 =====
export interface Category {
  id: number
  name: string
  sort: number
  created_at: string
  updated_at?: string
}

export interface CreateCategoryParams {
  name: string
  sort: number
}

export interface UpdateCategoryParams {
  id: number
  name: string
  sort: number
}

export type CategoryListResponse = Category[]

// ===== API 接口 =====

/**
 * 获取分类列表
 */
export const getCategoryList = () => {
  return request.get<Resp<CategoryListResponse>>('/api/category')
}

/**
 * 创建分类
 */
export const createCategory = (params: CreateCategoryParams) => {
  return request.post<Resp<Category>>('/api/category', params)
}

/**
 * 更新分类
 */
export const updateCategory = (params: UpdateCategoryParams) => {
  const { id, ...data } = params
  return request.put<Resp<Category>>(`/api/category/${id}`, data)
}

/**
 * 删除分类
 */
export const deleteCategory = (id: number) => {
  return request.delete<Resp<null>>(`/api/category/${id}`)
}