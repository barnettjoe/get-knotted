import { default as wasmWrapper } from "../../built-wasm/matrix.js";

const wasmModule = {};

export async function setup(): Promise<void> {
  const mod = await wasmWrapper();
  wasmModule.lup = mod.cwrap("LUP_decomposition", null, [
    "number",
    "number",
    "number",
  ]);
  wasmModule.solve = mod.cwrap("solve", null, [
    "number",
    "number",
    "number",
    "number",
    "number",
  ]);
  Object.assign(wasmModule, {
    malloc: mod._malloc,
    free: mod._free,
    getValue: mod.getValue,
    setValue: mod.setValue,
  });
}

// const A = [
//       [2, 0, 2, 0.6],
//       [3, 3, 4, -2],
//       [5, 5, 4, 2],
//       [-1, -2, 3.4, -1],
//     ];
//     const P = zeroArray(4);
//     const aPointer = createMatrix(A, "float");
//     const pPointer = createArray(P, "i32");
//     lup(rowCount(A), aPointer, pPointer);
//     const pResult = readArray(P.length, pPointer, "i32");
//     const aResult = readMatrix(rowCount(A), columnCount(A), aPointer, "float");
//     const [L, U] = splitIntoLU(aResult);
//     expect(isZeroMatrix(L)).toBe(false);
//     expect(isUnitLowerTriangularMatrix(L)).toBe(true);
//     expect(isZeroMatrix(U)).toBe(false);
//     expect(isUpperTriangularMatrix(U)).toBe(true);
//     expect(isPermutationArray(pResult)).toBe(true);
//     expect(
//       matrixIsCloseTo(
//         multiply(permutationMatrixFromArray(pResult), A),
//         multiply(L, U)
//       )
//     ).toBe(true);
//   });

// TODO - these are copied from wasm.test.js - should factor out into a utils module
const dataTypes = {
  float: {
    arrayConstructor: Float32Array,
    size: 4,
  },
  i32: {
    arrayConstructor: Uint32Array,
    size: 4,
  },
  double: {
    arrayConstructor: Float64Array,
    size: 8,
  },
};

function zeroArray(length: number) {
  const result = [];
  for (let i = 0; i < length; i++) {
    result.push(0);
  }
  return result;
}

const pointersToFree = [];

function freeAllPointers() {
  while (pointersToFree.length > 0) {
    wasmModule.free(pointersToFree.pop());
  }
}

function createArray(arr, dataType) {
  const inputArray = new dataTypes[dataType].arrayConstructor(arr);
  const pointer = wasmModule.malloc(
    inputArray.length * inputArray.BYTES_PER_ELEMENT
  );
  pointersToFree.push(pointer);
  inputArray.forEach((val, idx) => {
    wasmModule.setValue(
      pointer + idx * inputArray.BYTES_PER_ELEMENT,
      val,
      dataType
    );
  });
  return pointer;
}

function flatten(matrix) {
  const result = [];
  matrix.forEach((row) => result.push(...row));
  return result;
}

function createMatrix(matrix, dataType) {
  return createArray(flatten(matrix), dataType);
}

function readArray(length, pointer, dataType) {
  const result = [];
  for (let i = 0; i < length; i++) {
    const offset = i * dataTypes[dataType].size;
    result.push(wasmModule.getValue(pointer + offset, dataType));
  }
  return result;
}

function readMatrix(rows, columns, pointer, dataType) {
  const result = [];
  for (let i = 0; i < rows; i++) {
    result.push(
      readArray(
        columns,
        pointer + i * columns * dataTypes[dataType].size,
        dataType
      )
    );
  }
  return result;
}

export function lup(A: number[][]): void {
  if (!wasmModule) {
    throw new Error(`wasmModule is not yet initialized`);
  }
  const P = zeroArray(A.length);
  const aPointer = createMatrix(A, "float");
  const pPointer = createArray(P, "i32");
  wasmModule.lup(A.length, aPointer, pPointer);
  const pResult = readArray(P.length, pPointer, "i32");
  const aResult = readMatrix(A.length, A.length, aPointer, "float");
  freeAllPointers();
  return { P: pResult, LU: aResult };
}

export function solve({ P: pi, LU }, b) {
  if (!wasmModule) {
    throw new Error(`wasmModule is not yet initialized`);
  }
  const x = zeroArray(LU.length);
  const luPointer = createMatrix(LU, "float");
  const bPointer = createArray(b, "float");
  const xPointer = createArray(x, "float");
  const piPointer = createArray(pi, "i32");
  wasmModule.solve(LU.length, luPointer, piPointer, bPointer, xPointer);
  const xResult = readArray(LU.length, xPointer, "float");
  freeAllPointers();
  return xResult;
}
