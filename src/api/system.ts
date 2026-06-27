import request from '@/utils/request'
import type { Resp } from '@/types/response'

export type ConfigType = 'bool' | 'int' | 'string' | 'json'

export interface SysConfigItem {
  id: number
  config_key: string
  config_value: string
  config_desc: string
  config_type: ConfigType
  created_at: string
  updated_at: string
}

// 获取配置字典全量列表（管理员）
export const getSysConfigListApi = () => {
  return request.get<Resp<SysConfigItem[]>>('/api/system/config/list')
}

// 分页获取配置字典
export const getSysConfigPageApi = (params: { page: number; pageSize: number }) => {
  return request.get<Resp<{
    list: SysConfigItem[]
    total: number
    page: number
    pageSize: number
  }>>(`/api/system/config/page?page=${params.page}&pageSize=${params.pageSize}`)
}

// 批量修改配置
export const batchUpdateConfigApi = (data: Array<{
  config_key: string
  config_value: string
  config_type: ConfigType
}>) => {
  return request.put<Resp<null>>('/api/system/config/batch', data)
}

// 前端公开配置
export const getPublicConfigApi = () => {
  return request.get<Resp<Record<string, string | number | boolean>>>('/api/system/config')
}

// 新增配置
export const addConfigApi = (data: {
  config_key: string
  config_value: string
  config_desc: string
  config_type: ConfigType
}) => request.post<Resp<null>>('/api/system/config/add', data)

// 删除配置
export const deleteConfigApi = (config_key: string) => {
  return request.delete<Resp<null>>(`/api/system/config/delete?key=${encodeURIComponent(config_key)}`)
}