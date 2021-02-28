import zipObject from "lodash/zipObject";
import Drawing from "./drawing";
import { relativeCoords, rowAndCol } from "./mouse";
import { identicalObjects } from "./general-utils";
import model from "./model";
import { Vector } from "./types";
const eventNames = ["drag-start", "drag-end", "drag-over-grid-line"] as const;

type DragListener = (dragStart: Vector, dragEnd: Vector) => void;
type EventType = typeof eventNames[number];
type Listeners = { [key in EventType]: DragListener[] };
export default class Interaction {
  drawing: Drawing;
  isDragging: boolean;
  listeners: { [key in EventType]: DragListener[] };
  // drag tracking, in grid coordinates
  dragStart: [number, number];
  dragEnd: [number, number];
  constructor(drawing: Drawing) {
    this.drawing = drawing;
    this.isDragging = false;
    this.listeners = zipObject(
      eventNames,
      eventNames.map(() => [] as DragListener[])
    ) as Listeners;
    this.dragStart = [0, 0];
    this.dragEnd = [0, 0];
    this.addMouseListeners();
  }
  addMouseListeners() {
    const wrapper = document.getElementById("webgl-surface");
    if (wrapper) {
      wrapper.addEventListener(
        "mousedown",
        this.handleDragStart.bind(this),
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
  handleDragStart(e: MouseEvent) {
    this.isDragging = true;
    switch (this.drawing.mode) {
      case "add-grid":
        this.dragStart = rowAndCol(e);
        this.dragEnd = this.dragStart;
        this.drawing.startDrawingGrid();
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
  onDragOverGridLine(cb: DragListener) {
    this.listeners["drag-over-grid-line"].push(cb);
  }
  handleMouseMove(e: MouseEvent) {
    model.mouseTracker = relativeCoords(e);
    this.drawing.setDirty();
    if (this.isDragging)
      switch (this.drawing.mode) {
        case "add-grid":
          const previousBox = this.dragEnd;
          this.dragEnd = rowAndCol(e);
          if (!identicalObjects(previousBox, this.dragEnd)) {
            this.listeners["drag-over-grid-line"].forEach((listener) =>
              listener(this.dragStart, this.dragEnd)
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
