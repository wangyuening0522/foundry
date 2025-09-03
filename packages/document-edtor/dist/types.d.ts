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
    getContent: () => EditorContent;
    setContent: (html: string) => void;
    clear: () => void;
    destroy: () => void;
    focus: () => void;
    blur: () => void;
    isFocused: () => boolean;
    getWordCount: () => number;
    getCharacterCount: () => number;
    isEmpty: () => boolean;
    on: (event: string, callback: (data: any) => void) => void;
    off: (event: string, callback: (data: any) => void) => void;
}
