import config from "./config";
import frameLine, { uncrossed, isBetween, visits } from "./line";
import node, {
  sameNode,
  hasOverlap,
  distanceFromPoint,
  isAdjacentTo,
} from "./node";
import { GridSystem, Frame } from "./types";

function cartesianProduct(arr1, arr2) {
  return arr1.reduce((acc, x) => {
    return acc.concat(arr2.map((y) => [x, y]));
  }, []);
}

function integerRange(first: number, last: number) {
  return Array(last - first + 1)
    .fill(null)
    .map((_, i) => first + i);
}

function lineBetween(startNode, endNode) {
  return frameLine({
    method: "node",
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
function allNeighborsAdjacent(nodes) {
  return nodes.reduce((adjacencies, firstNode) => {
    return [
      ...adjacencies,
      nodes
        .map((secondNode, j) => [secondNode, j])
        .filter(([secondNode, j]) => isAdjacentTo(firstNode, secondNode))
        .map(([secondNode, j]) => j),
    ];
  }, []);
}
function nodeIndex(node, nodes) {
  return nodes.findIndex(function(someNode) {
    return sameNode(someNode, node);
  });
}

function closestNodeToPoint(coords, nodes) {
  return nodes.reduce(function(acc, node) {
    if (distanceFromPoint(node, coords) < distanceFromPoint(acc, coords)) {
      return node;
    } else {
      return acc;
    }
  });
}

function joinNodesAtIndex(idxA, idxB, adjacencyList) {
  const newAdjacencyList = [...adjacencyList];
  newAdjacencyList[idxA] = [...newAdjacencyList[idxA], idxB];
  newAdjacencyList[idxB] = [...newAdjacencyList[idxB], idxA];
  return newAdjacencyList;
}
export function fromExtrema(initialBox, finalBox) {
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

export function findProximalNode(coords, nodes) {
  const closestNode = closestNodeToPoint(coords, nodes);
  const proximityThreshold = config.nodeSelectionMinProximity;
  if (distanceFromPoint(closestNode, coords) < proximityThreshold) {
    return closestNode;
  }
  // explicit return to appease eslint
  return undefined;
}

export function lineExistsBetween(nodeA, nodeB, lines) {
  return !!lines.find((line) => {
    return isBetween(line, nodeA, nodeB);
  });
}

export function markAsAdjacent(nodeA, nodeB, nodes, adjacencyList) {
  return joinNodesAtIndex(
    nodeIndex(nodeA, nodes),
    nodeIndex(nodeB, nodes),
    adjacencyList
  );
}

export function linesOutFrom(node, lines) {
  return lines.filter((line) => visits(line, node));
}

export function overlapsExistingNode(pxX, pxY, nodes) {
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
  };
}

export function firstUncrossedLine(lines) {
  return lines.find(uncrossed);
}

export function lines(nodes, adjacencyList) {
  return nodes.reduce((lines, startNode, i) => {
    return lines.concat(
      adjacencyList[i]
        // avoid drawing each line twice
        .filter((j) => i < j)
        .map((j) => lineBetween(startNode, nodes[j]))
    );
  }, []);
}
