<template>
  <div class="note-edit" :class="{ 'dark-mode': isDarkMode }">
    <!-- ===== 页面头部 ===== -->
    <div class="page-header">
      <div class="header-left">
        <el-button :icon="ArrowLeft" @click="router.push('/note/list')">返回</el-button>
        <h2 class="page-title">{{ isEdit ? '编辑笔记' : '新建笔记' }}</h2>
        <el-tag v-if="isSaving" type="warning" size="small">保存中...</el-tag>
        <el-tag v-else-if="isSaved" type="success" size="small">已保存</el-tag>
        <span class="word-count">{{ wordCount }} 字 · {{ readTime }} 分钟阅读</span>
      </div>
      <div class="header-right">
        <el-button-group>
          <!-- ✅ AI 按钮（在模板按钮前面） -->
          <el-button 
            :icon="MagicStick" 
            @click="showAIPanel = !showAIPanel"
            :type="showAIPanel ? 'primary' : 'default'"
          >
            AI 助手
            <el-badge 
              v-if="selectedText" 
              value="●" 
              type="warning" 
              style="margin-left: 4px;"
            />
          </el-button>
          <el-button @click="showTemplates = true" :icon="Files">模板</el-button>
          <el-button @click="showHistory = true" :icon="Clock">历史</el-button>
          <el-button @click="toggleDarkMode" :icon="isDarkMode ? Sunny : Moon">
            {{ isDarkMode ? '亮色' : '暗色' }}
          </el-button>
          <el-dropdown @command="handleExport">
            <el-button :icon="Download">
              导出 <el-icon><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="markdown">导出 Markdown</el-dropdown-item>
                <el-dropdown-item command="html">导出 HTML</el-dropdown-item>
                <el-dropdown-item command="pdf">导出 PDF</el-dropdown-item>
                <el-dropdown-item command="txt">导出 TXT</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </el-button-group>
        <el-button @click="handleSave" type="primary" size="large" :loading="saving">
          {{ saving ? '保存中...' : '保存笔记' }}
        </el-button>
      </div>
    </div>

    <!-- ===== 笔记表单 ===== -->
    <el-card class="form-card" shadow="hover">
      <el-form :model="form" label-width="80px">
        <el-form-item label="标题" required>
          <el-input
            v-model="form.title"
            placeholder="请输入笔记标题"
            size="large"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="属性">
          <el-checkbox-group v-model="form.properties">
            <el-checkbox value="is_top" label="置顶" />
            <el-checkbox value="is_star" label="收藏" />
            <el-checkbox value="is_draft" label="草稿" />
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="分类">
          <el-select
            v-model="form.categoryIds"
            multiple
            placeholder="选择分类"
            style="width: 100%"
            clearable
          >
            <el-option
              v-for="item in categoryList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="标签">
          <el-select
            v-model="form.tagNames"
            multiple
            placeholder="选择标签"
            style="width: 100%"
            clearable
            allow-create
            filterable
            default-first-option
          >
            <el-option
              v-for="item in tagList"
              :key="item.id"
              :label="item.name"
              :value="item.name"
            />
          </el-select>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- ===== 编辑器 ===== -->
    <el-card class="editor-card" shadow="hover">
      <div id="vditor"></div>
    </el-card>

    <!-- ===== 选中文本悬浮工具栏 ===== -->
    <div 
      v-if="showSelectionToolbar" 
      class="selection-toolbar"
      :style="toolbarStyle"
    >
      <el-button-group>
        <el-button size="small" @click="handleSelectionAction('summarize')">
          <el-icon><Document /></el-icon> 总结
        </el-button>
        <el-button size="small" @click="handleSelectionAction('polish')">
          <el-icon><Edit /></el-icon> 润色
        </el-button>
        <el-button size="small" @click="handleSelectionAction('translate')">
          <el-icon><ChatDotRound /></el-icon> 翻译
        </el-button>
        <el-button size="small" @click="handleSelectionAction('continue')">
          <el-icon><MagicStick /></el-icon> 续写
        </el-button>
      </el-button-group>
    </div>

    <!-- ===== AI 侧边栏 ===== -->
    <AIPanel
      ref="aiPanelRef"
      v-model="showAIPanel"
      :content="editorContent"
      :selected-text="selectedText"
      @insert="insertAIContent"
      @clear-selection="clearSelection"
    />

    <!-- ===== 模板对话框 ===== -->
    <EditorTemplates v-model="showTemplates" @apply="applyTemplate" />

    <!-- ===== 历史版本对话框 ===== -->
    <HistoryPanel v-model="showHistory" :note-id="noteId" @restore="restoreVersion" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Vditor from 'vditor';
