<template>
  <div class="ai-sidebar" :class="{ 'is-open': visible, 'dark-mode': isDarkMode }">
    <!-- <div class="ai-sidebar-toggle" @click="togglePanel">
      <el-icon :size="24">
        <component :is="visible ? Close : MagicStick" />
      </el-icon>
      <span v-if="!visible" class="toggle-label">AI</span>
    </div> -->

    <div class="ai-sidebar-content">
      <div class="ai-panel">
        <!-- ===== 头部 ===== -->
        <div class="ai-header">
          <span class="ai-title">AI 助手</span>
          <el-button size="small" :icon="Close" text @click="togglePanel" />
        </div>

        <!-- ===== 选中内容提示 ===== -->
        <div v-if="displaySelectedText" class="selected-info">
          <el-alert type="info" :closable="false" show-icon>
            <template #title>
              <span>已选中 {{ displaySelectedText.length }} 字符</span>
            </template>
            <div class="selected-preview">{{ selectedTextPreview }}</div>
          </el-alert>
          <el-button size="small" type="text" @click="clearSelectedText">
            清除选中
          </el-button>
        </div>

        <!-- ===== 上下文模式选择 ===== -->
        <div v-if="displaySelectedText" class="context-mode">
          <el-radio-group v-model="contextMode" size="small">
            <el-radio-button value="selected">仅选中</el-radio-button>
            <el-radio-button value="full">整篇</el-radio-button>
            <el-radio-button value="both">结合</el-radio-button>
          </el-radio-group>
        </div>

        <!-- ===== 快捷操作 ===== -->
        <div class="ai-actions">
          <el-button-group>
            <el-button
              v-for="item in actionButtons"
              :key="item.action"
              size="small"
              @click="handleAction(item.action)"
              :loading="processing && currentAction === item.action"
              :disabled="!hasContent && !displaySelectedText"
            >
              <el-icon><component :is="item.icon" /></el-icon>
              {{ item.label }}
            </el-button>
          </el-button-group>
        </div>

        <!-- ===== 自定义提问 ===== -->
        <div class="ai-custom">
          <el-input
            v-model="customPrompt"
            type="textarea"
            :rows="2"
            :placeholder="customPlaceholder"
            :disabled="processing"
            @keydown.ctrl.enter="handleCustomAsk"
          />
          <div class="custom-actions">
            <el-button type="primary" @click="handleCustomAsk" :loading="processing" size="small">
              发送
            </el-button>
            <el-tag v-if="hasContent" size="small" type="info">
              {{ wordCount }} 字
            </el-tag>
            <el-tag v-if="displaySelectedText" size="small" type="warning">
              选中 {{ displaySelectedText.length }} 字
            </el-tag>
          </div>
        </div>

        <!-- ===== AI 响应 ===== -->
        <div class="ai-response" v-if="response">
          <div class="response-header">
            <span class="response-title">AI 回复</span>
            <div class="response-actions">
              <el-button size="small" @click="insertResponse" :icon="DocumentAdd" text />
              <el-button size="small" @click="copyResponse" :icon="CopyDocument" text />
              <el-button size="small" @click="clearResponse" :icon="Close" text />
            </div>
          </div>
          <div class="response-content" v-html="renderedHtml"></div>
          <div class="response-footer" v-if="responseTime">
            <span class="usage-info">{{ responseTime }}ms</span>
          </div>
        </div>

        <!-- ===== 空状态 ===== -->
        <div v-else class="ai-empty">
          <el-empty :description="emptyDescription" :image-size="60" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import {
  Document,
  Edit,
  MagicStick,
  ChatDotRound,
  DocumentAdd,
  CopyDocument,
  Close
} from '@element-plus/icons-vue';
import { useAI } from '@/composables/useAI';
import { ElMessage } from 'element-plus';
import Vditor from 'vditor';
import { useDarkMode } from '@/composables/useDarkMode';

// ============================================================
// Props & Emits
// ============================================================

const props = defineProps<{
  modelValue: boolean;
  content: string;
  selectedText?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'insert', content: string): void;
  (e: 'clearSelection'): void;
}>();

// ============================================================
// Composables
// ============================================================

const { askAI, summarizeAI, translateAI, continueAI, polishAI } = useAI();
const { isDarkMode } = useDarkMode();

// ============================================================
// 常量
// ============================================================

const actionButtons = [
  { action: 'summarize', label: '总结', icon: Document },
  { action: 'polish', label: '润色', icon: Edit },
  { action: 'continue', label: '续写', icon: MagicStick },
  { action: 'translate', label: '翻译', icon: ChatDotRound }
] as const;

