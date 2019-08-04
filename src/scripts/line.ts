import surface from './main';
import CrossingPoint from './crossing-point.js';
import { INode, LineOptions } from './types';

export default class Line {
  public startNode: INode;
  public endNode: INode;
  public startX: number;
  public startY: number;
  public endX: number;
  public endY: number;
  public snapObj: Snap.Element;

  constructor(options: LineOptions) {
    if (options.method === 'node') {
      this.startNode = options.startNode;
      this.endNode = options.endNode;
      this.startX = this.startNode.x;
      this.startY = this.startNode.y;
      this.endX = this.endNode.x;
      this.endY = this.endNode.y;
    } else if (options.method === 'position') {
      this.startX = options.startX;
      this.startY = options.startY;
      this.endX = options.endX;
      this.endY = options.endY;
    }

    this.crossingPoint = new CrossingPoint(this.startX, this.startY, this.endX, this.endY, this);

    this.snapObj = surface.line(this.startX, this.startY, this.endX, this.endY).attr(options.style);
  }

  uncrossed() {
    return !this.crossingPoint.fullyCrossed();
  }

  vector() {
    return [this.endX - this.startX, this.endY - this.startY];
  }

  isBetween(nodeA, nodeB) {
    const isForwards = this.startNode.sameNode(nodeA) && this.endNode.sameNode(nodeB);
    const isReversed = this.startNode.sameNode(nodeB) && this.endNode.sameNode(nodeA);
    return isForwards || isReversed;
  }

  rotateAboutOrigin(vector, angle) {
    const x = vector[0];
    const y = vector[1];
    const newX = x * Math.cos(angle) - y * Math.sin(angle);
    const newY = y * Math.cos(angle) + x * Math.sin(angle);
    return [newX, newY];
  }

  angle(options) {
    let vector = this.vector();
    if (options.reverse) {
      vector = vector.map(coord => coord * -1);
    }
    const result = Math.atan2(vector[1], vector[0]); // return value is in radians
    // result += 2 * Math.PI
    // if (options.reverse) result *= -1;
    return result; // % (2 * Math.PI);
  }

  angleOutFrom(node) {
    if (this.startX === node.x && this.startY === node.y) {
      return this.angle({ reverse: false });
    }
    return this.angle({ reverse: true });
  }

  angleOutCP(options) {
    let vect = this.vector();
    if (options.reverse) {
      vect = vect.map(coord => coord * -1);
    }

    let resultant;
    if (options.direction === 'R') {
      resultant = this.rotateAboutOrigin(vect, Math.PI / 4);
    } else if (options.direction === 'L') {
      resultant = this.rotateAboutOrigin(vect, -Math.PI / 4);
    }
    return Math.atan2(resultant[1], resultant[0]);
  }

  visits(node) {
    return !!(this.startNode.sameNode(node) || this.endNode.sameNode(node));
  }

  length() {
    return this.snapObj.getTotalLength();
  }
}
