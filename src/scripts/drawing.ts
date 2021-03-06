import { makeAutoObservable, reaction } from "mobx";
import { uncrossed } from "./line";
import { makeStrand } from "./strand";
import makeKnot from "./knot";
import { fromExtrema } from "./frame";
import getPrimitives from "./primitives";
import Renderer from "./webgl/draw-webgl";
import Interaction from "./interaction";
import Options from "./options";

import { Frame, Mode } from "./types";

class Drawing {
  dirty = true;
  mode: Mode;
  interaction = new Interaction(this);
  renderer = new Renderer(this);
  options = new Options(this);
  constructor() {
    reaction(
      () => this.interaction.lastMouseDownCoords,
      () => {
        if (this.interaction.mouseIsDown) {
          this.renderer.draw();
        }
      }
    );
    reaction(
      () => this.interaction.lastMouseMoveCoords,
      () => {
        this.renderer.draw();
      }
    );
    reaction(
      () => this.options.offsetContour,
      () => this.renderer.draw()
    );
    this.mode = "add-grid";
    makeAutoObservable(this);
  }
  get frame(): Frame | null {
    return fromExtrema(
      this.interaction.dragStartGridCoords,
      this.interaction.dragEndGridCoords
    );
  }
  get strands() {
    if (this.frame === null) return null;
    const strands = [];
    while (this.frame.lines.some(uncrossed)) {
      strands.push(makeStrand(this.frame));
    }
    return strands;
  }
  get knot() {
    if (this.frame === null) return null;
    return makeKnot(this.frame, this);
  }
  get primitives() {
    return getPrimitives(this);
  }
}

export default Drawing;
