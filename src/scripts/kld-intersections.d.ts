import { Point } from "./types";

interface CoincidentLinesResult {
  status: "Coincident";
  points: never[];
}

interface ParallelLinesResult {
  status: "Parallel";
  points: never[];
}

interface NoIntersectionResult {
  status: "Parallel";
  points: never[];
}

interface IntersectionPointResult {
  status: "Intersection";
  points: [Point];
}

interface Intersection {
  intersectLineLine(
    lineAStart: Point,
    lineAEnd: Point,
    lineBStart: Point,
    lineBEnd: Point
  ):
    | CoincidentLinesResult
    | ParallelLinesResult
    | NoIntersectionResult
    | IntersectionPointResult;
}

interface Point2D {
  new (x: number, y: number): Point;
}

export const Intersection: Intersection;
export const Point2D: Point2D;
