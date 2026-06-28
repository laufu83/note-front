// src/utils/export.ts

import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { marked } from 'marked';

// ====================== Marked 全局配置 ======================
marked.use({
  gfm: true,
  breaks: true,
  pedantic: false,
});

// ====================== 类型定义 ======================
export type ExportFormat = 'markdown' | 'html' | 'pdf' | 'txt';

export interface ExportOptions {
  fileName?: string;
  includeMetadata?: boolean;
  pdfPageSize?: 'a4' | 'a3' | 'letter' | 'legal';
  pdfOrientation?: 'portrait' | 'landscape';
  customStyles?: string;
  darkMode?: boolean;
}

// ====================== 工具函数 ======================

/** 过滤文件名非法字符 */
function safeFileName(name: string): string {
  return name.replace(/[\\\/:*?"<>|]/g, '_').trim() || '未命名笔记';
}

/** 获取元数据头部 */
function getMetaHeader(title: string): string {
  const now = new Date().toLocaleString('zh-CN');
  return `---
title: ${title}
export_time: ${now}
---

`;
}

// ====================== Markdown 转 HTML ======================

/**
 * Markdown 转 HTML（使用 marked 同步解析）
 */
function markdownToHtml(content: string): string {
  if (!content) return '';

  try {
    // 使用 marked.parse 同步解析
    const result = marked.parse(content, { async: false });
    return typeof result === 'string' ? result : String(result);
  } catch (err) {
    console.warn('marked 渲染异常，降级简易解析', err);
    return simpleMarkdownToHtml(content);
  }
}

/**
 * 极简降级 MD 解析（仅基础语法兜底）
 */
function simpleMarkdownToHtml(content: string): string {
  if (!content) return '';

  let html = content;

  // 标题
  html = html.replace(/^######\s+(.+)$/gim, '<h6>$1</h6>');
  html = html.replace(/^#####\s+(.+)$/gim, '<h5>$1</h5>');
  html = html.replace(/^####\s+(.+)$/gim, '<h4>$1</h4>');
  html = html.replace(/^###\s+(.+)$/gim, '<h3>$1</h3>');
  html = html.replace(/^##\s+(.+)$/gim, '<h2>$1</h2>');
  html = html.replace(/^#\s+(.+)$/gim, '<h1>$1</h1>');

  // 粗体、斜体、删除线
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

  // 代码
  html = html.replace(/`(.+?)`/g, '<code>$1</code>');

  // 代码块（简化版）
  html = html.replace(/```([\s\S]*?)```/g, (_, code) => {
    return `<pre><code>${code.trim()}</code></pre>`;
  });

  // 链接和图片
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => {
    return `<img src="${src}" alt="${alt || '图片'}" />`;
  });

  // 引用
  html = html.replace(/^>\s+(.+)$/gim, '<blockquote>$1</blockquote>');

  // 列表（简化）
  html = html.replace(/^-\s+(.+)$/gim, '<li>$1</li>');
  html = html.replace(/(<li>.+<\/li>)\s*(<li>.+<\/li>)/g, '<ul>$1$2</ul>');

  // 有序列表
  html = html.replace(/^\d+\.\s+(.+)$/gim, '<li>$1</li>');

  // 水平线
  html = html.replace(/^---$/gim, '<hr />');

  // 段落（空行分隔）
  const lines = html.split('\n');
  let result = '';
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      if (!inList) {
        result += '</p><p>';
      }
      continue;
    }

    if (trimmed.startsWith('<li>')) {
      if (!inList) {
        inList = true;
        result += '<ul>';
      }
      result += trimmed;
      continue;
    }

    if (trimmed.startsWith('</ul>')) {
      inList = false;
      result += trimmed;
      continue;
    }

    if (trimmed.startsWith('<h') || trimmed.startsWith('<pre') || trimmed.startsWith('<blockquote>')) {
      result += trimmed;
      continue;
    }

    if (!result || result.endsWith('<p>') || result.endsWith('</p>')) {
      result += trimmed;
    } else {
      result += trimmed;
    }
  }

  // 清理多余的标签
  result = result
    .replace(/<p><\/p>/g, '')
    .replace(/<p><ul>/g, '<ul>')
    .replace(/<\/ul><\/p>/g, '</ul>')
    .replace(/<p><\/ul>/g, '</ul>')
    .replace(/<p><h/g, '<h')
    .replace(/<\/h\d><\/p>/g, (match) => {
      const level = match.match(/\d/)?.[0] || '1';
      return `</h${level}>`;
    })
    .replace(/<p><blockquote>/g, '<blockquote>')
    .replace(/<\/blockquote><\/p>/g, '</blockquote>');

  // 如果结果为空，返回原始内容
  if (!result || result === '<p></p>') {
    return content;
  }

  return result;
}

// ====================== 统一导出入口 ======================

export async function exportNote(
  content: string,
  title: string,
  format: ExportFormat = 'markdown',
  options: ExportOptions = {}
): Promise<void> {
  const rawName = options.fileName || title;
  const fileName = safeFileName(rawName);

  try {
    switch (format) {
      case 'markdown':
        exportMarkdown(content, fileName, options);
        break;
      case 'html':
        await exportHTML(content, fileName, options);
        break;
      case 'pdf':
        await exportPDF(content, fileName, options);
        break;
      case 'txt':
        exportTxt(content, fileName, options);
        break;
      default:
        throw new Error(`不支持的导出格式：${format}`);
    }
  } catch (err) {
    console.error(`导出 ${format} 失败`, err);
    throw err;
  }
}

// ====================== Markdown 导出 ======================

export function exportMarkdown(
  content: string,
  fileName: string,
  options: ExportOptions = {}
): void {
  let md = content;

  if (options.includeMetadata) {
    md = getMetaHeader(fileName) + md;
  }

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  saveAs(blob, `${fileName}.md`);
}

// ====================== TXT 纯文本导出 ======================

export function exportTxt(
  content: string,
  fileName: string,
  options: ExportOptions = {}
): void {
  let text = content
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*|\*|__|_/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '图片')
    .replace(/`{1,3}[\s\S]*?`{1,3}/g, '')
    .replace(/\n{3,}/g, '\n\n');

  if (options.includeMetadata) {
    const now = new Date().toLocaleString('zh-CN');
    text = `标题：${fileName}\n导出时间：${now}\n\n${text}`;
  }

  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  saveAs(blob, `${fileName}.txt`);
}

// ====================== HTML 导出 ======================

export async function exportHTML(
  content: string,
  fileName: string,
  options: ExportOptions = {}
): Promise<void> {
  const htmlContent = markdownToHtml(content);
  const isDark = !!options.darkMode;

  const baseStyle = isDark
    ? `
    body { max-width: 900px; margin: 60px auto; padding: 0 20px; font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif; line-height: 1.8; color: #e6e6e6; background: #1a1a1a; }
    h1, h2, h3, h4 { color: #f0f0f0; }
    h1 { border-bottom: 2px solid #333; padding-bottom: 0.3em; }
    h2 { border-bottom: 1px solid #333; padding-bottom: 0.3em; }
    a { color: #58a6ff; text-decoration: none; }
    a:hover { text-decoration: underline; }
    img { max-width: 100%; height: auto; }
    pre { background: #2d2d2d; padding: 16px; border-radius: 6px; overflow: auto; }
    code { background: #2d2d2d; padding: 2px 6px; border-radius: 4px; color: #ff9898; }
    pre code { background: transparent; padding: 0; color: #e6e6e6; }
    blockquote { border-left: 4px solid #444; padding-left: 16px; color: #aaa; margin: 0.5em 0; }
    table { border-collapse: collapse; width: 100%; margin: 1em 0; }
    th, td { border: 1px solid #444; padding: 8px 12px; text-align: left; }
    th { background: #2d2d2d; }
    ul, ol { padding-left: 2em; }
    hr { border: none; border-top: 1px solid #444; margin: 2em 0; }
    `
    : `
    body { max-width: 900px; margin: 60px auto; padding: 0 20px; font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif; line-height: 1.8; color: #333; background: #fff; }
    h1, h2, h3, h4 { margin-top: 1.5em; margin-bottom: 0.5em; font-weight: 600; }
    h1 { border-bottom: 2px solid #eee; padding-bottom: 0.3em; }
    h2 { border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
    a { color: #0366d6; text-decoration: none; }
    a:hover { text-decoration: underline; }
    img { max-width: 100%; height: auto; }
    pre { background: #f6f8fa; padding: 16px; border-radius: 6px; overflow: auto; }
    code { background: #f6f8fa; padding: 2px 6px; border-radius: 4px; }
    pre code { background: transparent; padding: 0; }
    blockquote { border-left: 4px solid #dfe2e5; padding-left: 16px; color: #6a737d; margin: 0.5em 0; }
    table { border-collapse: collapse; width: 100%; margin: 1em 0; }
    th, td { border: 1px solid #dfe2e5; padding: 8px 12px; text-align: left; }
    th { background: #f6f8fa; }
    ul, ol { padding-left: 2em; }
    hr { border: none; border-top: 2px solid #eee; margin: 2em 0; }
    `;

  const metaHtml = options.includeMetadata
    ? `<p style="color: ${isDark ? '#aaa' : '#999'}; font-size: 0.9em; border-bottom: 1px solid ${isDark ? '#444' : '#eee'}; padding-bottom: 12px; margin-bottom: 20px;">
        导出时间：${new Date().toLocaleString('zh-CN')}
       </p>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${fileName}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/styles/${isDark ? 'github-dark' : 'github'}.min.css">
  <style>${baseStyle}${options.customStyles || ''}</style>
</head>
<body>
  ${metaHtml}
  <h1>${fileName}</h1>
  ${htmlContent}
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  saveAs(blob, `${fileName}.html`);
}

// ====================== PDF 导出 ======================

export async function exportPDF(
  content: string,
  fileName: string,
  options: ExportOptions = {}
): Promise<void> {
  const { pdfPageSize = 'a4', pdfOrientation = 'portrait' } = options;

  const container = document.createElement('div');
  container.style.cssText = `
    position: absolute;
    left: -9999px;
    top: 0;
    width: 794px;
    padding: 60px 70px;
    background: #ffffff;
    font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
    font-size: 14px;
    line-height: 1.8;
    color: #333;
    z-index: -1;
  `;

  const htmlContent = markdownToHtml(content);
  container.innerHTML = `
    <h1 style="font-size: 24px; margin-bottom: 20px;">${fileName}</h1>
    ${htmlContent}
  `;

  document.body.appendChild(container);

  try {
    // 等待渲染完成
    await new Promise(resolve => setTimeout(resolve, 500));

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: 794,
      height: container.scrollHeight,
      ignoreElements: (el) => el.classList.contains('no-export')
    });

    const pdf = new jsPDF({
      orientation: pdfOrientation,
      unit: 'mm',
      format: pdfPageSize
    });

    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const imgW = pdfW;
    const imgH = (canvas.height * imgW) / canvas.width;

    if (imgH > pdfH) {
      let remain = canvas.height;
      let offsetY = 0;
      let page = 0;
      const pagePxH = (pdfH / pdfW) * canvas.width;

      while (remain > 0) {
        if (page > 0) pdf.addPage();

        const cropH = Math.min(pagePxH, remain);
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = cropH;
        const ctx = pageCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(canvas, 0, offsetY, canvas.width, cropH, 0, 0, canvas.width, cropH);
        }

        const pageImg = pageCanvas.toDataURL('image/jpeg', 0.95);
        const pageImgH = (cropH * pdfW) / canvas.width;
        pdf.addImage(pageImg, 'JPEG', 0, 0, pdfW, pageImgH);

        offsetY += cropH;
        remain -= cropH;
        page++;
      }
    } else {
      pdf.addImage(imgData, 'JPEG', 0, 0, imgW, imgH);
    }

    pdf.save(`${fileName}.pdf`);
  } finally {
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  }
}

// ====================== ZIP 批量导出 ======================

export async function exportNotesAsZip(
  notes: Array<{ title: string; content: string }>,
  zipFileName: string = '笔记导出'
): Promise<void> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  const safeZipName = safeFileName(zipFileName);

  notes.forEach((note, idx) => {
    const name = safeFileName(note.title || '未命名');
    zip.file(`${String(idx + 1).padStart(2, '0')}_${name}.md`, note.content || '');
  });

  const now = new Date().toLocaleString('zh-CN');
  zip.file('README.md', `# 笔记批量导出

导出时间：${now}
共 ${notes.length} 条笔记

---
由 Note App 导出
`);

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `${safeZipName}.zip`);
}

// ====================== 默认导出 ======================

export default {
  exportNote,
  exportMarkdown,
  exportHTML,
  exportTxt,
  exportPDF,
  exportNotesAsZip,
};