import config from "./config.js";
import StrandElement from "./strand-element.js";

export function isCrossed(crossingPoint, direction) {
  if (direction === "L") {
    return crossingPoint.crossedLeft;
  } else {
    return crossingPoint.crossedRight;
  }
}

export function fullyCrossed(crossingPoint) {
  return isCrossed(crossingPoint, "R") && isCrossed(crossingPoint, "L");
}

export function uncrossedDirection(crossingPoint) {
  if (fullyCrossed(crossingPoint)) {
    return null;
  } else if (isCrossed(crossingPoint, "L")) {
    return "R";
  } else {
    return "L";
  }
}

export function makeCrossingPoint(startX, startY, endX, endY) {
  return {
    crossedLeft: false,
    crossedRight: false,
    coords: [(startX + endX) / 2, (startY + endY) / 2],
  };
}
