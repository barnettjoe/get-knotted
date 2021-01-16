import { pixelCoords } from "./mouse";
import config from "./config";
import { identicalObjects, distanceBetween } from "./general-utils";
import { NodeOptions, GridSystem, Vector, FrameNode } from "./types";

export default function node(options: NodeOptions): FrameNode {
  if (options.gridSystem !== GridSystem.square) {
    throw new Error("only square grid systems are currently supported");
  }
  const { x: gridX, y: gridY } = options;
  let [x, y] = pixelCoords([gridX, gridY]);
  return { gridX, gridY, x, y };
}

export function sameNode(node: FrameNode, otherNode: FrameNode) {
  return node.x === otherNode.x && node.y === otherNode.y;
}

export function hasOverlap(node: FrameNode, pxX: number, pxY: number) {
  const deltaX = Math.abs(pxX - node.x);
  const deltaY = Math.abs(pxY - node.y);
  return (deltaX ** 2 + deltaY ** 2) ** 0.5 <= config.nodeStyle.radius;
}
export function distanceFromPoint(node: FrameNode, coords: Vector) {
  return distanceBetween([node.x, node.y], [coords[0], coords[1]]);
}

export function isAdjacentTo(node: FrameNode, otherNode: FrameNode) {
  const required = [node.gridX, node.gridY, otherNode.gridX, otherNode.gridY];
  if (required.every((x) => x !== undefined)) {
    const xDiff = Math.abs(otherNode.gridX - node.gridX);
    const yDiff = Math.abs(otherNode.gridY - node.gridY);
    return identicalObjects([xDiff, yDiff].sort(), [0, 1]);
  } else {
    throw new Error("can't determine adjacency for a non-grid node");
  }
}
