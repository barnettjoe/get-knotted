import { makeAutoObservable } from "mobx";
import Drawing from "./drawing";
import { relativeCoords, rowAndCol } from "./mouse";
import { Vector } from "./types";

export default class Interaction {
  drawing: Drawing;
  canvas: HTMLCanvasElement | null = null;
  lastMouseDownTarget: EventTarget | null = null;
  mouseIsDown = false;
  isDragging = false;
  lastMouseMoveCoords: Vector = [0, 0];
  lastMouseDownCoords: Vector = [0, 0];
  lastMouseUpCoords: Vector = [0, 0];
  dragStartGridCoords: Vector = [0, 0];
  dragEndGridCoords: Vector = [0, 0];
  constructor(drawing: Drawing) {
    this.canvas = null;
    this.drawing = drawing;
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
  handleMouseDown = (e: MouseEvent) => {
    this.mouseIsDown = true;
    this.lastMouseDownTarget = e.target;
    this.lastMouseDownCoords = relativeCoords(e);
    if (this.lastMouseDownTarget === this.canvas) {
      this.dragStartGridCoords = rowAndCol(e);
      this.dragEndGridCoords = this.dragStartGridCoords;
    }
  };
  handleMouseUp = (e: MouseEvent) => {
    this.lastMouseUpCoords = relativeCoords(e);
    this.mouseIsDown = false;
    if (this.isDragging) {
      this.isDragging = false;
    }
  };
  handleMouseMove = (e: MouseEvent) => {
    this.lastMouseMoveCoords = relativeCoords(e);
    if (this.mouseIsDown) {
      this.isDragging = true;
      this.dragEndGridCoords = rowAndCol(e);
    }
  };
}