import 'vditor/dist/index.css';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  ArrowLeft,
  Files,
  Clock,
  Download,
  ArrowDown,
  Sunny,
  Moon,
  MagicStick,
  Document,
  Edit,
  ChatDotRound
} from '@element-plus/icons-vue';

// ===== 导入 API =====
import {
  getNoteDetail,
  createNote,
  updateNote
} from '@/api/note';
import { getCategoryList } from '@/api/category';
import { getTagList } from '@/api/tag';

// ===== 导入 Composables =====
import { useAutoSave } from '@/composables/useAutoSave';
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts';
import { useDarkMode } from '@/composables/useDarkMode';
import { useNoteStats } from '@/composables/useNoteStats';

// ===== 导入工具 =====
import { exportNote } from '@/utils/export';
import { templates } from '@/utils/template';

// ===== 导入组件 =====
import AIPanel from '@/components/ai/AIPanel.vue';
import EditorTemplates from '@/components/editor/EditorTemplates.vue';
import HistoryPanel from '@/components/history/HistoryPanel.vue';

// ============================================================
// 基础
// ============================================================

const route = useRoute();
const router = useRouter();
const noteId = ref(Number(route.query.id) || 0);
const isEdit = computed(() => noteId.value > 0);
const saving = ref(false);
const isSaved = ref(false);
const isSaving = ref(false);
let vditor: Vditor | null = null;

// ============================================================
// 状态
// ============================================================

const showAIPanel = ref(false);
const showTemplates = ref(false);
const showHistory = ref(false);
const editorContent = ref('');

// 选中文本相关
const selectedText = ref('');
const aiPanelRef = ref<InstanceType<typeof AIPanel> | null>(null);
const showSelectionToolbar = ref(false);
const toolbarStyle = ref({
  top: '0px',
  left: '0px',
  display: 'none'
});
let selectionTimer: number | null = null;

// 缓存编辑原始分类、标签
const originCategoryIds = ref<number[]>([]);
const originTagNames = ref<string[]>([]);

// ============================================================
// 表单数据
// ============================================================

const form = ref({
  title: '',
  content: '',
  properties: [] as string[],
  categoryIds: [] as number[],
  tagNames: [] as string[]
});

const categoryList = ref<any[]>([]);
const tagList = ref<any[]>([]);

// ============================================================
// 使用 Composables
// ============================================================

const { isDarkMode, toggleDarkMode } = useDarkMode();
const { wordCount, readTime, updateStats } = useNoteStats(() => vditor?.getValue() || '');
const { autoSave, clearDraft, restoreDraft } = useAutoSave(noteId);

const { registerShortcuts } = useKeyboardShortcuts({
  onSave: handleSave,
  onUndo: () => {
    if (vditor) {
      (vditor as any).execCommand('undo');
    }
  },
  onRedo: () => {
    if (vditor) {
      (vditor as any).execCommand('redo');
    }
  },
  onSearch: () => {
    vditor?.focus();
  }
});

// ============================================================
// 选中文本处理
// ============================================================

function getSelectedText(): string {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) return '';
  
  const editor = document.querySelector('#vditor');
  if (!editor) return '';
  
  const range = selection.getRangeAt(0);
  const container = range.commonAncestorContainer;
  if (!editor.contains(container)) return '';
  
  return selection.toString().trim();
}

function getSelectionPosition(): { top: number; left: number } {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) return { top: 0, left: 0 };
  
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  
  return {
    top: rect.top + window.scrollY - 40,
    left: rect.left + rect.width / 2 - 120
  };
}

