import numeric from 'numeric';

export default function StraightLine(start, end) {
  this.start = start;
  this.end = end;

  this.offset = function(d) {
    const dx = this.end[0] - this.start[0];
    const dy = this.end[1] - this.start[1];
    const length = numeric.norm2([dx, dy]);
    let perp;
    if (d < 0) {
      perp = [dy, -dx];
    } else {
      perp = [-dy, dx];
    }
    const shift = perp.map(coord => (Math.abs(d) * coord) / length);
    const newStart = [this.start[0] + shift[0], this.start[1] + shift[1]];
    const newEnd = [this.end[0] + shift[0], this.end[1] + shift[1]];
    return [new StraightLine(newStart, newEnd)];
  };
}
