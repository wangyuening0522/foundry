// packages/document-editor/src/types.ts
export interface EditorOptions {
    theme?: string;
    readOnly?: boolean;
    placeholder?: string;
  }
  
  export interface EditorContent {
    html: string;
    text: string;
    length: number;
  }
  
  export interface EditorInstance {
    // 核心方法
    getContent: () => EditorContent;
    setContent: (html: string) => void;
    clear: () => void;
    destroy: () => void;
    
    // 状态方法
    focus: () => void;
    blur: () => void;
    isFocused: () => boolean;
    
    // 工具方法
    getWordCount: () => number;
    getCharacterCount: () => number;
    isEmpty: () => boolean;
    
    // 事件相关
    on: (event: string, callback: (data: any) => void) => void;
    off: (event: string, callback: (data: any) => void) => void;
  }