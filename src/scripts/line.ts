import { makeCrossingPoint, fullyCrossed } from "./crossing-point";
import {
  FrameNode,
  Vector,
  FrameLine,
  Direction,
  FrameLineOptions,
} from "./types";
import { rotateAboutOrigin } from "./knot-utils";
import { sameNode } from "./node";

console.log("executing line module");

export default function frameLine({
  startNode,
  endNode,
}: FrameLineOptions): FrameLine {
  return {
    startNode: startNode,
    endNode: endNode,
    startX: startNode.x,
    startY: startNode.y,
    endX: endNode.x,
    endY: endNode.y,
    crossingPoint: makeCrossingPoint(
      startNode.x,
      startNode.y,
      endNode.x,
      endNode.y
    ),
  };
}

export function uncrossed(line: FrameLine): boolean {
  return !fullyCrossed(line.crossingPoint);
}

function vector(line: FrameLine): Vector {
  return [line.endX - line.startX, line.endY - line.startY];
}

export function isBetween(
  line: FrameLine,
  nodeA: FrameNode,
  nodeB: FrameNode
): boolean {
  const isForwards =
    sameNode(line.startNode, nodeA) && sameNode(line.endNode, nodeB);
  const isReversed =
    sameNode(line.startNode, nodeB) && sameNode(line.endNode, nodeA);
  return isForwards || isReversed;
}

function angle(line: FrameLine, options: { reverse?: boolean }) {
  let v = vector(line);
  if (options.reverse) {
    v = v.map((coord) => coord * -1) as Vector;
  }
  return Math.atan2(v[1], v[0]);
}

export function angleOutFrom(line: FrameLine, node: FrameNode): number {
  if (line.startX === node.x && line.startY === node.y) {
    return angle(line, { reverse: false });
  }
  return angle(line, { reverse: true });
}

export function visits(line: FrameLine, node: FrameNode): boolean {
  return !!(sameNode(line.startNode, node) || sameNode(line.endNode, node));
}

export function angleOutCP(
  line: FrameLine,
  options: { direction: Direction; reverse?: boolean }
): number {
  let vect = vector(line);
  if (options.reverse) {
    vect = vect.map((coord) => coord * -1) as Vector;
  }

  let resultant;
  if (options.direction === "R") {
    resultant = rotateAboutOrigin(vect, Math.PI / 4);
  } else {
    resultant = rotateAboutOrigin(vect, -Math.PI / 4);
  }
  return Math.atan2(resultant[1], resultant[0]);
}
