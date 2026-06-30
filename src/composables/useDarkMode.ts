// src/composables/useDarkMode.ts

import { ref, watch, onMounted, onBeforeUnmount } from 'vue';

const DARK_MODE_KEY = 'dark_mode';

// 系统暗色模式媒体查询
const systemDarkQuery = window.matchMedia('(prefers-color-scheme: dark)');

export function useDarkMode() {
  const isDarkMode = ref(localStorage.getItem(DARK_MODE_KEY) === 'true');

  /**
   * 更新暗色主题
   * 通过 class 控制，与 CSS 变量系统配合
   */
  function updateTheme() {
    if (isDarkMode.value) {
      document.documentElement.classList.add('dark-mode');
      // ⭐ 同时添加 dark-theme 类（与你的 common.scss 中的 .dark-theme 对应）
      document.documentElement.classList.add('dark-theme');
      // 设置 color-scheme（浏览器原生暗色支持）
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark-mode');
      document.documentElement.classList.remove('dark-theme');
      document.documentElement.style.colorScheme = 'light';
    }

    // ⭐ 同步更新 body 类（确保所有样式生效）
    if (isDarkMode.value) {
      document.body.classList.add('dark-mode');
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-mode');
      document.body.classList.remove('dark-theme');
    }

    // ⭐ 更新 meta 标签（可选，用于移动端浏览器状态栏）
    updateMetaTheme();
  }

  /**
   * 更新 meta 标签（移动端状态栏适配）
   */
  function updateMetaTheme() {
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', isDarkMode.value ? '#1a1a2e' : '#ffffff');
  }

  /**
   * 切换暗色模式
   */
  function toggleDarkMode() {
    isDarkMode.value = !isDarkMode.value;
    localStorage.setItem(DARK_MODE_KEY, String(isDarkMode.value));
    updateTheme();
  }

  /**
   * 设置暗色模式（直接设置）
   */
  function setDarkMode(value: boolean) {
    if (isDarkMode.value !== value) {
      isDarkMode.value = value;
      localStorage.setItem(DARK_MODE_KEY, String(value));
      updateTheme();
    }
  }

  /**
   * 跟随系统主题（不覆盖用户偏好）
   */
  function followSystem() {
    // 如果用户没有手动设置过，跟随系统
    if (localStorage.getItem(DARK_MODE_KEY) === null) {
      isDarkMode.value = systemDarkQuery.matches;
      updateTheme();
    }
  }

  /**
   * 重置为系统偏好
   */
  function resetToSystem() {
    localStorage.removeItem(DARK_MODE_KEY);
    isDarkMode.value = systemDarkQuery.matches;
    updateTheme();
  }

  // ============================================================
  // 监听系统主题变化
  // ============================================================
  const handleSystemChange = (e: MediaQueryListEvent) => {
    // 只有在用户没有手动设置过的情况下才跟随系统
    if (localStorage.getItem(DARK_MODE_KEY) === null) {
      isDarkMode.value = e.matches;
      updateTheme();
    }
  };

  // ============================================================
  // 监听用户手动设置的变化（跨标签页同步）
  // ============================================================
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === DARK_MODE_KEY) {
      const newValue = e.newValue === 'true';
      if (isDarkMode.value !== newValue) {
        isDarkMode.value = newValue;
        updateTheme();
      }
    }
  };

  // ============================================================
  // 生命周期
  // ============================================================
  onMounted(() => {
    // 初始化主题
    updateTheme();
    
    // 如果没有用户偏好，跟随系统
    if (localStorage.getItem(DARK_MODE_KEY) === null) {
      isDarkMode.value = systemDarkQuery.matches;
      updateTheme();
    }

    // 监听系统主题变化
    systemDarkQuery.addEventListener('change', handleSystemChange);
    
    // 监听跨标签页存储变化
    window.addEventListener('storage', handleStorageChange);
  });

  onBeforeUnmount(() => {
    systemDarkQuery.removeEventListener('change', handleSystemChange);
    window.removeEventListener('storage', handleStorageChange);
  });

  // ============================================================
  // watch 监听（备用）
  // ============================================================
  watch(isDarkMode, updateTheme);

  return {
    // 状态
    isDarkMode,
    
    // 方法
    toggleDarkMode,
    setDarkMode,
    followSystem,
    resetToSystem,
    updateTheme,
    
    // 常量
    DARK_MODE_KEY,
  };
}