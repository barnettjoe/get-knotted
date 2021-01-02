import config from "./config";
import model from "./model";
import { Coords } from "./types";

// for getting coords relative to graph area from absolute coords...
// (i.e. relative to whole window)
export function relativeCoords(e: MouseEvent): Coords {
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
  return coords.map((x) => x * window.devicePixelRatio) as Coords;
}

// for executing code on condition that mouse is positioned within graphArea
export function doIfInGraph(box: Coords, fn: Function) {
  const inHorizontally = box[0] >= 0 && box[0] < config.graphCols;
  const inVertically = box[1] >= 0 && box[1] < config.graphRows;
  if (inHorizontally && inVertically) {
    fn();
  }
}

// for getting [row, col] coords from pixel coords
export function rowAndCol(event: MouseEvent): Coords {
  function pxToBox(num: number) {
    const shifted = num - 0.5 * config.maxStrokeWidth();
    return Math.floor(shifted / model.squareSize);
  }
  return relativeCoords(event).map(pxToBox) as Coords;
}

export function closestGraphCoords(event: MouseEvent): Coords {
  function pxToBox(num: number) {
    const shifted = num - 0.5 * config.maxStrokeWidth();
    return Math.round(shifted / config.squareHeight);
  }
  return relativeCoords(event).map(pxToBox) as Coords;
}

// for getting pixel coords from [row, col]
export function pixelCoords(coords: Coords): Coords {
  function boxToPX(n: number) {
    return n * model.squareSize + config.maxStrokeWidth() / 2;
  }
  return coords.map(boxToPX) as Coords;
}
