import makeKnot, { addLineBetween, knotPolylines as drawKnot } from "./knot";
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

import { Frame, Knot, Mode, Vector, FrameNode, GridSystem } from "./types";

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

class Interaction {
  drawing: Drawing;
  constructor(drawing: Drawing) {
    this.drawing = drawing;
  }
  handleMouseDown(e: MouseEvent) {
    this.drawing.isCurrentlyDrawing = true;
    switch (this.drawing.mode) {
      case "add-grid":
        this.drawing.startDrawingGrid(e);
        break;
      case "add-line":
        this.drawing.startDrawingLine(relativeCoords(e));
        break;
      case "add-node":
        this.drawing.placeNode(e);
        break;
    }
  }
  handleMouseUp(e: MouseEvent) {
    if (e.target instanceof Element && e.target.tagName !== "BUTTON") {
      if (this.drawing.isCurrentlyDrawing) {
        switch (this.drawing.mode) {
          case "add-grid":
            model.frame && this.drawing.createKnot();
            break;
          case "add-line":
            this.drawing.finishDrawingLine(e);
            break;
        }
      }
      this.drawing.isCurrentlyDrawing = false;
    }
  }
  handleMouseMove(e: MouseEvent) {
    model.mouseTracker = relativeCoords(e);
    this.drawing.setDirty();
    if (this.drawing.isCurrentlyDrawing)
      switch (this.drawing.mode) {
        case "add-grid":
          this.drawing.dragFrame(e);
          break;
        case "add-line":
          if (model.userLine?.startNode) {
            this.drawing.drawUserLine(
              model.userLine.startNode,
              relativeCoords(e)
            );
          }
          break;
      }
  }
}

class Drawing {
  frame?: Frame;
  knots: Knot[];
  mode: Mode;
  isCurrentlyDrawing: boolean;
  interaction: Interaction;
  constructor() {
    this.interaction = new Interaction(this);
    this.knots = [];
    this.mode = "add-grid";
    this.isCurrentlyDrawing = false;
    this.addMouseListeners();
    this.startDrawLoop();
  }
  setDirty() {
    dirty = true;
  }
  addMouseListeners() {
    const wrapper = document.getElementById("webgl-surface");
    if (wrapper) {
      wrapper.addEventListener(
        "mousedown",
        this.interaction.handleMouseDown.bind(this.interaction),
        false
      );
      wrapper.addEventListener(
        "mousemove",
        this.interaction.handleMouseMove.bind(this.interaction),
        false
      );
    } else {
      // TODO - throw error
    }
    window.addEventListener(
      "mouseup",
      this.interaction.handleMouseUp.bind(this.interaction),
      false
    );
  }
  startDrawLoop() {
    // TODO - why is the requestAnimationFrame necessary here??
    requestAnimationFrame(drawLoop);
  }
  createKnot() {
    if (model.frame === null) {
      throw new Error("tried to create a knot with null frame");
    }
    const knot = makeKnot(model.frame);
    model.knot = knot;
    this.setDirty();
  }
  addNode(coords: Vector) {
    const frame = this.singleNodeFrame(coords);
    frame.lines = lines(frame.nodes, frame.adjacencyList);
    const newKnot = makeKnot(frame);
    drawKnot(newKnot);
  }
  singleNodeFrame(coords: Vector): Frame {
    const nodes = [
      node({
        x: coords[0],
        y: coords[1],
        gridSystem: GridSystem.square,
      }),
    ];
    return { nodes, adjacencyList: [[]], lines: [] };
  }
  placeNode(e: MouseEvent) {
    const coords = closestGraphCoords(e);
    const pxCoords = pixelCoords(coords);
    if (!this.isNodeOverlapping(pxCoords)) {
      this.addNode(coords);
    }
  }
  isNodeOverlapping(coords: Vector) {
    return this.knots.some((knot) => {
      return overlapsExistingNode(...coords, knot.frame.nodes);
    });
  }
  updateFrame() {
    model.frame = fromExtrema(dragStart, dragEnd);
    this.setDirty();
  }
  startDrawingGrid(e: MouseEvent) {
    dragStart = rowAndCol(e);
    dragEnd = dragStart;
    doIfInGraph(dragStart, this.updateFrame.bind(this));
  }
  dragFrame(e: MouseEvent) {
    const previousBox = dragEnd;
    dragEnd = rowAndCol(e);
    if (!identicalObjects(previousBox, dragEnd)) {
      doIfInGraph(dragEnd, () => {
        const currentFrame = model.frame;
        if (currentFrame) {
          currentFrame.lines = [];
        }
        model.frame = fromExtrema(dragStart, dragEnd);
      });
    }
  }
  drawUserLine(lineStart: FrameNode, toCoords: Vector) {
    model.userLine = {
      startNode: lineStart,
      toCoords,
    };
  }
  newLineIsValid(lineStart: FrameNode, lineEnd: FrameNode) {
    const currentFrame = model.frame;
    if (currentFrame === null) {
      throw new Error("current frame is null");
    }
    return (
      lineEnd &&
      lineEnd !== lineStart &&
      !lineExistsBetween(lineStart, lineEnd, currentFrame.lines)
    );
  }
  finishDrawingLine(e: MouseEvent) {
    if (model.userLine) {
      const lineStart = model.userLine.startNode;
      model.userLine = null;
      const coords = relativeCoords(e);
      const lineEnd = this.nodeAt(coords);
      if (lineStart && lineEnd && this.newLineIsValid(lineStart, lineEnd)) {
        this.makeNewLine(lineStart, lineEnd);
      }
    }
  }
  makeNewLine(lineStart: FrameNode, lineEnd: FrameNode) {
    const currentKnot = model.knot;
    if (currentKnot === null) {
      throw new Error("currentKnot is null");
    }
    addLineBetween(currentKnot, lineStart, lineEnd);
    this.setDirty();
  }
  nodeAt(coords: Vector) {
    const nodes = model.knot?.frame.nodes;
    return nodes ? findProximalNode(coords, nodes) : null;
  }
  startDrawingLine(coords: Vector) {
    const lineStart = this.nodeAt(coords);
    if (lineStart) {
      const foundKnot = model.knot?.frame.nodes.includes(lineStart);
      if (foundKnot) {
        this.drawUserLine(lineStart, coords);
      }
    }
  }
}

export default Drawing;
