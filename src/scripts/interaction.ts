import Drawing from "./drawing";
import { relativeCoords, rowAndCol } from "./mouse";
import { identicalObjects } from "./general-utils";
import { ArrayElement, Vector } from "./types";

type ClickHandler = () => void;
type MouseEventHandler = (mouseDownCoords: Vector) => void;
type DragEndHandler = (dragStartCoords: Vector, dragEndCoords: Vector) => void;
type DragOverGridLineHandler = (
  dragStartGridCoords: Vector,
  dragCurrentGridCoords: Vector
) => void;

interface Listeners {
  "drag-end": DragEndHandler[];
  "drag-move": MouseEventHandler[];
  "drag-over-grid-line": DragOverGridLineHandler[];
  click: ClickHandler[];
  "mouse-down": MouseEventHandler[];
  "mouse-move": MouseEventHandler[];
}

export default class Interaction {
  canvas: HTMLCanvasElement | null;
  drawing: Drawing;
  mouseIsDown: boolean;
  listeners: Listeners;
  lastMouseDownCoords: Vector;
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
    this.listeners = {
      "drag-end": [],
      "drag-move": [],
      "drag-over-grid-line": [],
      click: [],
      "mouse-down": [],
      "mouse-move": [],
    };
    this.lastMouseDownCoords = [0, 0];
    this.dragStartGridCoords = [0, 0];
    this.dragEndGridCoords = [0, 0];
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
    this.lastMouseDownCoords = relativeCoords(e);
    if (this.lastMouseDownTarget === this.canvas) {
      this.dragStartGridCoords = rowAndCol(e);
      this.dragEndGridCoords = this.dragStartGridCoords;
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
          listener(this.lastMouseDownCoords, relativeCoords(e))
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
    const coords = relativeCoords(e);
    if (this.mouseIsDown) {
      this.isDragging = true;
      this.listeners["drag-move"].forEach((listener) => listener(coords));
      const previousBox = this.dragEndGridCoords;
      this.dragEndGridCoords = rowAndCol(e);
      if (!identicalObjects(previousBox, this.dragEndGridCoords)) {
        this.listeners["drag-over-grid-line"].forEach((listener) =>
          listener(this.dragStartGridCoords, this.dragEndGridCoords)
        );
      }
    }
    this.listeners["mouse-move"].forEach((listener) => listener(coords));
  }
}
