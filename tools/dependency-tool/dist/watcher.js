"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startDev = void 0;
// watcher.ts
const ws_1 = require("ws");
const ws_2 = __importDefault(require("ws")); // 需要单独引入类型
const child_process_1 = require("child_process");
const build_runner_1 = require("./build-runner");
const chokidar_1 = __importDefault(require("chokidar"));
const path_1 = __importDefault(require("path"));
const startDev = (graph, entry, useAlias = false) => {
    const entryPkg = graph.nodes.get(entry);
    if (!entryPkg)
        throw new Error(`Package ${entry} not found`);
    console.log(`🚀 Starting Next.js dev server for ${entry}...`);
    // 收集所有依赖（递归）
    const dependenciesToWatch = new Set();
    function collectDeps(pkg) {
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
    const nextProcess = (0, child_process_1.spawn)("pnpm", ["run", "dev"], {
        cwd: entryPkg.dir,
        stdio: "inherit",
        shell: true,
    });
    console.log("\n🌐 Next.js dev server started at http://localhost:3000");
    console.log("   The page will automatically refresh when dependencies change\n");
    // WebSocket
    const wss = new ws_1.WebSocketServer({ port: 4000 });
    const clients = [];
    wss.on("connection", (ws) => {
        clients.push(ws);
        console.log("🔌 Browser connected for live reload");
    });
    // watchers
    const watchers = [];
    // 监听入口包
    const entryWatcher = chokidar_1.default.watch(entryPkg.dir, {
        ignored: /node_modules|dist|\.next/,
        ignoreInitial: true,
    });
    watchers.push(entryWatcher);
    entryWatcher.on("change", async (filePath) => {
        console.log(`\n📦 [${entry}] ${path_1.default.basename(filePath)} changed`);
        await (0, build_runner_1.buildPackages)(graph, entry);
        console.log(`[${entry}] hot reload triggered`);
        broadcastReload(clients);
    });
    // 监听依赖包
    for (const pkgName of dependenciesToWatch) {
        const pkgInfo = graph.nodes.get(pkgName);
        console.log("👀 Watching dep:", pkgInfo.dir);
        const watcher = chokidar_1.default.watch(pkgInfo.dir, {
            ignored: /node_modules|dist|\.next/,
            ignoreInitial: true,
        });
        watchers.push(watcher);
        watcher.on("change", async (filePath) => {
            console.log(`\n📦 [${pkgName}] ${path_1.default.basename(filePath)} changed`);
            await (0, build_runner_1.buildPackages)(graph, pkgName);
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
exports.startDev = startDev;
// 封装广播逻辑
function broadcastReload(clients) {
    clients.forEach((ws, index) => {
        if (ws.readyState === ws_2.default.OPEN) {
            ws.send("reload");
            console.log(`Reload message sent to client ${index}`);
        }
        else {
            console.log(`Client ${index} not ready, state: ${ws.readyState}`);
        }
    });
}
