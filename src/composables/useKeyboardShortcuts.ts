import { onMounted, onBeforeUnmount } from 'vue'

interface ShortcutHandlers {
  onSave: () => void
  onUndo: () => void
  onRedo: () => void
  onSearch: () => void
  onBold?: () => void
  onItalic?: () => void
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const handleKeydown = (e: KeyboardEvent) => {
    // Ctrl/Cmd + S - 保存
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      handlers.onSave()
    }
    
    // Ctrl/Cmd + Z - 撤销
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault()
      handlers.onUndo()
    }
    
    // Ctrl/Cmd + Shift + Z 或 Ctrl/Cmd + Y - 重做
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
      e.preventDefault()
      handlers.onRedo()
    }
    
    // Ctrl/Cmd + F - 搜索
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault()
      handlers.onSearch()
    }
    
    // Ctrl/Cmd + B - 加粗
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault()
      handlers.onBold?.()
    }
    
    // Ctrl/Cmd + I - 斜体
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault()
      handlers.onItalic?.()
    }
  }
  
  function registerShortcuts() {
    document.addEventListener('keydown', handleKeydown)
  }
  
  function unregisterShortcuts() {
    document.removeEventListener('keydown', handleKeydown)
  }
  
  onMounted(registerShortcuts)
  onBeforeUnmount(unregisterShortcuts)
  
  return {
    registerShortcuts,
    unregisterShortcuts
  }
}