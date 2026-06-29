<template>
  <div class="dashboard page-container">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6" v-for="stat in stats" :key="stat.label">
        <el-card class="stat-card page-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" :style="{ background: stat.color }">
              <el-icon :size="24"><component :is="stat.icon" /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">{{ stat.label }}</div>
              <div class="stat-number">{{ stat.value }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 操作栏 -->
    <div class="action-bar">
      <div class="action-left">
        <span class="greeting">👋 你好，{{ displayUsername }}</span>
        <span class="date">{{ currentDate }}</span>
      </div>
      <div class="action-right">
        <el-button type="primary" :icon="Download" @click="exportAll" size="large">
          一键导出全部笔记
        </el-button>
      </div>
    </div>

    <!-- 最近笔记列表 -->
    <el-card class="recent-card page-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><Clock /></el-icon>
            最近更新
          </span>
          <el-button type="text" @click="$router.push('/note/list')">查看全部</el-button>
        </div>
      </template>
      <el-table :data="recentList" border style="width: 100%" class="page-table">
        <el-table-column prop="title" label="标题" min-width="200">
          <template #default="{ row }">
            <el-link 
              type="primary" 
              :underline="false" 
              @click="$router.push(`/note/edit?id=${row.id}`)"
            >
              {{ row.title || '无标题笔记' }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="updated_at" label="更新时间" width="180" align="center">
          <template #default="{ row }">
            <span>{{ formatCNTime(row.updated_at) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.is_draft" type="warning" size="small" class="tag-warning">草稿</el-tag>
            <el-tag v-else-if="row.is_star" type="danger" size="small" effect="plain" class="tag-danger">收藏</el-tag>
            <el-tag v-else type="success" size="small" plain class="tag-success">已发布</el-tag>
          </template>
        </el-table-column>
      </el-table>
      <div v-if="recentList.length === 0" class="empty-state">
        <el-empty description="暂无笔记，去写一篇吧" :image-size="120">
          <el-button type="primary" @click="$router.push('/note/edit')">写第一篇笔记</el-button>
        </el-empty>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { getNoteList, exportNote } from '@/api'
import { formatCNTime } from '@/utils/format'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { ElMessage, ElLoading } from 'element-plus'
import { 
  Document, 
  Star, 
  EditPen, 
  Delete, 
  Clock, 
  Download
} from '@element-plus/icons-vue'

const userStore = useUserStore()

const totalNote = ref(0)
const starCount = ref(0)
const draftCount = ref(0)
const trashCount = ref(0)
const recentList = ref<any[]>([])

const currentDate = ref('')

const displayUsername = computed(() => {
  if (userStore.userInfo?.username) {
    return userStore.userInfo.username
  }
  const storedUsername = localStorage.getItem('username')
  if (storedUsername) {
    return storedUsername
  }
  return '用户'
})

const stats = computed(() => [
  { 
    label: '我的笔记', 
    value: totalNote.value, 
    icon: Document, 
    color: '#409EFF' 
  },
  { 
    label: '已收藏', 
    value: starCount.value, 
    icon: Star, 
    color: '#E6A23C' 
  },
  { 
    label: '草稿箱', 
    value: draftCount.value, 
    icon: EditPen, 
    color: '#909399' 
  },
  { 
    label: '回收站', 
    value: trashCount.value, 
    icon: Delete, 
    color: '#F56C6C' 
  }
])

function getCurrentDate() {
  const now = new Date()
  return now.toLocaleDateString('zh-CN', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    weekday: 'long'
  })
}

async function loadData() {
  try {
    const res = await getNoteList({ page: 1, size: 1000 })
    const list = res?.data?.list ?? []
    totalNote.value = list.filter((i: any) => !i.is_delete).length
    starCount.value = list.filter((i: any) => i.is_star && !i.is_delete).length
    draftCount.value = list.filter((i: any) => i.is_draft && !i.is_delete).length
    trashCount.value = list.filter((i: any) => i.is_delete).length
    recentList.value = list
      .filter((i: any) => !i.is_delete)
      .sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 10)
  } catch (error) {
    ElMessage.error('加载数据失败，请刷新重试')
  }
}

async function loadUserInfo() {
  if (userStore.userInfo) {
    return
  }
  await userStore.fetchUserInfo()
}

async function exportAll() {
  const loadingInstance = ElLoading.service({
    lock: true,
    text: '正在打包导出笔记...',
    background: 'rgba(0, 0, 0, 0.7)'
  })
  
  try {
    const zip = new JSZip()
    const res = await exportNote({ page: 1, size: 9999 })
    const list = res?.data ?? []
    
    if (list.length === 0) {
      loadingInstance.close()
      ElMessage.warning('没有可导出的笔记')
      return
    }
    
    const normalNotes = list.filter((i: any) => !i.is_delete)
    const deletedNotes = list.filter((i: any) => i.is_delete)
    
    if (normalNotes.length > 0) {
      const normalFolder = zip.folder('有效笔记')
      normalNotes.forEach((item: any) => {
        normalFolder!.file(`${item.title || '无标题'}.md`, item.content || '')
      })
    }
    
    if (deletedNotes.length > 0) {
      const deletedFolder = zip.folder('回收站笔记')
      deletedNotes.forEach((item: any) => {
        deletedFolder!.file(`${item.title || '无标题'}.md`, item.content || '')
      })
    }
    
    const blob = await zip.generateAsync({ type: 'blob' })
    saveAs(blob, `全部笔记_${new Date().toLocaleDateString('zh-CN')}.zip`)
    loadingInstance.close()
    ElMessage.success(`成功导出 ${list.length} 篇笔记`)
  } catch (error) {
    loadingInstance.close()
    ElMessage.error('导出失败，请重试')
  }
}

let dateInterval: NodeJS.Timeout

onMounted(() => {
  loadUserInfo()
  loadData()
  currentDate.value = getCurrentDate()
  
  dateInterval = setInterval(() => {
    currentDate.value = getCurrentDate()
  }, 60000)
})

onUnmounted(() => {
  if (dateInterval) clearInterval(dateInterval)
})
</script>

<style scoped>
/* ============================================================
   Dashboard 专用样式
   ============================================================ */

.dashboard {
  padding: 24px;
}

/* ===== 统计卡片 ===== */
.stats-row {
  margin-bottom: 24px;
}

.stat-card {
  transition: transform var(--transition-duration) var(--transition-timing),
              box-shadow var(--transition-duration) var(--transition-timing);
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md) !important;
}

.stat-content {
  display: flex;
  align-items: center;
  padding: 4px 0;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  margin-right: 16px;
  flex-shrink: 0;
  transition: all var(--transition-duration) var(--transition-timing);
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 14px;
  color: var(--text-secondary);
  transition: color var(--transition-duration);
}

.stat-number {
  font-size: 28px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.2;
  margin-top: 4px;
  transition: color var(--transition-duration);
}

/* ===== 操作栏 ===== */
.action-bar {
  background: var(--card-bg);
  padding: 16px 24px;
  border-radius: var(--radius-md);
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-color);
  transition: all var(--transition-duration) var(--transition-timing);
}

