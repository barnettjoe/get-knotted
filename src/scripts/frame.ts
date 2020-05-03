import Grid from "./grid";
import config from "./config.js";
import { FrameLine } from "./line";
import Node from "./node";
import { INode, GridSystem, Matrix } from "./types";

function cartesianProduct(arr1, arr2) {
  return arr1.reduce((acc, x) => {
    return acc.concat(arr2.map((y) => [x, y]));
  }, []);
}

function integerRange(first, last) {
  return Array(last - first + 1)
    .fill()
    .map((_, i) => first + i);
}

function coordinateSet({ leftmost, rightmost, topmost, bottommost }) {
  const xCoords = integerRange(leftmost, rightmost + 1);
  const yCoords = integerRange(topmost, bottommost + 1);
  return cartesianProduct(xCoords, yCoords);
}

export default class Frame extends Grid {
  private adjacencyList: Matrix;
  // TODO - error here bc. superclass Grid has a property nodes too, which has different type
  private nodes: INode[];
  public crossingPoints: any[];

  constructor(nodes, adjacencies) {
    super();
    this.nodes = nodes;
    this.adjacencyList = adjacencies;
  }

  // for drawing as a grid rather than individual nodes and lines...
  static fromExtrema(initialBox, finalBox) {
    const frame = new Frame([], []);

    const leftmost = Math.min(initialBox[0], finalBox[0]);
    const topmost = Math.min(initialBox[1], finalBox[1]);
    const rightmost = Math.max(initialBox[0], finalBox[0]);
    const bottommost = Math.max(initialBox[1], finalBox[1]);

    const nodeCoords = coordinateSet({
      leftmost,
      rightmost,
      topmost,
      bottommost,
    });
    nodeCoords.forEach((coord) => {
      frame.nodes.push(
        new Node({
          x: coord[0],
          y: coord[1],
          gridSystem: GridSystem.square,
        })
      );
    });
    frame.adjacencyList = Frame.allNeighboursAdjacent(frame);
    frame.makeLines();
    return frame;
  }

  nodeIndex(node) {
    return this.nodes.findIndex(function(someNode) {
      return someNode.sameNode(node);
    });
  }

  closestNodeToPoint(coords) {
    return this.nodes.reduce(function(acc, node) {
      if (node.distanceFromPoint(coords) < acc.distanceFromPoint(coords)) {
        return node;
      } else {
        return acc;
      }
    });
  }

  findProximalNode(coords) {
    const closestNode = this.closestNodeToPoint(coords);
    const proximityThreshold = config.nodeSelectionMinProximity;
    if (closestNode.distanceFromPoint(coords) < proximityThreshold) {
      return closestNode;
    }
    // explicit return to appease eslint
    return undefined;
  }

  lineExistsBetween(nodeA, nodeB) {
    const allLines = this.lines;
    return !!allLines.find((line) => {
      return line.isBetween(nodeA, nodeB);
    });
  }

  joinNodesAtIndex(idxA, idxB) {
    this.adjacencyList[idxA].push(idxB);
    this.adjacencyList[idxB].push(idxA);
  }

  markAsAdjacent(nodeA, nodeB) {
    this.joinNodesAtIndex(this.nodeIndex(nodeA), this.nodeIndex(nodeB));
  }

  hoverIn(node) {
    return () => {
      this.hoveredNode = node;
    };
  }

  hoverOut() {
    this.hoveredNode = undefined;
  }

  showCrossingPoints() {
    this.lines.forEach((line) => line.drawCrossingPoints());
  }

  showAllNodes() {
    this.nodes.forEach((node) => node.draw());
  }

  static allNeighboursAdjacent(frame) {
    const adjacencies = [];
    frame.nodes.forEach((firstNode) => {
      adjacencies.push([]);
      frame.nodes.forEach((secondNode, j) => {
        if (firstNode.isAdjacentTo(secondNode)) {
          adjacencies[adjacencies.length - 1].push(j);
        }
      });
    });
    return adjacencies;
  }

  makeLineBetween(startNode, endNode) {
    this.lines.push(
      new FrameLine({
        method: "node",
        startNode,
        endNode,
        style: config.frame,
      })
    );
  }

  makeLines() {
    this.lines = [];
    this.nodes.forEach((startNode, i) => {
      this.adjacencyList[i].forEach((j) => {
        // avoid drawing each line twice
        if (i < j) {
          this.makeLineBetween(startNode, this.nodes[j]);
        }
      });
    });
    this.crossingPoints = this.lines.map((line) => line.crossingPoint);
  }

  linesOutFrom(node) {
    return this.lines.filter((line) => line.visits(node));
  }

  draw() {
    this.lines.forEach((line) => line.draw());
    this.showAllNodes();
  }

  overlapsExistingNode(pxX, pxY) {
    return this.nodes.some((node) => node.hasOverlap(pxX, pxY));
  }

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
  }

  firstUncrossedLine() {
    return this.lines.find((line) => line.uncrossed());
  }
}