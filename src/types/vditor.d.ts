// src/types/vditor.d.ts
import 'vditor';

declare module 'vditor' {
  export interface Vditor {
    /**
     * 执行编辑器命令
     * @param command - 命令名称
     * @param value - 命令参数（可选）
     */
    execCommand(command: string, value?: string): void;

    /**
     * 获取当前选中的文本
     */
    getSelection(): string;

    /**
     * 在光标位置插入文本
     * @param text - 要插入的文本
     */
    insertText(text: string): void;

    /**
     * 获取编辑器内容（HTML 格式）
     */
    getHTML(): string;

    /**
     * 获取编辑器内容（Markdown 格式）
     */
    getValue(): string;

    /**
     * 设置编辑器内容
     * @param value - Markdown 内容
     */
    setValue(value: string): void;

    /**
     * 聚焦编辑器
     */
    focus(): void;

    /**
     * 失焦编辑器
     */
    blur(): void;

    /**
     * 销毁编辑器
     */
    destroy(): void;

    /**
     * 撤销
     */
    undo(): void;

    /**
     * 重做
     */
    redo(): void;

    /**
     * 渲染
     */
    render(): void;

    /**
     * 更新内容
     * @param value - 新内容
     */
    updateValue(value: string): void;

    /**
     * 获取编辑器状态
     */
    getStatus(): {
      mode: 'sv' | 'ir' | 'wysiwyg';
      fullscreen: boolean;
      outline: boolean;
      preview: boolean;
    };
  }
}

// 补充 Vditor 静态方法
declare module 'vditor' {
  export namespace Vditor {
    /**
     * 将 Markdown 转换为 HTML
     */
    function md2html(markdown: string): string;

    /**
     * 将 HTML 转换为 Markdown
     */
    function html2md(html: string): string;
  }
}