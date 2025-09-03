"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPeerDependencies = checkPeerDependencies;
function checkPeerDependencies(graph) {
    const peerMap = {};
    for (const pkg of graph.nodes.values()) {
        for (const [dep, version] of Object.entries(pkg.peerDependencies)) {
            if (!peerMap[dep]) {
                peerMap[dep] = version;
            }
            else if (peerMap[dep] !== version) {
                console.error(`❌ Peer dependency mismatch for ${dep}: ${peerMap[dep]} vs ${version}`);
            }
        }
    }
}
