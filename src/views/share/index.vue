<!-- src/views/ShareView.vue - 宽度调大 -->
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
        <el-button type="primary" size="large" @click="handleVerify" :loading="loading" block>
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

async function handleVerify() {
  loading.value = true
  errorMsg.value = ''
  
  try {
    const res = await getShareDetail(shareCode, pwd.value || undefined)
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

onMounted(handleVerify)
</script>

<style scoped>
.share-wrap {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: var(--main-bg);
}

.share-card {
  max-width: 1000px;  /* 从 820px 调整到 1000px */
  width: 100%;
  border-radius: var(--radius-lg);
  background: var(--card-bg) !important;
  border-color: var(--border-color) !important;
}

.share-card :deep(.el-card__body) {
  padding: 48px 56px;  /* 内边距调大 */
}

/* 密码验证 */
.share-logo {
  text-align: center;
  margin-bottom: 28px;
}
.share-logo .el-icon {
  color: var(--theme-color);
  margin-bottom: 12px;
}
.share-logo h2 {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}
.share-logo .subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}
.pwd-form {
  max-width: 420px;  /* 从 400px 调整到 420px */
  margin: 0 auto;
}
.pwd-form .el-button {
  margin-top: 16px;
  width: 100%;
}
.footer-tip {
  text-align: center;
  margin-top: 20px;
  font-size: 13px;
  color: var(--text-placeholder);
}

/* 笔记内容 */
.note-title {
  font-size: 28px;  /* 从 26px 调整到 28px */
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 12px 0;
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
  color: var(--text-secondary);
}
.meta-item .el-icon {
  font-size: 16px;
}

/* Markdown 内容 */
.note-content {
  font-size: 16px;  /* 从 15px 调整到 16px */
  line-height: 1.9;  /* 从 1.8 调整到 1.9 */
  color: var(--text-primary);
  min-height: 100px;
}
.note-content :deep(h1),
.note-content :deep(h2),
.note-content :deep(h3) {
  color: var(--text-primary);
  margin: 24px 0 12px;
}
.note-content :deep(p) {
  color: var(--text-regular);
  margin: 12px 0;
}
.note-content :deep(img) {
  max-width: 100%;
  border-radius: var(--radius-sm);
}
.note-content :deep(pre) {
  background: var(--bg-gray);
  padding: 16px 20px;  /* 内边距调大 */
  border-radius: var(--radius-sm);
  overflow-x: auto;
}
.note-content :deep(code) {
  background: var(--bg-gray);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-size: 14px;
  color: var(--text-primary);
}
.note-content :deep(pre code) {
  background: transparent;
  padding: 0;
  color: var(--text-regular);
}
.note-content :deep(blockquote) {
  border-left: 4px solid var(--theme-color);
  padding: 12px 20px;  /* 内边距调大 */
  margin: 12px 0;
  background: var(--bg-gray);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  color: var(--text-regular);
}
.note-content :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 12px 0;
}
.note-content :deep(th),
.note-content :deep(td) {
  border: 1px solid var(--border-color);
  padding: 10px 14px;  /* 内边距调大 */
  color: var(--text-regular);
}
.note-content :deep(th) {
  background: var(--bg-gray);
  color: var(--text-primary);
  font-weight: 600;
}
.note-content :deep(a) {
  color: var(--theme-color);
  text-decoration: none;
}
.note-content :deep(a:hover) {
  color: var(--theme-color-hover);
  text-decoration: underline;
}

.note-footer {
  margin-top: 32px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
  text-align: center;
  font-size: 13px;
  color: var(--text-placeholder);
}
.footer-brand {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-placeholder);
}

/* 错误状态 */
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
  color: var(--text-primary);
  margin: 0 0 8px 0;
}
.error-content .subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 20px 0;
}

/* 暗色主题额外适配 */
.dark-theme .note-content :deep(pre),
.dark-theme .note-content :deep(code),
.dark-theme .note-content :deep(blockquote),
.dark-theme .note-content :deep(th) {
  background: var(--bg-dark);
}

@media (max-width: 768px) {
  .share-wrap {
    padding: 20px 12px;
  }
  .share-card :deep(.el-card__body) {
    padding: 24px 20px;
  }
  .share-card {
    max-width: 100%;
  }
  .note-title {
    font-size: 22px;
  }
  .share-logo h2 {
    font-size: 20px;
  }
  .note-content {
    font-size: 15px;
  }
  .pwd-form {
    max-width: 100%;
  }
}

@media (max-width: 480px) {
  .share-wrap {
    padding: 12px 8px;
  }
  .share-card :deep(.el-card__body) {
    padding: 16px 12px;
  }
  .note-title {
    font-size: 18px;
  }
  .note-content {
    font-size: 14px;
  }
  .share-logo .el-icon {
    font-size: 36px !important;
  }
  .error-content h2 {
    font-size: 18px;
  }
}
</style>