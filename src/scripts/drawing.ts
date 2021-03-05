import { computed, makeObservable, reaction } from "mobx";
import makeKnot from "./knot";
import { fromExtrema } from "./frame";
import Renderer from "./webgl/draw-webgl";
import Interaction from "./interaction";
import Options from "./options";

import { Frame, Knot, Mode } from "./types";

class Drawing {
  dirty = true;
  knots: Knot[];
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
    this.knots = [];
    this.mode = "add-grid";
    makeObservable(this, {
      frame: computed,
      knot: computed,
    });
  }
  get frame(): Frame | null {
    return fromExtrema(
      this.interaction.dragStartGridCoords,
      this.interaction.dragEndGridCoords
    );
  }
  get knot() {
    if (this.frame === null) return null;
    return makeKnot(this.frame, this);
  }
}

export default Drawing;
