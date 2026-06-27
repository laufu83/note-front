// src/api/file.ts - 文件管理相关接口

import request from '@/utils/request'
import type { Resp } from '@/types/response'
// ===== 类型定义 =====
export interface FileItem {
  file_name: string
  storage_path: string
  mime_type: string
  size: number
  created_at: string
  updated_at: string
}

// 实际返回数据结构：data 直接是数组
export type FileListResponse = FileItem[]

export interface UploadFileParams {
  file: File
}

export interface DeleteFileParams {
  path: string
}



// ===== API 接口 =====

/**
 * 获取文件列表
 * 实际返回：{ code: 0, msg: "ok", data: FileItem[] }
 */
export const getFileList = () => {
  return request.get<Resp<FileListResponse>>('/api/file')
}

/**
 * 上传文件
 */
export const uploadFile = (params: UploadFileParams) => {
  const formData = new FormData()
  formData.append('file', params.file)
  
  return request.post<Resp<{ storage_path: string; file_name: string }>>(
    '/api/file/upload',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  )
}

/**
 * 删除文件
 */
export const deleteFile = (params: DeleteFileParams) => {
  return request.post<Resp<null>>('/api/file/delete', params)
}

/**
 * 获取文件下载 URL
 */
export const getFileUrl = (path: string) => {
  return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${import.meta.env.VITE_SUPABASE_STORAGE_BUCKET}/${path}`
}