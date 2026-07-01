import request from '@/utils/request';
import type { Resp } from '@/types/response';

// ============================================================
// 类型定义
// ============================================================

/** 笔记实体 */
export interface Note {
  id: number;
  title: string;
  content: string | null;
  is_draft: number;
  is_star: number;
  is_top: number;
  is_deleted: number;
  is_encrypted?: number;
  categoryIds?: number[];
  categoryNames?: string[];
  tagNames?: string[];
  tags?: string[];
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  version?: number;
}

/** 笔记历史版本 */
export interface NoteHistory {
  id: number;
  note_id: number;
  title: string;
  content: string;
  version: number;
  created_at: string;
  user_id?: number;
  user_name?: string;
  word_count?: number;
  is_deleted: number;
}

/** 笔记列表查询参数 */
export interface NoteListParams {
  page?: number;
  size?: number;
  keyword?: string;
  q?: string;
  is_draft?: number;
  is_star?: number;
  is_top?: number;
  is_deleted?: number;
  trash?: number;
  categoryId?: number;
  tagName?: string;
  is_encrypted?: number;
}

/** 笔记列表响应 */
export interface NoteListResponse {
  list: Note[];
  total: number;
  page: number;
  size: number;
  totalPages?: number;
}

/** 创建笔记参数 */
export interface CreateNoteParams {
  title: string;
  content: string;
  is_top?: number;
  is_star?: number;
  is_draft?: number;
  categoryIds?: number[];
  tagNames?: string[];
  /** 是否开启加密 0关闭 1开启 */
  is_encrypted?: number;
  /** 笔记访问密码，开启加密时必传，后端映射为 note_password */
  note_password?: string;
}

/** 更新笔记参数 */
export interface UpdateNoteParams {
  title?: string;
  content?: string;
  is_top?: number;
  is_star?: number;
  is_draft?: number;
  categoryIds?: number[];
  tagNames?: string[];
  /** 是否开启加密 0关闭 1开启 */
  is_encrypted?: number;
  /** 访问密码，加密笔记修改时必须传入原密码校验 */
  note_password?: string;
  /** 新访问密码，修改笔记密码时传入 */
  new_password?: string;
}

/** 回滚笔记参数 */
export interface RollbackNoteParams {
  noteId: number;
  historyId: number;
}

/** 创建历史版本参数 */
export interface CreateHistoryParams {
  noteId: number;
  title: string;
  content: string;
}

/** 创建历史版本响应 */
export interface CreateHistoryResponse {
  id: number;
  created_at: string;
}

/** 批量删除参数 */
export interface BatchDeleteParams {
  ids: number[];
}

/** 导出笔记响应 */
export type ExportNoteResponse = Note[];

/** 历史版本列表响应 */
export type NoteHistoryListResponse = NoteHistory[];

// ============================================================
// API 接口
// ============================================================

// ===== 笔记 CRUD =====

/**
 * 获取笔记列表
 * GET /api/note
 */
export const getNoteList = (params: NoteListParams) => {
  return request.get<Resp<NoteListResponse>>('/api/note', { params });
};

/**
 * 导出笔记
 * GET /api/note/export
 */
export const exportNote = (params: NoteListParams) => {
  return request.get<Resp<ExportNoteResponse>>('/api/note/export', { params });
};

/**
 * 获取笔记详情
 * GET /api/note/:id
 * @param id 笔记ID
 * @param password 加密笔记访问密码，非加密笔记不传
 */
export const getNoteDetail = (id: number, password?: string) => {
  const query: Record<string, string> = {};
  if (password) {
    query.password = password;
  }
  return request.get<Resp<Note>>(`/api/note/${id}`, { params: query });
};

/**
 * 校验加密笔记密码（基于详情接口封装）
 */
export const verifyNotePassword = async (noteId: number, password: string) => {
  try {
    await getNoteDetail(noteId, password);
    return true;
  } catch {
    return false;
  }
};

/**
 * 创建笔记
 * POST /api/note
 */
export const createNote = (params: CreateNoteParams) => {
  return request.post<Resp<Note>>('/api/note', params);
};

/**
 * 更新笔记
 * PUT /api/note/:id
 */
export const updateNote = (id: number, params: UpdateNoteParams) => {
  return request.put<Resp<Note>>(`/api/note/${id}`, params);
};

/**
 * 删除笔记（软删除）
 * DELETE /api/note/:id
 */
export const deleteNote = (id: number) => {
  return request.delete<Resp<null>>(`/api/note/${id}`);
};

/**
 * 批量删除笔记
 * POST /api/note/batch-delete
 */
export const batchDeleteNotes = (ids: number[]) => {
  return request.post<Resp<null>>('/api/note/batch-delete', { ids });
};

/**
 * 恢复笔记（从回收站）
 * PUT /api/note/:id/restore
 */
export const restoreNote = (id: number) => {
  return request.put<Resp<null>>(`/api/note/${id}/restore`);
};

/**
 * 永久删除笔记
 * DELETE /api/note/:id/destroy
 */
export const permanentDeleteNote = (id: number) => {
  return request.delete<Resp<null>>(`/api/note/${id}/destroy`);
};

/**
 * 清空回收站
 * DELETE /api/note/trash/clear
 */
export const clearTrash = () => {
  return request.delete<Resp<null>>('/api/note/trash/clear');
};

// ===== 历史版本 =====

/**
 * 获取笔记历史版本列表
 * GET /api/note/:noteId/history
 */
export const getNoteHistoryList = (noteId: number) => {
  return request.get<Resp<NoteHistoryListResponse>>(`/api/note/${noteId}/history`);
};

/**
 * 获取笔记历史版本（别名，兼容旧代码）
 * @deprecated 请使用 getNoteHistoryList
 */
export function getNoteHistory(id: number) {
  return getNoteHistoryList(id);
}

/**
 * 回滚到指定版本
 * POST /api/note/rollback
 */
export const rollbackNote = (params: RollbackNoteParams) => {
  return request.post<Resp<null>>('/api/note/rollback', params);
};

/**
 * 获取单个历史版本详情
 * GET /api/note/history/:historyId
 */
export const getHistoryDetail = (historyId: number) => {
  return request.get<Resp<NoteHistory>>(`/api/note/history/${historyId}`);
};

/**
 * 删除历史版本
 * DELETE /api/note/history/:historyId
 */
export const deleteHistory = (historyId: number) => {
  return request.delete<Resp<null>>(`/api/note/history/${historyId}`);
};

/**
 * 批量删除历史版本
 * DELETE /api/note/history/batch
 */
export const batchDeleteHistory = (historyIds: number[]) => {
  return request.delete<Resp<{ deletedCount: number }>>('/api/note/history/batch', {
    data: { historyIds }
  });
};

/**
 * 恢复历史版本到笔记
 * POST /api/note/history/:historyId/restore
 */
export const restoreHistoryToNote = (historyId: number) => {
  return request.post<Resp<{ noteId: number; version: number }>>(
    `/api/note/history/${historyId}/restore`
  );
};

// ============================================================
// 默认导出
// ============================================================

export default {
  // 笔记 CRUD
  getNoteList,
  exportNote,
  getNoteDetail,
  createNote,
  updateNote,
  deleteNote,
  batchDeleteNotes,
  restoreNote,
  permanentDeleteNote,
  clearTrash,
  verifyNotePassword,

  // 历史版本
  getNoteHistoryList,
  rollbackNote,
  getHistoryDetail,
  deleteHistory,
  batchDeleteHistory,
  restoreHistoryToNote,
};