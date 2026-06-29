<!-- src/views/NoteHistory.vue - 使用全局公共样式 -->
<template>
  <div class="note-history-page page-container">
    <el-card class="page-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-button :icon="ArrowLeft" @click="router.push('/note/list')" class="btn-default">返回</el-button>
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
          <el-button @click="router.push('/note/list')" class="btn-default">取消</el-button>
          <el-button type="primary" @click="handleRollback" :loading="rollbacking" class="btn-primary">
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
    const historyList = Array.isArray(res?.data) ? res.data : []
    
    if (historyList.length === 0) {
      ElMessage.warning('该笔记暂无历史版本')
      html.value = ''
      return
    }

    let targetItem: NoteHistory | undefined
    if (historyId.value) {
      targetItem = historyList.find((item: NoteHistory) => item.id === historyId.value)
    }
    
    if (!targetItem) {
      targetItem = historyList[0]
      if (historyId.value) {
        ElMessage.warning('未找到指定版本，显示最新版本')
      }
    }

    if (targetItem) {
      currentVersion.value = targetItem.version || 0
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
/* ============================================================
   NoteHistory 专用样式
   ============================================================ */

.note-history-page {
  padding: 24px;
}

/* ===== 卡片头部 ===== */
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
  color: var(--text-primary);
  transition: color var(--transition-duration);
}

.version-info {
  font-size: 14px;
  color: var(--text-secondary);
  transition: color var(--transition-duration);
}

/* ===== 内容区域 ===== */
.history-content {
  min-height: 300px;
  padding: 16px 20px;
}

/* ===== 加载状态 ===== */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  gap: 12px;
  color: var(--text-secondary);
  transition: color var(--transition-duration);
}

.loading-state .el-icon {
  color: var(--theme-color);
  animation: rotating 1.5s linear infinite;
}

@keyframes rotating {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ===== Markdown 内容 ===== */
.markdown-body {
  font-size: 14px;
  line-height: 1.8;
  color: var(--text-primary);
  transition: color var(--transition-duration);
}

/* Markdown 样式 - 使用 CSS 变量 */
.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4),
.markdown-body :deep(h5),
.markdown-body :deep(h6) {
  margin: 16px 0 8px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--text-primary);
  transition: color var(--transition-duration);
}

.markdown-body :deep(h1) { font-size: 24px; }
.markdown-body :deep(h2) { font-size: 20px; }
.markdown-body :deep(h3) { font-size: 18px; }
.markdown-body :deep(h4) { font-size: 16px; }

.markdown-body :deep(p) {
  margin: 8px 0;
  color: var(--text-regular);
  transition: color var(--transition-duration);
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  padding-left: 24px;
  margin: 8px 0;
  color: var(--text-regular);
  transition: color var(--transition-duration);
}

.markdown-body :deep(li) {
  margin: 4px 0;
}

.markdown-body :deep(blockquote) {
  margin: 8px 0;
  padding: 8px 16px;
  border-left: 4px solid var(--theme-color);
  background: var(--bg-gray);
  color: var(--text-regular);
  transition: background var(--transition-duration), 
              border-color var(--transition-duration),
              color var(--transition-duration);
}

.markdown-body :deep(code) {
  padding: 2px 6px;
  background: var(--bg-gray);
  border-radius: var(--radius-sm);
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: var(--text-primary);
  transition: background var(--transition-duration), color var(--transition-duration);
}

.markdown-body :deep(pre) {
  padding: 12px 16px;
  background: var(--bg-dark);
  border-radius: var(--radius-sm);
  overflow-x: auto;
  margin: 8px 0;
  transition: background var(--transition-duration);
}

.markdown-body :deep(pre code) {
  background: transparent;
  padding: 0;
  color: var(--text-regular);
}

.markdown-body :deep(img) {
  max-width: 100%;
  border-radius: var(--radius-sm);
}

.markdown-body :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 8px 0;
}

.markdown-body :deep(th),
.markdown-body :deep(td) {
  border: 1px solid var(--border-color);
  padding: 8px 12px;
  text-align: left;
  transition: border-color var(--transition-duration);
}

.markdown-body :deep(th) {
  background: var(--bg-gray);
  font-weight: 600;
  color: var(--text-primary);
  transition: background var(--transition-duration), color var(--transition-duration);
}

.markdown-body :deep(td) {
  color: var(--text-regular);
  transition: color var(--transition-duration);
}

.markdown-body :deep(hr) {
  border: none;
  border-top: 1px solid var(--border-color);
  margin: 16px 0;
  transition: border-color var(--transition-duration);
}

.markdown-body :deep(a) {
  color: var(--theme-color);
  text-decoration: none;
  transition: color var(--transition-duration);
}

.markdown-body :deep(a:hover) {
  color: var(--theme-color-hover);
  text-decoration: underline;
}

.markdown-body :deep(strong) {
  color: var(--text-primary);
  font-weight: 600;
}

.markdown-body :deep(em) {
  color: var(--text-regular);
}

/* ===== 卡片底部 ===== */
.card-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* ===== 暗色主题额外适配 ===== */
.dark-theme .markdown-body :deep(blockquote) {
  background: var(--bg-gray);
}

.dark-theme .markdown-body :deep(code) {
  background: var(--bg-gray);
}

.dark-theme .markdown-body :deep(pre) {
  background: var(--bg-dark);
}

.dark-theme .markdown-body :deep(th) {
  background: var(--bg-gray);
}

/* ============================================================
   响应式
   ============================================================ */
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

  .history-content {
    padding: 12px 16px;
  }

  .card-footer {
    flex-direction: column;
  }

  .card-footer .el-button {
    width: 100%;
  }

  .title {
    font-size: 14px;
  }

  .version-info {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .note-history-page {
    padding: 8px;
  }

  .history-content {
    padding: 8px 12px;
    min-height: 200px;
  }

  .markdown-body {
    font-size: 13px;
  }

  .markdown-body :deep(h1) { font-size: 20px; }
  .markdown-body :deep(h2) { font-size: 18px; }
  .markdown-body :deep(h3) { font-size: 16px; }
  .markdown-body :deep(h4) { font-size: 14px; }

  .markdown-body :deep(pre) {
    padding: 8px 12px;
    font-size: 12px;
  }

  .loading-state {
    min-height: 150px;
  }
}
</style>