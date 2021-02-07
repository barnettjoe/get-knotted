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
import node from "./node";
import {
  rowAndCol,
  doIfInGraph,
  relativeCoords,
  closestGraphCoords,
  pixelCoords,
} from "./mouse";
import { identicalObjects } from "./general-utils";
import model from "./model";
import * as webgl from "./webgl/draw-webgl";

import {
  Vector,
  Drawing,
  FrameNode,
  GridSystem,
  isOnscreenWebglContext,
} from "./types";

// for keeping track of where we started a drag on the grid
let dragStart: [number, number];
let dragEnd: [number, number];

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
        this.startDrawingLine(relativeCoords(e));
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
            this.drawUserLine(model.userLine.startNode, relativeCoords(e));
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
    if (model.frame === null) {
      throw new Error("tried to create a knot with null frame");
    }
    const knot = makeKnot(model.frame);
    model.knot = knot;
    this.knots.push(knot);
    dirty = true;
  },
  addNode(coords) {
    const frame = this.singleNodeFrame(coords);
    frame.lines = lines(frame.nodes, frame.adjacencyList);
    const newKnot = makeKnot(frame);
    drawKnot(newKnot);
    this.knots.push(newKnot);
  },
  singleNodeFrame(coords) {
    const nodes = [
      node({
        x: coords[0],
        y: coords[1],
        gridSystem: GridSystem.square,
      }),
    ];
    return { nodes, adjacencyList: [[]], lines: [] };
  },
  placeNode(e) {
    const coords = closestGraphCoords(e);
    const pxCoords = pixelCoords(coords);
    if (!this.isNodeOverlapping(pxCoords)) {
      this.addNode(coords);
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
    dragStart = rowAndCol(e);
    dragEnd = dragStart;
    doIfInGraph(dragStart, this.updateFrame.bind(this));
  },
  dragFrame(e: MouseEvent) {
    const previousBox = dragEnd;
    dragEnd = rowAndCol(e);
    if (!identicalObjects(previousBox, dragEnd)) {
      doIfInGraph(
        dragEnd,
        (() => {
          const currentFrame = model.frame;
          if (currentFrame) {
            currentFrame.lines = [];
          }
          model.frame = fromExtrema(dragStart, dragEnd);
        })
      );
    }
  },
  drawUserLine(lineStart: FrameNode, toCoords) {
    model.userLine = {
      startNode: lineStart,
      toCoords,
    };
  },
  newLineIsValid(lineStart, lineEnd) {
    const currentFrame = model.frame;
    if (currentFrame === null) {
      throw new Error("current frame is null");
    }
    return (
      lineEnd &&
      lineEnd !== lineStart &&
      !lineExistsBetween(lineStart, lineEnd, currentFrame.lines)
    );
  },
  finishDrawingLine(e) {
    if (model.userLine === null) {
      throw new Error("userLine is null");
    }
    const lineStart = model.userLine.startNode;
    model.userLine = null;
    const coords = relativeCoords(e);
    const lineEnd = this.nodeAt(coords);
    if (lineStart && lineEnd && this.newLineIsValid(lineStart, lineEnd)) {
      this.makeNewLine(lineStart, lineEnd);
    }
  },
  makeNewLine(lineStart, lineEnd) {
    const currentKnot = model.knot;
    if (currentKnot === null) {
      throw new Error("currentKnot is null");
    }
    const knotA = this.findKnotWith(lineStart);
    const knotB = this.findKnotWith(lineEnd);
    if (knotA && knotB && knotA !== knotB) {
      this.mergeKnots(knotA, knotB, lineStart, lineEnd);
    } else {
      addLineBetween(currentKnot, lineStart, lineEnd);
      dirty = true;
    }
  },
  mergeKnots(knotA, knotB, startNode, endNode) {
    // need to merge two frames...
    const knot = mergeKnots(knotA, knotB, startNode, endNode);
    model.knot = knot;
    model.frame = knot.frame;
    this.knots.push(knot);
  },
  nodeAt(coords: Vector) {
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
  startDrawingLine(coords: Vector) {
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
