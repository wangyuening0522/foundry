// watcher.ts
import { WebSocketServer } from "ws";
import WebSocket from "ws"; // 需要单独引入类型
import { DependencyGraph } from "./dependency-graph";
import { spawn } from "child_process";
import { buildPackages } from "./build-runner";
import chokidar from "chokidar";
import path from "path";

export const startDev = (graph: DependencyGraph, entry: string, useAlias = false) => {
  const entryPkg = graph.nodes.get(entry);
  if (!entryPkg) throw new Error(`Package ${entry} not found`);
  console.log(`🚀 Starting Next.js dev server for ${entry}...`);

  // 收集所有依赖（递归）
  const dependenciesToWatch = new Set<string>();
  function collectDeps(pkg: string) {
    for (const dep of graph.edges.get(pkg) || []) {
      if (!dependenciesToWatch.has(dep)) {
        dependenciesToWatch.add(dep);
        collectDeps(dep); // 递归收集深层依赖
      }
    }
  }
  collectDeps(entry);

  console.log(`📡 Watching dependencies: ${Array.from(dependenciesToWatch).join(", ")}`);

  // 启动 Next.js dev server
  const nextProcess = spawn("pnpm", ["run", "dev"], {
    cwd: entryPkg.dir,
    stdio: "inherit",
    shell: true,
  });
  console.log("\n🌐 Next.js dev server started at http://localhost:3000");
  console.log("   The page will automatically refresh when dependencies change\n");

  // WebSocket
  const wss = new WebSocketServer({ port: 4000 });
  const clients: WebSocket[] = [];
  wss.on("connection", (ws: WebSocket) => {
    clients.push(ws);
    console.log("🔌 Browser connected for live reload");
  });

  // watchers
  const watchers: chokidar.FSWatcher[] = [];

  // 监听入口包
  const entryWatcher = chokidar.watch(entryPkg.dir, {
    ignored: /node_modules|dist|\.next/,
    ignoreInitial: true,
  });
  watchers.push(entryWatcher);

  entryWatcher.on("change", async (filePath) => {
    console.log(`\n📦 [${entry}] ${path.basename(filePath)} changed`);
    await buildPackages(graph, entry);
    console.log(`[${entry}] hot reload triggered`);
    broadcastReload(clients);
  });

  // 监听依赖包
  for (const pkgName of dependenciesToWatch) {
    const pkgInfo = graph.nodes.get(pkgName)!;
    console.log("👀 Watching dep:", pkgInfo.dir);

    const watcher = chokidar.watch(pkgInfo.dir, {
      ignored: /node_modules|dist|\.next/,
      ignoreInitial: true,
    });
    watchers.push(watcher);

    watcher.on("change", async (filePath) => {
      console.log(`\n📦 [${pkgName}] ${path.basename(filePath)} changed`);
      await buildPackages(graph, pkgName);
      console.log(`[${pkgName}] hot reload triggered`);
      broadcastReload(clients);
    });
  }

  // 优雅退出
  process.on("SIGINT", () => {
    console.log("\n🛑 Stopping dev mode...");
    watchers.forEach((w) => w.close());
    nextProcess.kill();
    wss.close();
    process.exit(0);
  });
};

// 封装广播逻辑
function broadcastReload(clients: WebSocket[]) {
  clients.forEach((ws, index) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send("reload");
      console.log(`Reload message sent to client ${index}`);
    } else {
      console.log(`Client ${index} not ready, state: ${ws.readyState}`);
    }
  });
}