import request from '@/utils/request';
import type { Resp } from '@/types/response'

// ============================================================
// 类型定义
// ============================================================

/** 创建加密笔记请求参数 */
export interface CreateEncryptedNoteParams {
  /** 笔记明文标题 */
  title: string;
  /** 笔记明文内容（后端统一AES加密存入content字段） */
  content: string;
  /** 加密访问密码 */
  note_password: string;
  /** 分类ID列表 */
  categories?: number[];
  /** 标签名称数组 */
  tags?: string[];
}

/** 更新加密笔记请求参数 */
export interface UpdateEncryptedNoteParams {
  /** 笔记明文标题 */
  title: string;
  /** 笔记明文内容 */
  content: string;
  /** 旧访问密码（身份校验） */
  note_password: string;
  /** 新密码，不传则沿用原密码 */
  new_password?: string;
  /** 分类ID列表 */
  categories?: number[];
  /** 标签名称数组 */
  tags?: string[];
}

/** 获取加密笔记列表查询参数 */
export interface ListEncryptedNoteParams {
  /** 页码，默认 1 */
  page?: number;
  /** 每页数量，默认 20，最大 50 */
  limit?: number;
}

/** 验证密码请求参数 */
export interface VerifyPasswordParams {
  /** 访问密码 */
  password: string;
}

/** 删除加密笔记请求参数 */
export interface DeleteEncryptedNoteParams {
  /** 访问密码 */
  password: string;
}

// ============================================================
// 响应类型
// ============================================================

/** 加密笔记详情（解密后明文） */
export interface EncryptedNoteDetailResponse {
  id: number;
  title: string;
  content: string;
  categories: number[];
  tags: string[];
  created_at: string;
  updated_at: string;
  version: number;
}

/** 加密笔记列表项（仅元数据，无密文） */
export interface EncryptedNoteListItem {
  id: number;
  created_at: string;
  updated_at: string;
  version: number;
}

/** 加密笔记分页列表响应 */
export interface EncryptedNoteListResponse {
  list: EncryptedNoteListItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** 密码校验响应 */
export interface VerifyPasswordResponse {
  isValid: boolean;
}

// ============================================================
// API 方法
// ============================================================

/**
 * 创建加密笔记
 * POST /api/note/encrypted
 */
export function createEncryptedNote(
  data: CreateEncryptedNoteParams
): Promise<Resp<null>> {
  return request.post('/api/note/encrypted', data);
}

/**
 * 获取加密笔记解密详情
 * GET /api/note/encrypted/:id?password=xxx
 */
export function getEncryptedNote(
  id: number,
  password: string
): Promise<Resp<EncryptedNoteDetailResponse>> {
  return request.get(`/api/note/encrypted/${id}`, {
    params: { password }
  });
}

/**
 * 更新加密笔记（支持改密码）
 * PUT /api/note/encrypted/:id
 */
export function updateEncryptedNote(
  id: number,
  data: UpdateEncryptedNoteParams
): Promise<Resp<null>> {
  
  return request.put(`/api/note/encrypted/${id}`, data);
}

/**
 * 软删除加密笔记
 * DELETE /api/note/encrypted/:id
 */
export function deleteEncryptedNote(
  id: number,
  password: string
): Promise<Resp<null>> {
  return request.delete(`/api/note/encrypted/${id}`, {
    data: { password }
  });
}

/**
 * 分页获取加密笔记列表
 * GET /api/note/encrypted/list
 */
export function listEncryptedNotes(
  params?: ListEncryptedNoteParams
): Promise<Resp<EncryptedNoteListResponse>> {
  return request.get('/api/note/encrypted/list', { params });
}

/**
 * 校验笔记访问密码
 * POST /api/note/encrypted/:id/verify
 */
export function verifyEncryptedPassword(
  id: number,
  password: string
): Promise<Resp<VerifyPasswordResponse>> {
  return request.post(`/api/note/encrypted/${id}/verify`, { password });
}

/**
 * 恢复回收站加密笔记
 * POST /api/note/encrypted/:id/restore
 */
export function restoreEncryptedNote(
  id: number
): Promise<Resp<null>> {
  return request.post(`/api/note/encrypted/${id}/restore`);
}

// ============================================================
// 统一默认导出
// ============================================================
export default {
  create: createEncryptedNote,
  get: getEncryptedNote,
  update: updateEncryptedNote,
  delete: deleteEncryptedNote,
  list: listEncryptedNotes,
  verify: verifyEncryptedPassword,
  restore: restoreEncryptedNote,
};