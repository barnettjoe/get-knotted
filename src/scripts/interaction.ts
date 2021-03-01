import { makeObservable, observable, action, makeAutoObservable } from "mobx";
import Drawing from "./drawing";
import { relativeCoords, rowAndCol } from "./mouse";
import { Vector } from "./types";

export default class Interaction {
  canvas: HTMLCanvasElement | null;
  drawing: Drawing;
  mouseIsDown: boolean;
  lastMouseMoveCoords: Vector;
  lastMouseDownCoords: Vector;
  lastMouseUpCoords: Vector;
  lastMouseDownTarget: EventTarget | null;
  isDragging: boolean;
  dragStartGridCoords: Vector;
  dragEndGridCoords: Vector;
  constructor(drawing: Drawing) {
    this.canvas = null;
    this.lastMouseDownTarget = null;
    this.drawing = drawing;
    this.mouseIsDown = false;
    this.isDragging = false;
    this.lastMouseDownCoords = [0, 0];
    this.lastMouseMoveCoords = [0, 0];
    this.lastMouseUpCoords = [0, 0];
    this.dragStartGridCoords = [0, 0];
    this.dragEndGridCoords = [0, 0];
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    makeAutoObservable(this);
    this.addMouseListeners();
  }
  addMouseListeners() {
    const canvas = document.getElementById("webgl-surface");
    if (canvas instanceof HTMLCanvasElement) {
      this.canvas = canvas;
      canvas.addEventListener("mousemove", this.handleMouseMove, false);
    } else {
      throw new Error("could not find element for attaching event handlers");
    }
    window.addEventListener("mousedown", this.handleMouseDown, false);
    window.addEventListener("mouseup", this.handleMouseUp, false);
  }
  handleMouseDown(e: MouseEvent) {
    this.mouseIsDown = true;
    this.lastMouseDownTarget = e.target;
    this.lastMouseDownCoords = relativeCoords(e);
    if (this.lastMouseDownTarget === this.canvas) {
      this.dragStartGridCoords = rowAndCol(e);
      this.dragEndGridCoords = this.dragStartGridCoords;
    }
  }
  handleMouseUp(e: MouseEvent) {
    this.lastMouseUpCoords = relativeCoords(e);
    this.mouseIsDown = false;
    if (this.isDragging) {
      this.isDragging = false;
    }
  }
  handleMouseMove(e: MouseEvent) {
    this.lastMouseMoveCoords = relativeCoords(e);
    if (this.mouseIsDown) {
      this.isDragging = true;
      this.dragEndGridCoords = rowAndCol(e);
    }
  }
}
