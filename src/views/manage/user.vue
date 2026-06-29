<!-- src/views/UserManage.vue - 最终修复完整版 -->
<template>
  <div class="user-manage-page page-container">
    <el-card class="page-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><User /></el-icon>
            用户管理
          </span>
          <span class="page-count">共 {{ total }} 个用户</span>
        </div>
      </template>

      <el-table
        :data="tableData"
        border
        stripe
        style="width:100%"
        v-loading="loading"
        class="page-table"
      >
        <el-table-column label="用户ID" prop="id" width="80" align="center" />
        
        <el-table-column label="用户名" prop="username" align="center" />
        
        <el-table-column label="邮箱" prop="email" align="center">
          <template #default="{ row }">
            <span v-if="row.email">{{ row.email }}</span>
            <span v-else class="empty-text">未设置</span>
          </template>
        </el-table-column>
        
        <el-table-column label="角色" align="center">
          <template #default="{ row }">
            <el-tag :type="row.role === 'admin' ? 'danger' : ''" :class="row.role === 'admin' ? 'tag-danger' : 'tag-info'">
              {{ row.role === 'admin' ? '管理员' : '普通用户' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="账号状态" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.status === 'active'" type="success" class="tag-success">已激活</el-tag>
            <el-tag v-else type="warning" class="tag-warning">未激活</el-tag>
          </template>
        </el-table-column>
        
        <!-- 是否冻结列（已删除行内颜色，防止样式冲突 + 点击防抖禁用） -->
        <el-table-column label="是否冻结" width="120" align="center">
          <template #default="{ row }">
            <div class="switch-wrapper">
            <el-switch
              :model-value="Boolean(row.is_frozen)"
              @update:model-value="(val: boolean) => handleToggleFrozen(row, val)"
              size="small"
              :disabled="switchLoadingMap[row.id]"
              :active-value="true"
              :inactive-value="false"
            />
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="注册时间" prop="created_at" align="center">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="240" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" link class="btn-link-primary" @click="openRoleDialog(row)">
              <el-icon><Edit /></el-icon>
              修改角色
            </el-button>
            <el-button type="warning" size="small" link class="btn-link-warning" @click="openResetPwdDialog(row)">
              <el-icon><Key /></el-icon>
              重置密码
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态 -->
      <div v-if="tableData.length === 0 && !loading" class="empty-state">
        <el-empty description="暂无用户" :image-size="100" />
      </div>

      <!-- 分页组件 -->
      <div class="pagination-wrapper" v-if="total > 0">
        <el-pagination
          v-model:current-page="pageNum"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 修改角色弹窗 -->
    <el-dialog v-model="roleDialog.visible" title="修改用户角色" width="400px" destroy-on-close class="dialog-common">
      <el-form label-width="80px">
        <el-form-item label="当前用户">
          <span class="text-regular">{{ roleDialog.username }}</span>
        </el-form-item>
        <el-form-item label="当前角色">
          <el-tag :type="roleDialog.currentRole === 'admin' ? 'danger' : 'info'" :class="roleDialog.currentRole === 'admin' ? 'tag-danger' : 'tag-info'">
            {{ roleDialog.currentRole === 'admin' ? '管理员' : '普通用户' }}
          </el-tag>
        </el-form-item>
        <el-form-item label="新角色">
          <el-select v-model="roleDialog.role" placeholder="请选择" class="select-common">
            <el-option label="普通用户" value="user" />
            <el-option label="系统管理员" value="admin" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="roleDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="submitEditRole" :loading="submitting">
            确定修改
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 重置密码弹窗 -->
    <el-dialog v-model="pwdDialog.visible" title="重置用户密码" width="400px" destroy-on-close class="dialog-common">
      <el-form label-width="80px">
        <el-form-item label="用户">
          <span class="text-regular">{{ pwdDialog.username }}</span>
        </el-form-item>
        <el-form-item label="新密码">
          <el-input
            v-model="pwdDialog.newPwd"
            show-password
            placeholder="请设置新登录密码（至少6位）"
            class="input-common"
            @keyup.enter="submitResetPwd"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="pwdDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="submitResetPwd" :loading="submitting">
            确认重置
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getUserListApi, updateUserApi, adminResetUserPwdApi, type UserItem } from '@/api'
import { User, Edit, Key } from '@element-plus/icons-vue'
import { formatTime } from '@/utils/format'

const loading = ref(false)
const submitting = ref(false)
const tableData = ref<UserItem[]>([])

// 分页参数
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 修改角色弹窗
const roleDialog = ref({
  visible: false,
  userId: 0,
  username: '',
  currentRole: 'user' as 'admin' | 'user',
  role: 'user' as 'admin' | 'user'
})

// 重置密码弹窗
const pwdDialog = ref({
  visible: false,
  userId: 0,
  username: '',
  newPwd: ''
})

// ===== 获取用户列表（带分页） =====
const loadUserList = async () => {
  loading.value = true
  try {
    const res = await getUserListApi({
      page: pageNum.value,
      pageSize: pageSize.value
    })

    if (res.data) {
      tableData.value = res.data.list
      total.value = res.data.total
    }

  } catch (error) {
    console.error('获取用户列表失败', error)
    ElMessage.error('加载用户列表失败')
  } finally {
    loading.value = false
  }
}

// 每页条数改变
const handleSizeChange = () => {
  pageNum.value = 1
  loadUserList()
}

// 页码改变
const handleCurrentChange = () => {
  loadUserList()
}
// 新增：按用户ID存储每行开关加载状态
const switchLoadingMap = ref<Record<number, boolean>>({})

// ===== 冻结/解冻账号（增加防抖防止重复点击） =====
const handleToggleFrozen = async (row: UserItem, value: boolean) => {
  const oldFrozen = row.is_frozen
  switchLoadingMap.value[row.id] = true
  row.is_frozen = value

  try {
    await updateUserApi({
      userId: row.id,
      isFrozen: value
    })
    ElMessage.success(value ? '账号已冻结' : '账号已解冻')
  } catch {
    row.is_frozen = oldFrozen
    ElMessage.error('操作失败')
  } finally {
    switchLoadingMap.value[row.id] = false
  }
}

// ===== 修改角色 =====
const openRoleDialog = (row: UserItem) => {
  roleDialog.value = {
    visible: true,
    userId: row.id,
    username: row.username,
    currentRole: row.role,
    role: row.role
  }
}

const submitEditRole = async () => {
  submitting.value = true
  try {
    await updateUserApi({
      userId: roleDialog.value.userId,
      role: roleDialog.value.role
    })
    roleDialog.value.visible = false
    ElMessage.success('角色修改成功')
    loadUserList()
  } catch {
    ElMessage.error('角色修改失败')
  } finally {
    submitting.value = false
  }
}

// ===== 重置密码 =====
const openResetPwdDialog = (row: UserItem) => {
  pwdDialog.value = {
    visible: true,
    userId: row.id,
    username: row.username,
    newPwd: ''
  }
}

const submitResetPwd = async () => {
  if (!pwdDialog.value.newPwd || pwdDialog.value.newPwd.length < 6) {
    ElMessage.warning('密码至少6位')
    return
  }

  submitting.value = true
  try {
    await adminResetUserPwdApi({
      userId: pwdDialog.value.userId,
      newPwd: pwdDialog.value.newPwd
    })
    pwdDialog.value.visible = false
    ElMessage.success('密码重置成功')
  } catch {
    ElMessage.error('密码重置失败')
  } finally {
    submitting.value = false
  }
}

onMounted(loadUserList)
</script>

<style scoped>
/* ============================================================
   UserManage 专用样式
   ============================================================ */

.user-manage-page {
  padding: 24px;
}

/* ===== 卡片头部 ===== */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
  transition: color var(--transition-duration);
}

