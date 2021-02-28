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
  doIfInGraph,
  relativeCoords,
  closestGraphCoords,
  pixelCoords,
} from "./mouse";
import model from "./model";
import * as webgl from "./webgl/draw-webgl";
import Interaction from "./interaction";

import { Frame, Knot, Mode, Vector, FrameNode, GridSystem } from "./types";

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

class Drawing {
  // for keeping track of where we started a drag on the grid
  dragStart: [number, number];
  dragEnd: [number, number];
  frame?: Frame;
  knots: Knot[];
  mode: Mode;
  interaction: Interaction;
  constructor() {
    this.interaction = new Interaction(this);
    this.interaction.onGridDrag(this.updateFrameOnDrag);
    this.knots = [];
    this.mode = "add-grid";
    this.dragStart = [0, 0];
    this.dragEnd = [0, 0];
    this.startDrawLoop();
  }
  setDirty() {
    dirty = true;
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
    model.frame = fromExtrema(this.dragStart, this.dragEnd);
    this.setDirty();
  }
  startDrawingGrid() {
    doIfInGraph(this.dragStart, this.updateFrame.bind(this));
  }
  updateFrameOnDrag(dragStart: Vector, dragEnd: Vector) {
    doIfInGraph(dragEnd, () => {
      const currentFrame = model.frame;
      if (currentFrame) {
        currentFrame.lines = [];
      }
      model.frame = fromExtrema(dragStart, dragEnd);
    });
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
