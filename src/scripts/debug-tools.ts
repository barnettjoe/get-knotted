import { bezString } from "./knot-utils";
import Bezier from "./bezier/bezier";
import { Point } from "./types";

let rainbowIdx = 0;

function paintBezier(bezier: Bezier, color: string) {
  const ctrlPoints = bezier.points.map((coords) => [coords.x, coords.y]);
  const path = bezString(...ctrlPoints);
  // const svgBez = Snap(surface).path(path);
  // svgBez.attr({
  //   stroke: color,
  //   strokeWidth: 2,
  //   fill: "none",
  // });
}

function paintPoint(point: Point, color: string) {
  // const circle = Snap(surface).circle(point.x, point.y, 2);
  // circle.attr({ fill: color, stroke: color });
}

export function paint(item: unknown, color: string) {
  if (item.x !== undefined && item.y !== undefined) {
    paintPoint(item, color);
    return;
  }
  switch (item.constructor.name) {
    case "Object": // should be bezier but constructor not set in library
      paintBezier(item, color);
      break;
    case "Point2D":
      paintPoint(item, color);
      break;
    case "Array":
      item.forEach((element) => paint(element, color));
      break;
    default:
      break;
  }
}

export function rainbowPaint(bezCollection) {
  const rainbow = ["red", "blue", "green", "orange", "purple"];
  bezCollection.forEach((bez) => {
    paint(bez, rainbow[rainbowIdx++ % rainbow.length]);
  });
}
