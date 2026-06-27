<template>
  <div class="dashboard">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6" v-for="stat in stats" :key="stat.label">
        <el-card class="stat-card" shadow="hover">
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
        <span class="greeting">👋 你好，{{ username }}</span>
        <span class="date">{{ currentDate }}</span>
      </div>
      <div class="action-right">
        <el-button type="primary" :icon="Download" @click="exportAll" size="large">
          一键导出全部笔记
        </el-button>
      </div>
    </div>

    <!-- 最近笔记列表 -->
    <el-card class="recent-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><Clock /></el-icon>
            最近更新
          </span>
          <el-button type="text" @click="$router.push('/note/list')">查看全部</el-button>
        </div>
      </template>
      <el-table :data="recentList" border style="width: 100%">
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
            <span>{{ formatTime(row.updated_at) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.is_draft" type="warning" size="small">草稿</el-tag>
            <el-tag v-else-if="row.is_star" type="danger" size="small" effect="plain">收藏</el-tag>
            <el-tag v-else type="success" size="small" plain>已发布</el-tag>
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
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { getNoteList } from '@/api'
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

const router = useRouter()
const userStore = useUserStore()

const totalNote = ref(0)
const starCount = ref(0)
const draftCount = ref(0)
const trashCount = ref(0)
const recentList = ref<any[]>([])
const username = ref(userStore.userInfo?.username || '用户')
const currentDate = ref('')

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

function formatTime(time: string) {
  if (!time) return '-'
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  if (diff < 172800000) return '昨天'
  if (diff < 604800000) return Math.floor(diff / 86400000) + '天前'
  
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

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
      // 使用可选链和空值合并运算符安全地获取列表
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

async function exportAll() {
  const loadingInstance = ElLoading.service({
    lock: true,
    text: '正在打包导出笔记...',
    background: 'rgba(0, 0, 0, 0.7)'
  })
  
  try {
    const zip = new JSZip()
    const res = await getNoteList({ page: 1, size: 9999 })
      // 使用可选链和空值合并运算符安全地获取列表
    const list = res?.data?.list ?? []
    
    if (list.length === 0) {
      loadingInstance.close()
      ElMessage.warning('没有可导出的笔记')
      return
    }
    
    const normalNotes = list.filter((i: any) => !i.is_delete)
    const deletedNotes = list.filter((i: any) => i.is_delete)
    
    // 创建有效笔记文件夹 - 使用非空断言或类型守卫
    if (normalNotes.length > 0) {
      const normalFolder = zip.folder('有效笔记')
      // 使用非空断言操作符 (!) 告诉 TypeScript 这个值不为 null
      // 因为在 length > 0 时，folder 方法一定会返回一个有效对象
      normalNotes.forEach((item: any) => {
        normalFolder!.file(`${item.title || '无标题'}.md`, item.content || '')
      })
    }
    
    // 创建回收站笔记文件夹
    if (deletedNotes.length > 0) {
      const deletedFolder = zip.folder('回收站笔记')
      // 使用非空断言操作符 (!) 告诉 TypeScript 这个值不为 null
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

onMounted(() => {
  loadData()
  currentDate.value = getCurrentDate()
  
  const userInfo = userStore.userInfo
  if (userInfo?.username) {
    username.value = userInfo.username
  }
})

let dateInterval: NodeJS.Timeout
onMounted(() => {
  dateInterval = setInterval(() => {
    currentDate.value = getCurrentDate()
  }, 60000)
})

onUnmounted(() => {
  if (dateInterval) clearInterval(dateInterval)
})
</script>

<style scoped>
.dashboard {
  padding: 24px;
  background: #f0f2f5;
  min-height: calc(100vh - 60px);
}

/* 统计卡片 */
.stats-row {
  margin-bottom: 24px;
}

.stat-card {
  transition: transform 0.3s;
}

.stat-card:hover {
  transform: translateY(-4px);
}

.stat-content {
  display: flex;
  align-items: center;
  padding: 4px 0;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  margin-right: 16px;
  flex-shrink: 0;
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.stat-number {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  line-height: 1.2;
  margin-top: 4px;
}

/* 操作栏 */
.action-bar {
  background: #fff;
  padding: 16px 24px;
  border-radius: 8px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
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
  color: #303133;
}

.date {
  font-size: 14px;
  color: #909399;
}

/* 最近笔记 */
.recent-card {
  border-radius: 8px;
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
  color: #303133;
}

.card-title .el-icon {
  font-size: 18px;
  color: #409EFF;
}

/* 空状态 */
.empty-state {
  padding: 40px 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .dashboard {
    padding: 12px;
  }
  
  .stat-content {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .stat-icon {
    width: 40px;
    height: 40px;
    margin-right: 0;
    margin-bottom: 8px;
  }
  
  .stat-number {
    font-size: 22px;
  }
  
  .action-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .action-left {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>