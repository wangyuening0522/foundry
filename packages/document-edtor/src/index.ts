// packages/document-editor/src/index.ts
import { greet } from '@internal/utils';
import { EditorInstance, EditorOptions,EditorContent } from './types';

export function initEditor(container?: HTMLElement, options: EditorOptions = {}): EditorInstance {
  console.log("Initializing Document Editor...");
  console.log(greet("Editor User"));
  console.log('第2次改变');

  const targetContainer = container || createDefaultContainer();
  const editorElement = createEditorElement(targetContainer);
  
  // 应用选项
  if (options.theme) {
    editorElement.classList.add(`theme-${options.theme}`);
  }
  if (options.placeholder) {
    editorElement.setAttribute('data-placeholder', options.placeholder);
  }
  if (options.readOnly) {
    editorElement.contentEditable = 'false';
  }

  // 创建编辑器实例
  const instance: EditorInstance = {
    getContent: () => getContent(editorElement),
    setContent: (html: string) => setContent(editorElement, html),
    clear: () => clearContent(editorElement),
    destroy: () => destroyEditor(editorElement, targetContainer),
    
    focus: () => focusEditor(editorElement),
    blur: () => blurEditor(editorElement),
    isFocused: () => isEditorFocused(editorElement),
    
    getWordCount: () => getWordCount(editorElement),
    getCharacterCount: () => getCharacterCount(editorElement),
    isEmpty: () => isEmpty(editorElement),
    
    on: (event, callback) => addEventListener(editorElement, event, callback),
    off: (event, callback) => removeEventListener(editorElement, event, callback),
  };

  // 添加基本样式
  addStyles(editorElement);

  return instance;
}

// 辅助函数
function createDefaultContainer(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'document-editor-container';
  document.body.appendChild(container);
  return container;
}

function createEditorElement(container: HTMLElement): HTMLElement {
  const editor = document.createElement('div');
  editor.className = 'document-editor';
  editor.contentEditable = 'true';
  editor.style.minHeight = '200px';
  editor.style.padding = '12px';
  editor.style.border = '1px solid #red';
  editor.style.borderRadius = '4px';

  container.appendChild(editor);
  return editor;
}

function getContent(editor: HTMLElement): { html: string; text: string; length: number } {
  return {
    html: editor.innerHTML,
    text: editor.textContent || '',
    length: editor.textContent?.length || 0
  };
}

function setContent(editor: HTMLElement, html: string): void {
  editor.innerHTML = html;
}

function clearContent(editor: HTMLElement): void {
  editor.innerHTML = '';
}

function destroyEditor(editor: HTMLElement, container: HTMLElement): void {
  if (editor.parentNode === container) {
    container.removeChild(editor);
  }
  if (container.parentNode && container.className === 'document-editor-container') {
    document.body.removeChild(container);
  }
}

function focusEditor(editor: HTMLElement): void {
  editor.focus();
}

function blurEditor(editor: HTMLElement): void {
  editor.blur();
}

function isEditorFocused(editor: HTMLElement): boolean {
  return document.activeElement === editor;
}

function getWordCount(editor: HTMLElement): number {
  const text = editor.textContent || '';
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
}

function getCharacterCount(editor: HTMLElement): number {
  return editor.textContent?.length || 0;
}

function isEmpty(editor: HTMLElement): boolean {
  return editor.textContent?.trim() === '';
}

function addEventListener(editor: HTMLElement, event: string, callback: (data: any) => void): void {
  editor.addEventListener(event, callback);
}

function removeEventListener(editor: HTMLElement, event: string, callback: (data: any) => void): void {
  editor.removeEventListener(event, callback);
}

function addStyles(editor: HTMLElement): void {
  // 添加一些基本样式
  editor.style.fontFamily = 'system-ui, -apple-system, sans-serif';
  editor.style.lineHeight = '1.6';
  editor.style.outline = 'none';
}

// 导出类型
export type { EditorInstance, EditorOptions, EditorContent };
console.log("document-editor loaded with enhanced API");