function handleSelectionChange() {
  if (selectionTimer) {
    clearTimeout(selectionTimer);
  }
  
  selectionTimer = window.setTimeout(() => {
    const text = getSelectedText();
    
    if (text && text.length > 0) {
      selectedText.value = text;
      const pos = getSelectionPosition();
      toolbarStyle.value = {
        top: `${pos.top}px`,
        left: `${Math.max(10, pos.left)}px`,
        display: 'flex'
      };
      showSelectionToolbar.value = true;
    } else {
      showSelectionToolbar.value = false;
      selectedText.value = '';
    }
    
    selectionTimer = null;
  }, 300);
}

function handleSelectionAction(action: string) {
  showAIPanel.value = true;
  
  nextTick(() => {
    if (aiPanelRef.value) {
      aiPanelRef.value.executeAction(action, selectedText.value);
    }
  });
  
  showSelectionToolbar.value = false;
}

function handleClickOutside(e: MouseEvent) {
  const toolbar = document.querySelector('.selection-toolbar');
  const editor = document.querySelector('#vditor');
  
  if (toolbar && !toolbar.contains(e.target as Node) && 
      editor && !editor.contains(e.target as Node)) {
    showSelectionToolbar.value = false;
  }
}

function clearSelection() {
  selectedText.value = '';
  showSelectionToolbar.value = false;
}

// ============================================================
// 数据加载
// ============================================================

async function loadBase() {
  try {
    const [cateRes, tagRes] = await Promise.all([
      getCategoryList(),
      getTagList()
    ]);
    categoryList.value = Array.isArray(cateRes?.data) ? cateRes.data : [];
    tagList.value = Array.isArray(tagRes?.data) ? tagRes.data : [];
  } catch (error) {
    ElMessage.error('加载分类、标签数据失败');
  }
}

async function loadDetail() {
  if (!noteId.value) return;

  try {
    const res = await getNoteDetail(noteId.value);
    const data = res?.data;

    if (!data) {
      ElMessage.error('笔记数据为空');
      return;
    }

    form.value.title = data.title || '';
    form.value.categoryIds = data.categoryIds || [];
    form.value.tagNames = data.tagNames || [];

    originCategoryIds.value = [...form.value.categoryIds];
    originTagNames.value = [...form.value.tagNames];

    form.value.properties = [];
    if (data.is_top) form.value.properties.push('is_top');
    if (data.is_star) form.value.properties.push('is_star');
    if (data.is_draft) form.value.properties.push('is_draft');

    if (vditor) {
      vditor.setValue(data.content || '');
      await nextTick();
      updateStats();
    }
  } catch (error) {
    ElMessage.error('加载笔记详情失败');
  }
}

// ============================================================
// 编辑器初始化
// ============================================================

function initEditor() {
  const accessToken = localStorage.getItem('accessToken') || '';

  vditor = new Vditor('vditor', {
    height: 500,
    mode: 'sv',
    cache: { enable: false },
    placeholder: '开始记录你的想法...',
    theme: isDarkMode.value ? 'dark' : 'classic',

    preview: {
      markdown: {
        toc: true,
        mark: true
      },
      hljs: {
        lineNumber: true,
        style: isDarkMode.value ? 'dark' : 'github'
      },
      actions: [
        'desktop',
        'tablet',
        'mobile',
        {
          tip: '阅读模式',
          icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16"><path fill="none" d="M0 0h24v24H0z"/><path d="M12 2a10 10 0 0 1 10 10 10 10 0 0 1-10 10A10 10 0 0 1 2 12 10 10 0 0 1 12 2zm0 2a8 8 0 0 0-8 8 8 8 0 0 0 8 8 8 8 0 0 0 8-8 8 8 0 0 0-8-8zm-1 4h2v6h-2V8zm0 8h2v2h-2v-2z" fill="currentColor"/></svg>',
          handler: () => toggleReadMode()
        } as any
      ]
    },

    toolbar: [
      'emoji',
      'headings',
      'bold',
      'italic',
      'strike',
      '|',
      'list',
      'ordered-list',
      'check',
      '|',
      'quote',
      'line',
      'code',
      'inline-code',
      '|',
      'upload',
      'link',
      'table',
      '|',
      'undo',
      'redo',
      '|',
      'outline',
      'preview',
      'fullscreen'
    ],

    upload: {
      url: '/api/file/upload',
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      accept: 'image/*',
      max: 20 * 1024 * 1024,
      handler: (files: File[]): Promise<string> => {
        return Promise.resolve('');
      }
    },

    after: () => {
      const draft = restoreDraft();
      if (draft) {
        const draftData = draft as any;
        if (draftData.content) {
          vditor?.setValue(draftData.content);
          if (draftData.title) {
            form.value.title = draftData.title;
          }
          ElMessage.info('已恢复本地草稿');
        }
      }

      loadDetail();
      startAutoSave();
      setTimeout(() => updateStats(), 100);
    },

    input: () => {
      const content = vditor?.getValue() || '';
      editorContent.value = content;
      updateStats();
      isSaved.value = false;
    }
  });
}

