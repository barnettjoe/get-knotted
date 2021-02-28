import Drawing from "./drawing";
import { relativeCoords, rowAndCol } from "./mouse";
import { identicalObjects } from "./general-utils";
import model from "./model";
import { ArrayElement, Vector } from "./types";

type DragEndHandler = (dragEndCoords: Vector) => void;
type DragMoveHandler = (dragCoords: Vector) => void;
type DragOverGridLineHandler = (dragStart: Vector, dragEnd: Vector) => void;
type ClickHandler = () => void;
type MouseDownHandler = (mouseDownCoords: Vector) => void;
interface Listeners {
  "drag-end": DragEndHandler[];
  "drag-move": DragMoveHandler[];
  "drag-over-grid-line": DragOverGridLineHandler[];
  click: ClickHandler[];
  "mouse-down": MouseDownHandler[];
}

export default class Interaction {
  canvas: HTMLCanvasElement | null;
  drawing: Drawing;
  lastMouseDownTarget: EventTarget | null;
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
    this.canvas = null;
    this.lastMouseDownTarget = null;
    this.drawing = drawing;
    this.mouseIsDown = false;
    this.isDragging = false;
    this.listeners = {
      "drag-end": [],
      "drag-move": [],
      "drag-over-grid-line": [],
      click: [],
      "mouse-down": [],
    };
    this.mouseDown = [0, 0];
    // TODO - these are grid-coordinates - should rename to make that clear
    this.dragStart = [0, 0];
    this.dragEnd = [0, 0];
    this.addMouseListeners();
  }
  addMouseListeners() {
    const canvas = document.getElementById("webgl-surface");
    if (canvas instanceof HTMLCanvasElement) {
      this.canvas = canvas;
      canvas.addEventListener(
        "mousemove",
        this.handleMouseMove.bind(this),
        false
      );
    } else {
      throw new Error("could not find element for attaching event handlers");
    }
    window.addEventListener(
      "mousedown",
      this.handleMouseDown.bind(this),
      false
    );
    window.addEventListener("mouseup", this.handleMouseUp.bind(this), false);
  }
  handleMouseDown(e: MouseEvent) {
    this.mouseIsDown = true;
    this.lastMouseDownTarget = e.target;
    this.mouseDown = relativeCoords(e);
    if (this.lastMouseDownTarget === this.canvas) {
      this.dragStart = rowAndCol(e);
      this.dragEnd = this.dragStart;
      this.listeners["mouse-down"].forEach((listener) =>
        listener(relativeCoords(e))
      );
    }
  }
  handleMouseUp(e: MouseEvent) {
    this.mouseIsDown = false;
    if (this.isDragging) {
      this.isDragging = false;
      if (this.lastMouseDownTarget === this.canvas) {
        this.listeners["drag-end"].forEach((listener) =>
          listener(relativeCoords(e))
        );
      }
    } else {
      if (this.lastMouseDownTarget === this.canvas) {
        this.listeners["click"].forEach((listener) => listener());
      }
    }
  }
  on<EventName extends keyof Listeners>(
    eventName: EventName,
    handler: ArrayElement<Listeners[EventName]>
  ) {
    const listeners = this.listeners[eventName] as typeof handler[];
    listeners.push(handler);
  }
  handleMouseMove(e: MouseEvent) {
    if (this.mouseIsDown) {
      this.isDragging = true;
      this.listeners["drag-move"].forEach((listener) =>
        listener(relativeCoords(e))
      );
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
      }
    }
    model.mouseTracker = relativeCoords(e);
    this.drawing.setDirty();
  }
}
