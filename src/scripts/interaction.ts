import Drawing from "./drawing";
import { relativeCoords, rowAndCol } from "./mouse";
import { identicalObjects } from "./general-utils";
import model from "./model";
import { Vector } from "./types";

type DragListener = (dragStart: Vector, dragEnd: Vector) => void;

export default class Interaction {
  drawing: Drawing;
  isDragging: boolean;
  listeners: DragListener[];
  constructor(drawing: Drawing) {
    this.drawing = drawing;
    this.isDragging = false;
    this.listeners = [];
    this.addMouseListeners();
  }
  addMouseListeners() {
    const wrapper = document.getElementById("webgl-surface");
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
      throw new Error("could not find element for attaching event handlers");
    }
    window.addEventListener("mouseup", this.handleMouseUp.bind(this), false);
  }
  handleMouseDown(e: MouseEvent) {
    this.isDragging = true;
    switch (this.drawing.mode) {
      case "add-grid":
        this.drawing.dragStart = rowAndCol(e);
        this.drawing.dragEnd = this.drawing.dragStart;
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
      if (this.isDragging) {
        switch (this.drawing.mode) {
          case "add-grid":
            model.frame && this.drawing.createKnot();
            break;
          case "add-line":
            this.drawing.finishDrawingLine(e);
            break;
        }
      }
      this.isDragging = false;
    }
  }
  onGridDrag(cb: DragListener) {
    this.listeners.push(cb);
  }
  handleMouseMove(e: MouseEvent) {
    model.mouseTracker = relativeCoords(e);
    this.drawing.setDirty();
    if (this.isDragging)
      switch (this.drawing.mode) {
        case "add-grid":
          const previousBox = this.drawing.dragEnd;
          this.drawing.dragEnd = rowAndCol(e);
          if (!identicalObjects(previousBox, this.drawing.dragEnd)) {
            this.listeners.forEach((listener) =>
              listener(this.drawing.dragStart, this.drawing.dragEnd)
            );
          }
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
