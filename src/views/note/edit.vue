<template>
  <div class="note-edit page-container" :class="{ 'dark-mode': isDarkMode }">
    <!-- ===== 页面头部 ===== -->
    <div class="page-header">
      <div class="header-left">
        <el-button :icon="ArrowLeft" @click="router.push('/note/list')">返回</el-button>
        <h2 class="page-title">{{ isEdit ? '编辑笔记' : '新建笔记' }}</h2>
        <el-tag v-if="isSaving" type="warning" size="small" class="tag-warning">保存中...</el-tag>
        <el-tag v-else-if="isSaved" type="success" size="small" class="tag-success">已保存</el-tag>
        <span class="word-count">{{ wordCount }} 字 · {{ readTime }} 分钟阅读</span>
      </div>
      <div class="header-right">
        <el-button-group>
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
        <el-button @click="handleSave" type="primary" size="large" :loading="saving" class="btn-primary">
          {{ saving ? '保存中...' : '保存笔记' }}
        </el-button>
      </div>
    </div>

    <!-- ===== 笔记表单 ===== -->
    <el-card class="form-card page-card" shadow="hover">
      <el-form :model="form" label-width="100px">
        <el-form-item label="标题" required>
          <el-input
            v-model="form.title"
            placeholder="请输入笔记标题"
            size="large"
            maxlength="100"
            show-word-limit
            class="input-common"
          />
        </el-form-item>

        <!-- ===== 加密控制 ===== -->
        <el-form-item label="加密笔记">
          <div class="encrypt-control">
            <el-switch
              v-model="form.isEncrypted"
              @change="handleEncryptToggle"
              size="default"
              active-text="已加密"
              inactive-text="未加密"
              :class="{ 'is-encrypted': form.isEncrypted }"    
            />
            <el-tooltip
              content="开启后，笔记内容将在服务端加密存储，查看时需要输入密码"
              placement="top"
            >
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
            <span v-if="isEdit && originIsEncrypted" class="text-secondary ml-2">
              关闭加密后笔记正文将永久明文存储，请在下方输入当前访问密码完成身份校验
            </span>
          </div>
        </el-form-item>

        <!-- 加密密码设置 -->
        <el-form-item 
          v-if="showPasswordInput" 
          label="访问密码" 
          required
          :error="passwordError"
        >
          <div class="password-input-group">
            <el-input
              v-model="form.password"
              type="password"
              show-password
              :placeholder="form.isEncrypted 
                ? '请设置访问密码（至少6位，包含字母+数字）'
                : '关闭加密请输入当前笔记原访问密码'"
              class="input-common"
              @input="validatePassword"
            />
            <!-- 仅编辑原有加密笔记才显示修改密码 -->
            <el-button 
              v-if="isEdit && originIsEncrypted && form.isEncrypted"
              type="primary" 
              link 
              @click="showChangePassword = !showChangePassword"
            >
              {{ showChangePassword ? '取消修改密码' : '修改密码' }}
            </el-button>
          </div>
          <div class="form-tip">
            <el-icon><InfoFilled /></el-icon>
            <span v-if="form.isEncrypted">密码用于服务端加密/解密笔记内容，请妥善保管。忘记密码将无法查看笔记内容。</span>
            <span v-else>关闭加密需要验证原密码，验证通过后笔记正文将转为明文永久存储。</span>
          </div>
        </el-form-item>

        <!-- 修改密码：仅原有加密笔记编辑时可用 -->
        <el-form-item 
          v-if="showChangePassword && form.isEncrypted && isEdit && originIsEncrypted" 
          label="新密码"
        >
          <el-input
            v-model="form.newPassword"
            type="password"
            show-password
            placeholder="请输入新密码（至少6位，包含字母+数字）"
            class="input-common"
            @input="validateNewPassword"
          />
          <div class="form-tip">留空表示不修改密码</div>
        </el-form-item>

        <!-- 加密状态提示 -->
        <el-alert
          v-if="form.isEncrypted"
          type="warning"
          :closable="false"
          show-icon
          class="encrypt-alert"
        >
          <template #title>
            <span>🔒 此笔记已开启加密保护。保存后内容将在服务端加密存储，需密码才能查看。</span>
          </template>
        </el-alert>

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
            class="select-common"
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
            class="select-common"
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
    <el-card class="editor-card page-card" shadow="hover">
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
import { ref, onMounted, onBeforeUnmount, computed, nextTick, watch } from 'vue';
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
  MagicStick,
  Document,
  Edit,
  ChatDotRound,
  QuestionFilled,
  InfoFilled
} from '@element-plus/icons-vue';

