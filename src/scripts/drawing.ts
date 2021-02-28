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
  dragStart: [number, number] | null;
  dragEnd: [number, number] | null;
  frame?: Frame;
  knots: Knot[];
  mode: Mode;
  interaction: Interaction;
  constructor() {
    this.interaction = new Interaction(this);
    this.knots = [];
    this.mode = "add-grid";
    this.dragStart = null;
    this.dragEnd = null;
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
    if (this.dragStart === null) throw new Error("dragStart is null");
    if (this.dragEnd === null) throw new Error("dragEnd is null");
    model.frame = fromExtrema(this.dragStart, this.dragEnd);
    this.setDirty();
  }
  startDrawingGrid(e: MouseEvent) {
    this.dragStart = rowAndCol(e);
    this.dragEnd = this.dragStart;
    doIfInGraph(this.dragStart, this.updateFrame.bind(this));
  }
  dragFrame(e: MouseEvent) {
    if (this.dragEnd === null) throw new Error("dragEnd is null");
    const previousBox = this.dragEnd;
    this.dragEnd = rowAndCol(e);
    if (!identicalObjects(previousBox, this.dragEnd)) {
      doIfInGraph(this.dragEnd, () => {
        if (this.dragStart === null) throw new Error("dragStart is null");
        if (this.dragEnd === null) throw new Error("dragEnd is null");
        const currentFrame = model.frame;
        if (currentFrame) {
          currentFrame.lines = [];
        }
        model.frame = fromExtrema(this.dragStart, this.dragEnd);
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
