import { PipelineSpecification, Subject } from "./pipeline-types";

/*
  "undiscovered", "discovered", and "finished" correspond to "white", "gray" and
  "black" respectively in the terminology sometimes used (e.g. in CLRS) to
  describe depth-first search,
*/
enum NodePhase {
  undiscovered,
  discovered,
  finished,
}

interface NodeInfo {
  phase: NodePhase;
  discoveryTime: number;
  finishTime: number;
}

export default function topologicalOrdering(
  pipelineSpecification: PipelineSpecification
) {
  function getNodeInfo(node: Subject<unknown>): NodeInfo {
    const nodeInfo = nodes.get(node);
    if (!nodeInfo) {
      throw new Error(`could not get node ${node.name}`);
    }
    return nodeInfo;
  }
  function discover(node: Subject<unknown>) {
    const nodeInfo = getNodeInfo(node);
    nodes.set(node, {
      ...nodeInfo,
      discoveryTime: tick++,
      phase: NodePhase.discovered,
    });
  }
  function finish(node: Subject<unknown>) {
    const nodeInfo = getNodeInfo(node);
    nodes.set(node, {
      ...nodeInfo,
      finishTime: tick++,
      phase: NodePhase.finished,
    });
  }
  function depthFirstSearch(
    node: Subject<unknown>,
    ancestorIds: Subject<unknown>[]
  ) {
    discover(node);
    const spec = pipelineSpecification.get(node);
    if (!spec)
      throw new Error(`could not find specification for node ${node.name}`);
    const children = spec.observers;
    children.forEach((childNode) => {
      const childNodeInfo = getNodeInfo(childNode);
      if (childNodeInfo.phase === NodePhase.undiscovered) {
        depthFirstSearch(childNode, ancestorIds.concat(node));
      } else if (childNodeInfo.phase === NodePhase.discovered) {
        // We have found a cycle in our dependency graph. This is not allowed
        // because it means we can't find a topological ordering, and could
        // cause infinite loops.
        const cycleIds = ancestorIds
          .slice(ancestorIds.indexOf(childNode))
          .concat([node, childNode])
          .map((node) => node.name);
        throw new Error(
          `Dependency cycle detected in the data pipeline: ${cycleIds.join(
            " -> "
          )}`
        );
      }
    });
    finish(node);
  }
  let tick = 0;
  const nodes = new Map<Subject<unknown>, NodeInfo>();
  pipelineSpecification.forEach((_, node) => {
    nodes.set(node, {
      phase: NodePhase.undiscovered,
      discoveryTime: 0,
      finishTime: 0,
    });
  });
  nodes.forEach((_nodeInfo, node) => {
    depthFirstSearch(node, []);
  });
  return [...nodes]
    .sort(
      ([, nodeInfoA], [, nodeInfoB]) =>
        nodeInfoA.finishTime - nodeInfoB.finishTime
    )
    .map(([node]) => node);
}
