<!-- src/views/ShareManage.vue - 使用全局公共样式 -->
<template>
  <div class="share-manage page-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">
          <el-icon><ShareIcon /></el-icon>
          分享管理
        </h2>
        <span class="page-count">共 {{ tableData.length }} 个分享</span>
      </div>
      <div class="header-right">
        <el-button :icon="Refresh" @click="load" :loading="loading">刷新</el-button>
      </div>
    </div>

    <!-- 分享列表 -->
    <el-card class="list-card page-card" shadow="hover">
      <el-table
        :data="tableData"
        border
        v-loading="loading"
        style="width: 100%"
        class="page-table"
      >
        <el-table-column label="笔记标题" prop="title" min-width="160">
          <template #default="{ row }">
            <span class="title-text">{{ row.title || '无标题笔记' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="访问密码" prop="access_password" width="120" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.access_password" type="warning" size="small" class="tag-warning">
              <el-icon><Lock /></el-icon>
              已加密
            </el-tag>
            <el-tag v-else type="success" size="small" plain class="tag-success">
              <el-icon><Unlock /></el-icon>
              公开
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="创建时间" prop="created_at" width="170" align="center">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>

        <el-table-column label="过期时间" prop="expire_at" width="170" align="center">
          <template #default="{ row }">
            <span v-if="row.expire_at">{{ formatTime(row.expire_at) }}</span>
            <el-tag v-else size="small" type="info" plain class="tag-info">永久</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              v-if="isExpired(row.expire_at)"
              type="danger"
              size="small"
              class="tag-danger"
            >
              已过期
            </el-tag>
            <el-tag v-else type="success" size="small" plain class="tag-success">
              有效
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              size="small"
              type="primary"
              link
              class="btn-link-primary"
              @click="copyLink(row.share_code)"
            >
              <el-icon><LinkIcon /></el-icon>
              复制链接
            </el-button>
            <el-button
              size="small"
              type="danger"
              link
              class="btn-link-danger"
              @click="handleDelete(row.id)"
            >
              <el-icon><Delete /></el-icon>
              销毁
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态 -->
      <div v-if="tableData.length === 0 && !loading" class="empty-state">
        <el-empty description="暂无分享，去笔记列表创建吧" :image-size="120">
          <el-button type="primary" @click="$router.push('/note/list')">去笔记列表</el-button>
        </el-empty>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getShareList, deleteShare, type ShareItem } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { formatTime } from '@/utils/format'
import { 
  Share as ShareIcon,
  Refresh, 
  Lock, 
  Unlock, 
  Link as LinkIcon, 
  Delete 
} from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(false)
const tableData = ref<ShareItem[]>([])

// ===== 加载数据 =====
async function load() {
  loading.value = true
  try {
    const res = await getShareList()
    tableData.value = Array.isArray(res?.data) ? res.data : []
  } catch (error) {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// ===== 复制链接 =====
async function copyLink(code: string) {
  const url = `${location.origin}/share/${code}`
  try {
    await navigator.clipboard.writeText(url)
    ElMessage.success('链接已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败，请手动复制')
  }
}

// ===== 销毁分享 =====
async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm('销毁后链接将无法访问，确定继续吗？', '提示', {
      confirmButtonText: '确定销毁',
      cancelButtonText: '取消',
      type: 'warning',
      confirmButtonClass: 'el-button--danger'
    })
    await deleteShare(id)
    ElMessage.success('已销毁')
    load()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('销毁失败')
    }
  }
}

// ===== 判断是否过期 =====
function isExpired(expireAt: string) {
  if (!expireAt) return false
  return new Date(expireAt) < new Date()
}

// ===== 生命周期 =====
onMounted(load)
</script>

<style scoped>
/* ============================================================
   ShareManage 专用样式
   ============================================================ */

.share-manage {
  padding: 24px;
}

/* ===== 标题文字 ===== */
.title-text {
  color: var(--text-primary);
  font-weight: 500;
  transition: color var(--transition-duration);
}

/* ===== 图标颜色适配 ===== */
:deep(.el-icon) {
  color: var(--text-regular);
  transition: color var(--transition-duration);
}

:deep(.el-tag .el-icon) {
  color: inherit;
}

/* ============================================================
   响应式
   ============================================================ */
@media (max-width: 768px) {
  .share-manage {
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
}

@media (max-width: 480px) {
  .share-manage {
    padding: 8px;
  }
}
</style>