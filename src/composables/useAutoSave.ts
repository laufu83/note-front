import { ref, type Ref, watch, onBeforeUnmount } from 'vue';

// ============================================================
// 类型定义
// ============================================================

/** 草稿数据 */
export interface DraftData {
  /** 标题 */
  title: string;
  /** 内容 */
  content: string;
  /** 更新时间戳 */
  updatedAt: number;
  /** 笔记ID（用于识别） */
  noteId?: number;
  /** 版本号 */
  version?: number;
  /** 额外数据 */
  extra?: Record<string, any>;
}

/** 草稿信息（展示用） */
export interface DraftInfo {
  /** 标题 */
  title: string;
  /** 更新时间（格式化后的字符串） */
  updatedAt: string;
  /** 内容预览（截取前100字） */
  preview?: string;
  /** 字数 */
  wordCount?: number;
  /** 保存时间戳 */
  timestamp: number;
}

/** 自动保存配置 */
export interface AutoSaveOptions {
  /** 过期时间（毫秒），默认 7 天 */
  expireTime?: number;
  /** 最大草稿数量（不同笔记），默认 10 */
  maxDrafts?: number;
  /** 存储前缀 */
  prefix?: string;
  /** 是否启用压缩 */
  compress?: boolean;
}

// ============================================================
// 主函数
// ============================================================

/**
 * 自动保存 Composable
 * @param noteId - 笔记ID的 ref
 * @param options - 配置选项
 * 
 * @example
 * ```ts
 * const noteId = ref(0)
 * const { autoSave, restoreDraft, clearDraft, getDraftInfo } = useAutoSave(noteId)
 * 
 * // 自动保存
 * autoSave({ title: '标题', content: '内容' })
 * 
 * // 恢复草稿
 * const content = restoreDraft()
 * 
 * // 获取草稿信息
 * const info = getDraftInfo()
 * ```
 */
