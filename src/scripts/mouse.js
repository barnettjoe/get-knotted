import config from "./config";

// for getting coords relative to graph area from absolute coords...
// (i.e. relative to whole window)
export function relativeCoords(e) {
  const absX = e.clientX;
  const absY = e.clientY;
  const surface = document.getElementById("surface");
  const svgPosition = surface.getBoundingClientRect();
  const leftOffset = svgPosition.left;
  const topOffset = svgPosition.top;
  return [absX - leftOffset, absY - topOffset];
}

// for executing code on condition that mouse is positioned within graphArea
export function doIfInGraph(box, fn) {
  const inHorizontally = box[0] >= 0 && box[0] < config.graphCols;
  const inVertically = box[1] >= 0 && box[1] < config.graphRows;
  if (inHorizontally && inVertically) {
    fn();
  }
}

// for getting [row, col] coords from pixel coords
export function rowAndCol(event) {
  function pxToBox(num) {
    const shifted = num - 0.5 * config.maxStrokeWidth();
    return Math.floor(shifted / config.squareHeight);
  }
  return relativeCoords(event).map(pxToBox);
}

export function closestGraphCoords(event) {
  function pxToBox(num) {
    const shifted = num - 0.5 * config.maxStrokeWidth();
    return Math.round(shifted / config.squareHeight);
  }
  return relativeCoords(event).map(pxToBox);
}

// for getting pixel coords from [row, col]
export function pixelCoords(coords) {
  function boxToPX(n) {
    return n * config.squareHeight + config.maxStrokeWidth() / 2;
  }
  return coords.map(boxToPX);
}
