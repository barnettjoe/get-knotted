import Drawing from "./drawing";
import { relativeCoords } from "./mouse";
import model from "./model";

export default class Interaction {
  drawing: Drawing;
  constructor(drawing: Drawing) {
    this.drawing = drawing;
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
    this.drawing.isDragging = true;
    switch (this.drawing.mode) {
      case "add-grid":
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
      if (this.drawing.isDragging) {
        switch (this.drawing.mode) {
          case "add-grid":
            model.frame && this.drawing.createKnot();
            break;
          case "add-line":
            this.drawing.finishDrawingLine(e);
            break;
        }
      }
      this.drawing.isDragging = false;
    }
  }
  handleMouseMove(e: MouseEvent) {
    model.mouseTracker = relativeCoords(e);
    this.drawing.setDirty();
    if (this.drawing.isDragging)
      switch (this.drawing.mode) {
        case "add-grid":
          this.drawing.dragFrame(e);
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
