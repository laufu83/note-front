<!-- src/views/Trash.vue - 回收站页面，适配亮暗主题 -->

<template>
  <div class="trash-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">
          <el-icon><Delete /></el-icon>
          回收站
        </h2>
        <span class="count">共 {{ tableData.length }} 篇笔记</span>
      </div>
      <div class="header-right">
        <el-button :icon="Refresh" @click="loadData" :loading="loading">刷新</el-button>
        <el-button type="danger" :icon="Delete" @click="handleClearAll" :loading="clearing">
          清空回收站
        </el-button>
      </div>
    </div>

    <!-- 回收站列表 -->
    <el-card class="list-card" shadow="hover">
      <el-table 
        :data="tableData" 
        border
        style="width: 100%"
        v-loading="loading"
        element-loading-text="加载中..."
      >
        <el-table-column label="标题" prop="title" min-width="200">
          <template #default="{ row }">
            <span class="title-text">{{ row.title || '无标题笔记' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="删除时间" prop="deleted_at" width="180" align="center">
          <template #default="{ row }">
            {{ formatTime(row.deleted_at) }}
          </template>
        </el-table-column>

        <el-table-column label="剩余保留天数" width="140" align="center">
          <template #default="{ row }">
            <el-tag v-if="getRemainingDays(row.deleted_at) > 0" type="warning" size="small">
              {{ getRemainingDays(row.deleted_at) }} 天后永久删除
            </el-tag>
            <el-tag v-else type="danger" size="small">
              即将永久删除
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="240" align="center" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="success" link @click="handleRestore(row.id)">
              <el-icon><RefreshLeft /></el-icon>
              恢复
            </el-button>
            <el-button size="small" type="danger" link @click="handlePermanentDelete(row.id)">
              <el-icon><DeleteFilled /></el-icon>
              永久删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态 -->
      <div v-if="tableData.length === 0 && !loading" class="empty-state">
        <el-empty description="回收站空空如也" :image-size="120">
          <el-button type="primary" @click="$router.push('/note/list')">去笔记列表</el-button>
        </el-empty>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getNoteList, restoreNote, permanentDeleteNote, clearTrash, type Note } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Refresh, RefreshLeft, DeleteFilled } from '@element-plus/icons-vue'
import { formatTime } from '@/utils/format'

const loading = ref(false)
const clearing = ref(false)
const tableData = ref<Note[]>([])

// ===== 加载回收站列表 =====
async function loadData() {
  loading.value = true
  try {
    const res = await getNoteList({ 
      trash: 1,
      page: 1, 
      size: 999 
    })
    tableData.value = res?.data?.list || []
  } catch (error) {
    ElMessage.error('加载回收站列表失败')
  } finally {
    loading.value = false
  }
}

// ===== 恢复笔记 =====
async function handleRestore(id: number) {
  try {
    await ElMessageBox.confirm('确定要恢复这篇笔记吗？', '提示', {
      confirmButtonText: '确定恢复',
      cancelButtonText: '取消',
      type: 'info'
    })
    await restoreNote(id)
    ElMessage.success('恢复成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('恢复失败，请重试')
    }
  }
}

// ===== 永久删除笔记 =====
async function handlePermanentDelete(id: number) {
  try {
    await ElMessageBox.confirm(
      '永久删除后将无法恢复，确定继续吗？', 
      '警告',
      {
        confirmButtonText: '确定永久删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )
    await permanentDeleteNote(id)
    ElMessage.success('永久删除成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败，请重试')
    }
  }
}

// ===== 清空回收站 =====
async function handleClearAll() {
  if (tableData.value.length === 0) {
    ElMessage.warning('回收站已空')
    return
  }

  try {
    await ElMessageBox.confirm(
      `将永久删除回收站中所有 ${tableData.value.length} 篇笔记，此操作不可恢复！`,
      '警告',
      {
        confirmButtonText: '确定清空',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )
    clearing.value = true
    await clearTrash()
    ElMessage.success('回收站已清空')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('清空失败，请重试')
    }
  } finally {
    clearing.value = false
  }
}

// ===== 计算剩余保留天数 =====
function getRemainingDays(deletedAt: string) {
  if (!deletedAt) return 0
  const deleted = new Date(deletedAt)
  const now = new Date()
  const diff = now.getTime() - deleted.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  // 假设保留30天
  const remaining = 30 - days
  return remaining > 0 ? remaining : 0
}

// ===== 生命周期 =====
onMounted(() => {
  loadData()
})
</script>
<style scoped>
.trash-page {
  @extend .list-page-container;
}

/* 特定样式：回收站图标颜色 */
.page-title .el-icon {
  color: #F56C6C;
}

/* 特定样式：标签颜色适配 */
.dark-theme :deep(.el-tag--warning) {
  background-color: rgba(230, 162, 60, 0.15) !important;
  border-color: rgba(230, 162, 60, 0.3) !important;
  color: #e6a23c !important;
}

.dark-theme :deep(.el-tag--danger) {
  background-color: rgba(245, 108, 108, 0.15) !important;
  border-color: rgba(245, 108, 108, 0.3) !important;
  color: #f56c6c !important;
}

/* 特定样式：链接按钮 */
:deep(.el-button--success.is-link) {
  color: #67c23a !important;
}

:deep(.el-button--success.is-link:hover) {
  color: #85ce61 !important;
}
</style>
