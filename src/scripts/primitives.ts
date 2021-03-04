import model from "./model";
import { Primitives } from "./types";
import { normal, lineVector, addVectors, scaleVector } from "./general-utils";
import { knotPolylines } from "./knot";
import config from "./config";
import Drawing from "./drawing";

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
  const width = config.frame.strokeWidth;
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

export default function getPrimitives(drawing: Drawing): Primitives {
  lines = [];
  singlePixelLines = [];
  circles = [];
  if (drawing.frame) {
    drawing.frame.lines.forEach((line) => {
      addLine(line);
    });
  }

  if (drawing.knot) {
    const polylines = knotPolylines(drawing.knot);
    if (polylines) {
      polylines.forEach((polyline) => {
        for (let i = 0; i < polyline.length - 4; i += 2) {
          singlePixelLines.push(polyline.slice(i, i + 4));
        }
      });
    }
  }

  if (model.gridLines) {
    model.gridLines.forEach(({ startX, startY, endX, endY }) => {
      singlePixelLines.push([startX, startY, endX, endY]);
    });
  }

  if (model.mouseTracker) {
    addCircle(...model.mouseTracker, 2);
  }

  if (model.userLine) {
    singlePixelLines.push([
      model.userLine.startNode.x,
      model.userLine.startNode.y,
      ...model.userLine.toCoords,
    ]);
  }
  return {
    singlePixelLines,
    lines,
    circles,
  };
}
