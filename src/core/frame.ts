import config from "./config";
import frameLine, { uncrossed, isBetween, visits } from "./line";
import node, {
  sameNode,
  hasOverlap,
  distanceFromPoint,
  isAdjacentTo,
} from "./node";
import {
  GridSystem,
  Frame,
  FrameLine,
  FrameNode,
  Matrix,
  Vector,
  CrossingState,
} from "./types";

function cartesianProduct(arr1: number[], arr2: number[]): Matrix {
  return arr1.reduce((acc, x) => {
    return acc.concat(arr2.map((y) => [x, y]));
  }, [] as Matrix);
}

function integerRange(first: number, last: number) {
  return Array(last - first + 1)
    .fill(null)
    .map((_, i) => first + i);
}

function lineBetween(startNode: FrameNode, endNode: FrameNode) {
  return frameLine({
    startNode,
    endNode,
  });
}

function coordinateSet({
  leftmost,
  rightmost,
  topmost,
  bottommost,
}: {
  leftmost: number;
  rightmost: number;
  topmost: number;
  bottommost: number;
}) {
  const xCoords = integerRange(leftmost, rightmost + 1);
  const yCoords = integerRange(topmost, bottommost + 1);
  return cartesianProduct(xCoords, yCoords);
}

// for drawing as a grid rather than individual nodes and lines...
function allNeighborsAdjacent(nodes: FrameNode[]) {
  return nodes.reduce((adjacencies, firstNode) => {
    return [
      ...adjacencies,
      nodes
        .map((secondNode, j) => [secondNode, j] as [FrameNode, number])
        .filter(([secondNode]) => isAdjacentTo(firstNode, secondNode))
        .map(([, j]) => j),
    ];
  }, [] as Matrix);
}
function nodeIndex(node: FrameNode, nodes: FrameNode[]): number {
  return nodes.findIndex(function (someNode) {
    return sameNode(someNode, node);
  });
}

function closestNodeToPoint(coords: Vector, nodes: FrameNode[]): FrameNode {
  return nodes.reduce(function (acc, node) {
    if (distanceFromPoint(node, coords) < distanceFromPoint(acc, coords)) {
      return node;
    } else {
      return acc;
    }
  });
}

function joinNodesAtIndex(
  idxA: number,
  idxB: number,
  adjacencyList: Matrix
): Matrix {
  const newAdjacencyList = [...adjacencyList];
  newAdjacencyList[idxA] = [...newAdjacencyList[idxA], idxB];
  newAdjacencyList[idxB] = [...newAdjacencyList[idxB], idxA];
  return newAdjacencyList;
}

export function fromExtrema(initialBox: Vector, finalBox: Vector): Frame {
  const nodeCoords = coordinateSet({
    leftmost: Math.min(initialBox[0], finalBox[0]),
    rightmost: Math.max(initialBox[0], finalBox[0]),
    topmost: Math.min(initialBox[1], finalBox[1]),
    bottommost: Math.max(initialBox[1], finalBox[1]),
  });

  const nodes = nodeCoords.map((coord) => {
    return node({
      x: coord[0],
      y: coord[1],
      gridSystem: GridSystem.square,
    });
  });
  const adjacencyList = allNeighborsAdjacent(nodes);
  const frameLines = lines(nodes, adjacencyList);
  return {
    nodes,
    adjacencyList,
    lines: frameLines,
  };
}

export function findProximalNode(
  coords: Vector,
  nodes: FrameNode[]
): FrameNode | null {
  const closestNode = closestNodeToPoint(coords, nodes);
  const proximityThreshold = config.nodeSelectionMinProximity;
  if (distanceFromPoint(closestNode, coords) < proximityThreshold) {
    return closestNode;
  }
  return null;
}

export function lineExistsBetween(
  nodeA: FrameNode,
  nodeB: FrameNode,
  lines: FrameLine[]
): boolean {
  return !!lines.find((line) => {
    return isBetween(line, nodeA, nodeB);
  });
}

export function markAsAdjacent(
  nodeA: FrameNode,
  nodeB: FrameNode,
  nodes: FrameNode[],
  adjacencyList: Matrix
): Matrix {
  return joinNodesAtIndex(
    nodeIndex(nodeA, nodes),
    nodeIndex(nodeB, nodes),
    adjacencyList
  );
}

export function linesOutFrom(node: FrameNode, lines: FrameLine[]): FrameLine[] {
  return lines.filter((line) => visits(line, node));
}

export function overlapsExistingNode(
  pxX: number,
  pxY: number,
  nodes: FrameNode[]
): boolean {
  return nodes.some((node) => hasOverlap(node, pxX, pxY));
}

export function merge(frame: Frame, otherFrame: Frame): Frame {
  const originalLength = frame.nodes.length;
  const newNodes = frame.nodes.concat(otherFrame.nodes);
  const newAdjacencies = otherFrame.adjacencyList.map((arr) =>
    arr.map((x) => x + originalLength)
  );
  return {
    nodes: newNodes,
    adjacencyList: frame.adjacencyList.concat(newAdjacencies),
    lines: [],
  };
}

export function firstUncrossedLine(
  lines: FrameLine[],
  lineCrossingState: CrossingState
): FrameLine | null {
  return lines.find((line) => uncrossed(line, lineCrossingState)) || null;
}

export function lines(nodes: FrameNode[], adjacencyList: Matrix): FrameLine[] {
  return nodes.reduce((lines, startNode, i) => {
    return lines.concat(
      adjacencyList[i]
        // avoid drawing each line twice
        .filter((j) => i < j)
        .map((j) => lineBetween(startNode, nodes[j]))
    );
  }, [] as FrameLine[]);
}
