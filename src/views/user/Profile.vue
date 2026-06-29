<!-- src/views/Profile.vue - 精简版 -->
<template>
  <div class="profile-page page-container">
    <el-card class="profile-card page-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><User /></el-icon>
            个人资料
          </span>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="80px"
        class="profile-form"
      >
        <!-- 头像上传区域 -->
        <el-form-item label="个人头像">
          <div class="avatar-wrapper">
            <el-upload
              class="avatar-uploader"
              action=""
              :http-request="uploadAvatar"
              :show-file-list="false"
              accept="image/jpeg,image/png,image/webp"
              :before-upload="beforeAvatarUpload"
            >
              <div v-if="form.avatar" class="avatar-preview">
                <img :src="form.avatar" alt="头像" class="avatar-img" />
                <div class="avatar-mask">点击更换</div>
              </div>
              <div v-else class="avatar-upload">
                <el-icon><Plus /></el-icon>
                <div class="upload-text">上传头像</div>
              </div>
            </el-upload>
            <el-button
              v-if="form.avatar"
              type="text"
              @click="clearAvatar"
              class="clear-avatar-btn"
            >
              <el-icon><Delete /></el-icon>
              清空头像
            </el-button>
          </div>
        </el-form-item>

        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入用户名"
            maxlength="20"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="form.email"
            placeholder="请输入邮箱地址"
          />
          <div class="form-tip">修改邮箱后需要前往邮箱点击激活链接才能生效</div>
        </el-form-item>

        <el-form-item label="角色">
          <el-tag :type="userInfo?.role === 'admin' ? 'danger' : ''">
            {{ userInfo?.role === 'admin' ? '管理员' : '普通用户' }}
          </el-tag>
        </el-form-item>

        <el-form-item label="账号状态">
          <el-tag v-if="userInfo?.status === 'active'" type="success">已激活</el-tag>
          <el-tag v-else type="warning">未激活</el-tag>
        </el-form-item>

        <el-form-item label="冻结状态">
          <el-tag v-if="userInfo?.is_frozen" type="danger">已冻结</el-tag>
          <el-tag v-else type="success">正常</el-tag>
        </el-form-item>

        <el-form-item label="注册时间">
          <span class="info-text">{{ formatTime(userInfo?.created_at) }}</span>
        </el-form-item>

        <el-form-item label="最后更新">
          <span class="info-text">{{ formatTime(userInfo?.updated_at) }}</span>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            {{ submitting ? '保存中...' : '保存修改' }}
          </el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElForm, type FormRules } from 'element-plus'
import { User, Plus, Delete } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { uploadFile, getFileUrl, updateCurrentUserInfo } from '@/api'
import { formatTime } from '@/utils/format'

const userStore = useUserStore()
const submitting = ref(false)
const formRef = ref<InstanceType<typeof ElForm>>()

const userInfo = computed(() => userStore.userInfo)

const form = reactive({
  username: '',
  email: '',
  avatar: ''
})

const formRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度在 2 到 20 个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, message: '用户名只能包含字母、数字、下划线和中文', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ]
}

function loadUserInfo() {
  if (userInfo.value) {
    form.username = userInfo.value.username || ''
    form.email = userInfo.value.email || ''
    form.avatar = userInfo.value.avatar || ''
  }
}

const beforeAvatarUpload = (file: File) => {
  const isImage = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
  if (!isImage) {
    ElMessage.error('只能上传 JPG / PNG / WebP 格式图片')
    return false
  }
  if (file.size / 1024 / 1024 > 2) {
    ElMessage.error('图片大小不能超过 2MB')
    return false
  }
  return true
}

const uploadAvatar = async (options: { file: File }) => {
  try {
    const res = await uploadFile({ file: options.file })
    if (res.data) {
      form.avatar = getFileUrl(res.data.storage_path)
      ElMessage.success('头像上传成功，请点击保存修改')
    }
  } catch {
    ElMessage.error('头像上传失败')
  }
}

