import surface from "./main";
import { makeCrossingPoint, fullyCrossed } from "./crossing-point.js";
import {
  INode,
  GraphLineOptions,
  FrameLineOptions,
  Vector,
  Direction,
} from "./types";

export class GraphLine {
  // TODO - how to share all these between GraphLine and FrameLine??
  public startX: number;
  public startY: number;
  public endX: number;
  public endY: number;
  public snapObj: Snap.Element;

  constructor(options: GraphLineOptions) {
    this.startX = options.startX;
    this.startY = options.startY;
    this.endX = options.endX;
    this.endY = options.endY;
    this.snapObj = surface
      .line(this.startX, this.startY, this.endX, this.endY)
      .attr(options.style);
  }
}

export class FrameLine {
  public startX: number;
  public startY: number;
  public endX: number;
  public endY: number;
  public snapObj: Snap.Element;

  public startNode: INode;
  public endNode: INode;
  public crossingPoint: crossingPoint;

  constructor(options: FrameLineOptions) {
    this.startNode = options.startNode;
    this.endNode = options.endNode;
    this.startX = this.startNode.x;
    this.startY = this.startNode.y;
    this.endX = this.endNode.x;
    this.endY = this.endNode.y;
    this.crossingPoint = makeCrossingPoint(
      this.startX,
      this.startY,
      this.endX,
      this.endY,
      this
    );
    this.style = options.style;
  }

  draw() {
    this.snapObj = surface
      .line(this.startX, this.startY, this.endX, this.endY)
      .attr(this.style);
  }

  uncrossed() {
    return !fullyCrossed(this.crossingPoint);
  }

  vector() {
    return [this.endX - this.startX, this.endY - this.startY] as Vector;
  }

  isBetween(nodeA: INode, nodeB: INode) {
    const isForwards =
      this.startNode.sameNode(nodeA) && this.endNode.sameNode(nodeB);
    const isReversed =
      this.startNode.sameNode(nodeB) && this.endNode.sameNode(nodeA);
    return isForwards || isReversed;
  }

  rotateAboutOrigin(vector: Vector, angle: number) {
    const x = vector[0];
    const y = vector[1];
    const newX = x * Math.cos(angle) - y * Math.sin(angle);
    const newY = y * Math.cos(angle) + x * Math.sin(angle);
    return [newX, newY];
  }

  angle(options: { reverse?: boolean }) {
    let vector = this.vector();
    if (options.reverse) {
      vector = vector.map((coord) => coord * -1) as Vector;
    }
    const result = Math.atan2(vector[1], vector[0]); // return value is in radians
    // result += 2 * Math.PI
    // if (options.reverse) result *= -1;
    return result; // % (2 * Math.PI);
  }

  angleOutFrom(node: INode) {
    if (this.startX === node.x && this.startY === node.y) {
      return this.angle({ reverse: false });
    }
    return this.angle({ reverse: true });
  }

  length() {
    return this.snapObj.getTotalLength();
  }

  visits(node: INode) {
    return !!(this.startNode.sameNode(node) || this.endNode.sameNode(node));
  }

  angleOutCP(options: { direction: Direction; reverse?: boolean }) {
    let vect = this.vector();
    if (options.reverse) {
      vect = vect.map((coord) => coord * -1) as Vector;
    }

    let resultant;
    if (options.direction === "R") {
      resultant = this.rotateAboutOrigin(vect, Math.PI / 4);
    } else {
      resultant = this.rotateAboutOrigin(vect, -Math.PI / 4);
    }
    return Math.atan2(resultant[1], resultant[0]);
  }
}