.card-title .el-icon {
  color: var(--theme-color);
}

/* 分页区域样式 */
.pagination-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

/* ===== 空状态文字 ===== */
.empty-text {
  color: var(--text-placeholder);
  font-size: 13px;
  transition: color var(--transition-duration);
}

/* ===== 对话框表单标签 ===== */
.dialog-common :deep(.el-form-item__label) {
  color: var(--text-primary) !important;
  transition: color var(--transition-duration);
}

/* ===== 文字工具类 ===== */
.text-regular {
  color: var(--text-regular);
}

.switch-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
}

/* 表格内整体缩放，不要修改开关内部宽高、位移 */
.page-table :deep(.el-switch) {
  transform: scale(0.9);
}

/* 仅修改主题颜色，保留原生宽高、位移、圆角逻辑 */
:deep(.el-switch) {
  --el-switch-on-color: #409EFF;
  --el-switch-off-color: #dcdfe6;
}

/* 深色模式下关闭轨道深色适配 */
.dark-theme :deep(.el-switch) {
  --el-switch-off-color: #353a44;
}

/* 滑块亮色白色，浅深色微调 */
:deep(.el-switch .el-switch__action) {
  background: #ffffff;
}
.dark-theme :deep(.el-switch .el-switch__action) {
  background: #f5f7fa;
}

/* 禁用样式 */
:deep(.el-switch.is-disabled) {
  opacity: 0.55;
  cursor: not-allowed;
}


/* ============================================================
   响应式
   ============================================================ */
@media (max-width: 768px) {
  .user-manage-page {
    padding: 12px;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
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

  :deep(.el-table .el-switch) {
    transform: scale(0.85);
  }

  .pagination-wrapper {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .user-manage-page {
    padding: 8px;
  }

  .card-title {
    font-size: 14px;
  }

  .page-count {
    font-size: 12px;
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

  .empty-text {
    font-size: 11px;
  }

  :deep(.el-table .el-switch) {
    transform: scale(0.75);
  }

  .pagination-wrapper {
    justify-content: center;
  }
}
</style>