// ============================================================
// 响应式数据
// ============================================================

const visible = ref(props.modelValue);
const customPrompt = ref('');
const response = ref('');
const renderedHtml = ref('');
const currentAction = ref<string>('');
const responseTime = ref<number | null>(null);
const responseUsage = ref<{
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
} | null>(null);
const processing = ref(false);

const contextMode = ref<'selected' | 'full' | 'both'>('selected');
const internalSelectedText = ref('');

// ============================================================
// 计算属性
// ============================================================

const displaySelectedText = computed(() => {
  return internalSelectedText.value || props.selectedText || '';
});

const hasContent = computed(() => {
  return !!(props.content && props.content.trim());
});

const hasSelectedText = computed(() => {
  return !!(displaySelectedText.value && displaySelectedText.value.trim());
});

const wordCount = computed(() => {
  if (!props.content) return 0;
  return props.content.replace(/\s/g, '').length;
});

const selectedTextPreview = computed(() => {
  const text = displaySelectedText.value;
  if (text.length > 80) {
    return text.slice(0, 80) + '...';
  }
  return text;
});

const customPlaceholder = computed(() => {
  if (hasSelectedText.value) {
    return '对选中内容进行操作...';
  }
  if (hasContent.value) {
    return '对笔记进行操作...';
  }
  return '请先填写笔记内容';
});

const emptyDescription = computed(() => {
  if (!hasContent.value && !hasSelectedText.value) {
    return '暂无内容';
  }
  return '输入问题或点击按钮';
});

const getContextContent = (): string => {
  const selected = displaySelectedText.value;
  const full = props.content || '';

  switch (contextMode.value) {
    case 'selected':
      return selected || full;
    case 'full':
      return full;
    case 'both':
      return selected ? `${selected}\n\n---\n\n${full}` : full;
    default:
      return selected || full;
  }
};

// ============================================================
// 工具方法
// ============================================================

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function renderMarkdown(markdown: string): Promise<string> {
  if (!markdown) return '';
  try {
    const html = await Vditor.md2html(markdown);
    return typeof html === 'string' ? html : String(html);
  } catch (error) {
    console.warn('Markdown 渲染失败', error);
    return escapeHtml(markdown);
  }
}

async function updateRenderedHtml(markdown: string) {
  renderedHtml.value = await renderMarkdown(markdown);
}

function estimateTokens(text: string): number {
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
  return Math.ceil(chineseChars / 1.5 + englishWords * 0.75);
}

// ============================================================
// 业务方法
// ============================================================

function togglePanel() {
  visible.value = !visible.value;
  emit('update:modelValue', visible.value);
}

async function executeAction(action: string, text?: string) {
  if (text) {
    internalSelectedText.value = text;
  }
  if (hasSelectedText.value) {
    contextMode.value = 'selected';
  }
  if (!visible.value) {
    visible.value = true;
    emit('update:modelValue', true);
    await nextTick();
  }
  await handleAction(action);
}

function clearSelectedText() {
  internalSelectedText.value = '';
  emit('clearSelection');
}

async function handleAction(action: string) {
  const contextContent = getContextContent();

  if (!contextContent.trim() && !props.content.trim()) {
    ElMessage.warning('当前没有可处理的内容');
    return;
  }

  if (contextMode.value === 'selected' && !hasSelectedText.value) {
    contextMode.value = 'full';
  }

  currentAction.value = action;
  processing.value = true;
  response.value = '';
  renderedHtml.value = '';
  responseUsage.value = null;
  responseTime.value = null;

  const startTime = Date.now();

  try {
    let result: string;
    const content = contextContent.trim() || props.content.trim();

    switch (action) {
      case 'summarize':
        result = await summarizeAI(content);
        break;
      case 'polish':
        result = await polishAI(content);
        break;
      case 'continue':
        result = await continueAI(content);
        break;
      case 'translate':
        result = await translateAI(content, '英文');
        break;
      default:
        throw new Error('未知操作类型');
    }

    response.value = result;
    await updateRenderedHtml(result);

    responseUsage.value = {
      total_tokens: estimateTokens(result)
    };

    responseTime.value = Date.now() - startTime;
  } catch (err: any) {
    console.error('AI 操作失败:', err);
    ElMessage.error(err?.message || 'AI 请求异常');
    response.value = '';
    renderedHtml.value = '';
  } finally {
    processing.value = false;
    currentAction.value = '';
  }
}

