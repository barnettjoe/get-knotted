import config from "./config";
import { pixelCoords } from "./mouse";
import model from "./model";
import { GridOptions } from "./types";

const options: GridOptions = Object.freeze({
  cols: config.graphCols,
  rows: config.graphRows,
  style: config.graphLine,
});

function verticalLines() {
  return Array.from(Array(model.columns + 1), (_, idx) => idx).map((i) => {
    const [startX, startY] = pixelCoords([i, 0]);
    const [endX, endY] = pixelCoords([i, model.rows]);

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
  return Array.from(Array(model.rows + 1), (_, idx) => idx).map((i) => {
    const [startX, startY] = pixelCoords([0, i]);
    const [endX, endY] = pixelCoords([model.columns, i]);
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
