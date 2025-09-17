"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadPackages = loadPackages;
exports.buildGraph = buildGraph;
exports.topoSort = topoSort;
/// dependency-graph.ts
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// 返回map-包名:包信息
/*
Map {
  'package-a' => {
    name: 'package-a',
    dir: '/path/to/packages/package-a',
    dependencies: ['package-b', 'lodash'],
    peerDependencies: { react: '^18.0.0' }
  },
  'package-b' => { ... }
}
*/
function loadPackages(rootDir) {
    const packagesDir = fs_1.default.readdirSync(rootDir);
    const packages = new Map();
    for (const pkg of packagesDir) {
        const pkgPath = path_1.default.join(rootDir, pkg, 'package.json');
        if (fs_1.default.existsSync(pkgPath)) {
            const json = JSON.parse(fs_1.default.readFileSync(pkgPath, 'utf-8'));
            packages.set(json.name, {
                name: json.name,
                dir: path_1.default.dirname(pkgPath),
                dependencies: [
                    ...Object.keys(json.dependencies || {}),
                    ...Object.keys(json.devDependencies || {}),
                ],
                peerDependencies: json.peerDependencies || {},
            });
        }
    }
    return packages;
}
/*
{
  nodes: Map { 同输入的 packages },
  edges: Map {
    'package-a' => ['package-b'],
    'package-b' => [],
    'package-c' => ['package-a', 'package-b']
  }
}
*/
function buildGraph(packages) {
    const edges = new Map();
    for (const [name, pkg] of packages.entries()) {
        edges.set(name, pkg.dependencies.filter((dep) => packages.has(dep)));
    }
    return { nodes: packages, edges };
}
// 将依赖图转换为拓扑排序后的包名数组（构建顺序）
/*
算法思路:
1. 初始化入度表：统计每个包的被依赖次数
2. 找到起点：入度为 0 的包（没有内部依赖的包）
3. BFS 遍历：将入度为 0 的包加入结果，减少其依赖包的入度,将新的入度为 0 的包加入队列
4. 检测循环依赖：如果结果数量不等于节点数量，说明存在循环依赖
*/
/*
// 假设依赖关系：package-c → package-a → package-b
['package-b', 'package-a', 'package-c']
*/
function topoSort(graph) {
    const inDegree = {};
    for (const node of graph.nodes.keys()) {
        inDegree[node] = 0;
    }
    for (const deps of graph.edges.values()) {
        for (const dep of deps) {
            inDegree[dep]++;
        }
    }
    // 获取起点初始化queue
    const queue = Object.keys(inDegree).filter((n) => inDegree[n] === 0);
    const result = [];
    while (queue.length > 0) {
        const node = queue.shift();
        result.push(node);
        for (const dep of graph.edges.get(node) || []) {
            inDegree[dep]--;
            if (inDegree[dep] === 0)
                queue.push(dep);
        }
    }
    if (result.length !== graph.nodes.size) {
        throw new Error('❌ Detected circular dependency');
    }
    return result;
}
