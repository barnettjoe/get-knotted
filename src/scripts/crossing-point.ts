import { CrossingPoint, Direction } from "./types";

export function isCrossed(crossingPoint: CrossingPoint, direction: Direction) {
  if (direction === "L") {
    return crossingPoint.crossedLeft;
  } else {
    return crossingPoint.crossedRight;
  }
}

export function fullyCrossed(crossingPoint: CrossingPoint) {
  return isCrossed(crossingPoint, "R") && isCrossed(crossingPoint, "L");
}

export function uncrossedDirection(crossingPoint: CrossingPoint) {
  if (fullyCrossed(crossingPoint)) {
    return null;
  } else if (isCrossed(crossingPoint, "L")) {
    return "R";
  } else {
    return "L";
  }
}

export function makeCrossingPoint(
  startX: number,
  startY: number,
  endX: number,
  endY: number
): CrossingPoint {
  return {
    crossedLeft: false,
    crossedRight: false,
    coords: [(startX + endX) / 2, (startY + endY) / 2],
  };
}
