import config from "./config";
import { pixelCoords } from "./mouse.js";
import { GraphLine } from "./line";

import { GridOptions } from "types";

const options: GridOptions = Object.freeze({
  startCol: 0,
  startRow: 0,
  cols: config.graphCols,
  rows: config.graphRows,
  style: config.graphLine,
});

function verticalLines() {
  return Array.from(
    Array(options.cols + 1),
    (_, idx) => idx + options.startCol
  ).map((i) => {
    const [startX, startY] = pixelCoords([i, options.startRow]);
    const [endX, endY] = pixelCoords([i, options.startRow + options.rows]);

    return {
      startX,
      startY,
      endX,
      endY,
      style: options.style,
    };
  });
}

function horizontalLines() {
  return Array.from(
    Array(options.rows + 1),
    (_, idx) => idx + options.startRow
  ).map((i) => {
    const [startX, startY] = pixelCoords([options.startCol, i]);
    const [endX, endY] = pixelCoords([options.startCol + options.cols, i]);
    return {
      startX,
      startY,
      endX,
      endY,
      style: options.style,
    };
  });
}

export default function graphLines() {
  return [...horizontalLines(), ...verticalLines()];
}