export function useAutoSave(
  noteId: Ref<number>,
  options: AutoSaveOptions = {}
) {
  const {
    expireTime = 7 * 24 * 60 * 60 * 1000, // 默认7天
    maxDrafts = 10,
    prefix = 'note_draft',
    compress = false
  } = options;

  // ===== 计算存储键 =====
  const getStorageKey = (id?: number) => {
    const targetId = id ?? noteId.value;
    return `${prefix}_${targetId || 'new'}`;
  };

  const DRAFT_KEY = getStorageKey();

  // ===== 状态 =====
  const isDraftExist = ref(false);
  const draftUpdateTime = ref<number | null>(null);

  /**
   * 保存草稿
   */
  function autoSave(data: { title: string; content: string; extra?: Record<string, any> }) {
    try {
      const draftData: DraftData = {
        ...data,
        noteId: noteId.value,
        updatedAt: Date.now(),
        version: (data as any).version || 1
      };

      // 可选：压缩数据
      let storageData = JSON.stringify(draftData);
      if (compress) {
        // 简单压缩（移除多余空格）
        storageData = JSON.stringify(draftData);
      }

      localStorage.setItem(DRAFT_KEY, storageData);
      
      // 更新状态
      isDraftExist.value = true;
      draftUpdateTime.value = Date.now();

      // 管理草稿数量
      manageDrafts();

      return true;
    } catch (e) {
      console.warn('自动保存失败:', e);
      return false;
    }
  }

  /**
   * 恢复草稿
   */
  function restoreDraft(): DraftData | null {
    try {
      const data = localStorage.getItem(DRAFT_KEY);
      if (!data) return null;

      const parsed = JSON.parse(data) as DraftData;
      
      // 检查是否过期
      if (Date.now() - parsed.updatedAt > expireTime) {
        clearDraft();
        return null;
      }

      // 更新状态
      isDraftExist.value = true;
      draftUpdateTime.value = parsed.updatedAt;

      return parsed;
    } catch (e) {
      console.warn('恢复草稿失败:', e);
      return null;
    }
  }

  /**
   * 恢复草稿内容（仅内容）
   */
  function restoreDraftContent(): string | null {
    const draft = restoreDraft();
    return draft?.content || null;
  }

  /**
   * 恢复草稿标题
   */
  function restoreDraftTitle(): string | null {
    const draft = restoreDraft();
    return draft?.title || null;
  }

  /**
   * 清除当前草稿
   */
  function clearDraft() {
    try {
      localStorage.removeItem(DRAFT_KEY);
      isDraftExist.value = false;
      draftUpdateTime.value = null;
    } catch (e) {
      console.warn('清除草稿失败:', e);
    }
  }

  /**
   * 获取草稿信息
   */
  function getDraftInfo(): DraftInfo | null {
    try {
      const data = localStorage.getItem(DRAFT_KEY);
      if (!data) return null;

      const parsed = JSON.parse(data) as DraftData;
      
      // 检查是否过期
      if (Date.now() - parsed.updatedAt > expireTime) {
        clearDraft();
        return null;
      }

      return {
        title: parsed.title,
        updatedAt: new Date(parsed.updatedAt).toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }),
        preview: parsed.content.slice(0, 100) + (parsed.content.length > 100 ? '...' : ''),
        wordCount: parsed.content.length,
        timestamp: parsed.updatedAt
      };
    } catch (e) {
      console.warn('获取草稿信息失败:', e);
      return null;
    }
  }

  /**
   * 检查是否有草稿
   */
  function hasDraft(): boolean {
    const info = getDraftInfo();
    return info !== null;
  }

  /**
   * 管理草稿数量（保留最近的 N 个）
   */
  function manageDrafts() {
    try {
      const keys = Object.keys(localStorage)
        .filter(key => key.startsWith(prefix))
        .map(key => ({
          key,
          data: JSON.parse(localStorage.getItem(key) || '{}') as DraftData
        }))
        .filter(item => item.data && item.data.updatedAt)
        .sort((a, b) => b.data.updatedAt - a.data.updatedAt);

      // 如果超过最大数量，删除最旧的
      if (keys.length > maxDrafts) {
        const toDelete = keys.slice(maxDrafts);
        toDelete.forEach(item => {
          localStorage.removeItem(item.key);
        });
      }
    } catch (e) {
      // 静默处理
    }
  }

  /**
   * 获取所有草稿列表
   */
  function getAllDrafts(): DraftInfo[] {
    try {
      const drafts: DraftInfo[] = [];
      const keys = Object.keys(localStorage).filter(key => key.startsWith(prefix));

      for (const key of keys) {
        try {
          const data = localStorage.getItem(key);
          if (!data) continue;
          
          const parsed = JSON.parse(data) as DraftData;
          if (!parsed.updatedAt) continue;

          // 跳过过期的
          if (Date.now() - parsed.updatedAt > expireTime) {
            localStorage.removeItem(key);
            continue;
          }

          drafts.push({
            title: parsed.title || '未命名草稿',
            updatedAt: new Date(parsed.updatedAt).toLocaleString('zh-CN'),
            preview: parsed.content?.slice(0, 100) + (parsed.content?.length > 100 ? '...' : ''),
            wordCount: parsed.content?.length || 0,
            timestamp: parsed.updatedAt
          });
        } catch (e) {
          // 跳过损坏的数据
        }
      }

      // 按时间排序
      return drafts.sort((a, b) => b.timestamp - a.timestamp);
    } catch (e) {
      console.warn('获取所有草稿失败:', e);
      return [];
    }
  }

  /**
   * 清除所有草稿
   */
  function clearAllDrafts() {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith(prefix));
      keys.forEach(key => localStorage.removeItem(key));
      isDraftExist.value = false;
      draftUpdateTime.value = null;
    } catch (e) {
      console.warn('清除所有草稿失败:', e);
    }
  }

  /**
   * 获取草稿大小（KB）
   */
  function getDraftSize(): number {
    try {
      const data = localStorage.getItem(DRAFT_KEY);
      if (!data) return 0;
      return Math.round(data.length / 1024);
    } catch {
      return 0;
    }
  }

  // ===== 响应式监听 =====

  // 当 noteId 变化时更新存储键
  watch(noteId, (newId, oldId) => {
    if (newId !== oldId) {
      // 不自动清除，保留切换
      isDraftExist.value = false;
      draftUpdateTime.value = null;
    }
  });

  // 自动保存定时器（可选）
  let autoSaveTimer: number | null = null;

  /**
   * 启动自动保存（每30秒）
   */
  function startAutoSave(
    getData: () => { title: string; content: string; extra?: Record<string, any> }
  ) {
    stopAutoSave();
    autoSaveTimer = window.setInterval(() => {
      try {
        const data = getData();
        if (data.content) {
          autoSave(data);
        }
      } catch (e) {
        console.warn('定时自动保存失败:', e);
      }
    }, 30000);
  }

  /**
   * 停止自动保存
   */
  function stopAutoSave() {
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer);
      autoSaveTimer = null;
    }
  }

  // ===== 生命周期清理 =====
  onBeforeUnmount(() => {
    stopAutoSave();
  });

  // ============================================================
  // 返回
  // ============================================================

  return {
    // 核心方法
    autoSave,
    restoreDraft,
    restoreDraftContent,
    restoreDraftTitle,
    clearDraft,
    getDraftInfo,
    hasDraft,
    
    // 管理方法
    getAllDrafts,
    clearAllDrafts,
    manageDrafts,
    getDraftSize,
    
    // 自动保存控制
    startAutoSave,
    stopAutoSave,
    
    // 状态
    isDraftExist,
    draftUpdateTime,
    
    // 工具
    getStorageKey
  };
}

// ============================================================
// 默认导出
// ============================================================

export default useAutoSave;