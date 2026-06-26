<template>
  <div class="user-manage-page">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="title">
            <el-icon><User /></el-icon>
            用户管理
          </span>
          <span class="count">共 {{ tableData.length }} 个用户</span>
        </div>
      </template>

      <el-table
        :data="tableData"
        border
        stripe
        style="width:100%"
        v-loading="loading"
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
            <el-tag :type="row.role === 'admin' ? 'danger' : ''">
              {{ row.role === 'admin' ? '管理员' : '普通用户' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="账号状态" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.status === 'active'" type="success">已激活</el-tag>
            <el-tag v-else type="warning">未激活</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="是否冻结" align="center">
          <template #default="{ row }">
            <el-switch
              :model-value="row.is_frozen"
              @change="(val) => handleToggleFrozen(row, val)"
            />
          </template>
        </el-table-column>
        
        <el-table-column label="注册时间" prop="created_at" align="center">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="240" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="openRoleDialog(row)">
              <el-icon><Edit /></el-icon>
              修改角色
            </el-button>
            <el-button type="warning" size="small" link @click="openResetPwdDialog(row)">
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
    </el-card>

    <!-- 修改角色弹窗 -->
    <el-dialog v-model="roleDialog.visible" title="修改用户角色" width="400px" destroy-on-close>
      <el-form label-width="80px">
        <el-form-item label="当前用户">
          <span>{{ roleDialog.username }}</span>
        </el-form-item>
        <el-form-item label="当前角色">
          <el-tag :type="roleDialog.currentRole === 'admin' ? 'danger' : ''">
            {{ roleDialog.currentRole === 'admin' ? '管理员' : '普通用户' }}
          </el-tag>
        </el-form-item>
        <el-form-item label="新角色">
          <el-select v-model="roleDialog.role" placeholder="请选择">
            <el-option label="普通用户" value="user" />
            <el-option label="系统管理员" value="admin" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roleDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="submitEditRole" :loading="submitting">
          确定修改
        </el-button>
      </template>
    </el-dialog>

    <!-- 重置密码弹窗 -->
    <el-dialog v-model="pwdDialog.visible" title="重置用户密码" width="400px" destroy-on-close>
      <el-form label-width="80px">
        <el-form-item label="用户">
          <span>{{ pwdDialog.username }}</span>
        </el-form-item>
        <el-form-item label="新密码">
          <el-input
            v-model="pwdDialog.newPwd"
            show-password
            placeholder="请设置新登录密码（至少6位）"
            @keyup.enter="submitResetPwd"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pwdDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="submitResetPwd" :loading="submitting">
          确认重置
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getUserListApi, updateUserApi, adminResetUserPwdApi, type UserItem } from '@/api/user'
import { User, Edit, Key } from '@element-plus/icons-vue'

const loading = ref(false)
const submitting = ref(false)
const tableData = ref<UserItem[]>([])

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

// ===== 获取用户列表 =====
const loadUserList = async () => {
  loading.value = true
  try {
    const resp = await getUserListApi()
    // resp 现在是 Resp<UserItem[]>
    tableData.value = resp.data ?? []
  } catch (error) {
    console.error('获取用户列表失败', error)
    ElMessage.error('加载用户列表失败')
  } finally {
    loading.value = false
  }
}

// ===== 冻结/解冻账号 =====
const handleToggleFrozen = async (row: UserItem, value: boolean) => {
  const newFrozen = value
  try {
    await updateUserApi({
      userId: row.id,
      isFrozen: newFrozen
    })
    // 更新本地数据
    row.is_frozen = newFrozen
    ElMessage.success(newFrozen ? '账号已冻结' : '账号已解冻')
  } catch {
    ElMessage.error('操作失败')
    // 恢复原状态
    row.is_frozen = !newFrozen
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

// ===== 格式化时间 =====
const formatTime = (time: string) => {
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

onMounted(loadUserList)
</script>

<style scoped>
.user-manage-page {
  padding: 24px;
  background: #f0f2f5;
  min-height: calc(100vh - 60px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title .el-icon {
  color: #409EFF;
}

.count {
  font-size: 14px;
  color: #909399;
}

.empty-state {
  padding: 20px 0;
}

.empty-text {
  color: #c0c4cc;
  font-size: 13px;
}

:deep(.el-table) {
  border-radius: 8px;
}

:deep(.el-dialog) {
  border-radius: 12px;
}

:deep(.el-dialog__header) {
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
}

:deep(.el-dialog__body) {
  padding: 20px;
}

:deep(.el-dialog__footer) {
  padding: 12px 20px;
  border-top: 1px solid #ebeef5;
}

@media (max-width: 768px) {
  .user-manage-page {
    padding: 12px;
  }
}
</style>