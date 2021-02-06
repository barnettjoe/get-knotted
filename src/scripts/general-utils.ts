import { Vector } from "./types";

export function identicalObjects(obj1: unknown[], obj2: unknown[]): boolean {
  // TODO - this is a bit gross, but actually has negligible performance impact
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

export function distanceBetween(coordsA: Vector, coordsB: Vector): number {
  return (
    ((coordsA[0] - coordsB[0]) ** 2 + (coordsA[1] - coordsB[1]) ** 2) ** 0.5
  );
}

/**
 * Get vector with same direction but magnitude of 1.
 */
function normalize(vector: Vector): Vector {
  const length = Math.sqrt(vector[0] ** 2 + vector[1] ** 2);
  return vector.map((x) => x / length) as Vector;
}

/**
 * The normalized perpendicular vector, pointing to the RHS relative to the vector direction.
 */
export function normal(vector: Vector): Vector {
  return normalize([-vector[1], vector[0]]);
}

/**
 * Vector description of a line segment.
 */
export function lineVector(start: Vector, end: Vector): Vector {
  return [end[0] - start[0], end[1] - start[1]];
}

export function addVectors(vector1: Vector, vector2: Vector): Vector {
  return [vector1[0] + vector2[0], vector1[1] + vector2[1]];
}

export function scaleVector(vector: Vector, factor: number): Vector {
  return [vector[0] * factor, vector[1] * factor];
}