async function handleCustomAsk() {
  const promptTrim = customPrompt.value.trim();
  if (!promptTrim) {
    ElMessage.warning('请输入对话内容');
    return;
  }

  const contextContent = getContextContent();

  processing.value = true;
  response.value = '';
  renderedHtml.value = '';
  responseUsage.value = null;
  responseTime.value = null;

  const startTime = Date.now();

  try {
    const result = await askAI(promptTrim, contextContent || undefined);

    response.value = result;
    await updateRenderedHtml(result);

    responseUsage.value = {
      total_tokens: estimateTokens(result)
    };

    responseTime.value = Date.now() - startTime;
    customPrompt.value = '';
  } catch (err: any) {
    console.error('AI 自定义提问失败:', err);
    ElMessage.error(err?.message || 'AI 请求异常');
    response.value = '';
    renderedHtml.value = '';
  } finally {
    processing.value = false;
  }
}

function insertResponse() {
  if (!response.value) {
    ElMessage.warning('暂无内容可插入');
    return;
  }
  emit('insert', response.value);
  ElMessage.success('已插入编辑器');
}

async function copyResponse() {
  if (!response.value) {
    ElMessage.warning('暂无可复制内容');
    return;
  }
  try {
    await navigator.clipboard.writeText(response.value);
    ElMessage.success('复制成功');
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = response.value;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    ElMessage.success('复制成功');
  }
}

function clearResponse() {
  response.value = '';
  renderedHtml.value = '';
  responseUsage.value = null;
  responseTime.value = null;
}

// ============================================================
// 监听
// ============================================================

watch(() => props.modelValue, (val) => {
  visible.value = val;
});

watch(visible, (val) => {
  emit('update:modelValue', val);
});

watch(() => props.selectedText, (newVal) => {
  if (newVal) {
    internalSelectedText.value = newVal;
  }
}, { immediate: true });

watch(response, async (newVal) => {
  if (newVal) {
    await updateRenderedHtml(newVal);
  } else {
    renderedHtml.value = '';
  }
}, { immediate: true });

// ============================================================
// 暴露组件方法
// ============================================================

defineExpose({
  clearResponse,
  executeAction,
  togglePanel,
  setResponse: async (text: string) => {
    response.value = text;
    await updateRenderedHtml(text);
  }
});
</script>

<style scoped>
/* ============================================================
   AI 侧边栏
   ============================================================ */

.ai-sidebar {
  position: fixed;
  right: 0;
  top: 0;
  height: 100vh;
  z-index: 999;
  display: flex;
  align-items: flex-start;
  pointer-events: none;
}

/* ===== 侧边栏切换按钮 ===== */
.ai-sidebar-toggle {
  pointer-events: auto;
  width: 40px;
  height: 40px;
  margin-top: calc(50vh - 20px);
  background: #409eff;
  color: #fff;
  border-radius: 8px 0 0 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: -2px 0 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  flex-shrink: 0;
  position: relative;
  z-index: 2;
}

.ai-sidebar-toggle:hover {
  background: #66b1ff;
  transform: scale(1.05);
}

.ai-sidebar-toggle .toggle-label {
  font-size: 10px;
  font-weight: 600;
  margin-top: 2px;
  letter-spacing: 1px;
}

/* ===== 侧边栏内容 ===== */
.ai-sidebar-content {
  pointer-events: none;
  width: 340px;
  height: 100vh;
  transform: translateX(100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: #ffffff;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.08);
  border-left: 1px solid #e4e7ed;
  overflow: hidden;
  flex-shrink: 0;
}

.ai-sidebar.is-open .ai-sidebar-content {
  transform: translateX(0);
  pointer-events: auto;
}

.ai-sidebar.is-open .ai-sidebar-toggle {
  border-radius: 0;
  background: #409eff;
}

/* ===== AI 面板内容 ===== */
.ai-panel {
  height: 100%;
  padding: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ===== 头部 ===== */
.ai-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.ai-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

/* ===== 选中内容提示 ===== */
.selected-info {
  margin-bottom: 10px;
  flex-shrink: 0;
}

.selected-info :deep(.el-alert) {
  padding: 6px 10px;
}

.selected-info :deep(.el-alert__title) {
  font-size: 12px;
}

.selected-preview {
  font-size: 12px;
  color: #606266;
  margin-top: 2px;
  padding: 4px 8px;
  background: rgba(64, 158, 255, 0.08);
  border-radius: 4px;
  max-height: 40px;
  overflow-y: auto;
  word-break: break-all;
  line-height: 1.4;
}

/* ===== 上下文模式 ===== */
.context-mode {
  margin-bottom: 10px;
  flex-shrink: 0;
}

.context-mode .el-radio-group {
  width: 100%;
  display: flex;
}

.context-mode .el-radio-button {
  flex: 1;
}

.context-mode .el-radio-button .el-radio-button__inner {
  width: 100%;
  text-align: center;
  font-size: 11px;
  padding: 4px 6px;
}

/* ===== 快捷操作 ===== */
.ai-actions {
  margin-bottom: 10px;
  flex-shrink: 0;
}

.ai-actions .el-button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  width: 100%;
}

.ai-actions .el-button-group .el-button {
  flex: 1;
  min-width: 40px;
  font-size: 11px;
  padding: 4px 6px;
}

/* ===== 自定义提问 ===== */
.ai-custom {
  margin-bottom: 10px;
  flex-shrink: 0;
}

.ai-custom :deep(.el-textarea__inner) {
  font-size: 12px;
  padding: 6px 10px;
  min-height: 50px;
}

.custom-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
}

