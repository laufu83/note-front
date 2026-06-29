<template>
  <el-container class="app-container" :class="themeClass">
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
        <span class="logo-text" v-show="!isMobile ? !collapsed : mobileMenuVisible">📒 智慧笔记</span>
        <span class="logo-text" v-show="!isMobile ? collapsed : !mobileMenuVisible">📒</span>
      </div>

      <el-menu
        :collapse="isMobile ? !mobileMenuVisible : collapsed"
        router
        default-active="$route.path"
        background-color="var(--menu-bg)"
        text-color="var(--menu-text)"
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

          <span class="header-page-title">{{ currentPageTitle }}</span>
        </div>

        <div class="header-right">
          <!-- 主题切换按钮 -->
          <el-button @click="toggleTheme" circle class="theme-toggle-btn">
            <el-icon>
              <component :is="isDark ? 'Sunny' : 'Moon'" />
            </el-icon>
          </el-button>

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
  Sunny,
  Moon,
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const collapsed = ref(false)
const isMobile = ref(false)
const mobileMenuVisible = ref(false)
const isDark = ref(false)

// ===== 主题管理 =====
const THEME_KEY = 'app-theme'

const getSystemTheme = (): boolean => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

const loadTheme = () => {
  const saved = localStorage.getItem(THEME_KEY)
  if (saved !== null) {
    isDark.value = saved === 'dark'
  } else {
    isDark.value = getSystemTheme()
  }
  applyTheme(isDark.value)
}

const applyTheme = (dark: boolean) => {
  const root = document.documentElement
  if (dark) {
    root.classList.add('dark-theme')
  } else {
    root.classList.remove('dark-theme')
  }
  localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light')
}

const toggleTheme = () => {
  isDark.value = !isDark.value
  applyTheme(isDark.value)
  ElMessage.success(`已切换至${isDark.value ? '暗色' : '亮色'}模式`)
}

let systemThemeListener: ((e: MediaQueryListEvent) => void) | null = null

const setupSystemThemeListener = () => {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  systemThemeListener = (e: MediaQueryListEvent) => {
    if (!localStorage.getItem(THEME_KEY)) {
      isDark.value = e.matches
      applyTheme(isDark.value)
    }
  }
  mediaQuery.addEventListener('change', systemThemeListener)
}

const themeClass = computed(() => ({
  'dark-mode': isDark.value
}))

// ===== 响应式检测 =====
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
  if (isMobile.value) {
    collapsed.value = true
    mobileMenuVisible.value = false
    document.body.style.overflow = ''
  }
}

// ===== 移动端菜单控制 =====
const toggleMobileMenu = () => {
  mobileMenuVisible.value = !mobileMenuVisible.value
  document.body.style.overflow = mobileMenuVisible.value ? 'hidden' : ''
}

const closeMobileMenu = () => {
  mobileMenuVisible.value = false
  document.body.style.overflow = ''
}

const handleMenuSelect = () => {
  if (isMobile.value) {
    closeMobileMenu()
  }
}

// ===== 生命周期 =====
onMounted(() => {
  loadTheme()
  setupSystemThemeListener()
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkMobile)
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  if (systemThemeListener) {
    mediaQuery.removeEventListener('change', systemThemeListener)
  }
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
/* ============================================================
   Layout 组件专用样式
   ============================================================ */

/* ===== 应用容器 ===== */
.app-container {
  height: 100vh;
  overflow: hidden;
}

/* ===== 侧边栏 ===== */
.app-aside {
  background-color: var(--menu-bg);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  flex-shrink: 0;
  position: relative;
  z-index: 100;
}

/* ===== Logo 区域 ===== */
.logo-wrapper {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--menu-logo-bg);
  overflow: hidden;
  white-space: nowrap;
  flex-shrink: 0;
  transition: background 0.3s;
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
    box-shadow: 2px 0 12px var(--card-shadow);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .app-aside.aside-mobile-open {
    transform: translateX(0);
  }

  .mobile-mask {
    position: fixed;
    inset: 0;
    background: var(--mask-bg);
    z-index: -1;
    animation: fadeIn 0.3s ease;
  }

  .menu-toggle-btn {
    font-size: 20px;
  }

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
  background: var(--header-bg);
  border-bottom: 1px solid var(--border-color);
  height: 60px;
  flex-shrink: 0;
  z-index: 50;
  position: relative;
  transition: background 0.3s, border-color 0.3s;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.header-left .header-page-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.3s;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* ===== 主题切换按钮 ===== */
.theme-toggle-btn {
  transition: transform 0.5s ease;
}

.theme-toggle-btn:hover {
  transform: rotate(30deg);
}

/* ===== 用户信息 ===== */
.user-info {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 4px;
  transition: background 0.3s;
  color: var(--text-primary);
}

.user-info:hover {
  background: var(--btn-hover-bg);
}

.user-info .username-text {
  font-size: 14px;
}

.user-info .role-badge {
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--border-light);
  padding: 0 8px;
  border-radius: 10px;
  line-height: 20px;
  margin: 0 2px;
  transition: background 0.3s, color 0.3s;
}

.user-info .dropdown-arrow {
  font-size: 12px;
  color: var(--text-secondary);
}

/* ===== 主内容 ===== */
.main-container {
  flex: 1;
  min-width: 0;
}

.app-main {
  padding: 16px;
  background: var(--main-bg);
  overflow-y: auto;
  height: calc(100vh - 60px);
  transition: background 0.3s;
}

/* ============================================================
   响应式
   ============================================================ */

/* 桌面端小屏适配 */
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

/* 移动端超小屏 */
@media (max-width: 480px) {
  .app-header {
    padding: 0 10px;
    height: 50px;
  }

  .app-main {
    padding: 10px;
    height: calc(100vh - 50px);
  }

  .header-left .header-page-title {
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

/* ============================================================
   fadeIn 动画（用于移动端遮罩）
   ============================================================ */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>