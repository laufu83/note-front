// src/api/ai.ts

import request from '@/utils/request';

// ============================================================
// 类型定义
// ============================================================

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** 后端 ZhipuMessage 格式 */
export interface ZhipuMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/** 后端 chat 接口请求格式 */
export interface ChatRequest {
  prompt: string;
  history?: ZhipuMessage[];
  temperature?: number;
  max_tokens?: number;
}

/** 后端响应格式 */
export interface ChatResponse {
  code: number;
  msg: string;
  data: {
    reply: string;
  } | null;
}

// ============================================================
// API 方法
// ============================================================

export const aiAPI = {
  /**
   * 通用对话
   * 后端期望: { prompt: string; history?: ZhipuMessage[]; temperature?: number; max_tokens?: number }
   */
  chat(data: {
    messages: ChatMessage[];
    temperature?: number;
    max_tokens?: number;
  }): Promise<ChatResponse> {
    const { messages, temperature = 0.7, max_tokens = 2000 } = data;

    // ✅ 提取系统消息
    const systemMessages = messages.filter(m => m.role === 'system');
    const systemPrompt = systemMessages.map(m => m.content).join('\n');

    // ✅ 提取用户和助手消息
    const chatMessages = messages.filter(m => m.role !== 'system');

    // ✅ 提取最后一条用户消息作为 prompt
    let prompt = '';
    const lastUserIndex = chatMessages.map(m => m.role).lastIndexOf('user');
    if (lastUserIndex !== -1) {
      prompt = chatMessages[lastUserIndex].content;
    }

    // ✅ 构建 history（不包含最后一条用户消息）
    const history = chatMessages
      .filter((_, index) => index !== lastUserIndex)
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }));

    // ✅ 如果有系统消息，添加到 history 开头（作为上下文）
    if (systemPrompt) {
      // 后端可能不识别 system，放到 prompt 中
      prompt = `${systemPrompt}\n\n${prompt}`;
    }

    // ✅ 发送请求
    return request.post('/api/ai/chat', {
      prompt: prompt || '请开始对话',
      history: history.length > 0 ? history : undefined,
      temperature,
      max_tokens
    });
  },

  /**
   * 总结
   * 后端期望: { content: string }
   */
  summarize(content: string): Promise<ChatResponse> {
    return request.post('/api/ai/summarize', { content });
  },

  /**
   * 润色
   * 后端期望: { content: string }
   */
  polish(content: string): Promise<ChatResponse> {
    return request.post('/api/ai/polish', { content });
  },

  /**
   * 续写
   * 后端期望: { content: string }
   */
  continue(content: string): Promise<ChatResponse> {
    return request.post('/api/ai/continue', { content });
  },

  /**
   * 翻译
   * 后端期望: { content: string; target_lang?: string }
   */
  translate(data: { content: string; target_lang?: string }): Promise<ChatResponse> {
    return request.post('/api/ai/translate', data);
  }
};

export default aiAPI;