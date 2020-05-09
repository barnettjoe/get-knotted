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

export function makeLines(nodes, adjacencyList) {
  const lines = [];
  nodes.forEach((startNode, i) => {
    adjacencyList[i].forEach((j) => {
      // avoid drawing each line twice
      if (i < j) {
        lines.push(lineBetween(startNode, nodes[j]));
      }
    });
  });
  return lines;
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
  const adjacencies = [];
  nodes.forEach((firstNode) => {
    adjacencies.push([]);
    nodes.forEach((secondNode, j) => {
      if (firstNode.isAdjacentTo(secondNode)) {
        adjacencies[adjacencies.length - 1].push(j);
      }
    });
  });
  return adjacencies;
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
  const lines = makeLines(nodes, adjacencyList);
  const parent = Object.create(framePrototype);
  return Object.assign(parent, {
    nodes,
    adjacencyList,
    lines,
    crossingPoints: lines.map((line) => line.crossingPoint),
  });
}

const framePrototype = {
  nodeIndex(node) {
    return this.nodes.findIndex(function(someNode) {
      return someNode.sameNode(node);
    });
  },
  closestNodeToPoint(coords) {
    return this.nodes.reduce(function(acc, node) {
      if (node.distanceFromPoint(coords) < acc.distanceFromPoint(coords)) {
        return node;
      } else {
        return acc;
      }
    });
  },
  findProximalNode(coords) {
    const closestNode = this.closestNodeToPoint(coords);
    const proximityThreshold = config.nodeSelectionMinProximity;
    if (closestNode.distanceFromPoint(coords) < proximityThreshold) {
      return closestNode;
    }
    // explicit return to appease eslint
    return undefined;
  },
  lineExistsBetween(nodeA, nodeB) {
    const allLines = this.lines;
    return !!allLines.find((line) => {
      return line.isBetween(nodeA, nodeB);
    });
  },
  joinNodesAtIndex(idxA, idxB) {
    this.adjacencyList[idxA].push(idxB);
    this.adjacencyList[idxB].push(idxA);
  },
  markAsAdjacent(nodeA, nodeB) {
    this.joinNodesAtIndex(this.nodeIndex(nodeA), this.nodeIndex(nodeB));
  },
  hoverIn(node) {
    return () => {
      this.hoveredNode = node;
    };
  },
  hoverOut() {
    this.hoveredNode = undefined;
  },
  showCrossingPoints() {
    this.lines.forEach((line) => line.drawCrossingPoints());
  },
  showAllNodes() {
    this.nodes.forEach((node) => node.draw());
  },
  linesOutFrom(node) {
    return this.lines.filter((line) => line.visits(node));
  },
  draw() {
    this.lines.forEach((line) => line.draw());
    this.showAllNodes();
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
