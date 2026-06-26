import request from '@/utils/request'
import type { Resp } from '@/types/response'

export interface UserItem {
  id: number
  username: string
  email: string | null
  role: 'admin' | 'user'
  status: 'active' | 'inactive'
  is_frozen: boolean
  created_at: string
}

// 获取用户列表
export const getUserListApi = () => {
  return request.get<Resp<UserItem[]>>('/api/user/list')
}
// 更新用户角色/冻结状态
export const updateUserApi = (data: { userId: number; role?: string; isFrozen?: boolean }) => {
  return request.post<Resp<null>>('/api/user/update', data)
}

// 管理员重置用户密码
export const adminResetUserPwdApi = (data: { userId: number; newPwd: string }) => {
  return request.post<Resp<null>>('/api/user/admin-reset-pwd', data)
}