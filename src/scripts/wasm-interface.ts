import { default as wasmWrapper } from "../../built-wasm/matrix.js";
import { Matrix } from "./types";
// NB there is also i64 but it's more complicated...
// see https://emscripten.org/docs/getting_started/FAQ.html#how-do-i-pass-int64-t-and-uint64-t-values-from-js-into-wasm-functions
type BaseDataType = "i8" | "i16" | "i32" | "float" | "double";
type DataType = BaseDataType | `${BaseDataType}*` | "*";

interface WasmModule {
  lup(rowCount: number, A: number, b: number): void;
  solve(
    rowCount: number,
    LU: number,
    pi: number,
    b: number,
    xResult: number
  ): void;
  malloc(bytes: number): number;
  free(pointer: number): void;
  getValue(pointer: number, dataType: DataType): number;
  setValue(pointer: number, value: number, dataType: DataType): void;
}

let wasmModule: WasmModule | null = null;

export async function setup(): Promise<void> {
  const mod = await wasmWrapper();
  wasmModule = {
    lup: mod.cwrap("LUP_decomposition", null, ["number", "number", "number"]),
    solve: mod.cwrap("solve", null, [
      "number",
      "number",
      "number",
      "number",
      "number",
    ]),
    malloc: mod._malloc,
    free: mod._free,
    getValue: mod.getValue,
    setValue: mod.setValue,
  };
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

// TODO - these are copied from wasm.test.js - should factor out into a wasm-utils module
const dataTypes = {
  i8: {
    arrayConstructor: Int8Array,
    size: 1,
  },
  i16: {
    arrayConstructor: Int16Array,
    size: 2,
  },
  i32: {
    arrayConstructor: Int32Array,
    size: 4,
  },
  float: {
    arrayConstructor: Float32Array,
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

const pointersToFree: number[] = [];

function freeAllPointers() {
  if (!wasmModule) {
    throw new Error("wasm module has not yet been initialized");
  }
  while (true) {
    const pointer = pointersToFree.pop();
    if (pointer) {
      wasmModule.free(pointer);
    } else {
      break;
    }
  }
}

function createWasmArray(arr: number[], dataType: BaseDataType) {
  assertIsInitialized(wasmModule);
  const inputArray = new dataTypes[dataType].arrayConstructor(arr);
  const pointer = wasmModule.malloc(
    inputArray.length * inputArray.BYTES_PER_ELEMENT
  );
  pointersToFree.push(pointer);
  // typescript doesn't like a forEach here for some reason
  for (let i = 0; i < inputArray.length; i++) {
    const val = inputArray[i];
    wasmModule.setValue(
      pointer + i * inputArray.BYTES_PER_ELEMENT,
      val,
      dataType
    );
  }
  return pointer;
}

function flatten(matrix: Matrix) {
  const result: number[] = [];
  matrix.forEach((row) => result.push(...row));
  return result;
}

function createWasmMatrix(matrix: Matrix, dataType: BaseDataType) {
  return createWasmArray(flatten(matrix), dataType);
}

function readArray(length: number, pointer: number, dataType: BaseDataType) {
  assertIsInitialized(wasmModule);
  const result = [];
  for (let i = 0; i < length; i++) {
    const offset = i * dataTypes[dataType].size;
    result.push(wasmModule.getValue(pointer + offset, dataType));
  }
  return result;
}

function readMatrix(
  rows: number,
  columns: number,
  pointer: number,
  dataType: BaseDataType
) {
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

function assertIsInitialized(
  wasmModule: WasmModule | null
): asserts wasmModule is WasmModule {
  if (!wasmModule) {
    throw new Error(`wasmModule is not yet initialized`);
  }
}

interface LUDecomposition {
  P: number[];
  LU: Matrix;
}

export function lup(A: number[][]): LUDecomposition {
  assertIsInitialized(wasmModule);
  const P = zeroArray(A.length);
  const aPointer = createWasmMatrix(A, "float");
  const pPointer = createWasmArray(P, "i32");
  wasmModule.lup(A.length, aPointer, pPointer);
  const pResult = readArray(P.length, pPointer, "i32");
  const aResult = readMatrix(A.length, A.length, aPointer, "float");
  freeAllPointers();
  return { P: pResult, LU: aResult };
}

export function solve({ P: pi, LU }: LUDecomposition, b: number[]): number[] {
  assertIsInitialized(wasmModule);
  const x = zeroArray(LU.length);
  const luPointer = createWasmMatrix(LU, "float");
  const bPointer = createWasmArray(b, "float");
  const xPointer = createWasmArray(x, "float");
  const piPointer = createWasmArray(pi, "i32");
  wasmModule.solve(LU.length, luPointer, piPointer, bPointer, xPointer);
  const xResult = readArray(LU.length, xPointer, "float");
  freeAllPointers();
  return xResult;
}
