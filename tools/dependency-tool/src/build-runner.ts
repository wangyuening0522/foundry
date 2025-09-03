/// build-runner.ts - 优化版本
import { exec } from 'child_process';
import { promisify } from 'util';
import { DependencyGraph, topoSort } from './dependency-graph';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const execAsync = promisify(exec);
const readFileAsync = promisify(fs.readFile);
const statAsync = promisify(fs.stat);
const readdirAsync = promisify(fs.readdir);

// 构建缓存
const buildCache = new Map<string, string>();

// 缓存配置
const IGNORED_FILES = ['.DS_Store', 'Thumbs.db', '.gitkeep'];
const IGNORED_DIRS = ['node_modules', 'dist', '.git', '.next', '.nuxt', '.output'];

export async function buildPackages(graph: DependencyGraph, target: string) {
  const affected = new Set<string>();
  // 优化后的标记算法
  markAffectedPackages(graph, target, affected);
  
  const sortedOrder = topoSort(graph);
  const orderedAffected = sortedOrder.filter(pkg => affected.has(pkg));
  
  console.log(`📦 Packages to build: ${Array.from(orderedAffected).join(' → ')}`);
  
  // 并行构建
  const buildPromises = orderedAffected.map(pkg => 
    buildPackageWithCache(graph, pkg)
  );
  
  await Promise.all(buildPromises);
  console.log('✅ Build finished');
}

async function buildPackageWithCache(graph: DependencyGraph, pkg: string) {
  const info = graph.nodes.get(pkg)!;
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
  } catch (error) {
    console.error(`❌ Failed to build ${pkg}:`, error);
    // 构建失败时清除缓存，确保下次重新构建
    buildCache.delete(pkg);
    throw error;
  }
}

// 生成基于文件内容的缓存键
async function generateCacheKey(dir: string): Promise<string> {
  const hash = crypto.createHash('sha256');
  await hashDirectory(dir, hash);
  return hash.digest('hex');
}

// 递归哈希目录中的所有文件
async function hashDirectory(dir: string, hash: crypto.Hash): Promise<void> {
  try {
    const items = await readdirAsync(dir, { withFileTypes: true });
    
    // 按文件名排序确保顺序一致
    items.sort((a, b) => a.name.localeCompare(b.name));
    
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      
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
      } else if (item.isFile()) {
        await hashFile(fullPath, hash);
      }
    }
  } catch (error:any) {
    // 忽略无法访问的目录
    if (error.code !== 'EACCES') {
      console.warn(`Warning: Cannot access directory ${dir}:`, error.message);
    }
  }
}

// 哈希单个文件
async function hashFile(filePath: string, hash: crypto.Hash): Promise<void> {
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
    } else {
      // 对于大文件或非源代码文件，只哈希元数据
      hash.update(stats.size.toString());
    }
  } catch (error:any) {
    // 忽略无法访问的文件
    if (error.code !== 'EACCES') {
      console.warn(`Warning: Cannot access file ${filePath}:`, error.message);
    }
  }
}

// 优化标记算法 - 使用BFS避免递归栈溢出
function markAffectedPackages(graph: DependencyGraph, target: string, affected: Set<string>) {
  const reverseEdges = buildReverseGraph(graph);
  const queue = [target];
  
  while (queue.length > 0) {
    const pkg = queue.shift()!;
    
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
function buildReverseGraph(graph: DependencyGraph): Map<string, string[]> {
  const reverse = new Map<string, string[]>();
  
  for (const [from, toList] of graph.edges.entries()) {
    for (const to of toList) {
      if (!reverse.has(to)) {
        reverse.set(to, []);
      }
      reverse.get(to)!.push(from);
    }
  }
  
  return reverse;
}

// 缓存管理函数
export function clearBuildCache(pkg?: string): void {
  if (pkg) {
    buildCache.delete(pkg);
    console.log(`🧹 Cleared cache for ${pkg}`);
  } else {
    buildCache.clear();
    console.log('🧹 Cleared all build cache');
  }
}

export function getCacheStats(): { cached: number; total: number } {
  return { cached: buildCache.size, total: buildCache.size };
}