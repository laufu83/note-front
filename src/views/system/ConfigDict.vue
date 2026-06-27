<!-- src/views/SystemConfig.vue - 系统配置字典管理页面（分页优化版·下划线格式） -->
<template>
  <div class="config-dict-page">
    <el-card class="config-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span class="card-title">
              <el-icon><Setting /></el-icon>
              系统配置字典
            </span>
            <el-tag size="small" type="info">共 {{ total }} 项配置</el-tag>
          </div>
          <div class="header-right">
            <el-button size="small" :icon="Refresh" @click="handleRefresh" :loading="loading">刷新</el-button>
            <el-button type="primary" :icon="Plus" @click="openAddDialog">新增配置项</el-button>
          </div>
        </div>
      </template>

      <!-- 统计信息 -->
      <div class="stats-bar" v-if="tableData.length > 0">
        <span class="stat-item">
          <span class="stat-label">已修改：</span>
          <span class="stat-value" :class="{ 'has-change': changedRows.length > 0 }">
            {{ changedRows.length }} 项
          </span>
        </span>
        <span class="stat-item">
          <span class="stat-label">配置类型：</span>
          <span v-for="(count, type) in typeStats" :key="type" class="type-tag">
            <el-tag size="small" type="info">{{ type }}: {{ count }}</el-tag>
          </span>
        </span>
      </div>

      <!-- 配置列表 -->
      <el-table
        :data="tableData"
        border
        stripe
        style="width:100%"
        v-loading="loading"
        element-loading-text="加载中..."
        max-height="500"
      >
        <el-table-column label="ID" prop="id" width="70" align="center" />
        
        <el-table-column label="配置键名" prop="config_key" min-width="160">
          <template #default="{ row }">
            <el-tag type="primary" size="small" effect="plain">
              {{ row.config_key }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="配置值" prop="config_value" min-width="200">
          <template #default="{ row }">
            <el-input
              v-model="row.config_value"
              :type="row.config_type === 'string' ? 'textarea' : 'text'"
              :rows="2"
              :autosize="{ minRows: 1, maxRows: 4 }"
              placeholder="点击输入配置值"
              @input="handleCellChange(row)"
              class="config-input"
              size="small"
            />
          </template>
        </el-table-column>
        
        <el-table-column label="配置类型" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="getTypeTagColor(row.config_type)" size="small">
              {{ getTypeLabel(row.config_type) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="配置说明" prop="config_desc" min-width="140">
          <template #default="{ row }">
            <span class="desc-text">{{ row.config_desc || '-' }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="更新时间" prop="updated_at" width="170" align="center">
          <template #default="{ row }">
            <span class="time-text">{{ formatTime(row.updated_at) }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="80" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="danger" link size="small" @click="handleDelete(row.config_key)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页组件 -->
      <div class="pagination-wrapper" style="padding:12px 20px;border-top:1px solid #ebeef5;background:#fafbfc;">
        <el-pagination
          v-model:current-page="pageParams.page"
          v-model:page-size="pageParams.pageSize"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadList"
          @current-change="loadList"
        />
      </div>

      <!-- 底部操作栏 -->
      <div class="table-footer">
        <div class="footer-left">
          <el-tag v-if="changedRows.length > 0" type="warning" size="small">
            有 {{ changedRows.length }} 项修改未保存
          </el-tag>
          <span v-else class="no-change">暂无修改</span>
        </div>
        <div class="footer-right">
          <el-button size="default" @click="handleRefresh" :loading="loading">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
          <el-button type="primary" size="default" @click="handleSave" :loading="saveLoading">
            <el-icon><Check /></el-icon>
            {{ saveLoading ? '保存中...' : '保存全部修改' }}
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 新增配置弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      title="新增配置项"
      width="560px"
      destroy-on-close
      class="config-dialog"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="配置键名" prop="config_key">
          <el-input
            v-model="form.config_key"
            placeholder="例如：register_open"
            maxlength="50"
            show-word-limit
          >
            <template #prepend>
              <el-tag type="info" size="small">键</el-tag>
            </template>
          </el-input>
          <div class="form-tip">建议使用下划线分隔，如：system_mode</div>
        </el-form-item>

        <el-form-item label="配置值" prop="config_value">
          <el-input
            v-model="form.config_value"
            placeholder="请输入配置值"
            maxlength="500"
            show-word-limit
            type="textarea"
            :rows="2"
          >
            <template #prepend>
              <el-tag type="warning" size="small">值</el-tag>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="配置类型" prop="config_type">
          <el-select v-model="form.config_type" placeholder="请选择配置类型" style="width: 100%">
            <el-option label="布尔值" value="bool">
              <span>布尔值</span>
              <span class="option-desc">true / false</span>
            </el-option>
            <el-option label="数字" value="int">
              <span>数字</span>
              <span class="option-desc">整数</span>
            </el-option>
            <el-option label="字符串" value="string">
              <span>字符串</span>
              <span class="option-desc">文本内容</span>
            </el-option>
            <el-option label="JSON" value="json">
              <span>JSON</span>
              <span class="option-desc">结构化数据</span>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="配置说明" prop="config_desc">
          <el-input
            v-model="form.config_desc"
            type="textarea"
            :rows="2"
            placeholder="请输入配置说明（可选）"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAdd" :loading="addLoading">
          {{ addLoading ? '新增中...' : '确定新增' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox, ElForm, type FormRules } from 'element-plus'
import { Plus, Refresh, Delete, Check, Setting } from '@element-plus/icons-vue'
import {formatTime} from '@/utils/format'
import {
  getSysConfigPageApi,
  batchUpdateConfigApi,
  addConfigApi,
  deleteConfigApi,
  type SysConfigItem,
  type ConfigType
} from '@/api/system'

const loading = ref(false)
const saveLoading = ref(false)
const addLoading = ref(false)
const tableData = ref<SysConfigItem[]>([])
const changedRows = ref<SysConfigItem[]>([])
// 分页参数
const pageParams = ref({
  page: 1,
  pageSize: 10
})
const total = ref(0)

// 弹窗
const dialogVisible = ref(false)
const formRef = ref<InstanceType<typeof ElForm>>()
// 表单字段全部改为下划线
const form = ref({
  config_key: '',
  config_value: '',
  config_desc: '',
  config_type: 'string' as ConfigType
})

// 表单校验规则
const formRules: FormRules = {
  config_key: [
    { required: true, message: '请输入配置键名', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/, message: '只能包含字母、数字、下划线，且以字母或下划线开头', trigger: 'blur' }
  ],
  config_value: [
    { required: true, message: '请输入配置值', trigger: 'blur' }
  ],
  config_type: [
    { required: true, message: '请选择配置类型', trigger: 'change' }
  ]
}

// ===== 计算属性 =====
const typeStats = computed(() => {
  const stats: Record<string, number> = {}
  tableData.value.forEach(item => {
    const type = item.config_type || 'unknown'
    stats[type] = (stats[type] || 0) + 1
  })
  return stats
})

// ===== 工具函数 =====
const getTypeLabel = (type: string) => {
  const map: Record<string, string> = {
    bool: '布尔',
    int: '数字',
    string: '字符串',
    json: 'JSON'
  }
  return map[type] || type
}

const getTypeTagColor = (type: string) => {
  const map: Record<string, string> = {
    bool: 'success',
    int: 'warning',
    string: 'info',
    json: 'primary'
  }
  return map[type] || 'info'
}

// ===== 加载分页列表 =====
const loadList = async () => {
  loading.value = true
  try {
    const res = await getSysConfigPageApi(pageParams.value)
    if (res.code === 0 && res.data) {
      tableData.value = res.data.list
      total.value = res.data.total
      changedRows.value = []
    }
  } catch {
    ElMessage.error('加载配置字典失败')
  } finally {
    loading.value = false
  }
}

// ===== 单元格变更记录 =====
const handleCellChange = (row: SysConfigItem) => {
  const exists = changedRows.value.find(item => item.id === row.id)
  if (!exists) {
    changedRows.value.push(row)
  }
}

// ===== 批量保存修改 =====
const handleSave = async () => {
  if (!changedRows.value.length) {
    ElMessage.warning('暂无任何配置修改')
    return
  }

  saveLoading.value = true
  try {
    const submitData = changedRows.value.map(item => ({
      config_key: item.config_key,
      config_value: item.config_value,
      config_type: item.config_type
    }))
    await batchUpdateConfigApi(submitData)
    ElMessage.success(`成功保存 ${changedRows.value.length} 项配置，缓存已自动刷新`)
    changedRows.value = []
    await loadList()
  } catch {
    ElMessage.error('保存失败')
  } finally {
    saveLoading.value = false
  }
}

// ===== 重置刷新 =====
const handleRefresh = () => {
  if (changedRows.value.length) {
    ElMessageBox.confirm('当前有未保存的修改，确定要重置吗？', '提示', {
      type: 'warning',
      confirmButtonText: '确定重置',
      cancelButtonText: '取消'
    }).then(() => {
      changedRows.value = []
      pageParams.value.page = 1
      loadList()
      ElMessage.info('已重置')
    }).catch(() => {})
  } else {
    pageParams.value.page = 1
    loadList()
  }
}

// ===== 打开新增弹窗 =====
const openAddDialog = () => {
  formRef.value?.resetFields()
  form.value = {
    config_key: '',
    config_value: '',
    config_desc: '',
    config_type: 'string'
  }
  dialogVisible.value = true
}

// ===== 提交新增 =====
const submitAdd = async () => {
  try {
    await formRef.value?.validate()
    addLoading.value = true

    await addConfigApi(form.value)
    dialogVisible.value = false
    ElMessage.success('新增配置成功')
    pageParams.value.page = 1
    await loadList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('新增失败', error)
    }
  } finally {
    addLoading.value = false
  }
}

// ===== 删除配置 =====
const handleDelete = async (key: string) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除配置 "${key}" 吗？删除后不可恢复`,
      '操作确认',
      {
        type: 'warning',
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        confirmButtonClass: 'el-button--danger'
      }
    )
    await deleteConfigApi(key)
    ElMessage.success('删除成功')
    await loadList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(loadList)
</script>

<style scoped>
.config-dict-page {
  padding: 24px;
  background: #f0f2f5;
  min-height: calc(100vh - 60px);
}

.config-card {
  border-radius: 12px;
}

:deep(.config-card .el-card__header) {
  padding: 16px 24px;
  border-bottom: 1px solid #ebeef5;
  background: #fafafa;
}

:deep(.config-card .el-card__body) {
  padding: 0;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 17px;
  font-weight: 600;
  color: #303133;
}

.card-title .el-icon {
  color: #409EFF;
  font-size: 20px;
}

.header-right {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* ===== 统计栏 ===== */
.stats-bar {
  padding: 10px 20px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
  background: #fafbfc;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
}

.stat-label {
  color: #909399;
}

.stat-value {
  font-weight: 600;
  color: #303133;
}

.stat-value.has-change {
  color: #e6a23c;
}

.type-tag {
  margin-right: 4px;
}

/* ===== 表格 ===== */
.config-input :deep(.el-textarea__inner) {
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.5;
}

.config-input :deep(.el-textarea__inner:focus) {
  border-color: #409EFF;
}

.desc-text {
  color: #606266;
  font-size: 13px;
}

.time-text {
  color: #909399;
  font-size: 13px;
}

/* ===== 底部操作栏 ===== */
.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-top: 1px solid #ebeef5;
  background: #fafbfc;
  flex-wrap: wrap;
  gap: 12px;
}

.footer-left {
  display: flex;
  align-items: center;
}

.no-change {
  color: #c0c4cc;
  font-size: 13px;
}

.footer-right {
  display: flex;
  gap: 8px;
}

/* ===== 弹窗 ===== */
.config-dialog :deep(.el-dialog) {
  border-radius: 12px;
}

.config-dialog :deep(.el-dialog__header) {
  padding: 16px 24px;
  border-bottom: 1px solid #ebeef5;
}

.config-dialog :deep(.el-dialog__title) {
  font-size: 17px;
  font-weight: 600;
}

.config-dialog :deep(.el-dialog__body) {
  padding: 24px;
}

.config-dialog :deep(.el-dialog__footer) {
  padding: 12px 24px;
  border-top: 1px solid #ebeef5;
}

.form-tip {
  font-size: 12px;
  color: #c0c4cc;
  margin-top: 4px;
}

.option-desc {
  color: #909399;
  font-size: 12px;
  margin-left: 8px;
}

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .config-dict-page {
    padding: 12px;
  }

  .card-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-right {
    width: 100%;
  }

  .header-right .el-button {
    flex: 1;
  }

  .stats-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .table-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .footer-right {
    flex-direction: column;
  }

  .footer-right .el-button {
    width: 100%;
  }

  .config-dialog :deep(.el-dialog) {
    width: 95% !important;
  }
}
</style>