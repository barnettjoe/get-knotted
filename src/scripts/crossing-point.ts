import { assertNotNullable } from "./general-utils";
import { CrossingPoint, CrossingState, Direction, FrameLine } from "./types";

export function isCrossed(
  line: FrameLine,
  direction: Direction,
  crossingState: CrossingState
): boolean {
  const lineCrossingState = crossingState.get(line);
  assertNotNullable(lineCrossingState);
  if (direction === "L") {
    return lineCrossingState.crossedLeft;
  } else {
    return lineCrossingState.crossedRight;
  }
}

export function fullyCrossed(
  line: FrameLine,
  crossingState: CrossingState
): boolean {
  return (
    isCrossed(line, "R", crossingState) && isCrossed(line, "L", crossingState)
  );
}

export function uncrossedDirection(
  line: FrameLine,
  crossingState: CrossingState
): Direction | null {
  if (fullyCrossed(line, crossingState)) {
    return null;
  } else if (isCrossed(line, "L", crossingState)) {
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
    coords: [(startX + endX) / 2, (startY + endY) / 2],
  };
}
