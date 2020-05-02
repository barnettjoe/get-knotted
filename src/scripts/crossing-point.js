import config from './config.js';
import StrandElement from './strand-element.js';

export default function CrossingPoint(startX, startY, endX, endY, line) {
  this.line = line;
  // use proper getters / setters...
  this.crossedLeft = false;
  this.crossedRight = false;
  this.coords = [(startX + endX) / 2, (startY + endY) / 2];
}

CrossingPoint.prototype = Object.assign(Object.create(StrandElement.prototype), {
  constructor: CrossingPoint,
  crossed(direction) {
    if (direction === 'L') {
      return this.crossedLeft;
    } else {
      return this.crossedRight;
    }
  },
  fullyCrossed() {
    return this.crossed('R') && this.crossed('L');
  },
  rotate(cx, cy, x, y, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const nx = cos * (x - cx) + sin * (y - cy) + cx;
    const ny = cos * (y - cy) - sin * (x - cx) + cy;
    return [nx, ny];
  },
  uncrossedDirection() {
    if (this.fullyCrossed()) {
      return null;
    } else if (this.crossed('L')) {
      return 'R';
    } else {
      return 'L';
    }
  },
  controlPoint(direction, backwards) {
    const vector = backwards ? this.line.vector().map(i => -i) : this.line.vector();
    const vectorLength = vector.map(i => i ** 2).reduce((j, m) => j + m) ** 0.5;
    const normVect = vector.map(i => i / vectorLength);
    const xStep = normVect[0] * config.bezierDistance;
    const yStep = normVect[1] * config.bezierDistance;
    const initialPosition = [this.coords[0] + xStep, this.coords[1] + yStep];
    if (direction === 'L') {
      return this.rotate(...this.coords, ...initialPosition, Math.PI / 4);
    } else {
      return this.rotate(...this.coords, ...initialPosition, -Math.PI / 4);
    }
  },
});
