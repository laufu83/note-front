<template>
  <el-dialog 
    v-model="visible" 
    title="版本历史" 
    width="700px" 
    class="history-dialog"
    @close="handleClose"
  >
    <div class="history-list" v-loading="loading">
      <div 
        v-for="version in versions" 
        :key="version.id"
        class="history-item"
        :class="{ 'is-current': version.isCurrent }"
      >
        <div class="history-info">
          <div class="history-title">
            {{ version.title || '未命名笔记' }}
            <el-tag v-if="version.isCurrent" size="small" type="success">当前版本</el-tag>
            <el-tag v-if="version.version" size="small" type="info">v{{ version.version }}</el-tag>
          </div>
          <div class="history-meta">
            <span><el-icon><User /></el-icon> {{ version.userName || '未知用户' }}</span>
            <span><el-icon><Clock /></el-icon> {{ formatTime(version.createdAt || version.created_at) }}</span>
            <span><el-icon><Document /></el-icon> {{ version.wordCount || 0 }} 字</span>
          </div>
        </div>
        <div class="history-actions">
          <el-button size="small" @click="previewVersion(version)">预览</el-button>
          <el-button 
            size="small" 
            type="primary" 
            @click="restoreVersion(version)"
            :disabled="version.isCurrent"
          >
            {{ version.isCurrent ? '当前版本' : '恢复' }}
          </el-button>
          <el-button 
            size="small" 
            type="danger" 
            @click="deleteVersion(version)"
            :disabled="version.isCurrent"
          >
            删除
          </el-button>
        </div>
      </div>
      
      <el-empty v-if="!versions.length && !loading" description="暂无历史版本" />
    </div>
    
    <!-- 预览对话框 -->
    <el-dialog 
      v-model="showPreview" 
      title="版本预览" 
      width="800px" 
      class="preview-dialog"
      append-to-body
      :close-on-click-modal="false"
    >
      <div class="preview-content" v-html="previewContent"></div>
      <template #footer>
        <div class="preview-footer">
          <span class="preview-info" v-if="selectedVersion">
            版本 {{ selectedVersion.version }} · {{ formatTime(selectedVersion.createdAt || selectedVersion.created_at) }}
          </span>
          <div>
            <el-button @click="showPreview = false">关闭</el-button>
            <el-button 
              type="primary" 
              @click="restoreFromPreview"
              :disabled="selectedVersion?.isCurrent"
            >
              {{ selectedVersion?.isCurrent ? '已是当前版本' : '恢复此版本' }}
            </el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { User, Clock, Document } from '@element-plus/icons-vue';
import { marked } from 'marked';
import { getNoteHistoryList, deleteHistory, type NoteHistory } from '@/api/note';
import { formatTime } from '@/utils/format';
import { isSuccess, getData } from '@/types/response';

// ============================================================
// 类型定义
// ============================================================

interface HistoryVersion extends NoteHistory {
  userName?: string;
  wordCount?: number;
  isCurrent?: boolean;
  createdAt?: string;
}

// ============================================================
// Props & Emits
// ============================================================

const props = defineProps<{
  modelValue: boolean;
  noteId: number;
  currentContent?: string;
  currentTitle?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'restore', version: HistoryVersion): void;
  (e: 'delete', versionId: number): void;
}>();

// ============================================================
// 响应式数据
// ============================================================

const versions = ref<HistoryVersion[]>([]);
const loading = ref(false);
const showPreview = ref(false);
const previewContent = ref('');
const selectedVersion = ref<HistoryVersion | null>(null);

// ============================================================
// 计算属性
// ============================================================

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

// ============================================================
// 方法
// ============================================================

async function loadHistory() {
  if (!props.noteId) return;

  loading.value = true;
  try {
    const res = await getNoteHistoryList(props.noteId);

    if (isSuccess(res)) {
      const data = getData<NoteHistory[]>(res) || [];
      
      versions.value = data.map((item, index) => ({
        ...item,
        userName: item.user_name || '未知用户',
        wordCount: item.content?.length || 0,
        isCurrent: index === 0,
        createdAt: item.created_at,
        version: item.version || data.length - index
      }));
    } else {
      ElMessage.warning(res.msg || '加载历史版本失败');
      versions.value = [];
    }
  } catch (error) {
    console.error('加载历史版本失败:', error);
    ElMessage.error('加载历史版本失败');
    versions.value = [];
  } finally {
    loading.value = false;
  }
}

async function previewVersion(version: HistoryVersion) {
  if (!version || !version.content) {
    ElMessage.warning('该版本内容为空');
    return;
  }

  try {
    // ✅ 使用 marked 渲染 Markdown（更稳定）
    previewContent.value = marked.parse(version.content) as string;
    selectedVersion.value = version;
    showPreview.value = true;
  } catch (error) {
    console.error('预览渲染失败:', error);
    ElMessage.error('预览渲染失败');
  }
}

