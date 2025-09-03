#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const dependency_graph_1 = require("./dependency-graph");
const peer_checker_1 = require("./peer-checker");
const build_runner_1 = require("./build-runner");
const watcher_1 = require("./watcher");
const rootDir = path_1.default.join(process.cwd(), 'packages');
const packages = (0, dependency_graph_1.loadPackages)(rootDir);
const graph = (0, dependency_graph_1.buildGraph)(packages);
const command = process.argv[2];
const arg = process.argv[3];
// 额外参数，例如 --alias / --dist
const extraArgs = process.argv.slice(4);
const useAlias = extraArgs.includes('--alias') || (!extraArgs.includes('--dist'));
switch (command) {
    case 'analyze': {
        const sorted = (0, dependency_graph_1.topoSort)(graph);
        console.log(sorted.join(' → '));
        (0, peer_checker_1.checkPeerDependencies)(graph);
        break;
    }
    case 'build': {
        if (!arg)
            throw new Error('Please specify a package to build');
        (0, build_runner_1.buildPackages)(graph, arg);
        break;
    }
    case 'dev': {
        if (!arg)
            throw new Error('Please specify an entry package');
        console.log(`\n🚀 Starting dev mode for ${arg}`);
        console.log(`   Mode: ${useAlias ? "alias (HMR)" : "dist (full reload)"}\n`);
        (0, watcher_1.startDev)(graph, arg, useAlias);
        break;
    }
    default:
        console.log('Usage: pnpm tool <analyze|build|dev> [package] [--alias|--dist]');
}
