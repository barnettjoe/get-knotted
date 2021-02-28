import config from "./config";
import model from "./model";
import { Vector } from "./types";

// for getting coords relative to graph area from absolute coords...
// (i.e. relative to whole window)
export function relativeCoords(e: MouseEvent): Vector {
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
export function doIfInGraph(box: Vector, fn: () => void): void {
  const inHorizontally = box[0] >= 0 && box[0] < config.graphCols;
  const inVertically = box[1] >= 0 && box[1] < config.graphRows;
  if (inHorizontally && inVertically) {
    fn();
  }
}

// for getting [row, col] coords from pixel coords
export function rowAndCol(event: MouseEvent): Vector {
  function pxToBox(num: number) {
    const shifted = num - 0.5 * config.maxStrokeWidth();
    return Math.floor(shifted / model.squareSize);
  }
  return relativeCoords(event).map(pxToBox) as Vector;
}

export function closestGraphCoords(mouseCoords: Vector): Vector {
  function pxToBox(num: number) {
    const shifted = num - 0.5 * config.maxStrokeWidth();
    return Math.round(shifted / config.squareHeight);
  }
  return mouseCoords.map(pxToBox) as Vector;
}

// for getting pixel coords from [row, col]
export function pixelCoords(coords: Vector): Vector {
  function boxToPX(n: number) {
    return n * model.squareSize + config.maxStrokeWidth() / 2;
  }
  return coords.map(boxToPX) as Vector;
}
