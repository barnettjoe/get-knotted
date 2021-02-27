import config from "./config";
import { identicalObjects, distanceBetween } from "./general-utils";
import { NodeOptions, GridSystem, Vector, FrameNode } from "./types";
import type Mouse from "./mouse";

export default function node(options: NodeOptions, mouse: Mouse): FrameNode {
  if (options.gridSystem !== GridSystem.square) {
    throw new Error("only square grid systems are currently supported");
  }
  const { x: gridX, y: gridY } = options;
  const [x, y] = mouse.pixelCoords([gridX, gridY]);
  return { gridX, gridY, x, y };
}

export function sameNode(node: FrameNode, otherNode: FrameNode): boolean {
  return node.x === otherNode.x && node.y === otherNode.y;
}

export function hasOverlap(node: FrameNode, pxX: number, pxY: number): boolean {
  const deltaX = Math.abs(pxX - node.x);
  const deltaY = Math.abs(pxY - node.y);
  return (deltaX ** 2 + deltaY ** 2) ** 0.5 <= config.nodeStyle.radius;
}
export function distanceFromPoint(node: FrameNode, coords: Vector): number {
  return distanceBetween([node.x, node.y], [coords[0], coords[1]]);
}

export function isAdjacentTo(node: FrameNode, otherNode: FrameNode): boolean {
  const required = [node.gridX, node.gridY, otherNode.gridX, otherNode.gridY];
  if (required.every((x) => x !== undefined)) {
    const xDiff = Math.abs(otherNode.gridX - node.gridX);
    const yDiff = Math.abs(otherNode.gridY - node.gridY);
    return identicalObjects([xDiff, yDiff].sort(), [0, 1]);
  } else {
    throw new Error("can't determine adjacency for a non-grid node");
  }
}