async function restoreVersion(version: HistoryVersion) {
  if (version.isCurrent) {
    ElMessage.info('当前版本无需恢复');
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定要恢复版本「${version.title || '未命名'}」吗？当前内容将被覆盖。`,
      '确认恢复',
      {
        confirmButtonText: '确定恢复',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );

    emit('restore', version);
    visible.value = false;
    ElMessage.success('版本恢复成功');
  } catch (error) {
    if (error !== 'cancel') {
      console.error('恢复失败:', error);
    }
  }
}

async function deleteVersion(version: HistoryVersion) {
  if (version.isCurrent) {
    ElMessage.warning('当前版本不能删除');
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除版本「${version.title || '未命名'}」吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'error'
      }
    );

    await deleteHistory(version.id);
    ElMessage.success('版本删除成功');
    emit('delete', version.id);
    await loadHistory();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error);
      ElMessage.error('删除失败');
    }
  }
}

function restoreFromPreview() {
  if (selectedVersion.value) {
    restoreVersion(selectedVersion.value);
    showPreview.value = false;
  }
}

function handleClose() {
  showPreview.value = false;
  selectedVersion.value = null;
}

// ============================================================
// 监听
// ============================================================

watch(visible, (newVal) => {
  if (newVal && props.noteId) {
    loadHistory();
  }
});

// ============================================================
// 暴露方法
// ============================================================

defineExpose({
  loadHistory,
  versions
});
</script>

<style scoped>
/* ============================================================
   历史版本对话框
   ============================================================ */

.history-dialog :deep(.el-dialog__body) {
  padding: 0 20px 20px;
}

.history-list {
  max-height: 500px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  transition: background var(--transition-duration);
}

.history-item:last-child {
  border-bottom: none;
}

.history-item:hover {
  background: var(--bg-gray);
}

.history-item.is-current {
  background: rgba(103, 194, 58, 0.08);
}

.history-item.is-current:hover {
  background: rgba(103, 194, 58, 0.12);
}

/* ===== 历史信息 ===== */
.history-info {
  flex: 1;
  min-width: 0;
}

.history-title {
  font-weight: 500;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  color: var(--text-primary);
  transition: color var(--transition-duration);
}

.history-meta {
  font-size: 13px;
  color: var(--text-secondary);
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  transition: color var(--transition-duration);
}

.history-meta span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* ===== 操作按钮 ===== */
.history-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  margin-left: 16px;
}

/* ===== 预览对话框 ===== */
.preview-dialog :deep(.el-dialog__body) {
  padding: 0 20px 20px;
}

.preview-content {
  max-height: 500px;
  overflow-y: auto;
  padding: 24px;
  background: var(--bg-gray);
  border-radius: var(--radius-md);
  line-height: 1.8;
  font-size: 15px;
  color: var(--text-primary);
  transition: background var(--transition-duration), color var(--transition-duration);
}

.preview-content :deep(pre) {
  background: var(--bg-dark);
  padding: 16px;
  border-radius: var(--radius-sm);
  overflow: auto;
  transition: background var(--transition-duration);
}

.preview-content :deep(code) {
  background: var(--bg-dark);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-size: 14px;
  color: var(--text-primary);
  transition: background var(--transition-duration), color var(--transition-duration);
}

.preview-content :deep(blockquote) {
  border-left: 4px solid var(--theme-color);
  padding-left: 16px;
  color: var(--text-secondary);
  margin: 12px 0;
  transition: border-color var(--transition-duration), color var(--transition-duration);
}

.preview-content :deep(h1),
.preview-content :deep(h2),
.preview-content :deep(h3),
.preview-content :deep(h4) {
  color: var(--text-primary);
  transition: color var(--transition-duration);
}

.preview-content :deep(p) {
  color: var(--text-regular);
  transition: color var(--transition-duration);
}

/* ===== 预览底部 ===== */
.preview-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.preview-info {
  color: var(--text-secondary);
  font-size: 14px;
  transition: color var(--transition-duration);
}

/* ===== 暗色主题标签适配 ===== */
.dark-theme .history-item.is-current {
  background: rgba(103, 194, 58, 0.12);
}

.dark-theme .history-item.is-current:hover {
  background: rgba(103, 194, 58, 0.18);
}

/* ============================================================
   响应式
   ============================================================ */
@media (max-width: 768px) {
  .history-dialog :deep(.el-dialog) {
    width: 95% !important;
  }

  .history-item {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .history-actions {
    margin-left: 0;
    justify-content: flex-end;
  }

  .history-title {
    flex-wrap: wrap;
    white-space: normal;
  }

  .preview-dialog :deep(.el-dialog) {
    width: 95% !important;
  }

  .preview-footer {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .preview-content {
    padding: 16px;
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .history-actions {
    flex-wrap: wrap;
  }

  .history-actions .el-button {
    flex: 1;
    min-width: 60px;
  }

  .preview-content {
    padding: 12px;
    font-size: 13px;
    max-height: 350px;
  }
}
</style>