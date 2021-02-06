import { intersect, shape } from "svg-intersections";
import { Vector, Point, CollectionIntersectionResult } from "./types";

export function collectionIntersect(
  polylineA: Point[],
  polylineB: Point[]
): CollectionIntersectionResult | undefined {
  let lineA;
  let lineB;
  let intersection;
  for (let idxA = 0; idxA < polylineA.length - 1; idxA++) {
    lineA = polylineA.slice(idxA, idxA + 2) as [Point, Point];
    for (let idxB = 0; idxB < polylineB.length - 1; idxB++) {
      lineB = polylineB.slice(idxB, idxB + 2) as [Point, Point];
      const shapeA = shape("line", {
        x1: lineA[0].x,
        y1: lineA[0].y,
        x2: lineA[1].x,
        y2: lineA[1].y,
      });
      const shapeB = shape("line", {
        x1: lineB[0].x,
        y1: lineB[0].y,
        x2: lineB[1].x,
        y2: lineB[1].y,
      });
      intersection = intersect(shapeA, shapeB);
      if (intersection.points.length) {
        return {
          idxA: idxA,
          idxB: idxB,
          intersection: intersection.points[0],
        };
      }
    }
  }
}

// type Shape = Bezier | StraightLine;
// export function polyline(collection: Shape[]) {
//   function reducer(acc: Point[], shape: Shape, idx: number) {
//     if (shape instanceof StraightLine) {
//       if (idx === 0) {
//         return acc.concat([
//           { x: shape.start[0], y: shape.start[1] },
//           { x: shape.end[0], y: shape.end[1] },
//         ]);
//       } else {
//         return acc.concat([{ x: shape.end[0], y: shape.end[1] }]);
//       }
//     } else {
//       return acc.concat(shape.getLUT(config.resolution));
//     }
//   }
//   return collection.reduce(reducer, []);
// }

export function rotateAboutOrigin(point: Vector, angle: number): Vector {
  const x = point[0];
  const y = point[1];
  const newX = x * Math.cos(angle) - y * Math.sin(angle);
  const newY = y * Math.cos(angle) + x * Math.sin(angle);
  return [newX, newY];
}

// TODO - this seems like it could be very inefficient...
export function mutate<T>(arr: T[], newArr: T[]): T[] {
  // sets arr to newArr in mutating fashion.
  while (arr.length > 0) {
    arr.pop();
  }
  for (const x of newArr) {
    arr.push(x);
  }
  return arr;
}

export function flatten(acc: number[], point: Point): number[] {
  return acc.concat([point.x, point.y]);
}
