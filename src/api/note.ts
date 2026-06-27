// src/api/note.ts - 更新笔记相关接口（添加分享相关）

import request from '@/utils/request'
import type { Resp } from '@/types/response'

// ===== 类型定义 =====
export interface Note {
  id: number
  title: string
  content: string
  is_draft: boolean
  is_star: boolean
  is_top: boolean
  is_delete: boolean
  categoryIds?: number[]
  categoryNames?: string[]
  tagNames?: string[]
  tags?: string[]
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface NoteHistory {
  id: number
  note_id: number
  title: string
  content: string
  version: number
  created_at: string
}

export interface NoteListParams {
  page?: number
  size?: number
  keyword?: string
  q?: string
  is_draft?: boolean
  is_star?: boolean
  is_top?: boolean
  is_delete?: boolean
  trash?: number
  categoryId?: number
  tagName?: string
}

export interface NoteListResponse {
  list: Note[]
  total: number
  page: number
  size: number
}

export interface CreateNoteParams {
  title: string
  content: string
  is_top?: boolean
  is_star?: boolean
  is_draft?: boolean
  categoryIds?: number[]
  tagNames?: string[]
}

export interface UpdateNoteParams {
  title?: string
  content?: string
  is_top?: boolean
  is_star?: boolean
  is_draft?: boolean
  categoryIds?: number[]
  tagNames?: string[]
}

export interface RollbackNoteParams {
  noteId: number
  historyId: number
}



export interface ShareResponse {
  shareUrl: string
  shareCode: string
}

export type NoteHistoryListResponse = NoteHistory[]

// ===== API 接口 =====

/**
 * 获取笔记列表
 */
export const getNoteList = (params: NoteListParams) => {
  return request.get<Resp<NoteListResponse>>('/api/note', { params })
}

export const exportNote = (params: NoteListParams) => {
  return request.get<Resp<Note[]>>('/api/note/export', { params })
}
/**
 * 获取笔记详情
 */
export const getNoteDetail = (id: number) => {
  return request.get<Resp<Note>>(`/api/note/${id}`)
}

/**
 * 获取笔记历史版本列表
 */
export const getNoteHistoryList = (noteId: number) => {
  return request.get<Resp<NoteHistoryListResponse>>(`/api/note/${noteId}/history`)
}

/**
 * 回滚到指定版本
 */
export const rollbackNote = (params: RollbackNoteParams) => {
  return request.post<Resp<null>>('/api/note/rollback', params)
}

/**
 * 创建笔记
 */
export const createNote = (params: CreateNoteParams) => {
  return request.post<Resp<Note>>('/api/note', params)
}

/**
 * 更新笔记
 */
export const updateNote = (id: number, params: UpdateNoteParams) => {
  return request.put<Resp<Note>>(`/api/note/${id}`, params)
}

/**
 * 删除笔记（软删除）
 */
export const deleteNote = (id: number) => {
  return request.delete<Resp<null>>(`/api/note/${id}`)
}

/**
 * 批量删除笔记
 */
export const batchDeleteNotes = (ids: number[]) => {
  return request.post<Resp<null>>('/api/note/batch-delete', { ids })
}

/**
 * 恢复笔记（从回收站）
 */
export const restoreNote = (id: number) => {
  return request.put<Resp<null>>(`/api/note/${id}/restore`)
}

/**
 * 永久删除笔记
 */
export const permanentDeleteNote = (id: number) => {
  return request.delete<Resp<null>>(`/api/note/${id}/destroy`)
}

/**
 * 清空回收站
 */
export const clearTrash = () => {
  return request.delete<Resp<null>>('/api/note/trash/clear')
}