const clearAvatar = () => {
  form.avatar = ''
  ElMessage.info('已清空头像，保存后生效')
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()
    submitting.value = true

    const params: { username?: string; email?: string; avatar?: string } = {}
    if (form.username !== userInfo.value?.username) params.username = form.username
    if (form.email !== userInfo.value?.email) params.email = form.email
    if (form.avatar !== userInfo.value?.avatar) params.avatar = form.avatar

    if (Object.keys(params).length === 0) {
      ElMessage.warning('没有修改任何信息')
      return
    }

    const res = await updateCurrentUserInfo(params)
    if (res.code === 0 && res.msg) {
      ElMessage.success(res.msg)
      await userStore.fetchUserInfo()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('更新失败', error)
    }
  } finally {
    submitting.value = false
  }
}

function resetForm() {
  if (userInfo.value) {
    form.username = userInfo.value.username || ''
    form.email = userInfo.value.email || ''
    form.avatar = userInfo.value.avatar || ''
  }
  formRef.value?.clearValidate()
  ElMessage.info('已重置')
}

onMounted(async () => {
  if (!userInfo.value) {
    await userStore.fetchUserInfo()
  }
  loadUserInfo()
})
</script>

<style scoped>
.profile-page {
  padding: 24px;
}

.profile-card :deep(.el-card__header) {
  padding: 16px 24px;
  border-bottom: 1px solid var(--border-color) !important;
  background: var(--bg-gray);
}

.profile-card :deep(.el-card__body) {
  padding: 24px;
}

.card-header {
  display: flex;
  align-items: center;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.card-title .el-icon {
  color: var(--theme-color);
  font-size: 20px;
}

.profile-form {
  max-width: 100%;
}

.profile-form :deep(.el-form-item) {
  margin-bottom: 22px;
}

.profile-form :deep(.el-input) {
  max-width: 400px;
}

/* 表单提示 */
.form-tip {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}

/* 信息文字 */
.info-text {
  color: var(--text-regular);
}

/* 头像上传 */
.avatar-wrapper {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.avatar-uploader :deep(.el-upload) {
  border: 2px dashed var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 120px;
  height: 120px;
  transition: all var(--transition-duration);
  background: var(--bg-gray);
}

.avatar-uploader :deep(.el-upload:hover) {
  border-color: var(--theme-color);
}

.avatar-preview {
  width: 100%;
  height: 100%;
  position: relative;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-mask {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 36px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-upload {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-placeholder);
}

.avatar-upload .el-icon {
  font-size: 32px;
  margin-bottom: 6px;
  color: var(--text-placeholder);
}

.upload-text {
  font-size: 13px;
  color: var(--text-placeholder);
}

.clear-avatar-btn {
  color: var(--text-secondary) !important;
}

.clear-avatar-btn:hover {
  color: var(--theme-color) !important;
}

@media (max-width: 768px) {
  .profile-page {
    padding: 12px;
  }
  .profile-card :deep(.el-card__body) {
    padding: 16px;
  }
  .profile-form :deep(.el-input) {
    max-width: 100%;
  }
  .avatar-wrapper {
    flex-direction: column;
    align-items: flex-start;
  }
  .avatar-uploader :deep(.el-upload) {
    width: 100px;
    height: 100px;
  }
  .clear-avatar-btn {
    margin-left: 0;
  }
}

@media (max-width: 480px) {
  .profile-page {
    padding: 8px;
  }
  .profile-card :deep(.el-card__body) {
    padding: 12px;
  }
  .profile-card :deep(.el-card__header) {
    padding: 12px 16px;
  }
  .card-title {
    font-size: 16px;
  }
  .avatar-uploader :deep(.el-upload) {
    width: 80px;
    height: 80px;
  }
  .avatar-mask {
    height: 28px;
    font-size: 10px;
  }
  .avatar-upload .el-icon {
    font-size: 24px;
  }
  .upload-text {
    font-size: 11px;
  }
  .profile-form :deep(.el-form-item) {
    margin-bottom: 14px;
  }
  .profile-form :deep(.el-form-item__label) {
    font-size: 13px;
  }
}
</style>