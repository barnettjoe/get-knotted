import { makeAutoObservable, autorun } from "mobx";
import { fromExtrema } from "./frame";
import Renderer from "./webgl/draw-webgl";
import InteractionManager from "./interaction";
import Options from "./options";
import { Frame, Mode } from "./types";
import { computeStrands } from "./strand";
import computeContours from "./contour";
import computeOffsets from "./knot";
import computePrimitives from "./primitives";

class Drawing {
  dirty = true;
  mode: Mode;
  interaction = new InteractionManager(this);
  renderer = new Renderer(this);
  options = new Options(this);
  constructor() {
    autorun(() => {
      this.renderer.draw();
    });
    this.mode = "add-grid";
    makeAutoObservable(this);
  }
  get frame(): Frame {
    return fromExtrema(
      this.interaction.dragStartGridCoords,
      this.interaction.dragEndGridCoords
    );
  }
  get strands() {
    return computeStrands(this.frame);
  }
  get contours() {
    return computeContours(this.strands);
  }
  get knot() {
    return computeOffsets(this.frame, this.contours, this);
  }
  get primitives() {
    return computePrimitives(this);
  }
}

export default Drawing;
