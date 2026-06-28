<template>
  <el-dialog v-model="visible" title="版本历史" width="700px" @close="handleClose">
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
            <el-tag v-if="version.isCurrent" size="small" type="success" class="ml-2">当前版本</el-tag>
            <el-tag v-if="version.version" size="small" type="info" class="ml-2">v{{ version.version }}</el-tag>
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
import Vditor from 'vditor';
import { getNoteHistoryList, deleteHistory, type NoteHistory } from '@/api/note';
import { formatTime } from '@/utils/format';
import { isSuccess, getData } from '@/types/response';

// ============================================================
// 类型定义
// ============================================================

/** 历史版本（扩展） */
interface HistoryVersion extends NoteHistory {
  /** 用户名（展示用） */
  userName?: string;
  /** 字数（展示用） */
  wordCount?: number;
  /** 是否为当前版本 */
  isCurrent?: boolean;
  /** 创建时间（兼容驼峰） */
  createdAt?: string;
}

// ============================================================
// Props & Emits
// ============================================================

const props = defineProps<{
  modelValue: boolean;
  noteId: number;
  /** 当前笔记内容（用于判断当前版本） */
  currentContent?: string;
  /** 当前笔记标题 */
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

/**
 * 加载历史版本
 */
async function loadHistory() {
  if (!props.noteId) return;

  loading.value = true;
  try {
    const res = await getNoteHistoryList(props.noteId);

    if (isSuccess(res)) {
      const data = getData<NoteHistory[]>(res) || [];
      
      // 转换为展示格式
      versions.value = data.map((item, index) => ({
        ...item,
        userName: item.user_name || '未知用户',
        wordCount: item.content?.length || 0,
        isCurrent: index === 0, // 最新版本作为当前版本
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

/**
 * 预览版本
 */
/**
 * 预览版本
 */
async function previewVersion(version: HistoryVersion) {
  if (!version || !version.content) {
    ElMessage.warning('该版本内容为空');
    return;
  }

  try {
    // ✅ 如果 md2html 返回 Promise，使用 await
    previewContent.value = await Vditor.md2html(version.content);
    selectedVersion.value = version;
    showPreview.value = true;
  } catch (error) {
    console.error('预览渲染失败:', error);
    ElMessage.error('预览渲染失败');
  }
}

/**
 * 恢复版本
 */
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

/**
 * 删除版本
 */
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
    
    // 刷新列表
    await loadHistory();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error);
      ElMessage.error('删除失败');
    }
  }
}

/**
 * 从预览中恢复
 */
function restoreFromPreview() {
  if (selectedVersion.value) {
    restoreVersion(selectedVersion.value);
    showPreview.value = false;
  }
}

/**
 * 关闭对话框
 */
function handleClose() {
  // 重置预览状态
  showPreview.value = false;
  selectedVersion.value = null;
}

// ============================================================
// 监听
// ============================================================

// 当对话框打开时加载数据
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
.history-list {
  max-height: 500px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
  transition: background 0.2s;
}

.history-item:hover {
  background: #f5f7fa;
}

.history-item.is-current {
  background: #f0f9eb;
}

.history-item.is-current:hover {
  background: #e8f5e0;
}

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
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-title .ml-2 {
  margin-left: 4px;
}

.history-meta {
  font-size: 13px;
  color: #909399;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
}

.history-meta span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.history-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  margin-left: 16px;
}

.preview-content {
  max-height: 500px;
  overflow-y: auto;
  padding: 24px;
  background: #f8f9fa;
  border-radius: 8px;
  line-height: 1.8;
  font-size: 15px;
}

.preview-content :deep(pre) {
  background: #f6f8fa;
  padding: 16px;
  border-radius: 6px;
  overflow: auto;
}

.preview-content :deep(code) {
  background: #f6f8fa;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 14px;
}

.preview-content :deep(blockquote) {
  border-left: 4px solid #409eff;
  padding-left: 16px;
  color: #666;
  margin: 12px 0;
}

.preview-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.preview-info {
  color: #909399;
  font-size: 14px;
}

/* ===== 深色模式适配 ===== */
:global(.dark-mode) .history-item {
  border-color: #404040;
}

:global(.dark-mode) .history-item:hover {
  background: #2d2d2d;
}

:global(.dark-mode) .history-item.is-current {
  background: #1e3a2a;
}

:global(.dark-mode) .history-item.is-current:hover {
  background: #1a3324;
}

:global(.dark-mode) .preview-content {
  background: #1e1e1e;
  color: #d4d4d4;
}

:global(.dark-mode) .preview-content :deep(pre) {
  background: #2d2d2d;
}

:global(.dark-mode) .preview-content :deep(code) {
  background: #2d2d2d;
}

:global(.dark-mode) .history-meta {
  color: #a0a0a0;
}

/* ===== 响应式 ===== */
@media (max-width: 768px) {
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

  .preview-footer {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
}
</style>