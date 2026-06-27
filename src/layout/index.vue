<template>
  <el-container class="app-container">
    <!-- ===== 侧边栏 ===== -->
    <el-aside :width="collapsed ? '64px' : '220px'" class="app-aside">
      <div class="logo-wrapper">
        <span class="logo-text" v-show="!collapsed">📒 智慧笔记</span>
        <span class="logo-text" v-show="collapsed">📒</span>
      </div>

      <el-menu
        :collapse="collapsed"
        router
        default-active="$route.path"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        class="app-menu"
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
      </el-menu>
    </el-aside>

    <!-- ===== 主内容区 ===== -->
    <el-container class="main-container">
      <!-- 顶部导航 -->
      <el-header class="app-header">
        <div class="header-left">
          <el-button
            @click="collapsed = !collapsed"
            :icon="collapsed ? 'Expand' : 'Fold'"
            circle
          />
          <span class="page-title">{{ currentPageTitle }}</span>
        </div>

        <div class="header-right">
          <el-badge :value="3" :hidden="false">
            <el-button circle :icon="Bell" />
          </el-badge>

          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-icon><User /></el-icon>
              <span>{{ userStore.userInfo?.username}} ({{ userStore.role === 'admin' ? '系统管理员' : '普通用户' }})</span>            
              <el-icon><ArrowDown /></el-icon>
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
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
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
  SwitchButton
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const collapsed = ref(false)

const currentPageTitle = computed(() => {
  const meta = route.meta as any
  return meta?.title || route.name || '工作台'
})

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
.app-container {
  height: 100vh;
}

/* ===== 侧边栏 ===== */
.app-aside {
  background-color: #304156;
  transition: width 0.3s;
  overflow: hidden;
  flex-shrink: 0;
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

/* 折叠时隐藏文字，保留图标 */
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

/* ===== 顶部导航 ===== */
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: #ffffff;
  border-bottom: 1px solid #e6e6e6;
  height: 60px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 4px;
  transition: background 0.3s;
  color: #303133;
}

.user-info:hover {
  background: #f5f7fa;
}

/* ===== 主内容 ===== */
.app-main {
  padding: 0;
  background: #f0f2f5;
  overflow-y: auto;
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

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .app-aside {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 100;
    transform: translateX(-100%);
    transition: transform 0.3s;
  }

  .app-aside:not([style*="width: 64px"]) {
    transform: translateX(0);
  }

  .app-aside[style*="width: 64px"] {
    transform: translateX(-100%);
  }

  .app-header {
    padding: 0 12px;
    height: 50px;
  }

  .page-title {
    font-size: 14px;
  }

  .user-info span:not(:first-child) {
    display: none;
  }
}
</style>