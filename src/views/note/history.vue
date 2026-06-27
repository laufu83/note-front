<!-- src/views/NoteHistory.vue - 修复 ElMessageBox 导入 -->

<template>
  <div class="note-history-page">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-button :icon="ArrowLeft" @click="router.push('/note/list')">返回</el-button>
            <span class="title">笔记历史版本</span>
          </div>
          <span class="version-info">版本 #{{ currentVersion }}</span>
        </div>
      </template>

      <div class="history-content">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-state">
          <el-icon class="is-loading" :size="32"><Loading /></el-icon>
          <span>加载中...</span>
        </div>

        <!-- 历史内容 -->
        <div v-else-if="html" class="markdown-body" v-html="html"></div>

        <!-- 空状态 -->
        <div v-else class="empty-state">
          <el-empty description="暂无历史版本" :image-size="120" />
        </div>
      </div>

      <template #footer>
        <div class="card-footer">
          <el-button @click="router.push('/note/list')">取消</el-button>
          <el-button type="primary" @click="handleRollback" :loading="rollbacking">
            {{ rollbacking ? '回滚中...' : '回滚到此版本' }}
          </el-button>
        </div>
      </template>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getNoteHistoryList, rollbackNote, type NoteHistory } from '@/api'
import { marked } from 'marked'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Loading } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const rollbacking = ref(false)
const noteId = ref(Number(route.params.id))
const historyId = ref(Number(route.query.hid))
const html = ref('')
const currentVersion = ref(0)

// ===== 加载历史版本 =====
async function loadHistory() {
  if (!noteId.value) {
    ElMessage.error('笔记ID不存在')
    return
  }

  loading.value = true
  try {
    const res = await getNoteHistoryList(noteId.value)
    // 安全获取历史列表
    const historyList = Array.isArray(res?.data) ? res.data : []
    
    if (historyList.length === 0) {
      ElMessage.warning('该笔记暂无历史版本')
      html.value = ''
      return
    }

    // 查找指定版本
    let targetItem: NoteHistory | undefined
    if (historyId.value) {
      targetItem = historyList.find((item: NoteHistory) => item.id === historyId.value)
    }
    
    // 如果没找到指定版本，使用最新版本
    if (!targetItem) {
      targetItem = historyList[0]
      // 如果通过 query 参数指定了版本但没找到，提示用户
      if (historyId.value) {
        ElMessage.warning('未找到指定版本，显示最新版本')
      }
    }

    if (targetItem) {
      currentVersion.value = targetItem.version || 0
      // 使用 marked 解析 Markdown 为 HTML
      html.value = marked.parse(targetItem.content || '') as string
    } else {
      html.value = ''
      ElMessage.warning('未找到有效的历史版本')
    }
  } catch (error) {
    console.error('加载历史版本失败', error)
    ElMessage.error('加载历史版本失败')
    html.value = ''
  } finally {
    loading.value = false
  }
}

// ===== 回滚到指定版本 =====
async function handleRollback() {
  if (!noteId.value || !historyId.value) {
    ElMessage.warning('缺少必要参数')
    return
  }

  try {
    await ElMessageBox.confirm('确定要回滚到此版本吗？当前内容将被覆盖。', '提示', {
      confirmButtonText: '确定回滚',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    rollbacking.value = true
    await rollbackNote({
      noteId: noteId.value,
      historyId: historyId.value
    })
    ElMessage.success('回滚成功')
    router.push('/note/list')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('回滚失败', error)
      ElMessage.error('回滚失败，请重试')
    }
  } finally {
    rollbacking.value = false
  }
}

// ===== 生命周期 =====
onMounted(() => {
  loadHistory()
})
</script>

<style scoped>
.note-history-page {
  padding: 24px;
  background: #f0f2f5;
  min-height: calc(100vh - 60px);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.version-info {
  font-size: 14px;
  color: #909399;
}

.history-content {
  min-height: 300px;
  padding: 16px 0;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  gap: 12px;
  color: #909399;
}

.loading-state .el-icon {
  animation: rotating 1.5s linear infinite;
}

@keyframes rotating {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.empty-state {
  padding: 40px 0;
}

.markdown-body {
  font-size: 14px;
  line-height: 1.8;
  color: #303133;
}

/* Markdown 样式 */
.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4),
.markdown-body :deep(h5),
.markdown-body :deep(h6) {
  margin: 16px 0 8px;
  font-weight: 600;
  line-height: 1.4;
}

.markdown-body :deep(h1) { font-size: 24px; }
.markdown-body :deep(h2) { font-size: 20px; }
.markdown-body :deep(h3) { font-size: 18px; }
.markdown-body :deep(h4) { font-size: 16px; }

.markdown-body :deep(p) {
  margin: 8px 0;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  padding-left: 24px;
  margin: 8px 0;
}

.markdown-body :deep(li) {
  margin: 4px 0;
}

.markdown-body :deep(blockquote) {
  margin: 8px 0;
  padding: 8px 16px;
  border-left: 4px solid #409EFF;
  background: #f5f7fa;
  color: #606266;
}

.markdown-body :deep(code) {
  padding: 2px 6px;
  background: #f5f7fa;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
}

.markdown-body :deep(pre) {
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 6px;
  overflow-x: auto;
  margin: 8px 0;
}

.markdown-body :deep(pre code) {
  background: transparent;
  padding: 0;
}

.markdown-body :deep(img) {
  max-width: 100%;
  border-radius: 6px;
}

.markdown-body :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 8px 0;
}

.markdown-body :deep(th),
.markdown-body :deep(td) {
  border: 1px solid #dcdfe6;
  padding: 8px 12px;
  text-align: left;
}

.markdown-body :deep(th) {
  background: #f5f7fa;
  font-weight: 600;
}

.card-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
}

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .note-history-page {
    padding: 12px;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-left {
    flex-wrap: wrap;
  }

  .card-footer {
    flex-direction: column;
  }

  .card-footer .el-button {
    width: 100%;
  }
}
</style>