#!/usr/bin/env node
import path from 'path';
import { loadPackages, buildGraph, topoSort } from './dependency-graph';
import { checkPeerDependencies } from './peer-checker';
import { buildPackages } from './build-runner';
import { startDev } from './watcher';

const rootDir = path.join(process.cwd(), 'packages');
const packages = loadPackages(rootDir);
const graph = buildGraph(packages);

const command = process.argv[2];
const arg = process.argv[3];

// 额外参数，例如 --alias / --dist
const extraArgs = process.argv.slice(4);
const useAlias = extraArgs.includes('--alias') || (!extraArgs.includes('--dist'));

switch (command) {
  case 'analyze': {
    const sorted = topoSort(graph);
    console.log(sorted.join(' → '));
    checkPeerDependencies(graph);
    break;
  }
  case 'build': {
    if (!arg) throw new Error('Please specify a package to build');
    buildPackages(graph, arg);
    break;
  }
  case 'dev': {
    if (!arg) throw new Error('Please specify an entry package');

    console.log(`\n🚀 Starting dev mode for ${arg}`);
    console.log(`   Mode: ${useAlias ? "alias (HMR)" : "dist (full reload)"}\n`);

    startDev(graph, arg, useAlias);
    break;
  }
  default:
    console.log('Usage: pnpm tool <analyze|build|dev> [package] [--alias|--dist]');
}