.custom-actions .el-tag {
  font-size: 11px;
}

/* ===== AI 响应 ===== */
.ai-response {
  flex: 1;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 10px 12px;
  background: #f8f9fa;
  display: flex;
  flex-direction: column;
  min-height: 120px;
  overflow: hidden;
}

.response-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
  flex-shrink: 0;
}

.response-title {
  font-size: 12px;
  font-weight: 600;
  color: #303133;
}

.response-actions {
  display: flex;
  gap: 2px;
}

.response-actions .el-button {
  font-size: 14px;
  padding: 2px 6px;
}

.response-content {
  flex: 1;
  max-height: 250px;
  overflow-y: auto;
  line-height: 1.6;
  font-size: 13px;
  padding-right: 4px;
}

.response-content :deep(pre) {
  background: #f0f0f0;
  padding: 8px 10px;
  border-radius: 4px;
  overflow: auto;
  font-size: 12px;
}

.response-content :deep(code) {
  background: #f0f0f0;
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 12px;
}

.response-content :deep(pre code) {
  background: transparent;
  padding: 0;
}

.response-content :deep(blockquote) {
  border-left: 3px solid #409eff;
  padding-left: 10px;
  margin: 4px 0;
  color: #666;
  font-size: 12px;
}

.response-footer {
  flex-shrink: 0;
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid #e4e7ed;
}

.usage-info {
  font-size: 11px;
  color: #909399;
}

/* ===== 空状态 ===== */
.ai-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ai-empty :deep(.el-empty) {
  padding: 20px 0;
}

.ai-empty :deep(.el-empty__description) {
  font-size: 12px;
}

/* ============================================================
   深色模式
   ============================================================ */

.ai-sidebar.dark-mode .ai-sidebar-content {
  background: #1e1e1e;
  border-color: #404040;
}

.ai-sidebar.dark-mode .ai-title {
  color: #e0e0e0;
}

.ai-sidebar.dark-mode .ai-response {
  background: #2d2d2d;
  border-color: #404040;
}

.ai-sidebar.dark-mode .response-title {
  color: #e0e0e0;
}

.ai-sidebar.dark-mode .response-content :deep(pre) {
  background: #1a1a1a;
}

.ai-sidebar.dark-mode .response-content :deep(code) {
  background: #1a1a1a;
  color: #d4d4d4;
}

.ai-sidebar.dark-mode .response-footer {
  border-color: #404040;
}

.ai-sidebar.dark-mode .selected-preview {
  background: rgba(64, 158, 255, 0.15);
  color: #d4d4d4;
}

/* ============================================================
   响应式
   ============================================================ */

@media (max-width: 768px) {
  .ai-sidebar-content {
    width: 100%;
    max-width: 340px;
  }

  .ai-sidebar-toggle {
    width: 32px;
    height: 32px;
    margin-top: calc(50vh - 16px);
  }

  .ai-sidebar-toggle .toggle-label {
    display: none;
  }

  .ai-panel {
    padding: 12px;
  }

  .response-content {
    max-height: 150px;
  }

  .ai-actions .el-button-group .el-button {
    font-size: 10px;
    padding: 3px 4px;
  }

  .ai-actions .el-button-group .el-button .el-icon {
    margin-right: 2px;
  }
}

@media (max-width: 480px) {
  .ai-sidebar-content {
    max-width: 100%;
    width: 100%;
  }

  .ai-sidebar-toggle {
    display: none;
  }

  .ai-sidebar.is-open .ai-sidebar-content {
    transform: translateX(0);
  }
}
</style>