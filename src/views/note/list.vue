<!-- src/views/NoteList.vue - 使用分离的 API -->

<template>
  <div class="note-list">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h2 class="page-title">
            <el-icon><Document /></el-icon>
            笔记列表
          </h2>
          <span class="note-count">共 {{ total }} 篇笔记</span>
        </div>
        <div class="header-right">
          <el-button type="primary" :icon="Plus" @click="$router.push('/note/edit')">
            新建笔记
          </el-button>
        </div>
      </div>
    </div>

    <!-- 搜索和筛选栏 -->
    <el-card class="filter-card" shadow="hover">
      <div class="filter-content">
        <div class="filter-left">
          <el-input
            v-model="query.keyword"
            placeholder="搜索标题或内容..."
            prefix-icon="Search"
            clearable
            class="search-input"
            @keyup.enter="loadList"
            @clear="loadList"
          />
          <el-select 
            v-model="query.status" 
            placeholder="全部状态" 
            clearable
            class="status-select"
            @change="loadList"
          >
            <el-option label="全部" value="" />
            <el-option label="已发布" value="published" />
            <el-option label="草稿" value="draft" />
            <el-option label="已收藏" value="star" />
            <el-option label="置顶" value="top" />
          </el-select>
          <el-button :icon="Refresh" @click="loadList">刷新</el-button>
        </div>
      </div>
    </el-card>

    <!-- 笔记列表 -->
    <el-card class="list-card" shadow="hover">
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
        @row-click="handleRowClick"
      >
        <el-table-column label="标题" min-width="200" prop="title">
          <template #default="{ row }">
            <div class="title-cell">
              <span class="title-text">{{ row.title || '无标题笔记' }}</span>
              <div class="title-tags">
                <el-tag v-if="row.is_top" type="success" size="small">置顶</el-tag>
                <el-tag v-if="row.is_star" type="warning" size="small" effect="plain">收藏</el-tag>
                <el-tag v-if="row.is_draft" type="info" size="small">草稿</el-tag>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="分类" min-width="150" align="center">
          <template #default="{ row }">
            <div class="cate-cell" v-if="row.categoryNames && row.categoryNames.length">
              <el-tag
                v-for="name in row.categoryNames"
                :key="name"
                size="small"
                type="primary"
                plain
                class="cate-item"
              >
                {{ name }}
              </el-tag>
            </div>
            <span v-else class="empty-text">未分类</span>
          </template>
        </el-table-column>

        <el-table-column label="标签" min-width="150" prop="tags" align="center">
          <template #default="{ row }">
            <div class="tags-cell" v-if="row.tags && row.tags.length > 0">
              <el-tag 
                v-for="tag in row.tags.slice(0, 3)" 
                :key="tag"
                size="small"
                type="primary"
                plain
                class="tag-item"
              >
                #{{ tag }}
              </el-tag>
              <el-tag v-if="row.tags.length > 3" size="small" type="info">
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
            <el-button size="small" type="primary" link @click.stop="edit(row.id)">编辑</el-button>
            <el-button size="small" type="success" link @click.stop="openShare(row)">分享</el-button>
            <el-button size="small" type="danger" link @click.stop="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态 -->
      <div v-if="tableData.length === 0 && !loading" class="empty-state">
        <el-empty description="还没有笔记，开始写第一篇吧" :image-size="120">
          <el-button type="primary" @click="$router.push('/note/edit')">写第一篇笔记</el-button>
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
    <el-dialog v-model="shareVisible" title="创建分享链接" width="480px" destroy-on-close>
      <el-form :model="shareForm" label-width="80px">
        <el-form-item label="访问密码">
          <el-input 
            v-model="shareForm.password" 
            placeholder="留空则公开访问"
            show-password
            clearable
          />
        </el-form-item>
        <el-form-item label="权限">
          <el-radio-group v-model="shareForm.permission">
            <el-radio label="read">仅阅读</el-radio>
            <el-radio label="edit" disabled>可编辑（即将支持）</el-radio>
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
        <el-button @click="shareVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreateShare" :loading="shareLoading">
          {{ shareLoading ? '创建中...' : '创建分享' }}
        </el-button>
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

// 分享相关
const shareVisible = ref(false)
const shareLoading = ref(false)
const shareForm = ref({ 
  noteId: 0, 
  password: '', 
  permission: 'read',
  expireDays: 7
})

// ===== 加载列表 =====
async function loadList() {
  loading.value = true
  try {
    const params: any = {
      page: query.value.page,
      size: query.value.size,
      q: query.value.keyword
    }
    
    // 根据状态筛选
    if (query.value.status === 'draft') {
      params.is_draft = true
    } else if (query.value.status === 'star') {
      params.is_star = true
    } else if (query.value.status === 'top') {
      params.is_top = true
    } else if (query.value.status === 'published') {
      params.is_draft = false
    }

    const res = await getNoteList(params)
    tableData.value = res?.data?.list || []
    total.value = res?.data?.total || 0
  } catch (error) {
    ElMessage.error('加载笔记列表失败')
  } finally {
    loading.value = false
  }
}

// ===== 编辑 =====
function edit(id: number) {
  router.push({ path: '/note/edit', query: { id: String(id) } })
}

// ===== 行点击跳转 =====
function handleRowClick(row: Note) {
  edit(row.id)
}

// ===== 移入回收站 =====
async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm(
      '确定要移入回收站吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await deleteNote(id)
    ElMessage.success('已移入回收站')
    loadList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败，请重试')
    }
  }
}

// ===== 分享 =====
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
  } catch (error) {
    ElMessage.error('创建分享失败，请重试')
  } finally {
    shareLoading.value = false
  }
}

// ===== 生命周期 =====
onMounted(() => {
  loadList()
})
</script>

<style scoped>
.note-list {
  padding: 24px;
  background: #f0f2f5;
  min-height: calc(100vh - 60px);
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
  gap: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-title {
  font-size: 22px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
}

.page-title .el-icon {
  color: #409EFF;
}

.note-count {
  font-size: 14px;
  color: #909399;
}

/* ===== 筛选卡片 ===== */
.filter-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

:deep(.filter-card .el-card__body) {
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

/* ===== 列表卡片 ===== */
.list-card {
  border-radius: 8px;
}

:deep(.list-card .el-card__header) {
  padding: 14px 20px;
  border-bottom: 1px solid #ebeef5;
}

:deep(.list-card .el-card__body) {
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
  color: #303133;
}

.card-title .el-icon {
  color: #409EFF;
}

/* ===== 表格 ===== */
.title-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.title-text {
  font-size: 14px;
  color: #303133;
}

.title-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.title-tags .el-tag {
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
  color: #c0c4cc;
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

/* ===== 空状态 ===== */
.empty-state {
  padding: 40px 0;
}

/* ===== 分页 ===== */
.pagination-wrapper {
  padding: 16px 20px;
  border-top: 1px solid #ebeef5;
  display: flex;
  justify-content: flex-end;
}

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .note-list {
    padding: 12px;
  }

  .page-title {
    font-size: 18px;
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-right {
    width: 100%;
  }

  .header-right .el-button {
    width: 100%;
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
  }
}
</style>