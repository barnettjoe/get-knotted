import { makeObservable, autorun, action } from "mobx";
import config from "./config";
import { fromExtrema } from "./frame";
import Drawing from "./drawing";
import Mouse from "./mouse";
import { makeStrands } from "./strand";
import makeKnot, { knotPolylines as drawKnot } from "./knot";
import { Frame, FrameLine, UserLine, Line, Vector } from "./types";

class Model {
  userLine: UserLine | null = null;
  gridLines: Line[] | null = null;
  mouseTracker: Vector | null = null;
  canvasWidth: number = 0;
  canvasHeight: number = 0;
  columns: number = 0;
  rows: number = 0;
  squareSize: number;
  drawing: Drawing;
  mouse: Mouse;
  constructor() {
    this.squareSize = config.targetSquareSize;
    this.drawing = new Drawing(this);
    this.mouse = new Mouse(this);
    makeObservable(this, {
      updateFrame: action,
      updateFrameLines: action,
    });
  }

  get frame() {
    if (this.drawing.dragStart && this.drawing.dragEnd) {
      return fromExtrema(this.drawing.dragStart, this.drawing.dragEnd);
    }
    return null;
  }

  get strands() {
    return makeStrands(this.frame);
  }

  get knot() {
    return makeKnot(this.frame, this.strands);
  }

  updateFrame(newFrame: Frame) {
    this.frame = newFrame;
  }

  updateFrameLines(newLines: FrameLine[]) {
    this.frame.lines = newLines;
  }
}

function init() {
  const modelInstance = new Model();
  autorun(() => {
    console.log(modelInstance.frame);
  });
}

export { Model, init };
