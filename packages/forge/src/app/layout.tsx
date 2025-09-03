// src/app/layout.tsx
'use client';

import './globals.css';
import { useEffect } from 'react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        console.log(123123, process.env.NODE_ENV)
        const ws = new WebSocket('ws://localhost:4000');
        ws.onmessage = (event) => {
            if (event.data === 'reload') {
                console.log(123123123123)
                window.location.reload();
            }
        };
        return () => ws.close();
    }, []);

    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
