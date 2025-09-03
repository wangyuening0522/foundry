// packages/forge/src/app/page.tsx
'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// 动态导入文档编辑器组件
const DocumentEditor = dynamic(
    () => import('@/components/document-editor'),
    {
        ssr: false,
        loading: () => <div>Loading editor...</div>
    }
)

export default function Home() {
    const [mounted, setMounted] = useState(false)
    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return <div>Loading...</div>
    }

    return (
        <main className="editor-container">
            <div className="header">
                <h1>Forge Document Editor</h1>
                <p>Next.js application with real-time document editing</p>
            </div>

            <DocumentEditor />
        </main>
    )
}