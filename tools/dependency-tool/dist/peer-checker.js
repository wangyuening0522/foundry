"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPeerDependencies = checkPeerDependencies;
const semver_1 = __importDefault(require("semver"));
function checkPeerDependencies(graph) {
    const peerMap = {};
    for (const pkg of graph.nodes.values()) {
        for (const [dep, versionRange] of Object.entries(pkg.peerDependencies)) {
            if (!peerMap[dep]) {
                peerMap[dep] = versionRange;
            }
            else {
                const existingRange = peerMap[dep];
                // 检查两个 range 是否有交集
                const intersect = semver_1.default.intersects(existingRange, versionRange);
                if (!intersect) {
                    console.error(`❌ Peer dependency mismatch for ${dep}: ${existingRange} vs ${versionRange}`);
                }
            }
        }
    }
}
