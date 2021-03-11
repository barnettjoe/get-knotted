import { Line } from "./types";
import { pixelCoords } from "./mouse";
import model from "./model";

function verticalLines(): Line[] {
  return Array.from(Array(model.columns + 1), (_, idx) => idx).map((i) => {
    const [startX, startY] = pixelCoords([i, 0]);
    const [endX, endY] = pixelCoords([i, model.rows]);

    return {
      startX,
      startY,
      endX,
      endY,
    };
  });
}

function horizontalLines(): Line[] {
  return Array.from(Array(model.rows + 1), (_, idx) => idx).map((i) => {
    const [startX, startY] = pixelCoords([0, i]);
    const [endX, endY] = pixelCoords([model.columns, i]);
    return {
      startX,
      startY,
      endX,
      endY,
    };
  });
}

export default function graphLines(): Line[] {
  return [...horizontalLines(), ...verticalLines()];
}
