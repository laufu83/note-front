<!-- src/views/CategoryManage.vue - 使用全局公共样式 -->
<template>
  <div class="category-manage page-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">
          <el-icon><Folder /></el-icon>
          分类管理
        </h2>
        <span class="page-count">共 {{ tableData.length }} 个分类</span>
      </div>
      <div class="header-right">
        <el-button type="primary" :icon="Plus" @click="openDialog">新增分类</el-button>
      </div>
    </div>

    <!-- 分类列表 -->
    <el-card class="list-card page-card" shadow="hover">
      <el-table
        :data="tableData"
        border
        v-loading="loading"
        style="width: 100%"
        class="page-table"
      >
        <el-table-column label="分类名称" prop="name" min-width="200">
          <template #default="{ row }">
            <el-tag type="primary" size="default" class="tag-primary">{{ row.name }}</el-tag>
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
            <el-button size="small" type="primary" link class="btn-link-primary" @click="editRow(row)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button size="small" type="danger" link class="btn-link-danger" @click="handleDelete(row.id)">
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
      class="dialog-common"
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
            class="input-common"
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
            class="input-number-common"
          />
          <span class="form-tip">数值越大，排序越靠前</span>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submit" :loading="submitting">
            {{ submitting ? '保存中...' : '保存' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { getCategoryList, createCategory, updateCategory, deleteCategory, type Category } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Folder, Plus, Edit, Delete } from '@element-plus/icons-vue'

const loading = ref(false)
const submitting = ref(false)
const tableData = ref<Category[]>([])
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
    const res = await getCategoryList()
    tableData.value = Array.isArray(res?.data) ? res.data : []
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
function editRow(row: Category) {
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
      await updateCategory({
        id: form.value.id,
        name: form.value.name,
        sort: form.value.sort
      })
    } else {
      await createCategory({
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
async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm('确定要删除这个分类吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteCategory(id)
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
/* ============================================================
   CategoryManage 专用样式
   ============================================================ */

.category-manage {
  padding: 24px;
}

/* ===== 排序值 ===== */
.sort-value {
  color: var(--text-regular);
  font-weight: 500;
  transition: color var(--transition-duration);
}

/* ===== 表单提示 ===== */
.form-tip {
  font-size: 12px;
  color: var(--text-placeholder);
  margin-left: 8px;
  transition: color var(--transition-duration);
}

/* ============================================================
   响应式
   ============================================================ */
@media (max-width: 768px) {
  .category-manage {
    padding: 12px;
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

  .dialog-common :deep(.el-dialog) {
    width: 92% !important;
    margin: 16px auto !important;
  }

  .dialog-common :deep(.el-dialog__body) {
    padding: 16px;
  }

  .dialog-common :deep(.el-form-item) {
    margin-bottom: 16px;
  }
}

@media (max-width: 480px) {
  .category-manage {
    padding: 8px;
  }

  .form-tip {
    font-size: 11px;
  }

  .dialog-common :deep(.el-dialog) {
    width: 96% !important;
  }

  .dialog-common :deep(.el-dialog__header) {
    padding: 12px 16px;
  }

  .dialog-common :deep(.el-dialog__body) {
    padding: 12px;
  }

  .dialog-common :deep(.el-dialog__footer) {
    padding: 10px 16px;
  }
}
</style>