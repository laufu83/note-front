export const CODE = {
  SUCCESS: 0,
  FAIL: -1,
  PARAM_ERR: 400,
  UNAUTH: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  RATE_LIMIT: 429,
} as const;

export interface Resp<T = unknown> {
  code: Number;
  msg: string;
  data?: T;
}

// 分页响应
export interface PageResp<T> {
  list: T[]
  total: number
  page: number
  size: number
}