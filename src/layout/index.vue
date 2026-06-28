<template>
  <el-container class="app-container">
    <!-- ===== 侧边栏（移动端为抽屉） ===== -->
    <el-aside
      class="app-aside"
      :class="{
        'aside-mobile-open': isMobile && mobileMenuVisible
      }"
      :width="isMobile ? '220px' : (collapsed ? '64px' : '220px')"
    >
      <!-- 移动端关闭遮罩 -->
      <div
        v-if="isMobile && mobileMenuVisible"
        class="mobile-mask"
        @click="closeMobileMenu"
      ></div>

      <div class="logo-wrapper">
        <!-- 移动端展开或桌面端非折叠时显示完整文字 -->
        <span class="logo-text" v-show="!isMobile ? !collapsed : mobileMenuVisible">📒 智慧笔记</span>
        <span class="logo-text" v-show="!isMobile ? collapsed : !mobileMenuVisible">📒</span>
      </div>

      <el-menu
        :collapse="isMobile ? !mobileMenuVisible : collapsed"
        router
        default-active="$route.path"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        class="app-menu"
        @select="handleMenuSelect"
      >
        <!-- 工作台 -->
        <el-menu-item index="/dashboard">
          <el-icon><DataBoard /></el-icon>
          <template #title>
            <span>工作台</span>
          </template>
        </el-menu-item>

        <!-- 笔记管理 -->
        <el-sub-menu index="note">
          <template #title>
            <el-icon><Document /></el-icon>
            <span>笔记管理</span>
          </template>
          <el-menu-item index="/note/list">笔记列表</el-menu-item>
          <el-menu-item index="/note/edit">新建笔记</el-menu-item>
          <el-menu-item index="/note/recycle">回收站</el-menu-item>
        </el-sub-menu>

        <!-- 分类标签 -->
        <el-sub-menu index="manage">
          <template #title>
            <el-icon><Menu /></el-icon>
            <span>分类标签</span>
          </template>
          <el-menu-item index="/manage/category">分类管理</el-menu-item>
          <el-menu-item index="/manage/tag">标签管理</el-menu-item>
        </el-sub-menu>

        <!-- 仅管理员可见：用户管理 -->
        <el-menu-item v-if="userStore.role === 'admin'" index="/manage/user">
          <el-icon><User /></el-icon>
          <template #title>
            <span>用户管理</span>
          </template>
        </el-menu-item>

        <!-- 文件管理 -->
        <el-menu-item index="/file">
          <el-icon><Folder /></el-icon>
          <template #title>
            <span>文件管理</span>
          </template>
        </el-menu-item>

        <!-- 分享管理 -->
        <el-menu-item index="/manage/share">
          <el-icon><Share /></el-icon>
          <template #title>
            <span>分享管理</span>
          </template>
        </el-menu-item>

        <!-- 个人设置 -->
        <el-menu-item index="/setting">
          <el-icon><User /></el-icon>
          <template #title>
            <span>个人设置</span>
          </template>
        </el-menu-item>

        <!-- 数据字典 -->
        <el-menu-item v-if="userStore.role === 'admin'" index="/system/config">
          <el-icon><Collection /></el-icon>
          <template #title>
            <span>数据字典</span>
          </template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- ===== 主内容区 ===== -->
    <el-container class="main-container">
      <!-- 顶部导航 -->
      <el-header class="app-header">
        <div class="header-left">
          <!-- 移动端：汉堡菜单按钮 -->
          <el-button
            v-if="isMobile"
            @click="toggleMobileMenu"
            circle
            class="menu-toggle-btn"
          >
            <el-icon><Menu /></el-icon>
          </el-button>

          <!-- 桌面端：折叠按钮 -->
          <el-button
            v-else
            @click="collapsed = !collapsed"
            circle
          >
            <el-icon><component :is="collapsed ? 'Expand' : 'Fold'" /></el-icon>
          </el-button>

          <span class="page-title">{{ currentPageTitle }}</span>
        </div>

        <div class="header-right">
          <el-badge :value="3" :hidden="false">
            <el-button circle :icon="Bell" size="default" />
          </el-badge>

          <el-dropdown @command="handleCommand" class="user-dropdown">
            <span class="user-info">
              <el-icon><User /></el-icon>
              <span class="username-text">{{ userStore.userInfo?.username }}</span>
              <span class="role-badge">{{ userStore.role === 'admin' ? '管理员' : '用户' }}</span>
              <el-icon class="dropdown-arrow"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  个人中心
                </el-dropdown-item>
                <el-dropdown-item command="setting">
                  <el-icon><Setting /></el-icon>
                  设置
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 主内容 -->
      <el-main class="app-main">
        <router-view v-slot="{ Component }">
          <keep-alive>
            <component :is="Component" />
          </keep-alive>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import {
  DataBoard,
  Document,
  Menu,
  Folder,
  Share,
  User,
  Bell,
  ArrowDown,
  Setting,
  SwitchButton,
  Expand,
  Fold,
  Collection,
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const collapsed = ref(false)
const isMobile = ref(false)
const mobileMenuVisible = ref(false)

// ===== 响应式检测 =====
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
  // 移动端默认收起侧边栏
  if (isMobile.value) {
    collapsed.value = true
    mobileMenuVisible.value = false
    document.body.style.overflow = ''
  }
}

