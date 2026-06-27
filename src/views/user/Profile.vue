<!-- src/views/Profile.vue - 个人资料页面 -->
<template>
  <div class="profile-page">
    <el-card class="profile-card" shadow="hover">
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
            icon="Delete"
            @click="clearAvatar"
            class="clear-avatar-btn"
          >
            清空头像
          </el-button>
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
          <el-text type="info" style="font-size:12px">
            修改邮箱后需要前往邮箱点击激活链接才能生效
          </el-text>
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
          <span>{{ formatTime(userInfo?.created_at) }}</span>
        </el-form-item>

        <el-form-item label="最后更新">
          <span>{{ formatTime(userInfo?.updated_at) }}</span>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            {{ submitting ? '保存中...' : '保存修改' }}
          </el-button>
        
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
import { uploadFile, getFileUrl,updateCurrentUserInfo } from '@/api'
import { formatTime } from '@/utils/format'
const userStore = useUserStore()
const submitting = ref(false)
const formRef = ref<InstanceType<typeof ElForm>>()

// 用户信息
const userInfo = computed(() => userStore.userInfo)

// 表单数据
const form = reactive({
  username: '',
  email: '',
  avatar: ''
})

// 表单校验规则
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

// ===== 加载用户信息 =====
function loadUserInfo() {
  if (userInfo.value) {
    form.username = userInfo.value.username || ''
    form.email = userInfo.value.email || ''
    form.avatar = userInfo.value.avatar || ''
  }
}

// 头像上传前校验：大小、格式
const beforeAvatarUpload = (file: File) => {
  const isImage = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
  if (!isImage) {
    ElMessage.error('只能上传 JPG / PNG / WebP 格式图片')
    return false
  }
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB')
    return false
  }
  return true
}

// 自定义上传请求
const uploadAvatar = async (options: { file: File }) => {
  try {
    const res = await uploadFile({ file: options.file })
    if (res.code === 0 && res.data) {
      // 拼接完整访问地址
      const avatarUrl = getFileUrl(res.data.storage_path)
      form.avatar = avatarUrl
      ElMessage.success('头像上传成功，请点击保存修改')
    }
  } catch (err) {
    ElMessage.error('头像上传失败')
  }
}

// 清空头像
const clearAvatar = () => {
  form.avatar = ''
  ElMessage.info('已清空头像，保存后生效')
}

// ===== 提交修改 =====
async function handleSubmit() {
  try {
    await formRef.value?.validate()
    submitting.value = true

    // 构建更新参数：只传变更字段
    const params: { username?: string; email?: string; avatar?: string } = {}
    if (form.username !== userInfo.value?.username) {
      params.username = form.username
    }
    if (form.email !== userInfo.value?.email) {
      params.email = form.email
    }
    if (form.avatar !== userInfo.value?.avatar) {
      params.avatar = form.avatar
    }

    // 检查是否有修改
    if (Object.keys(params).length === 0) {
      ElMessage.warning('没有修改任何信息')
      return
    }

    // 调用接口更新
    const res = await updateCurrentUserInfo(params)
    if (res.code === 0 && res.msg) {
      ElMessage.success(res.msg)
      // 刷新用户信息
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

// ===== 重置表单 =====
function resetForm() {
  if (userInfo.value) {
    form.username = userInfo.value.username || ''
    form.email = userInfo.value.email || ''
    form.avatar = userInfo.value.avatar || ''
  }
  formRef.value?.clearValidate()
}


// ===== 生命周期 =====
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
  background: #f0f2f5;
  min-height: calc(100vh - 60px);
}

.profile-card {
  max-width: 640px;
  margin: 0 auto;
  border-radius: 12px;
}

:deep(.profile-card .el-card__header) {
  padding: 16px 24px;
  border-bottom: 1px solid #ebeef5;
}

:deep(.profile-card .el-card__body) {
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
  color: #303133;
}

.card-title .el-icon {
  color: #409EFF;
  font-size: 20px;
}

.profile-form {
  max-width: 100%;
}

:deep(.profile-form .el-form-item) {
  margin-bottom: 22px;
}

:deep(.profile-form .el-input) {
  max-width: 400px;
}

/* 头像上传样式 */
.avatar-uploader :deep(.el-upload) {
  border: 1px dashed #dcdcdc;
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 120px;
  height: 120px;
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
  background: rgba(0,0,0,0.5);
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
  color: #8c8c8c;
}
.avatar-upload .el-icon {
  font-size: 32px;
  margin-bottom: 6px;
}

.clear-avatar-btn {
  margin-left: 16px;
}

/* 响应式 */
@media (max-width: 768px) {
  .profile-page {
    padding: 12px;
  }

  .profile-card {
    max-width: 100%;
  }

  :deep(.profile-card .el-card__body) {
    padding: 16px;
  }

  :deep(.profile-form .el-input) {
    max-width: 100%;
  }
}
</style>