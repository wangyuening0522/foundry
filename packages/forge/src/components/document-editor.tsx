// packages/forge/src/components/DocumentEditor.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { initEditor, EditorInstance, EditorContent } from '@internal/document-editor'

export default function DocumentEditor() {
    const editorRef = useRef<HTMLDivElement>(null)
    const editorInstance = useRef<EditorInstance | null>(null)
    const [wordCount, setWordCount] = useState(0)
    const [charCount, setCharCount] = useState(0)

    useEffect(() => {
        if (editorRef.current && !editorInstance.current) {
            console.log('Initializing document editor...')

            editorInstance.current = initEditor(editorRef.current, {
                theme: 'light',
                placeholder: 'Start typing your document...',
                readOnly: false
            })

            // 设置初始内容
            editorInstance.current.setContent(`
        <h1>Welcome to Forge Editor</h1>
        <p>this asdf is a powerful document editor built with modern web technologies.</p>
        <ul>
          <li>Real-time editing</li>
          <li>Rich text support</li>
          <li>Word and character counting</li>
        </ul>
      `)

            // 监听内容变化
            editorInstance.current.on('input', () => {
                updateCounts()
            })

            updateCounts()
        }

        return () => {
            if (editorInstance.current) {
                console.log('Cleaning up editor...')
                editorInstance.current.destroy()
                editorInstance.current = null
            }
        }
    }, [])

    const updateCounts = () => {
        if (editorInstance.current) {
            setWordCount(editorInstance.current.getWordCount())
            setCharCount(editorInstance.current.getCharacterCount())
        }
    }

    const handleSave = () => {
        if (editorInstance.current) {
            const content: EditorContent = editorInstance.current.getContent()
            console.log('Document content:', content)
            alert(`Document saved!\nWords: ${content.html.split(' ').length}\nCharacters: ${content.length}`)
        }
    }

    const handleClear = () => {
        if (editorInstance.current) {
            editorInstance.current.clear()
            updateCounts()
        }
    }

    const handleFocus = () => {
        if (editorInstance.current) {
            editorInstance.current.focus()
        }
    }

    return (
        <div>
            <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span>Words: {wordCount}</span>
                <span>Characters: {charCount}</span>
            </div>

            <div ref={editorRef} style={{ minHeight: '300px' }} />

            <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                <button
                    onClick={handleSave}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#0070f3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Save Document
                </button>

                <button
                    onClick={handleClear}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#666',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Clear
                </button>

                <button
                    onClick={handleFocus}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Focus Editor
                </button>
            </div>
        </div>
    )
}