import {
  StrandElement as StrandElementType,
  CrossingPoint,
  Direction,
} from "./types";

export default class StrandElement implements StrandElementType {
  point: CrossingPoint;
  pr: Direction | null;
  direction: Direction;
  constructor(options: {
    point: CrossingPoint;
    pr: Direction | null;
    direction: Direction;
  }) {
    this.point = options.point;
    this.pr = options.pr;
    this.direction = options.direction;
  }
  get x() {
    return this.point.coords[0];
  }
  get y() {
    return this.point.coords[1];
  }
}
