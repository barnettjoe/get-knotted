import { computed, makeObservable, observable, autorun } from "mobx";
import config from "./config";
import makeKnot from "./knot";
import { Frame, UserLine, Line, Vector } from "./types";

console.log("executing model module");
class Model {
  frame: Frame;
  userLine: UserLine | null = null;
  gridLines: Line[] | null = null;
  mouseTracker: Vector | null = null;
  canvasWidth: number = 0;
  canvasHeight: number = 0;
  columns: number = 0;
  rows: number = 0;
  squareSize: number;
  constructor() {
    this.squareSize = config.targetSquareSize;
    this.frame = {
      nodes: [],
      adjacencyList: [],
      lines: [],
    };
    makeObservable(this, {
      frame: observable,
      knot: computed,
    });
  }

  get knot() {
    return makeKnot(this.frame);
  }
}

const modelInstance = new Model();

function init() {
  autorun(() => {
    console.log(modelInstance.knot);
  });
}

export { modelInstance, Model, init };
