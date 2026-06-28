export const CODE = {
  SUCCESS: 200,
  FAIL: 500,
  CREATED: 201,
  PARAM_ERR: 400,
  UNAUTH: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  RATE_LIMIT: 429,
  INTERNAL_ERROR: 500,
} as const;

export interface Resp<T = unknown> {
  code: Number;
  msg: string;
  data?: T;
  timestamp?: string;  
}

// 分页响应
export interface PageResp<T> {
  list: T[]
  total: number
  page: number
  size: number
  totalPages?: number;
}

/** 空响应 */
export type EmptyResp = Resp<null>;

// ============================================================
// 工具函数
// ============================================================

/**
 * 判断响应是否成功
 */
export function isSuccess<T>(resp: Resp<T>): boolean {
  return resp.code === CODE.SUCCESS || resp.code === CODE.CREATED;
}

/**
 * 获取响应数据，失败时返回 null
 */
export function getData<T>(resp: Resp<T>): T | null {
  return isSuccess(resp) ? (resp.data ?? null) : null;
}

/**
 * 获取响应消息，失败时返回默认消息
 */
export function getMessage(resp: Resp<any>, defaultMsg = '操作失败'): string {
  return resp.msg || defaultMsg;
}