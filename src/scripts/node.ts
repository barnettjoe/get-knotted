import { pixelCoords } from "./mouse.js";
import surface from "./main";
import config from "./config.js";
import { identicalObjects, distanceBetween } from "./general-utils";
import { NodeOptions, GridSystem, Coords } from "./types";
import { Element as SnapElement } from "snapsvg";

// TODO - maybe this should be subclassed into gridNode and freeformNode?
export default class Node {
  private gridX?: number;
  private gridY?: number;
  private x: number;
  private y: number;
  private snapObj?: SnapElement;

  constructor(options: NodeOptions) {
    switch (options.gridSystem) {
      case GridSystem.square:
        this.gridX = options.x;
        this.gridY = options.y;
        let x;
        let y;
        [x, y] = pixelCoords([this.gridX, this.gridY]);
        this.x = x;
        this.y = y;
        break;
      case GridSystem.freeform:
        this.x = options.x;
        this.y = options.y;
        break;
    }
  }
  sameNode(otherNode: Node) {
    return this.x === otherNode.x && this.y === otherNode.y;
  }
  draw() {
    this.snapObj = surface
      .circle(this.x, this.y, config.nodeStyle.radius)
      .attr(config.nodeStyle);
  }
  remove() {
    if (this.snapObj) this.snapObj.remove();
  }
  hasOverlap(pxX: number, pxY: number) {
    const deltaX = Math.abs(pxX - this.x);
    const deltaY = Math.abs(pxY - this.y);
    return (deltaX ** 2 + deltaY ** 2) ** 0.5 <= config.nodeStyle.radius;
  }
  distanceFromPoint(coords: Coords) {
    return distanceBetween([this.x, this.y], [coords[0], coords[1]]);
  }
  isAdjacentTo(otherNode: Node) {
    const required = [this.gridX, this.gridY, otherNode.gridX, otherNode.gridY];
    if (required.every((x) => x !== undefined)) {
      const xDiff = Math.abs(otherNode.gridX - this.gridX);
      const yDiff = Math.abs(otherNode.gridY - this.gridY);
      return identicalObjects([xDiff, yDiff].sort(), [0, 1]);
    } else {
      throw new Error("can't determine adjacency for a non-grid node");
    }
  }
}
