<!-- src/views/TagManage.vue - 使用分离的 API -->

<template>
  <div class="tag-manage">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">
          <el-icon><PriceTag /></el-icon>
          标签管理
        </h2>
        <span class="count">共 {{ tableData.length }} 个标签</span>
      </div>
      <div class="header-right">
        <el-button type="primary" :icon="Plus" @click="openDialog">新增标签</el-button>
      </div>
    </div>

    <!-- 标签列表 -->
    <el-card class="list-card" shadow="hover">
      <el-table :data="tableData" border v-loading="loading" style="width: 100%">
        <el-table-column prop="name" label="标签名称" min-width="200">
          <template #default="{ row }">
            <el-tag type="primary" size="default">{{ row.name }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" align="center">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" align="center" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="danger" link @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态 -->
      <div v-if="tableData.length === 0 && !loading" class="empty-state">
        <el-empty description="暂无标签，点击新增创建" :image-size="100">
          <el-button type="primary" @click="openDialog">新增标签</el-button>
        </el-empty>
      </div>
    </el-card>

    <!-- 新增对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="新增标签"
      width="420px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="80px"
      >
        <el-form-item label="标签名称" prop="name">
          <el-input
            v-model="form.name"
            placeholder="请输入标签名称"
            maxlength="20"
            show-word-limit
            @keyup.enter="submit"
          />
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
import { ref, onMounted } from 'vue'
import { getTagList, createTag, deleteTag, type Tag } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { PriceTag, Plus } from '@element-plus/icons-vue'

const loading = ref(false)
const submitting = ref(false)
const tableData = ref<Tag[]>([])
const dialogVisible = ref(false)

const formRef = ref()
const form = ref({ name: '' })

const formRules = {
  name: [
    { required: true, message: '请输入标签名称', trigger: 'blur' },
    { min: 1, max: 20, message: '长度在 1 到 20 个字符', trigger: 'blur' }
  ]
}

// ===== 加载数据 =====
async function load() {
  loading.value = true
  try {
    const res = await getTagList()
    // 实际返回：res.data 直接是数组
    tableData.value = Array.isArray(res?.data) ? res.data : []
  } catch (error) {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// ===== 打开对话框 =====
function openDialog() {
  form.value.name = ''
  dialogVisible.value = true
}

// ===== 提交 =====
async function submit() {
  try {
    await formRef.value?.validate()
    submitting.value = true

    await createTag(form.value)
    dialogVisible.value = false
    ElMessage.success('新增成功')
    load()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('新增失败')
    }
  } finally {
    submitting.value = false
  }
}

// ===== 删除 =====
async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm('确定要删除这个标签吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteTag(id)
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
.tag-manage {
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

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .tag-manage {
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
}
</style>