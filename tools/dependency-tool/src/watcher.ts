// watcher.ts
import chokidar from 'chokidar';
import { DependencyGraph } from './dependency-graph';
import { buildPackages } from './build-runner';
import { spawn } from 'child_process';
import path from 'path';
import WebSocket, { WebSocketServer } from 'ws';

export function startDev(graph: DependencyGraph, entry: string, useAlias = false) {
  const entryPkg = graph.nodes.get(entry);
  if (!entryPkg) throw new Error(`Package ${entry} not found`);

  console.log(`🚀 Starting Next.js dev server for ${entry}...`);

  // 启动 Next.js 开发服务器
  const nextProcess = spawn('pnpm', ['run', 'dev'], {
    cwd: entryPkg.dir,
    stdio: 'inherit',
    shell: true
  });

  // 启动一个 WebSocket 服务器（用于浏览器刷新）
  const wss = new WebSocketServer({ port: 4000 });
  const clients: WebSocket[] = [];
  wss.on('connection', (ws) => {
    clients.push(ws);
    console.log('🔌 Browser connected for live reload');
  });
  // 监听所有依赖包的变化
  const dependenciesToWatch = new Set<string>();
  for (const dep of graph.edges.get(entry) || []) {
    dependenciesToWatch.add(dep);
  }

  console.log(`📡 Watching dependencies: ${Array.from(dependenciesToWatch).join(', ')}`);

  // 存储所有监控器实例
  const watchers: any[] = [];

  // 监控入口包目录的变化
  const entryWatcher = chokidar.watch(entryPkg.dir, {
    ignored: /node_modules|dist|\.next/,
    ignoreInitial: true
  });

  // 处理文件变化事件
  entryWatcher.on('change', async (filePath) => {
    console.log(`\n📦 [${entry}] ${path.basename(filePath)} changed`);
    // 重新构建包
    await buildPackages(graph, entry);
    console.log(`[${entry}] hot reload triggered`);
    // dist 模式: 手动通知浏览器刷新,向所有客户端发送刷新消息
    console.log('Number of connected clients:', clients.length);
    clients.forEach((ws, index) => {
  console.log(`Client ${index} readyState:`, ws.readyState);
  console.log('WebSocket.OPEN:', WebSocket.OPEN);
  
  if (ws.readyState === WebSocket.OPEN) {
    ws.send('reload');
    console.log('Reload message sent to client', index);
  } else {
    console.log('Client', index, 'not ready, state:', ws.readyState);
  }
});
  });
  watchers.push(entryWatcher);

  console.log('\n🌐 Next.js dev server started at http://localhost:3000');
  console.log('   The page will automatically refresh when dependencies change\n');
  // 优雅退出
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping dev mode...');
    watchers.forEach((watcher: any) => watcher.close());
    nextProcess.kill();
    wss.close();
    process.exit(0);
  });
}
// 再监听依赖
// for (const pkgName of dependenciesToWatch) {
//   const pkgInfo = graph.nodes.get(pkgName)!;
//   console.log("👀 Watching dep:", pkgInfo.dir); // debug
//   const watcher = chokidar.watch(pkgInfo.dir, {
//     ignored: /node_modules|dist|\.next/,
//     ignoreInitial: true
//   });
//   watcher.on('change', async (filePath) => {
//     console.log(`\n📦 [${pkgName}] ${path.basename(filePath)} changed`);
//     await buildPackages(graph, pkgName);
//     console.log(`[${pkgName}] hot reload triggered`);

//   });
//   watchers.push(watcher);
// }


// import chokidar from 'chokidar';
// import { DependencyGraph } from './dependency-graph';
// import { buildPackages } from './build-runner';

// export function startDev(graph: DependencyGraph, entry: string,useAlias=false) {
//   const entryPkg = graph.nodes.get(entry);
//   if (!entryPkg) throw new Error('Package ${entry} not found');
//   chokidar.watch(entryPkg.dir, { ignoreInitial: true }).on('change', () => {
//     console.log('[${entry}] change detected, rebuilding...');
//     buildPackages(graph, entry);
//     console.log('[${entry}] hot reload triggered');
//   });
//   // 启动一个 WebSocket 服务器（用于浏览器刷新）
//   const wss = new WebSocketServer({ port: 4000 });
//   const clients: WebSocket[] = [];

//   wss.on('connection', (ws) => {
//     clients.push(ws);
//     console.log('🔌 Browser connected for live reload');
//   });
//   if (useAlias) {
//               // alias 模式: 交给 Next.js 的 HMR 处理
//               console.log('🔄 Using alias mode, Next.js HMR should apply automatically');
//             } else {
//               // dist 模式: 手动通知浏览器刷新
//               clients.forEach((ws) => {
//                 if (ws.readyState === WebSocket.OPEN) {
//                   ws.send('reload');
//                 }
//               });
//               console.log('🔄 Triggered browser full reload');
//             }

// }