// ============================================================
// 自动保存
// ============================================================

let autoSaveTimer: number | null = null;

function startAutoSave() {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer);
  }

  autoSaveTimer = window.setInterval(() => {
    if (vditor && form.value.title) {
      autoSave({
        title: form.value.title,
        content: vditor.getValue()
      });
      isSaving.value = true;
      setTimeout(() => {
        isSaving.value = false;
      }, 500);
    }
  }, 30000);
}

function stopAutoSave() {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer);
    autoSaveTimer = null;
  }
}

// ============================================================
// 阅读模式
// ============================================================

const isReadMode = ref(false);

function toggleReadMode() {
  isReadMode.value = !isReadMode.value;
  const editor = document.querySelector('#vditor');
  if (editor) {
    editor.classList.toggle('read-mode');
  }
  ElMessage.success(isReadMode.value ? '进入阅读模式' : '退出阅读模式');
}

// ============================================================
// 模板
// ============================================================

function applyTemplate(template: any) {
  form.value.title = template.title;
  vditor?.setValue(template.content);
  showTemplates.value = false;
  ElMessage.success(`已应用模板: ${template.name}`);
}

// ============================================================
// 导出
// ============================================================

async function handleExport(command: string) {
  const content = vditor?.getValue() || '';
  const title = form.value.title || '未命名笔记';

  try {
    await exportNote(content, title, command as any);
    ElMessage.success(`导出成功: ${title}.${command}`);
  } catch (error) {
    console.error('导出失败:', error);
    ElMessage.error(`导出失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

// ============================================================
// AI 功能
// ============================================================

function insertAIContent(content: string) {
  const current = vditor?.getValue() || '';
  vditor?.setValue(current + '\n\n' + content);
  ElMessage.success('AI 内容已插入');
}

// ============================================================
// 历史版本
// ============================================================

async function restoreVersion(version: any) {
  try {
    await ElMessageBox.confirm(
      '确定要恢复到此版本吗？当前内容将被覆盖。',
      '确认恢复',
      {
        confirmButtonText: '确定恢复',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    vditor?.setValue(version.content);
    form.value.title = version.title;
    showHistory.value = false;
    ElMessage.success('已恢复版本');
  } catch (error) {
    if (error !== 'cancel') {
      console.error('恢复失败:', error);
    }
  }
}

// ============================================================
// 保存
// ============================================================

function isArrayEqual(a: any[], b: any[]): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

async function handleSave() {
  const content = vditor?.getValue() || '';
  const title = form.value.title.trim();

  if (!title) {
    ElMessage.warning('请输入笔记标题');
    return;
  }

  if (!content) {
    ElMessage.warning('请输入笔记内容');
    return;
  }

  saving.value = true;

  try {
    const payload: any = {
      title,
      content,
      is_top: form.value.properties.includes('is_top'),
      is_star: form.value.properties.includes('is_star'),
      is_draft: form.value.properties.includes('is_draft')
    };

    if (isEdit.value) {
      if (!isArrayEqual(form.value.categoryIds, originCategoryIds.value)) {
        payload.categoryIds = form.value.categoryIds;
      }
      if (!isArrayEqual(form.value.tagNames, originTagNames.value)) {
        payload.tagNames = form.value.tagNames;
      }
      await updateNote(noteId.value, payload);
    } else {
      payload.categoryIds = form.value.categoryIds;
      payload.tagNames = form.value.tagNames;
      await createNote(payload);
    }

    isSaved.value = true;
    clearDraft();
    ElMessage.success('保存成功');
    router.push('/note/list');
  } catch (error) {
    console.error('保存失败:', error);
  } finally {
    saving.value = false;
  }
}

// ============================================================
// 生命周期
// ============================================================

onMounted(async () => {
  await loadBase();
  await nextTick();
  initEditor();
  registerShortcuts();
  
  document.addEventListener('selectionchange', handleSelectionChange);
  document.addEventListener('mousedown', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('selectionchange', handleSelectionChange);
  document.removeEventListener('mousedown', handleClickOutside);
  
  if (selectionTimer) {
    clearTimeout(selectionTimer);
  }
  
  stopAutoSave();

  if (vditor && form.value.title) {
    autoSave({
      title: form.value.title,
      content: vditor.getValue()
    });
  }

  if (vditor) {
    try {
      vditor.destroy();
    } catch (error) {
      console.warn('编辑器销毁失败:', error);
    }
    vditor = null;
  }
});
</script>

<style scoped>
.note-edit {
  padding: 24px;
  background: #f0f2f5;
  min-height: calc(100vh - 60px);
}

/* ===== 页面头部 ===== */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.word-count {
  font-size: 13px;
  color: #909399;
  white-space: nowrap;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.header-right .el-button-group .el-button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* ===== 卡片 ===== */
.form-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

:deep(.form-card .el-card__body) {
  padding: 20px 24px;
}

.editor-card {
  border-radius: 8px;
}

:deep(.editor-card .el-card__body) {
  padding: 0;
}

/* ===== 编辑器 ===== */
#vditor {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.vditor) {
  border: none !important;
  border-radius: 8px;
}

:deep(.vditor .vditor-toolbar) {
  border-bottom: 1px solid #ebeef5;
  background: #fafafa;
  padding: 8px 12px;
}

:deep(.vditor .vditor-reset) {
  min-height: 400px;
}

/* ===== 选中文本悬浮工具栏 ===== */
.selection-toolbar {
  position: absolute;
  z-index: 1000;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 4px;
  display: none;
  align-items: center;
  gap: 2px;
  border: 1px solid #e4e7ed;
  animation: fadeIn 0.2s ease;
}

.selection-toolbar .el-button {
  border: none;
  font-size: 12px;
  padding: 6px 12px;
}

.selection-toolbar .el-button:hover {
  background: #f0f2f5;
}

.selection-toolbar .el-button .el-icon {
  margin-right: 2px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-8px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* ===== 阅读模式 ===== */
:deep(.read-mode .vditor-reset) {
  max-width: 740px;
  margin: 0 auto;
  padding: 40px 60px;
  font-size: 18px;
  line-height: 1.8;
}

:deep(.read-mode .vditor-toolbar) {
  display: none;
}

/* ===== 深色模式 ===== */
.dark-mode :deep(.vditor) {
  background: #1e1e1e;
}

.dark-mode :deep(.vditor .vditor-reset) {
  color: #d4d4d4;
}

.dark-mode :deep(.vditor .vditor-toolbar) {
  background: #2d2d2d;
  border-color: #404040;
}

.dark-mode .page-title {
  color: #e0e0e0;
}

.dark-mode .selection-toolbar {
  background: #2d2d2d;
  border-color: #404040;
}

.dark-mode .selection-toolbar .el-button:hover {
  background: #3d3d3d;
}

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .note-edit {
    padding: 12px;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-left {
    flex-wrap: wrap;
  }

  .header-right {
    flex-wrap: wrap;
  }

  .header-right .el-button {
    width: 100%;
  }

  .selection-toolbar {
    padding: 2px;
  }
  
  .selection-toolbar .el-button {
    font-size: 11px;
    padding: 4px 8px;
  }
  
  .selection-toolbar .el-button .el-icon {
    margin-right: 0;
  }

  :deep(.form-card .el-card__body) {
    padding: 16px;
  }

  :deep(.el-form-item) {
    margin-bottom: 16px;
  }

  :deep(.el-select) {
    width: 100% !important;
  }

  .word-count {
    font-size: 12px;
    width: 100%;
  }
}
</style>