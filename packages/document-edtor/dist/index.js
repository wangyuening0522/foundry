"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initEditor = void 0;
// packages/document-editor/src/index.ts
const utils_1 = require("@internal/utils");
function initEditor(container, options = {}) {
    console.log("Initializing Document Editor...");
    console.log((0, utils_1.greet)("Editor User"));
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
    const instance = {
        getContent: () => getContent(editorElement),
        setContent: (html) => setContent(editorElement, html),
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
exports.initEditor = initEditor;
// 辅助函数
function createDefaultContainer() {
    const container = document.createElement('div');
    container.className = 'document-editor-container';
    document.body.appendChild(container);
    return container;
}
function createEditorElement(container) {
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
function getContent(editor) {
    return {
        html: editor.innerHTML,
        text: editor.textContent || '',
        length: editor.textContent?.length || 0
    };
}
function setContent(editor, html) {
    editor.innerHTML = html;
}
function clearContent(editor) {
    editor.innerHTML = '';
}
function destroyEditor(editor, container) {
    if (editor.parentNode === container) {
        container.removeChild(editor);
    }
    if (container.parentNode && container.className === 'document-editor-container') {
        document.body.removeChild(container);
    }
}
function focusEditor(editor) {
    editor.focus();
}
function blurEditor(editor) {
    editor.blur();
}
function isEditorFocused(editor) {
    return document.activeElement === editor;
}
function getWordCount(editor) {
    const text = editor.textContent || '';
    return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
}
function getCharacterCount(editor) {
    return editor.textContent?.length || 0;
}
function isEmpty(editor) {
    return editor.textContent?.trim() === '';
}
function addEventListener(editor, event, callback) {
    editor.addEventListener(event, callback);
}
function removeEventListener(editor, event, callback) {
    editor.removeEventListener(event, callback);
}
function addStyles(editor) {
    // 添加一些基本样式
    editor.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    editor.style.lineHeight = '1.6';
    editor.style.outline = 'none';
}
console.log("document-editor loaded with enhanced API");