// ===== 移动端菜单控制 =====
const toggleMobileMenu = () => {
  mobileMenuVisible.value = !mobileMenuVisible.value
  // 移动端菜单展开时禁止滚动
  document.body.style.overflow = mobileMenuVisible.value ? 'hidden' : ''
}

const closeMobileMenu = () => {
  mobileMenuVisible.value = false
  document.body.style.overflow = ''
}

const handleMenuSelect = () => {
  // 移动端点击菜单后自动关闭
  if (isMobile.value) {
    closeMobileMenu()
  }
}

// ===== 生命周期 =====
onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkMobile)
  document.body.style.overflow = ''
})

// ===== 页面标题 =====
const currentPageTitle = computed(() => {
  const meta = route.meta as any
  return meta?.title || route.name || '工作台'
})

// ===== 用户操作 =====
function handleCommand(cmd: string) {
  switch (cmd) {
    case 'logout':
      ElMessage.success('已安全退出')
      userStore.logout()
      break
    case 'profile':
      router.push('/user/profile')
      break
    case 'setting':
      router.push('/setting')
      break
    default:
      break
  }
}
</script>

<style scoped>
/* ===== 基础布局 ===== */
.app-container {
  height: 100vh;
  overflow: hidden;
}

/* ===== 侧边栏 ===== */
.app-aside {
  background-color: #304156;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  flex-shrink: 0;
  position: relative;
  z-index: 100;
}

/* ===== Logo ===== */
.logo-wrapper {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #273746;
  overflow: hidden;
  white-space: nowrap;
  flex-shrink: 0;
}

.logo-text {
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  letter-spacing: 1px;
  transition: all 0.3s;
}

/* ===== 菜单 ===== */
.app-menu {
  border-right: none;
  height: calc(100vh - 50px);
  overflow-y: auto;
  overflow-x: hidden;
}

.app-menu::-webkit-scrollbar {
  width: 4px;
}

.app-menu::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
}

.app-menu::-webkit-scrollbar-track {
  background: transparent;
}

:deep(.el-menu-item .el-icon),
:deep(.el-sub-menu .el-icon) {
  font-size: 18px;
  width: 24px;
  text-align: center;
}

/* 折叠时隐藏文字 */
:deep(.el-menu--collapse .el-menu-item span:not(.el-icon)),
:deep(.el-menu--collapse .el-sub-menu span:not(.el-icon)) {
  display: none;
}

:deep(.el-menu--collapse .el-menu-item .el-icon),
:deep(.el-menu--collapse .el-sub-menu .el-icon) {
  margin-right: 0;
}

:deep(.el-menu--collapse .el-menu-item),
:deep(.el-menu--collapse .el-sub-menu .el-sub-menu__title) {
  justify-content: center;
}

/* ===== 移动端侧边栏 ===== */
@media (max-width: 768px) {
  .app-aside {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    transform: translateX(-100%);
    width: 220px !important;
    box-shadow: 2px 0 12px rgba(0, 0, 0, 0.15);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* 展开时滑入 */
  .app-aside.aside-mobile-open {
    transform: translateX(0);
  }

  /* 遮罩 */
  .mobile-mask {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    z-index: -1;
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  /* 移动端菜单按钮 */
  .menu-toggle-btn {
    font-size: 20px;
  }

  /* 移动端用户信息简化 */
  .user-info .username-text {
    max-width: 60px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .user-info .role-badge {
    display: none;
  }

  .user-info .dropdown-arrow {
    margin-left: 2px;
  }
}

/* ===== 顶部导航 ===== */
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: #ffffff;
  border-bottom: 1px solid #e6e6e6;
  height: 60px;
  flex-shrink: 0;
  z-index: 50;
  position: relative;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.header-left .page-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 4px;
  transition: background 0.3s;
  color: #303133;
}

.user-info:hover {
  background: #f5f7fa;
}

.user-info .username-text {
  font-size: 14px;
}

.user-info .role-badge {
  font-size: 12px;
  color: #909399;
  background: #f4f4f5;
  padding: 0 8px;
  border-radius: 10px;
  line-height: 20px;
  margin: 0 2px;
}

.user-info .dropdown-arrow {
  font-size: 12px;
  color: #909399;
}

/* ===== 主内容 ===== */
.main-container {
  flex: 1;
  min-width: 0;
}

.app-main {
  padding: 16px;
  background: #f0f2f5;
  overflow-y: auto;
  height: calc(100vh - 60px);
}

.app-main::-webkit-scrollbar {
  width: 6px;
}

.app-main::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 4px;
}

.app-main::-webkit-scrollbar-track {
  background: transparent;
}

/* ===== 桌面端小屏适配 ===== */
@media (max-width: 1024px) and (min-width: 769px) {
  .app-header {
    padding: 0 16px;
  }

  .app-main {
    padding: 12px;
  }

  .user-info .username-text {
    max-width: 80px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

/* ===== 移动端超小屏 ===== */
@media (max-width: 480px) {
  .app-header {
    padding: 0 10px;
    height: 50px;
  }

  .app-main {
    padding: 10px;
    height: calc(100vh - 50px);
  }

  .header-left .page-title {
    font-size: 14px;
    max-width: 100px;
  }

  .app-aside {
    width: 220px !important;
  }

  .el-badge :deep(.el-badge__content) {
    transform: scale(0.8);
  }

  .header-right .el-button {
    padding: 8px;
  }

  .user-info {
    padding: 4px 6px;
  }

  .user-info .username-text {
    max-width: 40px;
    font-size: 13px;
  }
}
</style>