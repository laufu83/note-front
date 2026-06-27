<!-- src/views/ShareView.vue - 修复类型问题 -->

<template>
  <div class="share-wrap">
    <!-- 密码验证 -->
    <el-card v-if="needPwd" class="share-card" shadow="hover">
      <div class="share-logo">
        <el-icon :size="48"><Document /></el-icon>
        <h2>笔记分享</h2>
        <p class="subtitle">此笔记已加密，请输入访问密码</p>
      </div>

      <el-form @submit.prevent="handleVerify" class="pwd-form">
        <el-input
          v-model="pwd"
          placeholder="请输入访问密码"
          size="large"
          show-password
          @keyup.enter="handleVerify"
        >
          <template #prefix>
            <el-icon><Lock /></el-icon>
          </template>
        </el-input>
        <el-button
          type="primary"
          size="large"
          @click="handleVerify"
          :loading="loading"
          block
        >
          {{ loading ? '验证中...' : '验证密码' }}
        </el-button>
      </el-form>

      <div class="footer-tip">
        <span>💡 提示：密码错误或笔记不存在时无法访问</span>
      </div>
    </el-card>

    <!-- 笔记内容 -->
    <el-card v-else-if="detail" class="share-card" shadow="hover">
      <div class="note-header">
        <h2 class="note-title">{{ detail.title || '无标题笔记' }}</h2>
        <div class="note-meta">
          <span class="meta-item">
            <el-icon><Clock /></el-icon>
            更新时间：{{ formatTime(detail.updated_at) }}
          </span>
          <span class="meta-item" v-if="detail.view_count !== undefined">
            <el-icon><View /></el-icon>
            浏览 {{ detail.view_count }} 次
          </span>
        </div>
      </div>

      <el-divider />

      <div class="note-content" v-html="html"></div>

      <div class="note-footer">
        <span>📒 智慧笔记 · 分享</span>
        <span class="footer-brand">—— 记录灵感，高效生活</span>
      </div>
    </el-card>

    <!-- 错误状态 -->
    <el-card v-if="errorMsg" class="share-card error-card" shadow="hover">
      <div class="error-content">
        <el-icon :size="48"><Warning /></el-icon>
        <h2>{{ errorMsg }}</h2>
        <p class="subtitle">分享链接可能已失效或不存在</p>
        <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getShareDetail, type ShareDetail } from '@/api'
import { CODE } from '@/types/response'
import { ElMessage } from 'element-plus'
import { marked } from 'marked'
import { Document, Lock, Clock, View, Warning } from '@element-plus/icons-vue'
import { formatTime } from '@/utils/format'
const route = useRoute()

const shareCode = route.params.code as string
const urlPwd = route.query.pwd as string

const needPwd = ref(false)
const loading = ref(false)
const errorMsg = ref('')
const pwd = ref(urlPwd || '')
const detail = ref<ShareDetail | null>(null)
const html = ref('')

// ===== 验证密码/获取分享内容 =====
async function handleVerify() {
  loading.value = true
  errorMsg.value = ''
  
  try {
    const res = await getShareDetail(shareCode, pwd.value || undefined)
    // 安全获取数据
    const data = res?.data
    if (!data) {
      errorMsg.value = '分享数据为空'
      return
    }
    
    detail.value = data
    html.value = marked.parse(data.content || '') as string
    needPwd.value = false
    if (!urlPwd) ElMessage.success('验证成功')
  } catch (err: any) {
    // 检查是否需要密码（401 未授权）
    if (err.code === CODE.UNAUTH) {
      needPwd.value = true
      if (err.msg?.includes('密码错误')) {
        ElMessage.error(err.msg)
        pwd.value = ''
      }
    } else if (err.code === CODE.NOT_FOUND) {
      errorMsg.value = '分享链接不存在'
    } else {
      errorMsg.value = err.msg || '分享链接已失效'
    }
  } finally {
    loading.value = false
  }
}

// ===== 初始化 =====
async function init() {
  await handleVerify()
}


onMounted(init)
</script>

<style scoped>
.share-wrap {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: linear-gradient(145deg, #f0f2f5, #e4e7ed);
}

/* ===== 卡片 ===== */
.share-card {
  max-width: 820px;
  width: 100%;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}

:deep(.share-card .el-card__body) {
  padding: 40px 48px;
}

/* ===== 密码验证页 ===== */
.share-logo {
  text-align: center;
  margin-bottom: 28px;
}

.share-logo .el-icon {
  color: #409EFF;
  margin-bottom: 12px;
}

.share-logo h2 {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.share-logo .subtitle {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.pwd-form {
  max-width: 400px;
  margin: 0 auto;
}

.pwd-form .el-input {
  width: 100%;
}

.pwd-form .el-button {
  margin-top: 16px;
  width: 100%;
}

.footer-tip {
  text-align: center;
  margin-top: 20px;
  font-size: 13px;
  color: #c0c4cc;
}

/* ===== 笔记内容页 ===== */
.note-header {
  margin-bottom: 4px;
}

.note-title {
  font-size: 26px;
  font-weight: 700;
  color: #303133;
  margin: 0 0 12px 0;
  word-break: break-word;
}

.note-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #909399;
}

.meta-item .el-icon {
  font-size: 16px;
}

/* ===== 笔记内容 ===== */
.note-content {
  font-size: 15px;
  line-height: 1.8;
  color: #303133;
  min-height: 100px;
}

.note-content :deep(h1),
.note-content :deep(h2),
.note-content :deep(h3) {
  margin-top: 24px;
  margin-bottom: 12px;
}

.note-content :deep(p) {
  margin: 12px 0;
}

.note-content :deep(img) {
  max-width: 100%;
  border-radius: 8px;
}

.note-content :deep(pre) {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
}

.note-content :deep(code) {
  background: #f5f7fa;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 14px;
}

.note-content :deep(blockquote) {
  border-left: 4px solid #409EFF;
  padding: 8px 16px;
  margin: 12px 0;
  background: #f5f7fa;
  border-radius: 0 4px 4px 0;
}

.note-content :deep(ul),
.note-content :deep(ol) {
  padding-left: 24px;
}

.note-content :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 12px 0;
}

.note-content :deep(th),
.note-content :deep(td) {
  border: 1px solid #dcdfe6;
  padding: 8px 12px;
}

.note-content :deep(th) {
  background: #f5f7fa;
}

.note-footer {
  margin-top: 32px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
  text-align: center;
  font-size: 13px;
  color: #c0c4cc;
}

.footer-brand {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #d0d4dd;
}

/* ===== 错误状态 ===== */
.error-card {
  max-width: 480px;
}

.error-content {
  text-align: center;
  padding: 20px 0;
}

.error-content .el-icon {
  color: #f56c6c;
  margin-bottom: 16px;
}

.error-content h2 {
  font-size: 22px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.error-content .subtitle {
  font-size: 14px;
  color: #909399;
  margin: 0 0 20px 0;
}

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .share-wrap {
    padding: 20px 12px;
  }

  :deep(.share-card .el-card__body) {
    padding: 24px 20px;
  }

  .note-title {
    font-size: 20px;
  }

  .share-logo h2 {
    font-size: 20px;
  }

  .note-content {
    font-size: 14px;
  }

  .pwd-form {
    max-width: 100%;
  }
}
</style>