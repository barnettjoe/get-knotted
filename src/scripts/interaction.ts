import Drawing from "./drawing";
import { relativeCoords, rowAndCol } from "./mouse";
import { identicalObjects } from "./general-utils";
import model from "./model";
import { ArrayElement, Vector } from "./types";

type DragEndHandler = (dragEndCoords: Vector) => void;
type DragOverGridLineListener = (dragStart: Vector, dragEnd: Vector) => void;
interface Listeners {
  "drag-end": DragEndHandler[];
  "drag-over-grid-line": DragOverGridLineListener[];
}

export default class Interaction {
  drawing: Drawing;
  mouseIsDown: boolean;
  listeners: Listeners;
  /**
   * Position in relative coordinates of the last mousedown event.
   */
  mouseDown: Vector;
  /**
   * Whether we are currently dragging
   */
  isDragging: boolean;
  // drag tracking, in grid coordinates
  dragStart: Vector;
  dragEnd: Vector;
  constructor(drawing: Drawing) {
    this.drawing = drawing;
    this.mouseIsDown = false;
    this.isDragging = false;
    this.listeners = {
      "drag-end": [],
      "drag-over-grid-line": [],
    };
    this.mouseDown = [0, 0];
    // TODO - these are grid-coordinates - should rename to make that clear
    this.dragStart = [0, 0];
    this.dragEnd = [0, 0];
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
    this.mouseIsDown = true;
    this.mouseDown = relativeCoords(e);
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

  handleClick(e: MouseEvent) {
    if (e.target instanceof Element && e.target.tagName !== "BUTTON") {
      if (this.mouseIsDown) {
        switch (this.drawing.mode) {
          case "add-grid":
            model.frame && this.drawing.createKnot();
            break;
        }
      }
      this.mouseIsDown = false;
    }
  }
  handleMouseUp(e: MouseEvent) {
    this.mouseIsDown = false;
    if (this.isDragging) {
      this.listeners["drag-end"].forEach((listener) => {
        listener(relativeCoords(e));
      });
    } else {
      this.handleClick(e);
    }
  }
  on<EventName extends keyof Listeners>(
    eventName: EventName,
    cb: ArrayElement<Listeners[EventName]>
  ) {
    const listeners = this.listeners[eventName] as typeof cb[];
    listeners.push(cb);
  }
  handleMouseMove(e: MouseEvent) {
    if (this.mouseIsDown) {
      this.isDragging = true;
    }
    model.mouseTracker = relativeCoords(e);
    this.drawing.setDirty();
    if (this.mouseIsDown)
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
