import config from "./config";
import frameLine, { uncrossed, isBetween, visits } from "./line";
import node, {
  sameNode,
  hasOverlap,
  distanceFromPoint,
  isAdjacentTo,
} from "./node";
import { Coords, GridSystem, Frame, FrameLine, INode, Matrix } from "./types";

function cartesianProduct(arr1: number[], arr2: number[]): Matrix {
  return arr1.reduce(
    (acc, x) => {
      return acc.concat(arr2.map((y) => [x, y]));
    },
    [] as Matrix
  );
}

function integerRange(first: number, last: number) {
  return Array(last - first + 1)
    .fill(null)
    .map((_, i) => first + i);
}

function lineBetween(startNode: INode, endNode: INode) {
  return frameLine({
    startNode,
    endNode,
    style: config.frame,
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
function allNeighborsAdjacent(nodes: INode[]) {
  return nodes.reduce(
    (adjacencies, firstNode) => {
      return [
        ...adjacencies,
        nodes
          .map((secondNode, j) => [secondNode, j] as [INode, number])
          .filter(([secondNode]) => isAdjacentTo(firstNode, secondNode))
          .map(([_secondNode, j]) => j),
      ];
    },
    [] as Matrix
  );
}
function nodeIndex(node: INode, nodes: INode[]): number {
  return nodes.findIndex(function(someNode) {
    return sameNode(someNode, node);
  });
}

function closestNodeToPoint(coords: Coords, nodes: INode[]): INode {
  return nodes.reduce(function(acc, node) {
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

export function fromExtrema(initialBox: Coords, finalBox: Coords) {
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

export function findProximalNode(coords: Coords, nodes: INode[]): INode | null {
  const closestNode = closestNodeToPoint(coords, nodes);
  const proximityThreshold = config.nodeSelectionMinProximity;
  if (distanceFromPoint(closestNode, coords) < proximityThreshold) {
    return closestNode;
  }
  return null;
}

export function lineExistsBetween(
  nodeA: INode,
  nodeB: INode,
  lines: FrameLine[]
) {
  return !!lines.find((line) => {
    return isBetween(line, nodeA, nodeB);
  });
}

export function markAsAdjacent(
  nodeA: INode,
  nodeB: INode,
  nodes: INode[],
  adjacencyList: Matrix
) {
  return joinNodesAtIndex(
    nodeIndex(nodeA, nodes),
    nodeIndex(nodeB, nodes),
    adjacencyList
  );
}

export function linesOutFrom(node: INode, lines: FrameLine[]) {
  return lines.filter((line) => visits(line, node));
}

export function overlapsExistingNode(pxX: number, pxY: number, nodes: INode[]) {
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

export function firstUncrossedLine(lines: FrameLine[]): FrameLine | null {
  return lines.find(uncrossed) || null;
}

export function lines(nodes: INode[], adjacencyList: Matrix): FrameLine[] {
  return nodes.reduce(
    (lines, startNode, i) => {
      return lines.concat(
        adjacencyList[i]
          // avoid drawing each line twice
          .filter((j) => i < j)
          .map((j) => lineBetween(startNode, nodes[j]))
      );
    },
    [] as FrameLine[]
  );
}
