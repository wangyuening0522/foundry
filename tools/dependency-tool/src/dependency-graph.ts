/// dependency-graph.ts
import fs from 'fs';
import path from 'path';

export interface PackageInfo {
  name: string;
  dir: string;
  dependencies: string[];
  peerDependencies: Record<string, string>;
}

export interface DependencyGraph {
  nodes: Map<string, PackageInfo>;
  edges: Map<string, string[]>;
}
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
export function loadPackages(rootDir: string): Map<string, PackageInfo> {
  const packagesDir = fs.readdirSync(rootDir);
  const packages = new Map<string, PackageInfo>();

  for (const pkg of packagesDir) {
    const pkgPath = path.join(rootDir, pkg, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const json = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      packages.set(json.name, {
        name: json.name,
        dir: path.dirname(pkgPath),
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
export function buildGraph(packages: Map<string, PackageInfo>): DependencyGraph {
  const edges = new Map<string, string[]>();
  for (const [name, pkg] of packages.entries()) {
    edges.set(
      name,
      pkg.dependencies.filter((dep) => packages.has(dep))
    );
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
export function topoSort(graph: DependencyGraph): string[] {
  const inDegree: Record<string, number> = {};
  for (const node of graph.nodes.keys()) {
    inDegree[node] = 0;
  }
  for (const deps of graph.edges.values()) {
    for (const dep of deps) {
      inDegree[dep]++;
    }
  }

  const queue = Object.keys(inDegree).filter((n) => inDegree[n] === 0);
  const result: string[] = [];

  while (queue.length > 0) {
    const node = queue.shift()!;
    result.push(node);
    for (const dep of graph.edges.get(node) || []) {
      inDegree[dep]--;
      if (inDegree[dep] === 0) queue.push(dep);
    }
  }

  if (result.length !== graph.nodes.size) {
    throw new Error('❌ Detected circular dependency');
  }
  return result;
}
