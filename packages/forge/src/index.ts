// packages/forge/src/index.ts

import { initEditor } from '@internal/document-editor';

export function start() {
  console.log("Starting Forge...");
  console.log('forge改变')
  initEditor();
}

console.log("forge loaded");
