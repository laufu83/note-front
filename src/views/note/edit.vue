<!-- src/views/NoteEdit.vue - 修复 Vditor 上传 handler 类型 -->

<template>
  <div class="note-edit">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button :icon="ArrowLeft" @click="router.push('/note/list')">返回</el-button>
        <h2 class="page-title">{{ isEdit ? '编辑笔记' : '新建笔记' }}</h2>
      </div>
      <div class="header-right">
        <el-button @click="handleSave" type="primary" size="large" :loading="saving">
          {{ saving ? '保存中...' : '保存笔记' }}
        </el-button>
      </div>
    </div>

    <!-- 笔记表单 -->
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

    <!-- 编辑器 -->
    <el-card class="editor-card" shadow="hover">
      <div id="vditor"></div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Vditor from 'vditor'
import 'vditor/dist/index.css'
import { getCategoryList } from '@/api/category'
import { getTagList } from '@/api/tag'
import { getNoteDetail, createNote, updateNote } from '@/api'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

const noteId = ref(Number(route.query.id) || 0)
const isEdit = computed(() => noteId.value > 0)
const saving = ref(false)
let vditor: Vditor | null = null

// 表单数据
const form = ref({
  title: '',
  content: '',
  properties: [] as string[],
  categoryIds: [] as number[],
  tagNames: [] as string[]
})

// 缓存编辑原始分类、标签，用于判断是否修改
const originCategoryIds = ref<number[]>([])
const originTagNames = ref<string[]>([])

const categoryList = ref<any[]>([])
const tagList = ref<any[]>([])

// ===== 加载基础下拉数据 =====
async function loadBase() {
  try {
    const [cateRes, tagRes] = await Promise.all([
      getCategoryList(),
      getTagList()
    ])
    categoryList.value = Array.isArray(cateRes?.data) ? cateRes.data : []
    tagList.value = Array.isArray(tagRes?.data) ? tagRes.data : []
  } catch (error) {
    ElMessage.error('加载分类、标签数据失败')
  }
}

// ===== 编辑回显并缓存原始数据 =====
async function loadDetail() {
  if (!noteId.value) return
  try {
    const res = await getNoteDetail(noteId.value)
    const data = res?.data
    if (!data) {
      ElMessage.error('笔记数据为空')
      return
    }
    
    form.value.title = data.title || ''
    form.value.categoryIds = data.categoryIds || []
    form.value.tagNames = data.tagNames || []

    // 缓存原始数组，用于提交对比
    originCategoryIds.value = [...form.value.categoryIds]
    originTagNames.value = [...form.value.tagNames]

    form.value.properties = []
    if (data.is_top) form.value.properties.push('is_top')
    if (data.is_star) form.value.properties.push('is_star')
    if (data.is_draft) form.value.properties.push('is_draft')

    if (vditor) {
      vditor.setValue(data.content || '')
    }
  } catch (error) {
    ElMessage.error('加载笔记详情失败')
  }
}

// ===== 编辑器初始化 =====
function initEditor() {
  // 获取 accessToken
  const accessToken = localStorage.getItem('accessToken') || ''
  
  vditor = new Vditor('vditor', {
    height: 500,
    mode: 'sv',
    cache: { enable: false },
    placeholder: '开始记录你的想法...',
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
      // 修复 handler 类型：返回 Promise<string> 或 string
      handler: (files: File[]): Promise<string> => {
        // 由于 Vditor 会通过 url 自动上传，这里不需要额外处理
        // 但必须返回一个 Promise<string> 以符合类型要求
        return Promise.resolve('')
      }
    },
    after: () => {
      loadDetail()
    }
  })
}

// 数组简单对比工具
function isArrayEqual(a: any[], b: any[]) {
  return JSON.stringify(a) === JSON.stringify(b)
}

// ===== 保存提交 =====
async function handleSave() {
  const content = vditor?.getValue() || ''
  const title = form.value.title.trim()

  if (!title) {
    ElMessage.warning('请输入笔记标题')
    return
  }

  if (!content) {
    ElMessage.warning('请输入笔记内容')
    return
  }

  saving.value = true
  try {
    if (isEdit.value) {
      // 编辑：构建 UpdateNoteParams 类型的对象
      const payload: {
        title: string
        content: string
        is_top?: boolean
        is_star?: boolean
        is_draft?: boolean
        categoryIds?: number[]
        tagNames?: string[]
      } = {
        title,
        content,
        is_top: form.value.properties.includes('is_top'),
        is_star: form.value.properties.includes('is_star'),
        is_draft: form.value.properties.includes('is_draft')
      }

      // 仅修改过才携带分类、标签字段，避免误清空
      if (!isArrayEqual(form.value.categoryIds, originCategoryIds.value)) {
        payload.categoryIds = form.value.categoryIds
      }
      if (!isArrayEqual(form.value.tagNames, originTagNames.value)) {
        payload.tagNames = form.value.tagNames
      }
      await updateNote(noteId.value, payload)
    } else {
      // 新建：构建 CreateNoteParams 类型的对象
      const payload: {
        title: string
        content: string
        is_top: boolean
        is_star: boolean
        is_draft: boolean
        categoryIds: number[]
        tagNames: string[]
      } = {
        title,
        content,
        is_top: form.value.properties.includes('is_top'),
        is_star: form.value.properties.includes('is_star'),
        is_draft: form.value.properties.includes('is_draft'),
        categoryIds: form.value.categoryIds,
        tagNames: form.value.tagNames
      }
      await createNote(payload)
    }

    ElMessage.success('保存成功')
    router.push('/note/list')
  } catch (error) {
    // 全局请求拦截器统一处理错误提示
  } finally {
    saving.value = false
  }
}

// ===== 生命周期 =====
onMounted(async () => {
  await loadBase()
  initEditor()
})
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
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
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

/* 覆盖 Vditor 默认样式 */
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

  .header-right .el-button {
    width: 100%;
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
}
</style>