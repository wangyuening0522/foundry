/// peer-checker.ts
import { DependencyGraph } from './dependency-graph';

export function checkPeerDependencies(graph: DependencyGraph) {
  const peerMap: Record<string, string> = {};
  for (const pkg of graph.nodes.values()) {
    for (const [dep, version] of Object.entries(pkg.peerDependencies)) {
      if (!peerMap[dep]) {
        peerMap[dep] = version;
      } else if (peerMap[dep] !== version) {
        console.error(`❌ Peer dependency mismatch for ${dep}: ${peerMap[dep]} vs ${version}`);
      }
    }
  }
}