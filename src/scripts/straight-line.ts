import numeric from "numeric";
import { Vector } from "./types";
export default class StraightLine {
  start: Vector;
  end: Vector;
  constructor(start: Vector, end: Vector) {
    this.start = start;
    this.end = end;
  }
  offset(d: number) {
    const dx = this.end[0] - this.start[0];
    const dy = this.end[1] - this.start[1];
    const length = numeric.norm2([dx, dy]);
    let perp;
    if (d < 0) {
      perp = [dy, -dx];
    } else {
      perp = [-dy, dx];
    }
    const shift = perp.map((coord) => (Math.abs(d) * coord) / length);
    const newStart = [
      this.start[0] + shift[0],
      this.start[1] + shift[1],
    ] as Vector;
    const newEnd = [this.end[0] + shift[0], this.end[1] + shift[1]] as Vector;
    return [new StraightLine(newStart, newEnd)];
  }
}