// ===== 导入通用笔记API =====
import {
  getNoteDetail,
  createNote,
  updateNote
} from '@/api/note';
import type { CreateNoteParams, UpdateNoteParams } from '@/api/note';
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
import EncryptUtil from '@/utils/encryptUtil';

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
const showPasswordInput = computed(() => {
  return form.value.isEncrypted || (isEdit.value && originIsEncrypted.value);
});

const showAIPanel = ref(false);
const showTemplates = ref(false);
const showHistory = ref(false);
const editorContent = ref('');
const showChangePassword = ref(false);
const passwordError = ref('');

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

// 缓存编辑原始数据
const originCategoryIds = ref<number[]>([]);
const originTagNames = ref<string[]>([]);
const originIsEncrypted = ref(false);

// 解密失败重试次数
const decryptRetryCount = ref(0);

// ============================================================
// 表单数据
// ============================================================

const form = ref({
  title: '',
  content: '',
  properties: [] as string[],
  categoryIds: [] as number[],
  tagNames: [] as string[],
  isEncrypted: false,
  password: '',
  newPassword: ''
});

const categoryList = ref<any[]>([]);
const tagList = ref<any[]>([]);

// ============================================================
// 使用 Composables
// ============================================================

const { isDarkMode } = useDarkMode();
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
// ⭐ 监听暗色模式变化，更新 Vditor 主题
// ============================================================
watch(isDarkMode, (newVal) => {
  if (vditor) {
    // 更新 Vditor 主题
    const theme = newVal ? 'dark' : 'classic';
    vditor.setTheme(theme);
    
    // 更新代码高亮样式
    const hljsStyle = newVal ? 'dark' : 'github';
    vditor.setTheme(theme, hljsStyle);
    
    // 更新编辑器容器样式
    const editorEl = document.querySelector('#vditor');
    if (editorEl) {
      if (newVal) {
        editorEl.classList.add('dark-theme');
      } else {
        editorEl.classList.remove('dark-theme');
      }
    }
  }
}, { immediate: true });

// ============================================================
// ⭐ Element Plus 弹窗暗色模式适配
// ============================================================
function getMessageBoxConfig(): any {
  return {
    customClass: isDarkMode.value ? 'dark-message-box' : '',
    customStyle: isDarkMode.value ? {
      backgroundColor: '#1a1a2e',
      color: '#e0e0e0'
    } : {}
  };
}

// 重写 ElMessageBox 的调用，注入暗色模式配置
const showConfirm = (message: string, title: string, options?: any) => {
  return ElMessageBox.confirm(message, title, {
    ...options,
    ...getMessageBoxConfig(),
    customClass: `${options?.customClass || ''} ${isDarkMode.value ? 'dark-message-box' : ''}`.trim()
  });
};

const showPrompt = (message: string, title: string, options?: any) => {
  return ElMessageBox.prompt(message, title, {
    ...options,
    ...getMessageBoxConfig(),
    customClass: `${options?.customClass || ''} ${isDarkMode.value ? 'dark-message-box' : ''}`.trim()
  });
};

// ============================================================
// 密码验证（前端仅做格式校验，后端做哈希验证）
// ============================================================

function validatePassword() {
  if (!form.value.password) {
    passwordError.value = '';
    return;
  }
  const result = EncryptUtil.validatePassword(form.value.password);
  if (!result.isValid) {
    passwordError.value = result.message || '';
  } else {
    passwordError.value = '';
  }
}

function validateNewPassword() {
  if (!form.value.newPassword) {
    passwordError.value = '';
    return;
  }
  const result = EncryptUtil.validatePassword(form.value.newPassword);
  if (!result.isValid) {
    passwordError.value = result.message || '';
  } else {
    passwordError.value = '';
  }
}

