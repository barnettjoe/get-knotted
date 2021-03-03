import { comparer, reaction } from "mobx";
import makeKnot, { addLineBetween, knotPolylines as drawKnot } from "./knot";
import {
  fromExtrema,
  lines,
  findProximalNode,
  lineExistsBetween,
  overlapsExistingNode,
} from "./frame";
import node from "./node";
import { closestGraphCoords, pixelCoords } from "./mouse";
import model from "./model";
import * as webgl from "./webgl/draw-webgl";
import Interaction from "./interaction";

import { Frame, Knot, Mode, Vector, FrameNode, GridSystem } from "./types";

class Drawing {
  dirty = true;
  frame: Frame | null = null;
  knots: Knot[];
  mode: Mode;
  interaction: Interaction;
  constructor() {
    this.interaction = new Interaction(this);
    this.drawLoop = this.drawLoop.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    reaction(
      () => this.interaction.lastMouseDownCoords,
      (coords) => {
        if (this.interaction.mouseIsDown) {
          this.handleMouseDown(coords);
        }
      }
    );
    reaction(
      () => [
        this.interaction.dragStartGridCoords,
        this.interaction.dragEndGridCoords,
      ],
      ([dragStartGridCoords, dragEndGridCoords]) => {
        this.handleDragOverGridLine(dragStartGridCoords, dragEndGridCoords);
      },
      { equals: comparer.structural }
    );
    reaction(
      () => this.interaction.lastMouseUpCoords,
      (isDragging) => {
        if (isDragging) {
          this.handleDragEnd(this.interaction.lastMouseUpCoords);
        } else {
          this.handleClick(this.interaction.lastMouseUpCoords);
        }
      }
    );
    reaction(
      () => this.interaction.lastMouseMoveCoords,
      (mouseCoords) => {
        if (this.interaction.isDragging) {
          this.handleDragMove(mouseCoords);
        }
        this.handleMouseMove(mouseCoords);
      }
    );
    this.knots = [];
    this.mode = "add-grid";
    this.startDrawLoop();
  }
  drawLoop() {
    if (this.dirty) {
      if (model.knot) {
        drawKnot(model.knot);
      }
      webgl.draw(this);
      this.dirty = false;
    }
    requestAnimationFrame(this.drawLoop);
  }

  startDrawLoop() {
    // TODO - why is the requestAnimationFrame necessary here??
    requestAnimationFrame(this.drawLoop);
  }
  createKnot() {
    if (this.frame === null) {
      throw new Error("tried to create a knot with null frame");
    }
    const knot = makeKnot(this.frame);
    model.knot = knot;
    this.dirty = true;
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
  placeNode(mouseCoords: Vector) {
    const coords = closestGraphCoords(mouseCoords);
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
  startDrawingGrid() {
    this.frame = fromExtrema(
      this.interaction.dragStartGridCoords,
      this.interaction.dragEndGridCoords
    );
    this.dirty = true;
  }
  handleDragOverGridLine(
    dragStartGridCoords: Vector,
    dragEndGridCoords: Vector
  ) {
    if (this.mode === "add-grid") {
      this.frame = fromExtrema(dragStartGridCoords, dragEndGridCoords);
    }
  }
  drawUserLine(lineStart: FrameNode, toCoords: Vector) {
    model.userLine = {
      startNode: lineStart,
      toCoords,
    };
  }
  newLineIsValid(lineStart: FrameNode, lineEnd: FrameNode) {
    const currentFrame = this.frame;
    if (currentFrame === null) {
      throw new Error("current frame is null");
    }
    return (
      lineEnd &&
      lineEnd !== lineStart &&
      !lineExistsBetween(lineStart, lineEnd, currentFrame.lines)
    );
  }
  finishDrawingLine(coords: Vector) {
    if (model.userLine) {
      const lineStart = model.userLine.startNode;
      model.userLine = null;
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
    this.dirty = true;
  }
  nodeAt(coords: Vector) {
    const nodes = model.knot?.frame.nodes;
    return nodes ? findProximalNode(coords, nodes) : null;
  }
  handleMouseDown(mouseDownCoords: Vector) {
    switch (this.mode) {
      case "add-grid":
        this.startDrawingGrid();
        break;
      case "add-line":
        this.startDrawingLine(mouseDownCoords);
        break;
    }
  }
  handleDragMove(dragCoords: Vector) {
    if (this.mode === "add-line") {
      if (model.userLine?.startNode) {
        this.drawUserLine(model.userLine.startNode, dragCoords);
      }
    }
  }
  handleDragEnd(dragEndCoords: Vector) {
    switch (this.mode) {
      case "add-grid":
        this.frame && this.createKnot();
        break;
      case "add-line":
        this.finishDrawingLine(dragEndCoords);
        break;
    }
  }
  handleMouseMove(mouseMoveCoords: Vector) {
    model.mouseTracker = mouseMoveCoords;
    this.dirty = true;
  }
  handleClick(clickCoords: Vector) {
    if (this.mode === "add-grid") {
      this.frame && this.createKnot();
    } else if (this.mode === "add-node") {
      this.placeNode(clickCoords);
    }
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
