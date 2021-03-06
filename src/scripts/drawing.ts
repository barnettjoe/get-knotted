import { makeAutoObservable, autorun } from "mobx";
import { computeStrands } from "./strand";
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
    autorun(() => {
      this.renderer.draw();
    });
    this.mode = "add-grid";
    makeAutoObservable(this);
  }
  get frame(): Frame | null {
    console.log("computing frame");
    return fromExtrema(
      this.interaction.dragStartGridCoords,
      this.interaction.dragEndGridCoords
    );
  }
  get strands() {
    if (this.frame === null) return null;
    return computeStrands(this.frame);
  }
  get knot() {
    console.log("computing knot");
    if (this.frame === null) return null;
    return makeKnot(this.frame, this);
  }
  get primitives() {
    console.log("computing primitives");
    return getPrimitives(this);
  }
}

export default Drawing;
