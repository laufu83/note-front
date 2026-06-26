<template>
  <div class="category-manage">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">
          <el-icon><Folder /></el-icon>
          分类管理
        </h2>
        <span class="count">共 {{ tableData.length }} 个分类</span>
      </div>
      <div class="header-right">
        <el-button type="primary" :icon="Plus" @click="openDialog">新增分类</el-button>
      </div>
    </div>

    <!-- 分类列表 -->
    <el-card class="list-card" shadow="hover">
      <el-table
        :data="tableData"
        border
        v-loading="loading"
        style="width: 100%"
      >
        <el-table-column label="分类名称" prop="name" min-width="200">
          <template #default="{ row }">
            <el-tag type="primary" size="default">{{ row.name }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="排序值" prop="sort" width="120" align="center">
          <template #default="{ row }">
            <span class="sort-value">{{ row.sort }}</span>
          </template>
        </el-table-column>

        <el-table-column label="创建时间" prop="created_at" width="170" align="center">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="editRow(row)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button size="small" type="danger" link @click="del(row.id)">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态 -->
      <div v-if="tableData.length === 0 && !loading" class="empty-state">
        <el-empty description="暂无分类，点击新增创建" :image-size="100">
          <el-button type="primary" @click="openDialog">新增分类</el-button>
        </el-empty>
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="420px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="80px"
      >
        <el-form-item label="分类名称" prop="name">
          <el-input
            v-model="form.name"
            placeholder="请输入分类名称"
            maxlength="20"
            show-word-limit
            @keyup.enter="submit"
          />
        </el-form-item>

        <el-form-item label="排序" prop="sort">
          <el-input-number
            v-model="form.sort"
            :min="0"
            :max="999"
            controls-position="right"
            style="width: 100%"
          />
          <span class="form-tip">数值越大，排序越靠前</span>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submit" :loading="submitting">
          {{ submitting ? '保存中...' : '保存' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import request from '@/utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Folder, Plus, Edit, Delete } from '@element-plus/icons-vue'

const loading = ref(false)
const submitting = ref(false)
const tableData = ref<any[]>([])
const dialogVisible = ref(false)
const isEdit = ref(false)

const formRef = ref()
const form = ref({
  id: 0,
  name: '',
  sort: 0
})

const formRules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 1, max: 20, message: '长度在 1 到 20 个字符', trigger: 'blur' }
  ],
  sort: [
    { required: true, message: '请输入排序值', trigger: 'blur' },
    { type: 'number', min: 0, message: '排序必须大于等于 0', trigger: 'blur' }
  ]
}

const dialogTitle = computed(() => isEdit.value ? '编辑分类' : '新增分类')

// ===== 加载数据 =====
async function load() {
  loading.value = true
  try {
    const res = await request.get('/api/category')
    tableData.value = res.data || []
  } catch (error) {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// ===== 打开新增对话框 =====
function openDialog() {
  isEdit.value = false
  form.value = { id: 0, name: '', sort: 0 }
  dialogVisible.value = true
}

// ===== 打开编辑对话框 =====
function editRow(row: any) {
  isEdit.value = true
  form.value = { ...row }
  dialogVisible.value = true
}

// ===== 提交 =====
async function submit() {
  try {
    await formRef.value?.validate()
    submitting.value = true

    if (isEdit.value) {
      await request.put(`/api/category/${form.value.id}`, {
        name: form.value.name,
        sort: form.value.sort
      })
    } else {
      await request.post('/api/category', {
        name: form.value.name,
        sort: form.value.sort
      })
    }

    dialogVisible.value = false
    ElMessage.success('保存成功')
    load()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('保存失败')
    }
  } finally {
    submitting.value = false
  }
}

// ===== 删除 =====
async function del(id: number) {
  try {
    await ElMessageBox.confirm('确定要删除这个分类吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await request.delete(`/api/category/${id}`)
    ElMessage.success('删除成功')
    load()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// ===== 格式化时间 =====
function formatTime(time: string) {
  if (!time) return '-'
  const date = new Date(time)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// ===== 生命周期 =====
onMounted(load)
</script>

<style scoped>
.category-manage {
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

.count {
  font-size: 14px;
  color: #909399;
}

/* ===== 列表卡片 ===== */
.list-card {
  border-radius: 8px;
}

:deep(.list-card .el-card__body) {
  padding: 0;
}

.sort-value {
  color: #606266;
  font-weight: 500;
}

/* ===== 空状态 ===== */
.empty-state {
  padding: 40px 0;
}

/* ===== 对话框 ===== */
:deep(.el-dialog) {
  border-radius: 12px;
}

:deep(.el-dialog__header) {
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
}

:deep(.el-dialog__title) {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

:deep(.el-dialog__body) {
  padding: 20px;
}

:deep(.el-dialog__footer) {
  padding: 12px 20px;
  border-top: 1px solid #ebeef5;
}

.form-tip {
  font-size: 12px;
  color: #c0c4cc;
  margin-left: 8px;
}

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .category-manage {
    padding: 12px;
  }

  .page-title {
    font-size: 18px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-right {
    width: 100%;
  }

  .header-right .el-button {
    width: 100%;
  }

  :deep(.el-dialog) {
    width: 92% !important;
  }

  :deep(.el-table) {
    font-size: 13px;
  }

  :deep(.el-table .cell) {
    padding: 8px 6px !important;
  }
}
</style>