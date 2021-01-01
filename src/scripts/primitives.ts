import model from "./model";
import { Primitives } from "./types";
import { normal, lineVector, addVectors, scaleVector } from "./general-utils";
import { drawAndReturnPolylines } from "./knot";
import config from "./config";

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

function addCircle(x: number, y: number, radius: number) {
  const points = Array(config.webgl.circleSides)
    .fill(0)
    .map((_, idx) => {
      const theta = (idx / config.webgl.circleSides) * 2 * Math.PI;
      return [x + radius * Math.cos(theta), y + radius * Math.sin(theta)];
    });
  points.forEach((point, idx) => {
    circles.push([x, y], point, points[idx - 1] || points[points.length - 1]);
  });
}

export default function getPrimitives(): Primitives {
  lines = [];
  singlePixelLines = [];
  circles = [];

  const frame = model.frame;
  const currentKnot = model.currentKnot;
  const gridLines = model.gridLines;
  const mouseTracker = model.mouseTracker;

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

  if (mouseTracker) {
    addCircle(...mouseTracker, 2);
  }

  return {
    singlePixelLines,
    lines,
    circles,
  };
}
