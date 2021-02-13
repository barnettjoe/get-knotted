import { PipelineSpecification, StageName } from "./pipeline-types";

interface NodeInfo {
  color: "gray" | "black" | "white";
  discovered: number;
  finished: number;
}

const pipelineSpecification = {
  frame: { dependencies: [] },
  // when the frame updates, the strand should update
  strands: { dependencies: ["frame"] },
  // when the strand updates, the contour should update
  contour: { dependencies: ["strands"] },
  // when the contour updates, the offsets should update
  offsets: { dependencies: ["contour"] },
  // when the offsets or frame updates, the primitives should update
  primitives: { dependencies: ["offsets", "frame"] },
} as const;

function topologicalOrdering(pipelineSpecification: PipelineSpecification) {
  function getNodeInfo(nodeId: StageName): NodeInfo {
    const nodeInfo = nodes.get(nodeId);
    if (!nodeInfo) {
      throw new Error(`could not get node ${nodeId}`);
    }
    return nodeInfo;
  }
  function discover(nodeId: StageName) {
    const nodeInfo = getNodeInfo(nodeId);
    nodes.set(nodeId, { ...nodeInfo, discovered: tick++, color: "gray" });
  }
  function finish(nodeId: StageName) {
    const nodeInfo = getNodeInfo(nodeId);
    nodes.set(nodeId, { ...nodeInfo, finished: tick++, color: "black" });
  }
  function depthFirstSearch(nodeId: StageName, ancestorIds: string[]) {
    discover(nodeId);
    const children = pipelineSpecification[nodeId].dependencies;
    for (const childNodeId of children) {
      const childNodeInfo = getNodeInfo(childNodeId);
      if (childNodeInfo.color === "white") {
        depthFirstSearch(childNodeId, ancestorIds.concat(nodeId));
      } else if (childNodeInfo.color === "gray") {
        const cycleIds = ancestorIds
          .slice(ancestorIds.indexOf(childNodeId))
          .concat([nodeId, childNodeId]);
        throw new Error(
          `dependency cycle detected in data pipeline: ${cycleIds.join(" -> ")}`
        );
      }
    }
    finish(nodeId);
  }
  let tick = 0;
  const nodes = new Map<StageName, NodeInfo>();
  const nodeNames = Object.keys(pipelineSpecification) as StageName[];
  nodeNames.forEach((nodeName) => {
    nodes.set(nodeName, { color: "white", discovered: 0, finished: 0 });
  });
  nodes.forEach((_nodeInfo, nodeName) => {
    depthFirstSearch(nodeName, []);
  });
  const topologicalOrdering = [...nodes]
    .sort((a, b) => a[1].finished - b[1].finished)
    .map((a) => a[0]);
  return topologicalOrdering;
}

const result = topologicalOrdering(pipelineSpecification);
console.log(result);
