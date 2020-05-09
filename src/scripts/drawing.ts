import Knot from "./knot";
import Frame, {
  fromExtrema,
  lines,
  findProximalNode,
  lineExistsBetween,
} from "./frame";
import Node from "./node";
import {
  rowAndCol,
  doIfInGraph,
  relativeCoords,
  closestGraphCoords,
  pixelCoords,
} from "./mouse.js";
import { identicalObjects } from "./general-utils";
import Snap from "snapsvg";
import config from "./config.js";
import { Coords, Drawing, INode, GridSystem } from "./types";

// for keeping track of where we started a drag on the grid
let dragStart: [number, number];
let dragEnd: [number, number];

// for keeping track of which knot / frame is currently being manipulated
let currentKnot: Knot;
let currentFrame: Frame;

// for keeping track of the line currently being drawn (in 'add-line' mode)
const userLine: { element: Snap.Element | null; startNode: INode | null } = {
  element: null,
  startNode: null,
};

const drawing: Drawing = {
  knots: [],
  mode: "add-grid",
  mouseIsDown: false,
  handleMouseDown(this: Drawing, e: MouseEvent) {
    this.mouseIsDown = true;
    switch (this.mode) {
      case "add-grid":
        this.startDrawingGrid(e);
        break;
      case "add-line":
        // TODO - should be able to remove type assertion after converting mouse.js
        // into typescript
        this.startDrawingLine(relativeCoords(e) as Coords);
        break;
      case "add-node":
        this.placeNode(e);
        break;
    }
  },
  handleMouseUp(this: Drawing, e: MouseEvent) {
    if (e.target instanceof Element && e.target.tagName !== "BUTTON") {
      this.mouseIsDown = false;
      switch (this.mode) {
        case "add-grid":
          currentFrame && this.drawKnot();
          break;
        case "add-line":
          this.finishDrawingLine(e);
          break;
      }
    }
  },
  handleMouseMove(this: Drawing, e: MouseEvent) {
    if (this.mouseIsDown) {
      switch (this.mode) {
        case "add-grid":
          this.dragFrame(e);
          break;
        case "add-line":
          if (userLine.startNode) {
            // TODO - should be able to remove type assertion after converting mouse.js
            // into typescript
            this.drawUserLine(userLine.startNode, relativeCoords(e) as Coords);
          }
          break;
      }
    }
  },
  addMouseListeners() {
    const wrapper = document.getElementById("wrapper");
    if (wrapper) {
      wrapper.addEventListener(
        "mousedown",
        this.handleMouseDown.bind(this),
        false
      );
      wrapper.addEventListener(
        "mousemove",
        this.handleMouseMove.bind(this),
        false
      );
    } else {
      // TODO - throw error
    }
    window.addEventListener("mouseup", this.handleMouseUp.bind(this), false);
  },
  drawKnot() {
    currentKnot = new Knot(currentFrame);
    this.knots.push(currentKnot);
  },
  addNode(coords) {
    const frame = this.singleNodeFrame(coords);
    frame.lines = lines(frame.nodes, frame.adjacencyList);
    frame.crossingPoints = frame.lines.map((line) => line.crossingPoint);
    frame.lines.forEach((line) => line.draw());
    this.knots.push(new Knot(frame));
  },
  singleNodeFrame(coords) {
    const nodes = [
      new Node({
        x: coords[0],
        y: coords[1],
        gridSystem: GridSystem.square,
      }),
    ];
    const adjacencies = [[]];
    return new Frame(nodes, adjacencies);
  },
  placeNode(e) {
    const coords = closestGraphCoords(e);
    const pxCoords = pixelCoords(coords);
    if (!this.isNodeOverlapping(pxCoords)) {
      // TODO - should be able to remove type assertion after converting mouse.js
      // into typescript
      this.addNode(coords as Coords);
    }
  },
  isNodeOverlapping(coords) {
    return this.knots.some((knot) => {
      return knot.frame.overlapsExistingNode(...coords);
    });
  },
  drawFrame() {
    currentFrame = fromExtrema(dragStart, dragEnd);
    currentFrame.draw();
  },
  startDrawingGrid(e) {
    // TODO - should be able to remove type assertion after converting mouse.js
    // into typescript
    dragStart = rowAndCol(e) as Coords;
    dragEnd = dragStart;
    doIfInGraph(dragStart, this.drawFrame.bind(this));
  },
  dragFrame(e: MouseEvent) {
    const previousBox = dragEnd;
    // TODO - should be able to remove type assertion after converting mouse.js
    // into typescript
    dragEnd = rowAndCol(e) as Coords;
    if (!identicalObjects(previousBox, dragEnd)) {
      doIfInGraph(
        dragEnd,
        (() => {
          if (currentFrame) currentFrame.remove();
          currentFrame = fromExtrema(dragStart, dragEnd);
          currentFrame.draw();
        }).bind(this)
      );
    }
  },
  drawUserLine(lineStart, toCoords) {
    userLine.element && userLine.element.remove();
    userLine.startNode = lineStart;
    userLine.element = Snap("#surface").line(
      lineStart.x,
      lineStart.y,
      ...toCoords
    );
    userLine.element.attr(config.frame);
  },
  removeUserLine() {
    userLine.element && userLine.element.remove();
    userLine.element = null;
    userLine.startNode = null;
  },
  newLineIsValid(lineStart, lineEnd) {
    return (
      lineEnd &&
      lineEnd !== lineStart &&
      !lineExistsBetween(lineStart, lineEnd, currentFrame.lines)
    );
  },
  finishDrawingLine(e) {
    const lineStart = userLine.startNode;
    this.removeUserLine();
    const coords = relativeCoords(e);
    // TODO - should be able to remove type assertion after converting mouse.js
    // into typescript
    const lineEnd = this.nodeAt(coords as Coords);
    if (lineStart && lineEnd && this.newLineIsValid(lineStart, lineEnd)) {
      this.makeNewLine(lineStart, lineEnd);
    }
  },
  makeNewLine(lineStart, lineEnd) {
    currentKnot && currentKnot.remove();
    const knotA = this.findKnotWith(lineStart);
    const knotB = this.findKnotWith(lineEnd);
    if (knotA && knotB && knotA !== knotB) {
      this.mergeKnots(knotA, knotB, lineStart, lineEnd);
    } else {
      currentKnot.addLineBetween(lineStart, lineEnd);
    }
  },
  mergeKnots(knotA, knotB, startNode, endNode) {
    // need to merge two frames...
    this.remove(knotA);
    this.remove(knotB);
    currentKnot = knotA.merge(knotB, startNode, endNode);
    currentFrame = currentKnot.frame;
    this.knots.push(currentKnot);
  },
  remove(knot) {
    knot.remove();
    this.knots.splice(this.knots.indexOf(knot), 1);
  },
  nodeAt(coords: Coords) {
    let result;
    this.knots.some((knot) => {
      result = findProximalNode(coords, knot.frame.nodes);
      if (result) {
        return true;
      }
      return false;
    });
    return result || null;
  },
  findKnotWith(node) {
    return (
      this.knots.find((knot) => {
        return knot.frame.nodes.includes(node);
      }) || null
    );
  },
  startDrawingLine(coords) {
    const lineStart = this.nodeAt(coords);
    if (lineStart) {
      const foundKnot = this.findKnotWith(lineStart);
      if (foundKnot) {
        currentKnot = foundKnot;
        currentFrame = currentKnot.frame;
        this.drawUserLine(lineStart, coords);
      }
    }
  },
};

export default drawing;