// ============================================================
// 加密控制
// ============================================================

function handleEncryptToggle(value: boolean) {
  if (value) {
    ElMessage.info('请在下方输入框设置笔记访问密码，密码必须6位以上且包含字母+数字');
    return;
  }

  if (!originIsEncrypted.value) {
    form.value.password = '';
    form.value.newPassword = '';
    showChangePassword.value = false;
    passwordError.value = '';
    ElMessage.info('已关闭笔记加密');
    return;
  }

  showConfirm(
    '⚠️ 关闭加密后，笔记正文将永久明文存储，历史加密版本仍保留密文，无法一键恢复加密保护，确定要关闭吗？',
    '确认取消笔记加密',
    {
      confirmButtonText: '确认关闭加密',
      cancelButtonText: '保留加密',
      type: 'warning'
    }
  ).then(() => {
    if (!form.value.password) {
      form.value.isEncrypted = true;
      ElMessage.warning('关闭加密必须填写当前笔记访问密码，用于解密校验');
      return;
    }
    showChangePassword.value = false;
    form.value.newPassword = '';
    passwordError.value = '';
    ElMessage.success('已确认关闭加密，保存后笔记将转为明文');
  }).catch(() => {
    form.value.isEncrypted = true;
  });
}

// ============================================================
// 解密笔记
// ============================================================

async function decryptNoteWithPassword(password: string): Promise<boolean> {
  try {
    const res = await getNoteDetail(noteId.value, password);
    if (res.data) {
      const data = res.data;
      if (vditor) {
        vditor.setValue(data.content || '');
        updateStats();
      }
      form.value.title = data.title || '';
      form.value.categoryIds = data.categoryIds || [];
      form.value.tagNames = data.tagNames || [];
      form.value.password = password;
      decryptRetryCount.value = 0;
      ElMessage.success('解密成功');
      return true;
    }
    return false;
  } catch (error: any) {
    console.error('解密失败:', error);
    throw new Error(error?.message || '解密失败，请检查密码是否正确');
  }
}

async function promptForPassword() {
  try {
    const { value: password } = await showPrompt(
      '🔒 此笔记已加密，请输入访问密码查看内容',
      '笔记解密',
      {
        confirmButtonText: '解密查看',
        cancelButtonText: '取消',
        inputType: 'password',
        inputPlaceholder: '请输入访问密码',
       inputValidator: (val: string) => {
          const check = EncryptUtil.validatePassword(val);
          if (!check.isValid) return check.message;
          return true;
        }
      }
    );

    await decryptNoteWithPassword(password);
  } catch (error: any) {
    if (error === 'cancel') {
      if (vditor) {
        vditor.setValue('🔒 此笔记已加密，请点击"解密查看"按钮输入密码查看内容');
      }
      return;
    }
    decryptRetryCount.value++;
    if (decryptRetryCount.value < 3) {
      ElMessage.error('密码错误，请重新输入');
      await promptForPassword();
    } else {
      ElMessage.error('多次解密失败，请刷新页面后重试');
      decryptRetryCount.value = 0;
      if (vditor) {
        vditor.setValue('🔒 解密失败，请刷新页面后重试');
      }
    }
  }
}

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
  if (selectionTimer) clearTimeout(selectionTimer);
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
  if (toolbar && !toolbar.contains(e.target as Node) && editor && !editor.contains(e.target as Node)) {
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
    const [cateRes, tagRes] = await Promise.all([getCategoryList(), getTagList()]);
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
    form.value.isEncrypted = data.is_encrypted || false;

    originCategoryIds.value = [...form.value.categoryIds];
    originTagNames.value = [...form.value.tagNames];
    originIsEncrypted.value = form.value.isEncrypted;

    form.value.properties = [];
    if (data.is_top) form.value.properties.push('is_top');
    if (data.is_star) form.value.properties.push('is_star');
    if (data.is_draft) form.value.properties.push('is_draft');

    if (data.is_encrypted) {
      const tempPassword = sessionStorage.getItem(`note_${noteId.value}_password`);
      if (tempPassword) {
        form.value.password = tempPassword;
        sessionStorage.removeItem(`note_${noteId.value}_password`);
        try {
          await decryptNoteWithPassword(tempPassword);
          return;
        } catch (error) {
          console.error('使用临时密码解密失败:', error);
        }
      }
      await promptForPassword();
    } else {
      if (vditor && data.content !== undefined) {
        vditor.setValue(data.content || '');
        await nextTick();
        updateStats();
      }
    }
  } catch (error) {
    console.error('加载笔记详情失败:', error);
    ElMessage.error('加载笔记详情失败');
  }
}

