import { ref, watch } from 'vue'

const DARK_MODE_KEY = 'dark_mode'

export function useDarkMode() {
  const isDarkMode = ref(localStorage.getItem(DARK_MODE_KEY) === 'true')
  
  function toggleDarkMode() {
    isDarkMode.value = !isDarkMode.value
    localStorage.setItem(DARK_MODE_KEY, String(isDarkMode.value))
    updateTheme()
  }
  
  function updateTheme() {
    if (isDarkMode.value) {
      document.documentElement.classList.add('dark-mode')
      document.documentElement.style.setProperty('--bg-color', '#1e1e1e')
      document.documentElement.style.setProperty('--text-color', '#d4d4d4')
    } else {
      document.documentElement.classList.remove('dark-mode')
      document.documentElement.style.setProperty('--bg-color', '#ffffff')
      document.documentElement.style.setProperty('--text-color', '#303133')
    }
  }
  
  // 监听变化
  watch(isDarkMode, updateTheme)
  
  // 初始化
  updateTheme()
  
  return {
    isDarkMode,
    toggleDarkMode
  }
}