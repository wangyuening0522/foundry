import { DependencyGraph } from './dependency-graph';
import semver from 'semver';

export function checkPeerDependencies(graph: DependencyGraph) {
  const peerMap: Record<string, string> = {};

  for (const pkg of graph.nodes.values()) {
    for (const [dep, versionRange] of Object.entries(pkg.peerDependencies)) {
      if (!peerMap[dep]) {
        peerMap[dep] = versionRange;
      } else {
        const existingRange = peerMap[dep];
        // 检查两个 range 是否有交集
        const intersect = semver.intersects(existingRange, versionRange);
        if (!intersect) {
          console.error(
            `❌ Peer dependency mismatch for ${dep}: ${existingRange} vs ${versionRange}`
          );
        }
      }
    }
  }
}
