import config from "./config.js";
import { FrameLine } from "./line";
import Node from "./node";
import { INode, GridSystem, Matrix } from "./types";

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
  return new FrameLine({
    method: "node",
    startNode,
    endNode,
    style: config.frame,
  });
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
        .filter(([secondNode, j]) => firstNode.isAdjacentTo(secondNode))
        .map(([secondNode, j]) => j),
    ];
  }, []);
}
export function fromExtrema(initialBox, finalBox) {
  const nodeCoords = coordinateSet({
    leftmost: Math.min(initialBox[0], finalBox[0]),
    rightmost: Math.max(initialBox[0], finalBox[0]),
    topmost: Math.min(initialBox[1], finalBox[1]),
    bottommost: Math.max(initialBox[1], finalBox[1]),
  });

  const nodes = nodeCoords.map((coord) => {
    return new Node({
      x: coord[0],
      y: coord[1],
      gridSystem: GridSystem.square,
    });
  });
  const adjacencyList = allNeighborsAdjacent(nodes);
  const frameLines = lines(nodes, adjacencyList);
  const parent = Object.create(framePrototype);
  return Object.assign(parent, {
    nodes,
    adjacencyList,
    lines: frameLines,
    crossingPoints: frameLines.map((line) => line.crossingPoint),
  });
}

function nodeIndex(node, nodes) {
  return nodes.findIndex(function(someNode) {
    return someNode.sameNode(node);
  });
}

function closestNodeToPoint(coords, nodes) {
  return nodes.reduce(function(acc, node) {
    if (node.distanceFromPoint(coords) < acc.distanceFromPoint(coords)) {
      return node;
    } else {
      return acc;
    }
  });
}

export function findProximalNode(coords, nodes) {
  const closestNode = closestNodeToPoint(coords, nodes);
  const proximityThreshold = config.nodeSelectionMinProximity;
  if (closestNode.distanceFromPoint(coords) < proximityThreshold) {
    return closestNode;
  }
  // explicit return to appease eslint
  return undefined;
}

export function lineExistsBetween(nodeA, nodeB, lines) {
  return !!lines.find((line) => {
    return line.isBetween(nodeA, nodeB);
  });
}

function joinNodesAtIndex(idxA, idxB, adjacencyList) {
  const newAdjacencyList = [...adjacencyList];
  newAdjacencyList[idxA] = [...newAdjacencyList[idxA], idxB];
  newAdjacencyList[idxB] = [...newAdjacencyList[idxB], idxA];
  return newAdjacencyList;
}

export function markAsAdjacent(nodeA, nodeB, nodes, adjacencyList) {
  return joinNodesAtIndex(
    nodeIndex(nodeA, nodes),
    nodeIndex(nodeB, nodes),
    adjacencyList
  );
}

export function linesOutFrom(node, lines) {
  return lines.filter((line) => line.visits(node));
}

const framePrototype = {
  draw() {
    this.lines.forEach((line) => line.draw());
    this.nodes.forEach((node) => node.draw());
  },
  overlapsExistingNode(pxX, pxY) {
    return this.nodes.some((node) => node.hasOverlap(pxX, pxY));
  },
  merge(otherFrame) {
    const originalLength = this.nodes.length;
    const nodes = this.nodes.concat(otherFrame.nodes);
    const newAdjacencies = otherFrame.adjacencyList.map((arr) =>
      arr.map((x) => x + originalLength)
    );
    const adjacencies = this.adjacencyList.concat(newAdjacencies);
    this.nodes = nodes;
    this.adjacencyList = adjacencies;
    return this;
  },
  firstUncrossedLine() {
    return this.lines.find((line) => line.uncrossed());
  },
  remove() {
    this.lines.forEach((line) => line.snapObj.remove());
    this.lines = [];

    if (this.nodes) {
      this.nodes.forEach((node) => node.remove());
    }
  },
};

export default function Frame(nodes, adjacencyList) {
  return Object.assign(Object.create(framePrototype), { nodes, adjacencyList });
}
