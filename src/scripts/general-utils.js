export function identicalObjects(arr1, arr2) {
  // TODO - this is often very inefficient...
  return JSON.stringify(arr1) === JSON.stringify(arr2);
}

export function distanceBetween(coordsA, coordsB) {
  return (
    ((coordsA[0] - coordsB[0]) ** 2 + (coordsA[1] - coordsB[1]) ** 2) ** 0.5
  );
}
