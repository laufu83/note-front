import { ref, onMounted } from 'vue'

export function useNoteStats(contentGetter: () => string) {
  const wordCount = ref(0)
  const charCount = ref(0)
  const readTime = ref(0)
  const paragraphCount = ref(0)
  
  function updateStats() {
    const content = contentGetter()
    
    // 字数（去除空白字符）
    const cleanContent = content.replace(/\s/g, '')
    charCount.value = cleanContent.length
    wordCount.value = cleanContent.length // 中文按字算
    
    // 段落数
    paragraphCount.value = content.split('\n').filter(p => p.trim()).length
    
    // 阅读时间（按 300 字/分钟）
    readTime.value = Math.ceil(charCount.value / 300)
  }
  
  // 每秒更新一次
  let timer: number | null = null
  
  function startWatching() {
    updateStats()
    timer = window.setInterval(updateStats, 1000)
  }
  
  function stopWatching() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }
  
  onMounted(startWatching)
  
  return {
    wordCount,
    charCount,
    readTime,
    paragraphCount,
    updateStats,
    startWatching,
    stopWatching
  }
}