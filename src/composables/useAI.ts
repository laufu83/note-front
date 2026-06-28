// src/composables/useAI.ts
import { ref } from 'vue';
import { aiAPI } from '@/api/ai';
import { ElMessage } from 'element-plus';
import type { ChatMessage, ChatResponse } from '@/api/ai';

// ============================================================
// 类型定义
// ============================================================
export type AIActionType = 'summarize' | 'polish' | 'continue' | 'translate' | 'custom';

export interface AIError {
  code?: number;
  message: string;
  details?: any;
}

export interface AIAskOptions {
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  silent?: boolean;
}

// ============================================================
// 工具函数
// ============================================================
/** 安全提取错误文案 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    if ('msg' in error && typeof error.msg === 'string') return error.msg;
    if ('message' in error && typeof error.message === 'string') return error.message;
    if ('error' in error && typeof error.error === 'string') return error.error;
  }
  return 'AI 请求失败，请稍后重试';
}

/** 统一解析后端返回数据 */
function extractContentFromResponse(response: ChatResponse): string {
  if (response.code !== 200) {
    throw new Error(response.msg || 'AI 请求失败');
  }

  const data = response.data;
  if (typeof data === 'string') return data;

  if (data && typeof data === 'object') {
    const fields = ['reply', 'summary', 'polished', 'continue_content', 'result', 'content', 'text', 'message'];
    for (const field of fields) {
      const val = (data as any)[field];
      if (typeof val === 'string' && val) return val;
    }
  }

  console.warn('无法提取 AI 响应内容:', response);
  return 'AI 未返回有效内容';
}

/** 公共请求包装器：统一处理loading、错误、状态 */
async function wrapAIRequest<T>(
  actionType: AIActionType,
  fn: () => Promise<ChatResponse>,
  state: {
    isProcessing: ReturnType<typeof ref<boolean>>;
    error: ReturnType<typeof ref<string | null>>;
    lastResponse: ReturnType<typeof ref<string>>;
    lastAction: ReturnType<typeof ref<AIActionType | null>>;
  },
  silent = false
): Promise<string> {
  state.isProcessing.value = true;
  state.error.value = null;
  state.lastAction.value = actionType;

  try {
    const res = await fn();
    const content = extractContentFromResponse(res);
    state.lastResponse.value = content;
    return content;
  } catch (err) {
    const msg = getErrorMessage(err);
    state.error.value = msg;
    if (!silent) ElMessage.error(msg);
    throw new Error(msg);
  } finally {
    state.isProcessing.value = false;
  }
}

// ============================================================
// Composable
// ============================================================
export function useAI() {
  const isProcessing = ref(false);
  const error = ref<string | null>(null);
  const lastResponse = ref<string>('');
  const lastAction = ref<AIActionType | null>(null);

  const state = { isProcessing, error, lastResponse, lastAction };

  /**
   * 通用对话：默认不注入写作助手系统提示，仅options传入时才添加
   */
  async function askAI(
    prompt: string,
    context?: string,
    options?: AIAskOptions
  ): Promise<string> {
    const promptTrim = prompt.trim();
    if (!promptTrim) throw new Error('请输入有效的问题');

    return wrapAIRequest('custom', async () => {
      const messages: ChatMessage[] = [];

      // 只有手动传入系统提示词才添加，不再强制固定写作助手身份
      if (options?.systemPrompt?.trim()) {
        messages.push({
          role: 'system',
          content: options.systemPrompt.trim()
        });
      }

      const ctxTrim = context?.trim();
      if (ctxTrim) {
        messages.push({
          role: 'user',
          content: `${ctxTrim}\n\n${promptTrim}`
        });
      } else {
        messages.push({
          role: 'user',
          content: promptTrim
        });
      }

      return aiAPI.chat({
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2000
      });
    }, state, options?.silent);
  }

  /** 笔记总结 */
  async function summarizeAI(content: string): Promise<string> {
    const contentTrim = content.trim();
    if (!contentTrim) throw new Error('请提供要总结的内容');

    return wrapAIRequest('summarize', () => aiAPI.summarize(contentTrim), state);
  }

  /** 笔记润色 */
  async function polishAI(content: string): Promise<string> {
    const contentTrim = content.trim();
    if (!contentTrim) throw new Error('请提供要润色的内容');

    return wrapAIRequest('polish', () => aiAPI.polish(contentTrim), state);
  }

  /** 笔记续写 */
  async function continueAI(content: string): Promise<string> {
    const contentTrim = content.trim();
    if (!contentTrim) throw new Error('请提供要续写的内容');

    return wrapAIRequest('continue', () => aiAPI.continue(contentTrim), state);
  }

  /** 文本翻译 */
  async function translateAI(content: string, targetLang: string = '英文'): Promise<string> {
    const contentTrim = content.trim();
    if (!contentTrim) throw new Error('请提供要翻译的内容');

    return wrapAIRequest('translate', () => aiAPI.translate({
      content: contentTrim,
      target_lang: targetLang
    }), state);
  }

  function customAskAI(prompt: string, context?: string, options?: AIAskOptions) {
    return askAI(prompt, context, options);
  }

  /** 重置所有AI状态 */
  function resetState() {
    error.value = null;
    lastResponse.value = '';
    lastAction.value = null;
  }

  function clearError() {
    error.value = null;
  }

  return {
    isProcessing,
    error,
    lastResponse,
    lastAction,

    askAI,
    customAskAI,

    summarizeAI,
    polishAI,
    continueAI,
    translateAI,

    resetState,
    clearError
  };
}

export default useAI;