import kldIntersections from "kld-intersections";
import config from "./config.js";
import Bezier from "./bezier/bezier.js";

export function collectionIntersect(polylineA, polylineB) {
  let lineA;
  let lineB;
  let intersection;
  for (let idxA = 0; idxA < polylineA.length - 1; idxA++) {
    lineA = polylineA.slice(idxA, idxA + 2);
    for (let idxB = 0; idxB < polylineB.length - 1; idxB++) {
      lineB = polylineB.slice(idxB, idxB + 2);
      intersection = kldIntersections.Intersection.intersectLineLine(
        ...lineA,
        ...lineB
      );
      if (intersection.points.length > 0) {
        return {
          idxA: idxA,
          idxB: idxB,
          intersection: intersection.points[0],
        };
      }
    }
  }
}

export function polyline(collection) {
  function reducer(acc, curve, idx) {
    if (curve.constructor.name === "StraightLine") {
      if (idx === 0) {
        return acc.concat([
          { x: curve.start[0], y: curve.start[1] },
          { x: curve.end[0], y: curve.end[1] },
        ]);
      } else {
        return acc.concat([{ x: curve.end[0], y: curve.end[1] }]);
      }
    } else {
      return acc.concat(curve.getLUT(config.resolution));
    }
  }
  return collection
    .reduce(reducer, [])
    .map((point) => new kldIntersections.Point2D(point.x, point.y));
}

export function bezString(p0, p1, p2, p3) {
  return `M${p0[0]} ${p0[1]} C ${p1[0]} ${p1[1]}, ${p2[0]} ${p2[1]}, ${p3[0]} ${
    p3[1]
  }`;
}

export function format(snapObj) {
  snapObj.attr({
    stroke: "black",
    strokeWidth: config.knot.borderWidth,
    fill: "none",
  });
}

function rotateAboutOrigin(point, angle) {
  const x = point[0];
  const y = point[1];
  const newX = x * Math.cos(angle) - y * Math.sin(angle);
  const newY = y * Math.cos(angle) + x * Math.sin(angle);
  return [newX, newY];
}

function rotate(point, center, angle) {
  // first shift to origin
  const shiftedPoint = [point[0] - center[0], point[1] - center[1]];
  const rotated = rotateAboutOrigin(shiftedPoint, angle);
  return [rotated[0] + center[0], rotated[1] + center[1]];
}

function alignBez(p0, p1, p2, p3) {
  // translate to get p0 on x axis
  const translated = [p0, p1, p2, p3].map((coords) => [
    coords[0],
    coords[1] + -p0[1],
  ]);
  // now rotate so p3 is also on x axis
  const deltaX = translated[0][0];
  const angle = -Math.atan(translated[3][1] / (translated[3][0] - deltaX));
  return translated.map((coord) => rotate(coord, translated[0], angle));
}

export function mutate(arr, newArr) {
  // sets arr to newArr in mutating fashion
  while (arr.length > 0) {
    arr.pop();
  }
  for (const x of newArr) {
    arr.push(x);
  }
  return arr;
}

export function reducer(acc, point) {
  return acc.concat([point.x, point.y]);
}
