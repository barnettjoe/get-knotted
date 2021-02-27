import config from "./config";
import { Vector } from "./types";
import type { Model } from "./model";
class Mouse {
  model: Model;
  constructor(model: Model) {
    this.model = model;
  }
  // for getting coords relative to graph area from absolute coords...
  // (i.e. relative to whole window)
  relativeCoords(e: MouseEvent): Vector {
    const absX = e.clientX;
    const absY = e.clientY;
    const surface = document.getElementById("webgl-surface");
    if (surface === null) {
      throw new Error("could not find canvas element");
    }
    const canvasPosition = surface.getBoundingClientRect();
    const leftOffset = canvasPosition.left;
    const topOffset = canvasPosition.top;
    const coords = [absX - leftOffset, absY - topOffset];
    return coords.map((x) => x * window.devicePixelRatio) as Vector;
  }

  // for executing code on condition that mouse is positioned within graphArea
  doIfInGraph(box: Vector, fn: () => void): void {
    const inHorizontally = box[0] >= 0 && box[0] < config.graphCols;
    const inVertically = box[1] >= 0 && box[1] < config.graphRows;
    if (inHorizontally && inVertically) {
      fn();
    }
  }

  pxToBox = (num: number) => {
    const shifted = num - 0.5 * config.maxStrokeWidth();
    return Math.floor(shifted / this.model.squareSize);
  };

  // for getting [row, col] coords from pixel coords
  rowAndCol(event: MouseEvent): Vector {
    return this.relativeCoords(event).map(this.pxToBox) as Vector;
  }

  boxToPX = (n: number) => {
    return n * this.model.squareSize + config.maxStrokeWidth() / 2;
  };

  // for getting pixel coords from [row, col]
  pixelCoords(coords: Vector): Vector {
    return coords.map(this.boxToPX) as Vector;
  }
}

export default Mouse;
