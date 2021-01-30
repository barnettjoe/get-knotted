const {
  toBeDeepCloseTo,
  toMatchCloseTo,
} = require("jest-matcher-deep-close-to");
expect.extend({ toBeDeepCloseTo });
const wasmModuleWrapper = require("../wasm/output/matrix.js");

// TODO - using an absolute number of decimal points isn't ideal...
const DECIMAL_POINTS_FOR_CLOSETO_TEST = 7;

let wasmModule;
const pointersToFree = [];

function flatten(matrix) {
  const result = [];
  matrix.forEach((row) => result.push(...row));
  return result;
}

const dataTypes = {
  float: {
    arrayConstructor: Float32Array,
    size: 4,
  },
  i32: {
    arrayConstructor: Uint32Array,
    size: 4,
  },
};

function createArray(arr, dataType) {
  const inputArray = new dataTypes[dataType].arrayConstructor(arr);
  const pointer = wasmModule._malloc(
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

function createMatrix(matrix, dataType) {
  return createArray(flatten(matrix), dataType);
}

function rows(matrix) {
  return matrix.length;
}

function columns(matrix) {
  return matrix[0].length;
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

beforeAll(async () => {
  wasmModule = await wasmModuleWrapper();
});

afterEach(() => {
  while (pointersToFree.length > 0) {
    wasmModule._free(pointersToFree.pop());
  }
});

describe("multiply", () => {
  it("should multiply two matrices", () => {
    const multiply = wasmModule.cwrap("multiply", null, [
      "number",
      "number",
      "number",
      "number",
      "number",
      "number",
    ]);
    const matrixA = [
      [0, 3, 5],
      [5, 5, 2],
    ];
    const matrixB = [
      [3, 4],
      [3, -2],
      [4, -2],
    ];
    const result = [
      [0, 0],
      [0, 0],
    ];
    const aPointer = createMatrix(matrixA, "float");
    const bPointer = createMatrix(matrixB, "float");
    const resultPointer = createMatrix(result, "float");
    multiply(
      rows(matrixA),
      columns(matrixA),
      rows(matrixB),
      columns(matrixB),
      aPointer,
      bPointer,
      resultPointer
    );
    expect(readMatrix(2, 2, resultPointer, "float")).toBeDeepCloseTo(
      [
        [29, -16],
        [38, 6],
      ],
      DECIMAL_POINTS_FOR_CLOSETO_TEST
    );
  });
});

describe("forward substitution", () => {
  it("should solve for y", () => {
    const forwardSubstitution = wasmModule.cwrap("forward_substitution", null, [
      "number",
      "number",
      "number",
      "number",
      "number",
    ]);
    const L = [
      [1, 0, 0],
      [0.2, 1, 0],
      [0.6, 0.5, 1],
    ];
    const pi = [2, 0, 1];
    const b = [3, 7, 8];
    const y = [0, 0, 0];
    const lPointer = createMatrix(L, "float");
    const piPointer = createArray(pi, "i32");
    const bPointer = createArray(b, "float");
    const yPointer = createArray(y, "float");
    forwardSubstitution(b.length, lPointer, piPointer, bPointer, yPointer);
    expect(readArray(3, yPointer, "float")).toBeDeepCloseTo(
      [8, 1.4, 1.5],
      DECIMAL_POINTS_FOR_CLOSETO_TEST
    );
  });
});
