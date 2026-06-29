<!-- src/views/NoteList.vue - 精简版 -->
<template>
  <div class="note-list page-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h2 class="page-title">
            <el-icon><Document /></el-icon>
            笔记列表
          </h2>
          <span class="page-count">共 {{ total }} 篇笔记</span>
        </div>
        <div class="header-right">
          <el-button type="primary" :icon="Plus" @click="$router.push('/note/edit')" class="btn-primary">
            新建笔记
          </el-button>
        </div>
      </div>
    </div>

    <!-- 搜索和筛选栏 -->
    <el-card class="filter-card page-card" shadow="hover">
      <div class="filter-content">
        <div class="filter-left">
          <el-input
            v-model="query.keyword"
            placeholder="搜索标题或内容..."
            prefix-icon="Search"
            clearable
            class="search-input input-common"
            @keyup.enter="loadList"
            @clear="loadList"
          />
          <el-select 
            v-model="query.status" 
            placeholder="全部状态" 
            clearable
            class="status-select select-common"
            @change="loadList"
          >
            <el-option label="全部" value="" />
            <el-option label="已发布" value="published" />
            <el-option label="草稿" value="draft" />
            <el-option label="已收藏" value="star" />
            <el-option label="置顶" value="top" />
          </el-select>
          <el-button :icon="Refresh" @click="loadList" class="btn-default">刷新</el-button>
        </div>
      </div>
    </el-card>

    <!-- 笔记列表 -->
    <el-card class="list-card page-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><List /></el-icon>
            笔记列表
          </span>
        </div>
      </template>

      <el-table 
        :data="tableData" 
        border
        style="width: 100%"
        v-loading="loading"
        element-loading-text="加载中..."
        class="page-table"
        @row-click="handleRowClick"
      >
        <el-table-column label="标题" min-width="200" prop="title">
          <template #default="{ row }">
            <div class="title-cell">
              <span class="title-text">{{ row.title || '无标题笔记' }}</span>
              <div class="title-tags">
                <el-tag v-if="row.is_top" type="success" size="small" class="tag-success">置顶</el-tag>
                <el-tag v-if="row.is_star" type="warning" size="small" effect="plain" class="tag-warning">收藏</el-tag>
                <el-tag v-if="row.is_draft" type="info" size="small" class="tag-info">草稿</el-tag>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="分类" min-width="150" align="center">
          <template #default="{ row }">
            <div class="cate-cell" v-if="row.categoryNames?.length">
              <el-tag
                v-for="name in row.categoryNames"
                :key="name"
                size="small"
                type="primary"
                plain
                class="cate-item tag-primary"
              >
                {{ name }}
              </el-tag>
            </div>
            <span v-else class="empty-text">未分类</span>
          </template>
        </el-table-column>

        <el-table-column label="标签" min-width="150" prop="tags" align="center">
          <template #default="{ row }">
            <div class="tags-cell" v-if="row.tags?.length">
              <el-tag 
                v-for="tag in row.tags.slice(0, 3)" 
                :key="tag"
                size="small"
                type="primary"
                plain
                class="tag-item tag-primary"
              >
                #{{ tag }}
              </el-tag>
              <el-tag v-if="row.tags.length > 3" size="small" type="info" class="tag-info">
                +{{ row.tags.length - 3 }}
              </el-tag>
            </div>
            <span v-else class="empty-text">无标签</span>
          </template>
        </el-table-column>

        <el-table-column label="更新时间" width="170" prop="updated_at" align="center">
          <template #default="{ row }">
            <span>{{ formatCNTime(row.updated_at) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="240" align="center" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link class="btn-link-primary" @click.stop="edit(row.id)">编辑</el-button>
            <el-button size="small" type="success" link class="btn-link-success" @click.stop="openShare(row)">分享</el-button>
            <el-button size="small" type="danger" link class="btn-link-danger" @click.stop="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态 -->
      <div v-if="tableData.length === 0 && !loading" class="empty-state">
        <el-empty description="还没有笔记，开始写第一篇吧" :image-size="120">
          <el-button type="primary" @click="$router.push('/note/edit')" class="btn-primary">写第一篇笔记</el-button>
        </el-empty>
      </div>

      <!-- 分页 -->
      <div class="pagination-wrapper" v-if="total > 0">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          background
          layout="total, sizes, prev, pager, next, jumper"
          @change="loadList"
          @size-change="loadList"
        />
      </div>
    </el-card>

    <!-- 分享对话框 -->
    <el-dialog v-model="shareVisible" title="创建分享链接" width="480px" destroy-on-close class="dialog-common">
      <el-form :model="shareForm" label-width="80px">
        <el-form-item label="访问密码">
          <el-input 
            v-model="shareForm.password" 
            placeholder="留空则公开访问"
            show-password
            clearable
            class="input-common"
          />
        </el-form-item>
        <el-form-item label="权限">
          <el-radio-group v-model="shareForm.permission">
            <el-radio value="read">仅阅读</el-radio>
            <el-radio value="edit" disabled>可编辑（即将支持）</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="有效期">
          <el-radio-group v-model="shareForm.expireDays">
            <el-radio :label="7">7天</el-radio>
            <el-radio :label="30">30天</el-radio>
            <el-radio :label="0">永久</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="shareVisible = false">取消</el-button>
          <el-button type="primary" @click="handleCreateShare" :loading="shareLoading" class="btn-primary">
            {{ shareLoading ? '创建中...' : '创建分享' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getNoteList, deleteNote, createShare, type Note } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { formatCNTime } from '@/utils/format'
import { 
  Document, 
  Plus, 
  Refresh, 
  List
} from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(false)
const tableData = ref<Note[]>([])
const total = ref(0)
const query = ref({ 
  page: 1, 
  size: 10, 
  keyword: '',
  status: '' 
})

const shareVisible = ref(false)
const shareLoading = ref(false)
const shareForm = ref({ 
  noteId: 0, 
  password: '', 
  permission: 'read',
  expireDays: 7
})

async function loadList() {
  loading.value = true
  try {
    const params: any = {
      page: query.value.page,
      size: query.value.size,
      q: query.value.keyword
    }
    
    if (query.value.status === 'draft') params.is_draft = true
    else if (query.value.status === 'star') params.is_star = true
    else if (query.value.status === 'top') params.is_top = true
    else if (query.value.status === 'published') params.is_draft = false

    const res = await getNoteList(params)
    tableData.value = res?.data?.list || []
    total.value = res?.data?.total || 0
  } catch {
    ElMessage.error('加载笔记列表失败')
  } finally {
    loading.value = false
  }
}

function edit(id: number) {
  router.push({ path: '/note/edit', query: { id: String(id) } })
}

function handleRowClick(row: Note) {
  edit(row.id)
}

async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm('确定要移入回收站吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteNote(id)
    ElMessage.success('已移入回收站')
    loadList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败，请重试')
    }
  }
}

function openShare(row: Note) {
  shareForm.value.noteId = row.id
  shareForm.value.password = ''
  shareForm.value.permission = 'read'
  shareForm.value.expireDays = 7
  shareVisible.value = true
}

async function handleCreateShare() {
  if (!shareForm.value.noteId) {
    ElMessage.warning('请选择要分享的笔记')
    return
  }
  
  shareLoading.value = true
  try {
    const res = await createShare({
      noteId: shareForm.value.noteId,
      password: shareForm.value.password || undefined,
      permission: shareForm.value.permission,
      expireDays: shareForm.value.expireDays
    })
    
    ElMessage.success('分享创建成功！')
    
    if (res.data?.shareUrl) {
      const url = res.data.shareUrl
      try {
        await navigator.clipboard.writeText(url)
        ElMessage.success('分享链接已自动复制到剪贴板')
      } catch {
        ElMessage.info(`分享链接: ${url}`)
      }
    }
    
    shareVisible.value = false
  } catch {
    ElMessage.error('创建分享失败，请重试')
  } finally {
    shareLoading.value = false
  }
}

onMounted(loadList)
</script>

<style scoped>
.note-list {
  padding: 24px;
}

/* ===== 页面头部 ===== */
.page-header {
  margin-bottom: 20px;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px 16px;
  width: 100%;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;
}

.header-left .page-title {
  font-size: 22px;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  white-space: nowrap;
}

.header-left .page-title .el-icon {
  color: var(--theme-color);
}

.header-left .page-count {
  font-size: 14px;
  color: var(--text-secondary);
  white-space: nowrap;
}

/* 关键：桌面端按钮在右侧，不被压缩 */
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.header-right .el-button {
  white-space: nowrap;
}

.filter-card {
  margin-bottom: 20px;
}

.filter-card :deep(.el-card__body) {
  padding: 16px 20px;
}

.filter-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  min-width: 200px;
  max-width: 400px;
}

