<template>
  <div class="file-manage page-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h2 class="page-title">
            <el-icon><Folder /></el-icon>
            文件管理
          </h2>
          <span class="page-count">共 {{ tableData.length }} 个文件</span>
        </div>
        <div class="header-right">
          <el-button type="primary" :icon="Upload" @click="triggerUpload">
            上传文件
          </el-button>
        </div>
      </div>
    </div>

    <!-- 上传区域 -->
    <el-card class="upload-card page-card" shadow="hover">
      <el-upload
        ref="uploadRef"
        :action="uploadActionUrl"
        :headers="uploadHeaders"
        :on-success="handleSuccess"
        :on-error="handleError"
        :before-upload="beforeUpload"
        :show-file-list="false"
        drag
        class="upload-dragger"
      >
        <el-icon class="upload-icon"><Upload /></el-icon>
        <div class="upload-text">
          <div class="main-text">点击或拖拽文件到此上传</div>
          <div class="sub-text">支持图片、文档等格式，单个文件不超过 20MB</div>
        </div>
      </el-upload>
    </el-card>

    <!-- 文件列表 -->
    <el-card class="file-list-card page-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><Document /></el-icon>
            已上传文件
          </span>
          <div class="card-actions">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索文件名..."
              size="small"
              prefix-icon="Search"
              clearable
              class="search-input input-common"
            />
            <el-button size="small" :icon="Refresh" @click="loadData" />
          </div>
        </div>
      </template>

      <!-- 文件统计 -->
      <div class="stats-bar" v-if="tableData.length > 0">
        <span class="stat-item">总文件：<b>{{ tableData.length }}</b></span>
        <span class="stat-item">图片：<b>{{ imageCount }}</b></span>
        <span class="stat-item">文档：<b>{{ documentCount }}</b></span>
        <span class="stat-item">其他：<b>{{ otherCount }}</b></span>
      </div>

      <!-- 文件列表 -->
      <el-table 
        :data="filteredData" 
        border
        style="width: 100%"
        v-loading="loading"
        element-loading-text="加载中..."
        class="page-table"
      >
        <el-table-column label="文件名" min-width="200" prop="file_name">
          <template #default="{ row }">
            <div class="file-name-cell">
              <el-icon class="file-icon" :style="{ color: getFileIconColor(row.mime_type) }">
                <component :is="getFileIcon(row.mime_type)" />
              </el-icon>
              <span>{{ row.file_name }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="类型" width="120" prop="mime_type" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="primary" plain class="tag-primary">
              {{ getFileTypeLabel(row.mime_type) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="大小" width="120" prop="size" align="center">
          <template #default="{ row }">
            {{ formatFileSize(row.size) }}
          </template>
        </el-table-column>

        <el-table-column label="上传时间" width="170" prop="created_at" align="center">
          <template #default="{ row }">
            {{ formatCNTime(row.created_at) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link class="btn-link-primary" @click="previewFile(row)">预览</el-button>
            <el-button size="small" type="success" link class="btn-link-success" @click="copyUrl(row.storage_path)">复制链接</el-button>
            <el-button size="small" type="danger" link class="btn-link-danger" @click="handleDeleteFile(row.storage_path)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态 -->
      <div v-if="filteredData.length === 0 && !loading" class="empty-state">
        <el-empty description="暂无文件，快来上传吧" :image-size="120">
          <el-button type="primary" @click="triggerUpload">立即上传</el-button>
        </el-empty>
      </div>
    </el-card>

    <!-- 预览对话框 -->
    <el-dialog v-model="previewVisible" title="文件预览" width="60%" destroy-on-close class="dialog-common">
      <div class="preview-content" v-if="previewFileData">
        <img 
          v-if="isImage(previewFileData.mime_type)" 
          :src="getFileUrl(previewFileData.storage_path)" 
          alt="预览图片"
          class="preview-image"
        />
        <div v-else class="preview-info">
          <el-icon :size="48"><component :is="getFileIcon(previewFileData.mime_type)" /></el-icon>
          <p><strong>文件名：</strong>{{ previewFileData.file_name }}</p>
          <p><strong>类型：</strong>{{ previewFileData.mime_type }}</p>
          <p><strong>大小：</strong>{{ formatFileSize(previewFileData.size) }}</p>
          <p><strong>上传时间：</strong>{{ formatCNTime(previewFileData.created_at) }}</p>
          <el-button type="primary" @click="copyUrl(previewFileData.storage_path)">复制链接</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { 
  Upload, 
  Refresh, 
  Document, 
  Folder,
  Picture,
  Files,
  VideoCamera,
  Headset
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { getFileList, deleteFile as deleteFileApi, getFileUrl } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { formatCNTime } from '@/utils/format'

const userStore = useUserStore()
const loading = ref(false)
const tableData = ref<any[]>([])
const searchKeyword = ref('')
const previewVisible = ref(false)
const previewFileData = ref<any>(null)

// 后端上传地址
const uploadActionUrl = `${import.meta.env.VITE_API_BASE_URL}/api/file/upload`

// 上传请求头
const uploadHeaders = ref({
  Authorization: `Bearer ${userStore.accessToken}`
})

// 计算统计
const imageCount = computed(() => 
  tableData.value.filter(f => f.mime_type?.startsWith('image/')).length
)
const documentCount = computed(() => 
  tableData.value.filter(f => 
    f.mime_type?.includes('pdf') || 
    f.mime_type?.includes('word') || 
    f.mime_type?.includes('excel') ||
    f.mime_type?.includes('text')
  ).length
)
const otherCount = computed(() => 
  tableData.value.length - imageCount.value - documentCount.value
)

// 搜索过滤
const filteredData = computed(() => {
  if (!searchKeyword.value) return tableData.value
  const keyword = searchKeyword.value.toLowerCase()
  return tableData.value.filter(item => 
    item.file_name?.toLowerCase().includes(keyword)
  )
})

// ===== 工具函数 =====
function getFileIcon(mimeType: string) {
  if (!mimeType) return Document
  if (mimeType.startsWith('image/')) return Picture
  if (mimeType.includes('video/')) return VideoCamera
  if (mimeType.includes('audio/')) return Headset
  if (mimeType.includes('pdf')) return Files
  return Document
}

function getFileIconColor(mimeType: string) {
  if (!mimeType) return 'var(--text-secondary)'
  if (mimeType.startsWith('image/')) return '#409EFF'
  if (mimeType.includes('video/')) return '#E6A23C'
  if (mimeType.includes('audio/')) return '#67C23A'
  if (mimeType.includes('pdf')) return '#F56C6C'
  return 'var(--text-secondary)'
}

function getFileTypeLabel(mimeType: string) {
  if (!mimeType) return '未知'
  if (mimeType.startsWith('image/')) return '图片'
  if (mimeType.includes('video/')) return '视频'
  if (mimeType.includes('audio/')) return '音频'
  if (mimeType.includes('pdf')) return 'PDF'
  if (mimeType.includes('word')) return '文档'
  if (mimeType.includes('excel')) return '表格'
  if (mimeType.includes('text')) return '文本'
  return '其他'
}

function isImage(mimeType: string) {
  return mimeType?.startsWith('image/')
}

function formatFileSize(bytes: number) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`
}

// ===== API 调用 =====
async function loadData() {
  loading.value = true
  try {
    const res = await getFileList()
    tableData.value = res?.data ?? []
  } catch (error) {
    ElMessage.error('加载文件列表失败')
  } finally {
    loading.value = false
  }
}

// ===== 上传相关 =====
function triggerUpload() {
  const input = document.querySelector('.el-upload input[type="file"]') as HTMLInputElement
  if (input) input.click()
}

function beforeUpload(file: File) {
  if (file.size > 20 * 1024 * 1024) {
    ElMessage.error('文件大小不能超过 20MB')
    return false
  }
  return true
}

function handleSuccess() {
  ElMessage.success('文件上传成功')
  loadData()
}

function handleError() {
  ElMessage.error('文件上传失败，请重试')
}

// ===== 文件操作 =====
function previewFile(row: any) {
  previewFileData.value = row
  previewVisible.value = true
}

async function copyUrl(path: string) {
  try {
    await navigator.clipboard.writeText(getFileUrl(path))
    ElMessage.success('链接已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败，请手动复制')
  }
}

async function handleDeleteFile(path: string) {
  try {
    await ElMessageBox.confirm('确定要删除这个文件吗？', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteFileApi({ path })
    ElMessage.success('文件已删除')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败，请重试')
    }
  }
}

onMounted(loadData)
</script>

<style scoped>
/* ============================================================
   FileManage 专用样式
   ============================================================ */

.file-manage {
  padding: 24px;
}

/* ===== 页面头部 ===== */
.page-header {
  margin-bottom: 20px;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* ===== 上传卡片 ===== */
.upload-card {
  margin-bottom: 20px;
}

.upload-card :deep(.el-card__body) {
  padding: 0;
}

.upload-dragger {
  width: 100%;
}

.upload-dragger :deep(.el-upload) {
  width: 100%;
}

.upload-dragger :deep(.el-upload-dragger) {
  width: 100%;
  border-radius: var(--radius-md);
  padding: 40px 20px;
  border: 2px dashed var(--border-color);
  background: var(--card-bg);
  transition: all var(--transition-duration) var(--transition-timing);
}

.upload-dragger :deep(.el-upload-dragger:hover) {
  border-color: var(--theme-color);
}

.upload-dragger :deep(.el-upload-dragger.is-dragover) {
  border-color: var(--theme-color);
  background: var(--theme-color-light);
}

.upload-icon {
  font-size: 48px;
  color: var(--text-placeholder);
  margin-bottom: 8px;
  transition: color var(--transition-duration);
}

.upload-text {
  text-align: center;
}

.main-text {
  font-size: 16px;
  color: var(--text-regular);
  transition: color var(--transition-duration);
}

.sub-text {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 4px;
  transition: color var(--transition-duration);
}

/* ===== 文件列表卡片 ===== */
.file-list-card :deep(.el-card__header) {
  padding: 14px 20px;
  border-bottom: 1px solid var(--border-color) !important;
  transition: border-color var(--transition-duration);
}

.file-list-card :deep(.el-card__body) {
  padding: 0;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  transition: color var(--transition-duration);
}

.card-title .el-icon {
  color: var(--theme-color);
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-input {
  width: 200px;
}

/* ===== 统计栏（使用全局 stats-bar，覆盖部分样式） ===== */
.stats-bar {
  gap: 24px;
}

.stats-bar .stat-item b {
  color: var(--text-primary);
  transition: color var(--transition-duration);
}

/* ===== 文件列表 ===== */
.file-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-name-cell span {
  color: var(--text-primary);
  transition: color var(--transition-duration);
}

.file-icon {
  font-size: 20px;
}

/* ===== 预览对话框 ===== */
.preview-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 12px 0;
}

.preview-image {
  max-width: 100%;
  max-height: 60vh;
  border-radius: var(--radius-sm);
}

.preview-info {
  text-align: center;
  line-height: 2;
  color: var(--text-regular);
  transition: color var(--transition-duration);
}

.preview-info .el-icon {
  color: var(--theme-color);
}

.preview-info p {
  color: var(--text-regular);
  transition: color var(--transition-duration);
}

.preview-info strong {
  color: var(--text-primary);
  transition: color var(--transition-duration);
}

/* ============================================================
   响应式
   ============================================================ */
@media (max-width: 768px) {
  .file-manage {
    padding: 12px;
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-right {
    width: 100%;
  }

  .header-right .el-button {
    width: 100%;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .search-input {
    width: 100%;
  }

  .stats-bar {
    gap: 12px;
    font-size: 13px;
    padding: 10px 16px;
  }

  .upload-dragger :deep(.el-upload-dragger) {
    padding: 30px 16px;
  }

  .upload-icon {
    font-size: 40px;
  }
}

@media (max-width: 480px) {
  .file-manage {
    padding: 8px;
  }

  .stats-bar {
    font-size: 12px;
    gap: 8px;
    padding: 8px 12px;
  }

  .file-icon {
    font-size: 16px;
  }

  .upload-dragger :deep(.el-upload-dragger) {
    padding: 20px 12px;
  }

  .upload-icon {
    font-size: 32px;
  }

  .main-text {
    font-size: 14px;
  }

  .sub-text {
    font-size: 12px;
  }

  .preview-content {
    padding: 8px 0;
  }

  .preview-info {
    font-size: 13px;
  }
}
</style>