// ============================================================
// 编辑器初始化
// ============================================================

function initEditor() {
  const accessToken = localStorage.getItem('accessToken') || '';
  const theme = isDarkMode.value ? 'dark' : 'classic';
  const hljsStyle = isDarkMode.value ? 'dark' : 'github';
  
  vditor = new Vditor('vditor', {
    height: 500,
    mode: 'sv',
    cache: { enable: false },
    placeholder: '开始记录你的想法...',
    theme: theme,
    preview: {
      markdown: { toc: true, mark: true },
      hljs: { lineNumber: true, style: hljsStyle },
      actions: [
        'desktop', 'tablet', 'mobile',
        {
          tip: '阅读模式',
          icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16"><path fill="none" d="M0 0h24v24H0z"/><path d="M12 2a10 10 0 0 1 10 10 10 10 0 0 1-10 10A10 10 0 0 1 2 12 10 10 0 0 1 12 2zm0 2a8 8 0 0 0-8 8 8 8 0 0 0 8 8 8 8 0 0 0 8-8 8 8 0 0 0-8-8zm-1 4h2v6h-2V8zm0 8h2v2h-2v-2z" fill="currentColor"/></svg>',
          handler: () => toggleReadMode()
        } as any
      ]
    },
    toolbar: [
      'emoji', 'headings', 'bold', 'italic', 'strike', '|',
      'list', 'ordered-list', 'check', '|',
      'quote', 'line', 'code', 'inline-code', '|',
      'upload', 'link', 'table', '|',
      'undo', 'redo', '|', 'outline', 'preview', 'fullscreen'
    ],
    upload: {
      url: '/api/file/upload',
      headers: { Authorization: `Bearer ${accessToken}` },
      accept: 'image/*',
      max: 20 * 1024 * 1024,
      handler: () => Promise.resolve('')
    },
    after: () => {
      const draft = restoreDraft();
      if (draft) {
        const draftData = draft as any;
        if (draftData.content) {
          vditor?.setValue(draftData.content);
          if (draftData.title) form.value.title = draftData.title;
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
  if (autoSaveTimer) clearInterval(autoSaveTimer);
  autoSaveTimer = window.setInterval(() => {
    if (vditor && form.value.title) {
      autoSave({ title: form.value.title, content: vditor.getValue() });
      isSaving.value = true;
      setTimeout(() => isSaving.value = false, 500);
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
// 阅读模式、模板、导出、AI、历史版本
// ============================================================

const isReadMode = ref(false);

function toggleReadMode() {
  isReadMode.value = !isReadMode.value;
  const editor = document.querySelector('#vditor');
  if (editor) editor.classList.toggle('read-mode');
  ElMessage.success(isReadMode.value ? '进入阅读模式' : '退出阅读模式');
}

function applyTemplate(template: any) {
  form.value.title = template.title;
  vditor?.setValue(template.content);
  showTemplates.value = false;
  ElMessage.success(`已应用模板: ${template.name}`);
}

async function handleExport(command: string) {
  const content = vditor?.getValue() || '';
  const title = form.value.title || '未命名笔记';
  if (form.value.isEncrypted) {
    try {
      await showConfirm(
        '⚠️ 此笔记已加密，导出的是解密后的内容，请确认是否继续？',
        '导出确认',
        {
          confirmButtonText: '继续导出',
          cancelButtonText: '取消',
          type: 'warning'
        }
      );
    } catch {
      return;
    }
  }
  try {
    await exportNote(content, title, command as any);
    ElMessage.success(`导出成功: ${title}.${command}`);
  } catch (error) {
    ElMessage.error(`导出失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

function insertAIContent(content: string) {
  const current = vditor?.getValue() || '';
  vditor?.setValue(current + '\n\n' + content);
  ElMessage.success('AI 内容已插入');
}

async function restoreVersion(version: any) {
  try {
    await showConfirm(
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
    if (error !== 'cancel') console.error('恢复失败:', error);
  }
}

// ============================================================
// 保存逻辑
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
  if (content.trim().length === 0) {
    ElMessage.warning('请输入笔记正文内容');
    return;
  }

  if (form.value.isEncrypted) {
    if (!form.value.password) {
      ElMessage.warning('开启笔记加密必须设置访问密码');
      return;
    }
    const check = EncryptUtil.validatePassword(form.value.password);
    if (!check.isValid) {
      ElMessage.warning(check.message || '密码格式不合法');
      return;
    }
    if (form.value.newPassword?.trim()) {
      const newCheck = EncryptUtil.validatePassword(form.value.newPassword);
      if (!newCheck.isValid) {
        ElMessage.warning(newCheck.message);
        return;
      }
    }
  }

  if (!form.value.isEncrypted && originIsEncrypted.value) {
    if (!form.value.password) {
      ElMessage.warning('关闭加密必须填写当前笔记原访问密码');
      return;
    }
  }

  saving.value = true;
  try {
    const baseParams = {
      title,
      content,
      is_top: form.value.properties.includes('is_top'),
      is_star: form.value.properties.includes('is_star'),
      is_draft: form.value.properties.includes('is_draft'),
      categoryIds: form.value.categoryIds,
      tagNames: form.value.tagNames,
      is_encrypted: form.value.isEncrypted,
      note_password: form.value.password || undefined,
      new_password: (form.value.isEncrypted && form.value.newPassword?.trim()) 
        ? form.value.newPassword 
        : undefined
    };

    if (isEdit.value) {
      const updatePayload: UpdateNoteParams = { ...baseParams };
      
      if (isArrayEqual(form.value.categoryIds, originCategoryIds.value)) {
        delete updatePayload.categoryIds;
      }
      if (isArrayEqual(form.value.tagNames, originTagNames.value)) {
        delete updatePayload.tagNames;
      }
      
      if (originIsEncrypted.value && !form.value.newPassword?.trim()) {
        delete updatePayload.new_password;
      }
      
      if (originIsEncrypted.value && !form.value.isEncrypted) {
        updatePayload.note_password = form.value.password;
      }
      
      if (!originIsEncrypted.value && form.value.isEncrypted) {
        updatePayload.note_password = form.value.password;
      }

      await updateNote(noteId.value, updatePayload);
    } else {
      await createNote(baseParams);
    }

    isSaved.value = true;
    clearDraft();
    ElMessage.success('保存成功');
    router.push('/note/list');
  } catch (error: any) {
    console.error('保存失败:', error);
    ElMessage.error(error?.message || '保存失败，请重试');
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
  if (selectionTimer) clearTimeout(selectionTimer);
  stopAutoSave();
  if (vditor && form.value.title) {
    autoSave({ title: form.value.title, content: vditor.getValue() });
  }
  if (vditor) {
    try {
      vditor.destroy();
    } catch (e) {
      console.warn('编辑器销毁失败', e);
    }
    vditor = null;
  }
});
</script>

<style scoped>
/* ============================================================
   NoteEdit 专用样式
   ============================================================ */

.note-edit {
  padding: 24px;
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
  color: var(--text-primary);
  margin: 0;
  transition: color var(--transition-duration);
}

.word-count {
  font-size: 13px;
  color: var(--text-secondary);
  white-space: nowrap;
  transition: color var(--transition-duration);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* ===== 加密控制 ===== */
.encrypt-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.encrypt-control .help-icon {
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 18px;
  transition: color var(--transition-duration);
}

.encrypt-control .help-icon:hover {
  color: var(--theme-color);
}

:deep(.el-switch.is-encrypted .el-switch__core) {
  background: #f56c6c !important;
  border-color: #f56c6c !important;
}

.password-input-group {
  display: flex;
  gap: 12px;
  align-items: center;
  width: 100%;
}

.password-input-group .input-common {
  flex: 1;
}

.form-tip {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.form-tip .el-icon {
  font-size: 14px;
}

.encrypt-alert {
  margin: 8px 0 16px 0;
}

/* ===== 卡片 ===== */
.form-card {
  margin-bottom: 20px;
}

.form-card :deep(.el-card__body) {
  padding: 20px 24px;
}

.editor-card :deep(.el-card__body) {
  padding: 0;
}

/* ============================================================
   Vditor 暗色模式适配
   ============================================================ */
#vditor {
  border-radius: var(--radius-md);
  overflow: hidden;
}

:deep(.vditor) {
  border: none !important;
  border-radius: var(--radius-md);
  background: var(--card-bg) !important;
  transition: background var(--transition-duration), border-color var(--transition-duration);
}

:deep(.vditor .vditor-toolbar) {
  border-bottom: 1px solid var(--border-color) !important;
  background: var(--bg-gray) !important;
  padding: 8px 12px;
  transition: background var(--transition-duration), border-color var(--transition-duration);
}

:deep(.vditor .vditor-toolbar .vditor-toolbar__item) {
  color: var(--text-regular) !important;
}

:deep(.vditor .vditor-toolbar .vditor-toolbar__item:hover) {
  color: var(--theme-color) !important;
  background: var(--btn-hover-bg) !important;
}

:deep(.vditor .vditor-reset) {
  min-height: 400px;
  color: var(--text-primary) !important;
  background: var(--card-bg) !important;
  transition: color var(--transition-duration), background var(--transition-duration);
}

:deep(.vditor .vditor-reset h1),
:deep(.vditor .vditor-reset h2),
:deep(.vditor .vditor-reset h3),
:deep(.vditor .vditor-reset h4),
:deep(.vditor .vditor-reset h5),
:deep(.vditor .vditor-reset h6) {
  color: var(--text-primary) !important;
}

:deep(.vditor .vditor-reset p),
:deep(.vditor .vditor-reset li),
:deep(.vditor .vditor-reset blockquote) {
  color: var(--text-regular) !important;
}

:deep(.vditor .vditor-reset code) {
  background: var(--bg-gray) !important;
  color: var(--text-primary) !important;
}

:deep(.vditor .vditor-reset pre) {
  background: var(--bg-dark) !important;
}

:deep(.vditor .vditor-reset pre code) {
  color: var(--text-regular) !important;
}

:deep(.vditor .vditor-reset blockquote) {
  border-left-color: var(--theme-color) !important;
  background: var(--bg-gray) !important;
}

:deep(.vditor .vditor-reset table) {
  border-color: var(--border-color) !important;
}

:deep(.vditor .vditor-reset table th),
:deep(.vditor .vditor-reset table td) {
  border-color: var(--border-color) !important;
}

:deep(.vditor .vditor-reset table th) {
  background: var(--bg-gray) !important;
}

:deep(.vditor .vditor-outline) {
  background: var(--card-bg) !important;
  border-color: var(--border-color) !important;
}

:deep(.vditor .vditor-outline li) {
  color: var(--text-regular) !important;
}

:deep(.vditor .vditor-outline li:hover) {
  color: var(--theme-color) !important;
  background: var(--btn-hover-bg) !important;
}

/* ============================================================
   Vditor 暗色主题额外修复
   ============================================================ */
.dark-mode :deep(.vditor) {
  background: var(--card-bg) !important;
}

.dark-mode :deep(.vditor .vditor-reset) {
  color: var(--text-primary) !important;
  background: var(--card-bg) !important;
}

.dark-mode :deep(.vditor .vditor-toolbar) {
  background: var(--bg-gray) !important;
  border-color: var(--border-color) !important;
}

.dark-mode :deep(.vditor .vditor-toolbar .vditor-toolbar__item) {
  color: var(--text-secondary) !important;
}

.dark-mode :deep(.vditor .vditor-toolbar .vditor-toolbar__item:hover) {
  color: var(--theme-color) !important;
  background: var(--btn-hover-bg) !important;
}

.dark-mode :deep(.vditor .vditor-outline) {
  background: var(--card-bg) !important;
  border-color: var(--border-color) !important;
}

.dark-mode :deep(.vditor .vditor-outline li) {
  color: var(--text-secondary) !important;
}

.dark-mode :deep(.vditor .vditor-outline li:hover) {
  color: var(--theme-color) !important;
  background: var(--btn-hover-bg) !important;
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

/* ===== 选中文本悬浮工具栏 ===== */
.selection-toolbar {
  position: absolute;
  z-index: 1000;
  background: var(--card-bg);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  padding: 4px;
  display: none;
  align-items: center;
  gap: 2px;
  border: 1px solid var(--border-color);
  animation: fadeIn 0.2s ease;
  transition: background var(--transition-duration), border-color var(--transition-duration);
}

.selection-toolbar .el-button {
  border: none;
  font-size: 12px;
  padding: 6px 12px;
  color: var(--text-regular);
  transition: color var(--transition-duration), background var(--transition-duration);
}

.selection-toolbar .el-button:hover {
  background: var(--btn-hover-bg);
  color: var(--theme-color);
}

.selection-toolbar .el-button .el-icon {
  margin-right: 2px;
}

.dark-mode .selection-toolbar {
  background: var(--card-bg);
  border-color: var(--border-color);
}

.dark-mode .selection-toolbar .el-button {
  color: var(--text-regular);
}

.dark-mode .selection-toolbar .el-button:hover {
  background: var(--btn-hover-bg);
  color: var(--theme-color);
}

/* ============================================================
   Element Plus 弹窗暗色模式适配（全局样式）
   ============================================================ */
:global(.dark-message-box .el-message-box) {
  background-color: #1a1a2e !important;
  border-color: #2a2a4a !important;
}

:global(.dark-message-box .el-message-box__title) {
  color: #e0e0e0 !important;
}

:global(.dark-message-box .el-message-box__message) {
  color: #b0b0b0 !important;
}

:global(.dark-message-box .el-message-box__content) {
  color: #b0b0b0 !important;
}

:global(.dark-message-box .el-message-box__input input) {
  background-color: #2a2a4a !important;
  border-color: #3a3a5a !important;
  color: #e0e0e0 !important;
}

:global(.dark-message-box .el-message-box__input input:focus) {
  border-color: var(--theme-color) !important;
}

:global(.dark-message-box .el-message-box__btns .el-button) {
  color: #b0b0b0 !important;
}

:global(.dark-message-box .el-message-box__btns .el-button:hover) {
  color: #e0e0e0 !important;
  background: var(--btn-hover-bg) !important;
}

:global(.dark-message-box .el-message-box__btns .el-button--primary) {
  background: var(--theme-color) !important;
  color: #fff !important;
}

:global(.dark-message-box .el-message-box__btns .el-button--primary:hover) {
  opacity: 0.85 !important;
}

:global(.dark-message-box .el-message-box__close) {
  color: #b0b0b0 !important;
}

:global(.dark-message-box .el-message-box__close:hover) {
  color: #e0e0e0 !important;
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

/* ============================================================
   响应式
   ============================================================ */
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

  .header-right .el-button-group {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
  }

  .header-right .el-button-group .el-button {
    flex: 1;
    min-width: 60px;
  }

  .password-input-group {
    flex-direction: column;
    align-items: stretch;
  }

  .form-card :deep(.el-card__body) {
    padding: 16px;
  }

  .word-count {
    font-size: 12px;
    width: 100%;
  }

  :deep(.read-mode .vditor-reset) {
    padding: 20px;
    font-size: 15px;
  }

  .selection-toolbar .el-button {
    font-size: 10px;
    padding: 4px 8px;
  }
}

@media (max-width: 480px) {
  .note-edit {
    padding: 8px;
  }

  .page-title {
    font-size: 16px;
  }

  .form-card :deep(.el-card__body) {
    padding: 12px;
  }

  .selection-toolbar .el-button {
    font-size: 9px;
    padding: 3px 6px;
  }
}
</style>