.action-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.greeting {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
  transition: color var(--transition-duration);
}

.date {
  font-size: 14px;
  color: var(--text-secondary);
  transition: color var(--transition-duration);
}

/* ===== 最近笔记卡片 ===== */
.recent-card {
  border-radius: var(--radius-md);
}

.recent-card :deep(.el-card__header) {
  border-bottom-color: var(--border-color) !important;
  padding: 16px 20px;
}

.recent-card :deep(.el-card__body) {
  padding: 0;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 16px;
  color: var(--text-primary);
  transition: color var(--transition-duration);
}

.card-title .el-icon {
  font-size: 18px;
  color: var(--theme-color);
}

/* ===== 标签样式（暗色主题适配） ===== */
.tag-warning {
  background-color: rgba(230, 162, 60, 0.15) !important;
  border-color: rgba(230, 162, 60, 0.3) !important;
  color: #e6a23c !important;
}

.tag-danger {
  background-color: rgba(245, 108, 108, 0.15) !important;
  border-color: rgba(245, 108, 108, 0.3) !important;
  color: #f56c6c !important;
}

.tag-success {
  background-color: rgba(103, 194, 58, 0.15) !important;
  border-color: rgba(103, 194, 58, 0.3) !important;
  color: #67c23a !important;
}

/* ===== 暗色主题下的额外适配 ===== */
.dark-theme .action-bar {
  background: var(--card-bg);
}

/* ============================================================
   响应式
   ============================================================ */
@media (max-width: 1200px) {
  .dashboard {
    padding: 20px;
  }
  
  .stat-number {
    font-size: 24px;
  }
}

@media (max-width: 992px) {
  .dashboard {
    padding: 16px;
  }
  
  .stat-icon {
    width: 40px;
    height: 40px;
  }
  
  .stat-icon .el-icon {
    font-size: 20px !important;
  }
  
  .stat-number {
    font-size: 22px;
  }
}

@media (max-width: 768px) {
  .dashboard {
    padding: 12px;
  }
  
  .stats-row {
    margin-bottom: 16px;
  }
  
  .stat-content {
    flex-direction: row;
    align-items: center;
    padding: 2px 0;
  }
  
  .stat-icon {
    width: 36px;
    height: 36px;
    margin-right: 12px;
  }
  
  .stat-icon .el-icon {
    font-size: 18px !important;
  }
  
  .stat-label {
    font-size: 12px;
  }
  
  .stat-number {
    font-size: 20px;
  }
  
  .action-bar {
    flex-direction: column;
    align-items: stretch;
    padding: 12px 16px;
  }
  
  .action-left {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .greeting {
    font-size: 14px;
  }
  
  .date {
    font-size: 12px;
  }
  
  .action-right {
    width: 100%;
  }
  
  .action-right .el-button {
    width: 100%;
  }
  
  .recent-card :deep(.el-card__header) {
    padding: 12px 16px;
  }
  
  .card-title {
    font-size: 14px;
  }
  
  .recent-card :deep(.el-table) {
    font-size: 13px;
  }
  
  .recent-card :deep(.el-table .el-table__cell) {
    padding: 8px 0;
  }
}

@media (max-width: 480px) {
  .dashboard {
    padding: 8px;
  }
  
  .stat-number {
    font-size: 18px;
  }
  
  .stat-icon {
    width: 32px;
    height: 32px;
    margin-right: 8px;
  }
  
  .stat-icon .el-icon {
    font-size: 16px !important;
  }
  
  .action-bar {
    padding: 10px 12px;
  }
  
  .recent-card :deep(.el-table-column--selection .cell) {
    padding: 0 4px;
  }
}
</style>