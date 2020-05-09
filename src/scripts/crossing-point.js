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

export function CrossingPoint(startX, startY, endX, endY, line) {
  this.line = line;
  // use proper getters / setters...
  this.crossedLeft = false;
  this.crossedRight = false;
  this.coords = [(startX + endX) / 2, (startY + endY) / 2];
}

CrossingPoint.prototype = Object.assign(
  Object.create(StrandElement.prototype),
  {
    constructor: CrossingPoint,
    uncrossedDirection() {
      if (fullyCrossed(this)) {
        return null;
      } else if (isCrossed(this, "L")) {
        return "R";
      } else {
        return "L";
      }
    },
  }
);
