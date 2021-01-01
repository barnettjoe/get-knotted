import { Coords, Vector } from "./types";

export function identicalObjects(arr1: any[], arr2: any[]) {
  // TODO - this is often very inefficient...
  return JSON.stringify(arr1) === JSON.stringify(arr2);
}

export function distanceBetween(coordsA: Coords, coordsB: Coords) {
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
export function lineVector(start: Coords, end: Coords): Vector {
  return [end[0] - start[0], end[1] - start[1]];
}

export function addVectors(vector1: Vector, vector2: Vector): Vector {
  return [vector1[0] + vector2[0], vector1[1] + vector2[1]];
}

export function scaleVector(vector: Vector, factor: number): Vector {
  return [vector[0] * factor, vector[1] * factor];
}
