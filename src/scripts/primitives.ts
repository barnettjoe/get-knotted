import model from "./model";
import { Primitives } from "./types";
import { normal, lineVector, addVectors, scaleVector } from "./general-utils";
import { drawAndReturnPolylines } from "./knot";
let lines: number[][] = [];
let circles: number[][] = [];
let singlePixelLines: number[][] = [];

function addLine({
  startX,
  startY,
  endX,
  endY,
}: {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}) {
  const width = 5;
  const norm = normal(lineVector([startX, startY], [endX, endY]));
  // if it's worth it we could later move part of this calculation into the vertex shader
  lines.push(
    addVectors([startX, startY], scaleVector(norm, width / 2)),
    addVectors([endX, endY], scaleVector(norm, -width / 2)),
    addVectors([startX, startY], scaleVector(norm, -width / 2)),
    addVectors([startX, startY], scaleVector(norm, width / 2)),
    addVectors([endX, endY], scaleVector(norm, width / 2)),
    addVectors([endX, endY], scaleVector(norm, -width / 2))
  );
}

export default function getPrimitives(): Primitives {
  lines = [];
  singlePixelLines = [];
  circles = [];

  const frame = model.getFrame();
  const currentKnot = model.getCurrentKnot();
  const gridLines = model.getGridLines();

  if (frame) {
    frame.lines.forEach(addLine);
  }

  if (currentKnot) {
    const polylines = drawAndReturnPolylines(currentKnot);
    if (polylines) {
      polylines.forEach((polyline) => {
        for (let i = 0; i < polyline.length - 4; i += 2) {
          singlePixelLines.push(polyline.slice(i, i + 4));
        }
      });
    }
  }

  gridLines.forEach(({ startX, startY, endX, endY, style }) => {
    singlePixelLines.push([startX, startY, endX, endY]);
  });

  return {
    singlePixelLines,
    lines,
    circles,
  };
}