.status-select {
  width: 140px;
}

.list-card :deep(.el-card__header) {
  padding: 14px 20px;
  border-bottom: 1px solid var(--border-color) !important;
}

.list-card :deep(.el-card__body) {
  padding: 0;
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
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.card-title .el-icon {
  color: var(--theme-color);
}

.title-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.title-text {
  font-size: 14px;
  color: var(--text-primary);
}

.title-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.title-tags :deep(.el-tag) {
  font-size: 12px;
  height: 20px;
  line-height: 18px;
}

.tags-cell {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  justify-content: center;
}

.tag-item {
  font-size: 12px;
  height: 22px;
  line-height: 20px;
}

.empty-text {
  color: var(--text-placeholder);
  font-size: 13px;
}

.cate-cell {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  justify-content: center;
}

.cate-item {
  font-size: 12px;
}

.pagination-wrapper {
  padding: 16px 20px;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
}

/* ===== 暗色主题标签适配（由全局样式提供，这里保留覆盖） ===== */
.dark-theme .title-tags :deep(.el-tag--success) {
  background-color: rgba(103, 194, 58, 0.15) !important;
  border-color: rgba(103, 194, 58, 0.3) !important;
  color: #67c23a !important;
}

.dark-theme .title-tags :deep(.el-tag--warning) {
  background-color: rgba(230, 162, 60, 0.15) !important;
  border-color: rgba(230, 162, 60, 0.3) !important;
  color: #e6a23c !important;
}

.dark-theme .title-tags :deep(.el-tag--info) {
  background-color: rgba(144, 147, 153, 0.15) !important;
  border-color: rgba(144, 147, 153, 0.3) !important;
  color: #c0c4cc !important;
}

.dark-theme .cate-item,
.dark-theme .tag-item {
  background-color: rgba(64, 158, 255, 0.1) !important;
  border-color: rgba(64, 158, 255, 0.2) !important;
  color: #66b1ff !important;
}


@media (max-width: 768px) {
   .note-list {
    padding: 12px;
  }

  .header-content {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .header-left {
    flex-wrap: wrap;
  }

  .header-left .page-title {
    font-size: 18px;
  }

  /* 移动端：按钮占满宽度 */
  .header-right {
    width: 100%;
  }

  .header-right .el-button {
    width: 100%;
    justify-content: center;
  }

  .filter-content {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-left {
    flex-direction: column;
    align-items: stretch;
  }

  .search-input {
    min-width: auto;
    max-width: none;
  }

  .status-select {
    width: 100%;
  }

  .pagination-wrapper {
    justify-content: center;
    padding: 12px 16px;
  }
  
}
@media (max-width: 480px) {
  .note-list {
    padding: 8px;
  }

  .header-left .page-title {
    font-size: 16px;
  }

  .header-left .page-count {
    font-size: 12px;
  }

  .list-card :deep(.el-card__header) {
    padding: 10px 14px;
  }

  .pagination-wrapper {
    padding: 10px 12px;
  }

  :deep(.el-table .cell) {
    padding: 0 6px;
  }

  :deep(.el-table .el-button--small) {
    padding: 4px 6px;
    font-size: 12px;
  }

  .dialog-common :deep(.el-dialog) {
    width: 92% !important;
    margin: 16px auto !important;
  }
}
</style>