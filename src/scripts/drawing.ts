import makeKnot, {
  merge as mergeKnots,
  addLineBetween,
  knotPolylines as drawKnot,
} from "./knot";
import {
  fromExtrema,
  lines,
  findProximalNode,
  lineExistsBetween,
  overlapsExistingNode,
} from "./frame";
import Node from "./node";
import {
  rowAndCol,
  doIfInGraph,
  relativeCoords,
  closestGraphCoords,
  pixelCoords,
} from "./mouse";
import { identicalObjects } from "./general-utils";
import config from "./config";
import model from "./model";
import * as webgl from "./webgl/draw-webgl";

import {
  Coords,
  Drawing,
  GridSystem,
  isOnscreenWebglContext,
  OnscreenWebglContext,
} from "./types";

// for keeping track of where we started a drag on the grid
let dragStart: [number, number];
let dragEnd: [number, number];

let webglContext: OnscreenWebglContext;

let dirty = true;

function drawLoop() {
  if (dirty) {
    if (model.knot) {
      drawKnot(model.knot);
    }
    webgl.draw();
    dirty = false;
  }
  requestAnimationFrame(drawLoop);
}

const drawing: Drawing = {
  knots: [],
  mode: "add-grid",
  mouseIsDown: false,
  setupWebglContext() {
    const webglCanvas = document.getElementById("webgl-surface");
    if (!(webglCanvas instanceof HTMLCanvasElement)) {
      throw new Error("no canvas for webgl");
    }
    const webglContext = webglCanvas.getContext("webgl2");
    if (isOnscreenWebglContext(webglContext)) {
      webgl.start(webglContext);
    } else {
      throw new Error("failed to get webgl context");
    }
  },
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
          model.frame && this.createKnot();
          break;
        case "add-line":
          this.finishDrawingLine(e);
          break;
      }
    }
  },
  handleMouseMove(this: Drawing, e: MouseEvent) {
    model.mouseTracker = relativeCoords(e);
    dirty = true;
    if (this.mouseIsDown) {
      switch (this.mode) {
        case "add-grid":
          this.dragFrame(e);
          break;
        case "add-line":
          if (model.userLine?.startNode) {
            // TODO - should be able to remove type assertion after converting mouse.js
            // into typescript
            this.drawUserLine(model.userLine.startNode, relativeCoords(e) as Coords);
          }
          break;
      }
    }
  },
  addMouseListeners() {
    const wrapper = document.getElementById("webgl-wrapper");
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
  startDrawLoop() {
    // TODO - why is the requestAnimationFrame necessary here??
    requestAnimationFrame(drawLoop);
  },
  createKnot() {
    const knot = makeKnot(model.frame);
    model.knot = knot;
    this.knots.push(knot);
    dirty = true;
  },
  addNode(coords) {
    const frame = this.singleNodeFrame(coords);
    frame.lines = lines(frame.nodes, frame.adjacencyList);
    frame.crossingPoints = frame.lines.map((line) => line.crossingPoint);
    const newKnot = makeKnot(frame);
    drawKnot(newKnot);
    this.knots.push(newKnot);
  },
  singleNodeFrame(coords) {
    const nodes = [
      new Node({
        x: coords[0],
        y: coords[1],
        gridSystem: GridSystem.square,
      }),
    ];
    return { nodes, adjacencyList: [[]] };
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
      return overlapsExistingNode(...coords, knot.frame.nodes);
    });
  },
  updateFrame() {
    model.frame = fromExtrema(dragStart, dragEnd);
    dirty = true;
  },
  startDrawingGrid(e) {
    // TODO - should be able to remove type assertion after converting mouse.js
    // into typescript
    dragStart = rowAndCol(e) as Coords;
    dragEnd = dragStart;
    doIfInGraph(dragStart, this.updateFrame.bind(this));
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
          let currentFrame = model.frame;
          if (currentFrame) {
            // elementsForRemoval(currentFrame).forEach(removeElement);
            currentFrame.lines = [];
          }
          model.frame = fromExtrema(dragStart, dragEnd);
        }).bind(this)
      );
    }
  },
  drawUserLine(lineStart, toCoords) {
    model.userLine = {
      startNode: lineStart,
      toCoords,
    };
  },
  newLineIsValid(lineStart, lineEnd) {
    const currentFrame = model.frame;
    return (
      lineEnd &&
      lineEnd !== lineStart &&
      !lineExistsBetween(lineStart, lineEnd, currentFrame.lines)
    );
  },
  finishDrawingLine(e) {
    const lineStart = model.userLine.startNode;
    model.userLine = null;
    const coords = relativeCoords(e);
    // TODO - should be able to remove type assertion after converting mouse.js
    // into typescript
    const lineEnd = this.nodeAt(coords as Coords);
    if (lineStart && lineEnd && this.newLineIsValid(lineStart, lineEnd)) {
      this.makeNewLine(lineStart, lineEnd);
    }
  },
  makeNewLine(lineStart, lineEnd) {
    const currentKnot = model.knot;
    const knotA = this.findKnotWith(lineStart);
    const knotB = this.findKnotWith(lineEnd);
    if (knotA && knotB && knotA !== knotB) {
      this.mergeKnots(knotA, knotB, lineStart, lineEnd);
    } else {
      addLineBetween(currentKnot, lineStart, lineEnd);
    }
  },
  mergeKnots(knotA, knotB, startNode, endNode) {
    // need to merge two frames...
    const knot = mergeKnots(knotA, knotB, startNode, endNode);
    model.knot = knot;
    model.frame = knot.frame;
    this.knots.push(knot);
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
        model.knot = foundKnot;
        model.frame = foundKnot.frame;
        this.drawUserLine(lineStart, coords);
      }
    }
  },
};

export default drawing;
