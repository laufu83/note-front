import request from '@/utils/request';
import type{Resp} from '@/types/response'

// ============================================================
// 类型定义
// ============================================================

/** 创建加密笔记请求参数 */
export interface CreateEncryptedNoteParams {
  /** 笔记标题 */
  title: string;
  /** 加密后的内容（前端已加密） */
  encrypt_content: string;
  /** 加密密码（用于后端验证和重新加密） */
  note_password: string;
  /** 分类ID列表 */
  categories?: string[];
  /** 标签列表 */
  tags?: string[];
}

/** 更新加密笔记请求参数 */
export interface UpdateEncryptedNoteParams {
  /** 笔记标题 */
  title: string;
  /** 加密后的内容 */
  encrypt_content: string;
  /** 旧密码（用于验证身份） */
  note_password: string;
  /** 新密码（可选，修改密码时使用） */
  new_password?: string;
  /** 分类ID列表 */
  categories?: string[];
  /** 标签列表 */
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
  /** 密码 */
  password: string;
}

/** 删除加密笔记请求参数 */
export interface DeleteEncryptedNoteParams {
  /** 密码 */
  password: string;
}

// ============================================================
// 响应类型
// ============================================================

/** 创建加密笔记响应 */
export interface CreateEncryptedNoteResponse {
  /** 笔记ID */
  id: number;
  /** 创建时间 */
  created_at: string;
}

/** 加密笔记详情响应（解密后） */
export interface EncryptedNoteDetailResponse {
  /** 笔记ID */
  id: number;
  /** 标题（解密后） */
  title: string;
  /** 加密内容（前端加密后的密文） */
  encrypt_content: string;
  /** 分类列表（解密后） */
  categories: string[];
  /** 标签列表（解密后） */
  tags: string[];
  /** 创建时间 */
  created_at: string;
  /** 更新时间 */
  updated_at: string;
  /** 版本号 */
  version: number;
}

/** 加密笔记列表项 */
export interface EncryptedNoteListItem {
  /** 笔记ID */
  id: number;
  /** 创建时间 */
  created_at: string;
  /** 更新时间 */
  updated_at: string;
  /** 版本号 */
  version: number;
}

/** 加密笔记列表响应 */
export interface EncryptedNoteListResponse {
  /** 笔记列表 */
  list: EncryptedNoteListItem[];
  /** 当前页码 */
  page: number;
  /** 每页数量 */
  limit: number;
  /** 总记录数 */
  total: number;
  /** 总页数 */
  totalPages: number;
}

/** 验证密码响应 */
export interface VerifyPasswordResponse {
  /** 是否有效 */
  isValid: boolean;
}

/** 更新加密笔记响应 */
export interface UpdateEncryptedNoteResponse {
  /** 笔记ID */
  id: number;
  /** 更新时间 */
  updated_at: string;
  /** 版本号 */
  version: number;
}

/** 删除加密笔记响应 */
export interface DeleteEncryptedNoteResponse {
  /** 笔记ID */
  id: number;
  /** 删除时间 */
  deleted_at: string;
}

/** 恢复加密笔记响应 */
export interface RestoreEncryptedNoteResponse {
  /** 笔记ID */
  id: number;
  /** 是否已恢复 */
  restored: boolean;
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
): Promise<Resp<CreateEncryptedNoteResponse>> {
  return request.post('/api/note/encrypted', data);
}

/**
 * 获取加密笔记详情（需要密码）
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
 * 更新加密笔记
 * PUT /api/note/encrypted/:id
 */
export function updateEncryptedNote(
  id: number,
  data: UpdateEncryptedNoteParams
): Promise<Resp<UpdateEncryptedNoteResponse>> {
  return request.put(`/api/note/encrypted/${id}`, data);
}

/**
 * 删除加密笔记（软删除）
 * DELETE /api/note/encrypted/:id
 */
export function deleteEncryptedNote(
  id: number,
  password: string
): Promise<Resp<DeleteEncryptedNoteResponse>> {
  return request.delete(`/api/note/encrypted/${id}`, {
    data: { password }
  });
}

/**
 * 获取加密笔记列表
 * GET /api/note/encrypted/list
 */
export function listEncryptedNotes(
  params?: ListEncryptedNoteParams
): Promise<Resp<EncryptedNoteListResponse>> {
  return request.get('/api/note/encrypted/list', { params });
}

/**
 * 验证加密笔记密码
 * POST /api/note/encrypted/:id/verify
 */
export function verifyEncryptedPassword(
  id: number,
  password: string
): Promise<Resp<VerifyPasswordResponse>> {
  return request.post(`/api/note/encrypted/${id}/verify`, { password });
}

/**
 * 恢复已删除的加密笔记
 * POST /api/note/encrypted/:id/restore
 */
export function restoreEncryptedNote(
  id: number
): Promise<Resp<RestoreEncryptedNoteResponse>> {
  return request.post(`/api/note/encrypted/${id}/restore`);
}

// ============================================================
// 默认导出（方便统一导入）
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