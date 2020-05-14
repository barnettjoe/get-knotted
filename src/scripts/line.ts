import { makeCrossingPoint, fullyCrossed } from "./crossing-point.js";
import { INode, Vector, Direction } from "./types";
import { rotateAboutOrigin } from "./knot-utils";

export default function frameLine({ startNode, endNode, style }) {
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
    style: style,
  };
}

export function uncrossed(line) {
  return !fullyCrossed(line.crossingPoint);
}

function vector(line) {
  return [line.endX - line.startX, line.endY - line.startY];
}

export function isBetween(line, nodeA: INode, nodeB: INode) {
  const isForwards =
    line.startNode.sameNode(nodeA) && line.endNode.sameNode(nodeB);
  const isReversed =
    line.startNode.sameNode(nodeB) && line.endNode.sameNode(nodeA);
  return isForwards || isReversed;
}

function angle(line, options: { reverse?: boolean }) {
  let v = vector(line);
  if (options.reverse) {
    v = v.map((coord) => coord * -1);
  }
  return Math.atan2(v[1], v[0]);
}

export function angleOutFrom(line, node: INode) {
  if (line.startX === node.x && line.startY === node.y) {
    return angle(line, { reverse: false });
  }
  return angle(line, { reverse: true });
}

export function visits(line, node: INode) {
  return !!(line.startNode.sameNode(node) || line.endNode.sameNode(node));
}

export function angleOutCP(
  line,
  options: { direction: Direction; reverse?: boolean }
) {
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
