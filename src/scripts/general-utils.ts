import { Coords } from "./types";

export function identicalObjects(arr1: any[], arr2: any[]) {
  // TODO - this is often very inefficient...
  return JSON.stringify(arr1) === JSON.stringify(arr2);
}

export function distanceBetween(coordsA: Coords, coordsB: Coords) {
  return (
    ((coordsA[0] - coordsB[0]) ** 2 + (coordsA[1] - coordsB[1]) ** 2) ** 0.5
  );
}
