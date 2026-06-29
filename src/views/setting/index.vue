<!-- src/views/Setting.vue - 精简版 -->
<template>
  <div class="setting-page page-container">
    <!-- 修改密码 -->
    <el-card class="setting-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><Lock /></el-icon>
            修改密码
          </span>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="100px"
        class="pwd-form"
      >
        <el-form-item label="原密码" prop="oldPwd">
          <el-input v-model="form.oldPwd" placeholder="请输入原密码" show-password />
        </el-form-item>

        <el-form-item label="新密码" prop="newPwd">
          <el-input v-model="form.newPwd" placeholder="请输入新密码（至少6位）" show-password />
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPwd">
          <el-input v-model="form.confirmPwd" placeholder="请再次输入新密码" show-password />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleChangePassword" :loading="pwdLoading">
            {{ pwdLoading ? '修改中...' : '修改密码' }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 危险操作 -->
    <el-card class="setting-card danger-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title danger-title">
            <el-icon><Warning /></el-icon>
            危险操作
          </span>
        </div>
      </template>

      <div class="danger-content">
        <div class="danger-info">
          <el-icon class="danger-icon"><InfoFilled /></el-icon>
          <span>注销账号后，您的所有笔记、文件和数据将被永久删除，且无法恢复。</span>
        </div>
        <el-button type="danger" @click="handleDestroyAccount" :loading="destroyLoading">
          {{ destroyLoading ? '注销中...' : '永久注销账号' }}
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useUserStore } from '@/stores/user'
import { changePassword, destroyAccount } from '@/api'
import { ElMessage, ElMessageBox, ElForm, type FormRules } from 'element-plus'
import { Lock, Warning, InfoFilled } from '@element-plus/icons-vue'

const userStore = useUserStore()
const formRef = ref<InstanceType<typeof ElForm>>()
const pwdLoading = ref(false)
const destroyLoading = ref(false)

const form = reactive({
  oldPwd: '',
  newPwd: '',
  confirmPwd: ''
})

const formRules: FormRules = {
  oldPwd: [
    { required: true, message: '请输入原密码', trigger: 'blur' }
  ],
  newPwd: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '新密码至少 6 位', trigger: 'blur' }
  ],
  confirmPwd: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== form.newPwd) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

async function handleChangePassword() {
  try {
    await formRef.value?.validate()
    pwdLoading.value = true
    await changePassword({ oldPwd: form.oldPwd, newPwd: form.newPwd })
    ElMessage.success('密码修改成功，请重新登录')
    form.oldPwd = ''
    form.newPwd = ''
    form.confirmPwd = ''
    userStore.logout()
  } catch (error) {
    // 错误已由拦截器处理
  } finally {
    pwdLoading.value = false
  }
}

async function handleDestroyAccount() {
  try {
    await ElMessageBox.confirm(
      '永久注销账号后，所有数据将无法恢复，确定继续吗？',
      '警告',
      {
        confirmButtonText: '确定注销',
        cancelButtonText: '取消',
        type: 'error',
        confirmButtonClass: 'el-button--danger'
      }
    )
    destroyLoading.value = true
    await destroyAccount()
    ElMessage.success('账号已注销，再见 👋')
    userStore.logout()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('注销失败，请重试')
    }
  } finally {
    destroyLoading.value = false
  }
}
</script>

<style scoped>
.setting-page {
  padding: 24px;
}

.setting-card {
  margin-bottom: 24px;
}

.setting-card :deep(.el-card__header) {
  padding: 14px 20px;
  border-bottom: 1px solid var(--border-color) !important;
}

.setting-card :deep(.el-card__body) {
  padding: 20px 24px;
}

.card-header {
  display: flex;
  align-items: center;
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

.pwd-form {
  max-width: 700px;
}

.pwd-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

.pwd-form :deep(.el-input) {
  max-width: 360px;
}

/* 危险操作 */
.danger-card {
  border-color: rgba(245, 108, 108, 0.3) !important;
}

.danger-title .el-icon {
  color: #f56c6c !important;
}

.danger-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.danger-info {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: var(--text-regular);
  font-size: 14px;
  flex: 1;
}

.danger-icon {
  color: #f56c6c;
  font-size: 18px;
  flex-shrink: 0;
  margin-top: 1px;
}

@media (max-width: 768px) {
  .setting-page {
    padding: 12px;
  }
  .setting-card :deep(.el-card__body) {
    padding: 16px;
  }
  .pwd-form {
    max-width: 100%;
  }
  .pwd-form :deep(.el-input) {
    max-width: 100% !important;
  }
  .danger-content {
    flex-direction: column;
    align-items: flex-start;
  }
  .danger-content .el-button {
    width: 100%;
  }
  .danger-info {
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .setting-page {
    padding: 8px;
  }
  .setting-card :deep(.el-card__body) {
    padding: 12px;
  }
  .setting-card :deep(.el-card__header) {
    padding: 10px 16px;
  }
  .card-title {
    font-size: 14px;
  }
  .danger-info {
    font-size: 12px;
  }
  .danger-icon {
    font-size: 16px;
  }
  .pwd-form :deep(.el-form-item) {
    margin-bottom: 14px;
  }
  .pwd-form :deep(.el-form-item__label) {
    font-size: 13px;
  }
}
</style>