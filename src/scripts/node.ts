import { pixelCoords } from "./mouse.js";
import config from "./config";
import { identicalObjects, distanceBetween } from "./general-utils";
import { NodeOptions, GridSystem, Coords } from "./types";

export default function node(options: NodeOptions) {
  switch (options.gridSystem) {
    case GridSystem.square: {
      const { x: gridX, y: gridY } = options;
      let [x, y] = pixelCoords([gridX, gridY]);
      return { gridX, gridY, x, y };
    }
    case GridSystem.freeform: {
      const { x, y } = options;
      return { x, y };
    }
  }
}

export function sameNode(node: Node, otherNode: Node) {
  return node.x === otherNode.x && node.y === otherNode.y;
}

export function hasOverlap(node: Node, pxX: number, pxY: number) {
  const deltaX = Math.abs(pxX - node.x);
  const deltaY = Math.abs(pxY - node.y);
  return (deltaX ** 2 + deltaY ** 2) ** 0.5 <= config.nodeStyle.radius;
}
export function distanceFromPoint(node: Node, coords: Coords) {
  return distanceBetween([node.x, node.y], [coords[0], coords[1]]);
}

export function isAdjacentTo(node: Node, otherNode: Node) {
  const required = [node.gridX, node.gridY, otherNode.gridX, otherNode.gridY];
  if (required.every((x) => x !== undefined)) {
    const xDiff = Math.abs(otherNode.gridX - node.gridX);
    const yDiff = Math.abs(otherNode.gridY - node.gridY);
    return identicalObjects([xDiff, yDiff].sort(), [0, 1]);
  } else {
    throw new Error("can't determine adjacency for a non-grid node");
  }
}
