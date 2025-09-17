"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPackages = buildPackages;
exports.calculateInDegree = calculateInDegree;
exports.clearBuildCache = clearBuildCache;
exports.getCacheStats = getCacheStats;
/// build-runner.ts - 优化版本
const child_process_1 = require("child_process");
const util_1 = require("util");
const dependency_graph_1 = require("./dependency-graph");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
const readFileAsync = (0, util_1.promisify)(fs_1.default.readFile);
const statAsync = (0, util_1.promisify)(fs_1.default.stat);
const readdirAsync = (0, util_1.promisify)(fs_1.default.readdir);
// 构建缓存
const buildCache = new Map();
// 缓存配置
const IGNORED_FILES = ['.DS_Store', 'Thumbs.db', '.gitkeep'];
const IGNORED_DIRS = ['node_modules', 'dist', '.git', '.next', '.nuxt', '.output'];
async function buildPackages(graph, target) {
    const affected = new Set();
    markAffectedPackages(graph, target, affected);
    const sortedOrder = (0, dependency_graph_1.topoSort)(graph);
    const orderedAffected = sortedOrder.filter(pkg => affected.has(pkg));
    console.log(`📦 Packages to build: ${Array.from(orderedAffected).join(' → ')}`);
    // 按拓扑层级分组
    const levels = groupByTopoLevel(graph, orderedAffected);
    // 按层级顺序构建，同一层级的并行
    for (const levelPackages of levels) {
        console.log(`🚀 Building level: ${levelPackages.join(', ')}`);
        const buildPromises = levelPackages.map(pkg => buildPackageWithCache(graph, pkg));
        await Promise.all(buildPromises);
    }
    console.log('✅ Build finished');
}
// dependency-graph.ts - 添加这个函数
function calculateInDegree(graph) {
    const inDegree = {};
    // 初始化所有节点的入度为0
    for (const node of graph.nodes.keys()) {
        inDegree[node] = 0;
    }
    // 遍历所有边，计算入度
    for (const [source, dependencies] of graph.edges.entries()) {
        for (const dep of dependencies) {
            if (graph.nodes.has(dep)) { // 只计算内部依赖
                inDegree[dep] = (inDegree[dep] || 0) + 1;
            }
        }
    }
    return inDegree;
}
// 正确的层级分组函数
function groupByTopoLevel(graph, packages) {
    const depthMap = new Map();
    const levels = [];
    // 为每个包计算拓扑深度
    function calculateDepth(pkg) {
        if (depthMap.has(pkg)) {
            return depthMap.get(pkg);
        }
        const dependencies = graph.edges.get(pkg) || [];
        if (dependencies.length === 0) {
            depthMap.set(pkg, 0);
            return 0;
        }
        // 深度 = 最大依赖深度 + 1
        const maxDepDepth = Math.max(...dependencies.map(dep => packages.includes(dep) ? calculateDepth(dep) : -1));
        const depth = maxDepDepth + 1;
        depthMap.set(pkg, depth);
        return depth;
    }
    // 计算每个包的深度
    for (const pkg of packages) {
        calculateDepth(pkg);
    }
    // 按深度分组
    for (const [pkg, depth] of depthMap) {
        if (!levels[depth])
            levels[depth] = [];
        levels[depth].push(pkg);
    }
    return levels.filter(Boolean);
}
async function buildPackageWithCache(graph, pkg) {
    const info = graph.nodes.get(pkg);
    const cacheKey = await generateCacheKey(info.dir);
    if (buildCache.get(pkg) === cacheKey) {
        console.log(`📦 [CACHE] ${pkg} - skipped`);
        return;
    }
    console.log(`🏗️ Building: ${pkg}`);
    const startTime = Date.now();
    try {
        await execAsync('pnpm run build', { cwd: info.dir });
        const buildTime = Date.now() - startTime;
        buildCache.set(pkg, cacheKey);
        console.log(`✅ Finished: ${pkg} (${buildTime}ms)`);
    }
    catch (error) {
        console.error(`❌ Failed to build ${pkg}:`, error);
        // 构建失败时清除缓存，确保下次重新构建
        buildCache.delete(pkg);
        throw error;
    }
}
// 生成基于文件内容的缓存键
async function generateCacheKey(dir) {
    const hash = crypto_1.default.createHash('sha256');
    await hashDirectory(dir, hash);
    return hash.digest('hex');
}
// 递归哈希目录中的所有文件
async function hashDirectory(dir, hash) {
    try {
        const items = await readdirAsync(dir, { withFileTypes: true });
        // 按文件名排序确保顺序一致
        items.sort((a, b) => a.name.localeCompare(b.name));
        for (const item of items) {
            const fullPath = path_1.default.join(dir, item.name);
            // 跳过忽略的目录
            if (item.isDirectory() && IGNORED_DIRS.includes(item.name)) {
                continue;
            }
            // 跳过忽略的文件
            if (item.isFile() && IGNORED_FILES.includes(item.name)) {
                continue;
            }
            if (item.isDirectory()) {
                await hashDirectory(fullPath, hash);
            }
            else if (item.isFile()) {
                await hashFile(fullPath, hash);
            }
        }
    }
    catch (error) {
        // 忽略无法访问的目录
        if (error.code !== 'EACCES') {
            console.warn(`Warning: Cannot access directory ${dir}:`, error.message);
        }
    }
}
// 哈希单个文件
async function hashFile(filePath, hash) {
    try {
        const stats = await statAsync(filePath);
        // 添加文件路径到哈希（确保不同文件的哈希不同）
        hash.update(filePath);
        // 添加文件修改时间到哈希
        hash.update(stats.mtimeMs.toString());
        // 对于文本文件（源代码）哈希内容，对于大文件只哈希元数据
        const isSourceFile = /\.(ts|js|jsx|tsx|vue|svelte|css|scss|less|json)$/.test(filePath);
        const isSmallFile = stats.size < 1024 * 1024; // 小于1MB
        if (isSourceFile && isSmallFile) {
            const content = await readFileAsync(filePath, 'utf-8');
            hash.update(content);
        }
        else {
            // 对于大文件或非源代码文件，只哈希元数据
            hash.update(stats.size.toString());
        }
    }
    catch (error) {
        // 忽略无法访问的文件
        if (error.code !== 'EACCES') {
            console.warn(`Warning: Cannot access file ${filePath}:`, error.message);
        }
    }
}
// 优化标记算法 - 使用BFS避免递归栈溢出
function markAffectedPackages(graph, target, affected) {
    const reverseEdges = buildReverseGraph(graph);
    const queue = [target];
    while (queue.length > 0) {
        const pkg = queue.shift();
        if (!affected.has(pkg)) {
            affected.add(pkg);
            // 使用反向图快速找到依赖者
            const dependents = reverseEdges.get(pkg) || [];
            for (const dependent of dependents) {
                if (!affected.has(dependent)) {
                    queue.push(dependent);
                }
            }
        }
    }
}
// 构建反向依赖图
function buildReverseGraph(graph) {
    const reverse = new Map();
    for (const [from, toList] of graph.edges.entries()) {
        for (const to of toList) {
            if (!reverse.has(to)) {
                reverse.set(to, []);
            }
            reverse.get(to).push(from);
        }
    }
    return reverse;
}
// 缓存管理函数
function clearBuildCache(pkg) {
    if (pkg) {
        buildCache.delete(pkg);
        console.log(`🧹 Cleared cache for ${pkg}`);
    }
    else {
        buildCache.clear();
        console.log('🧹 Cleared all build cache');
    }
}
function getCacheStats() {
    return { cached: buildCache.size, total: buildCache.size };
}
