const wasmModuleWrapper = require("../built-wasm/matrix.js");

let wasmModule;
const pointersToFree = [];

const NUMERICAL_ERROR_THRESHOLD = 1e-6;

function isCloseTo(a, b) {
  return Math.abs(a - b) < NUMERICAL_ERROR_THRESHOLD;
}

function arrayIsCloseTo(a, b) {
  return a.length === b.length && a.every((x, idx) => isCloseTo(x, b[idx]));
}

function matrixIsCloseTo(a, b) {
  return (
    rowCount(a) === rowCount(b) &&
    a.every((row, rowIdx) => arrayIsCloseTo(row, b[rowIdx]))
  );
}

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
  double: {
    arrayConstructor: Float64Array,
    size: 8,
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

function rowCount(matrix) {
  return matrix.length;
}

function columnCount(matrix) {
  return matrix[0].length;
}

function transpose(matrix) {
  const result = zeroMatrix(columnCount(matrix), rowCount(matrix));
  matrix.forEach((row, rowIdx) => {
    row.forEach((element, colIdx) => {
      result[colIdx][rowIdx] = element;
    });
  });
  return result;
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

function zeroArray(length) {
  const result = [];
  for (let i = 0; i < length; i++) {
    result.push(0);
  }
  return result;
}

function zeroMatrix(rows, cols) {
  const result = [];
  for (let i = 0; i < rows; i++) {
    result.push(zeroArray(cols));
  }
  return result;
}

function isZeroMatrix(matrix) {
  return flatten(matrix).every((element) => isCloseTo(element, 0));
}

function isUnitLowerTriangularMatrix(matrix) {
  const isSquare = rowCount(matrix) === columnCount(matrix);
  if (!isSquare) return false;
  return matrix.every((row, rowIdx) => {
    return row.every((element, colIdx) => {
      return (
        colIdx < rowIdx ||
        (colIdx === rowIdx && isCloseTo(element, 1)) ||
        isCloseTo(element, 0)
      );
    });
  });
}

function isUpperTriangularMatrix(matrix) {
  const isSquare = rowCount(matrix) === columnCount(matrix);
  if (!isSquare) return false;
  return matrix.every((row, rowIdx) =>
    row.every((element, colIdx) => colIdx >= rowIdx || isCloseTo(element, 0))
  );
}

function isPermutationArray(array) {
  const sorted = array.slice().sort();
  return sorted.every((el, idx) => el === idx);
}

function innerProduct(vecA, vecB) {
  if (vecA.length !== vecB.length) {
    throw new Error(
      "could not calculate inner product: vector lengths don't match"
    );
  }
  return vecA.reduce((acc, value, idx) => acc + value * vecB[idx], 0);
}

function multiply(matrixA, matrixB) {
  if (columnCount(matrixA) !== rowCount(matrixB)) {
    throw new Error("could not multiply matrices: dimensions didn't match");
  }
  const bCols = transpose(matrixB);
  return matrixA.map((aRow) => {
    return bCols.map((bCol) => innerProduct(bCol, aRow));
  });
}

beforeAll(async () => {
  wasmModule = await wasmModuleWrapper();
});

afterEach(() => {
  while (pointersToFree.length > 0) {
    wasmModule._free(pointersToFree.pop());
  }
});

function permutationMatrixFromArray(array) {
  return array.map((idx) => {
    const row = zeroArray(array.length);
    row[idx] = 1;
    return row;
  });
}

describe("multiply", () => {
  it("should multiply two matrices", () => {
    const wasmMultiply = wasmModule.cwrap("multiply", null, [
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
    wasmMultiply(
      rowCount(matrixA),
      columnCount(matrixA),
      rowCount(matrixB),
      columnCount(matrixB),
      aPointer,
      bPointer,
      resultPointer
    );

    expect(
      matrixIsCloseTo(readMatrix(2, 2, resultPointer, "float"), [
        [29, -16],
        [38, 6],
      ])
    ).toBe(true);
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
    expect(arrayIsCloseTo(readArray(3, yPointer, "float"), [8, 1.4, 1.5])).toBe(
      true
    );
  });
});

describe("backward substitution", () => {
  it("should solve for x", () => {
    const backward_substitution = wasmModule.cwrap(
      "backward_substitution",
      null,
      ["number", "number", "number", "number", "number"]
    );
    const U = [
      [5, 6, 3],
      [0, 0.8, -0.6],
      [0, 0, 2.5],
    ];
    const y = [8, 1.4, 1.5];
    const x = [0, 0, 0];
    const uPointer = createMatrix(U, "float");
    const yPointer = createArray(y, "float");
    const xPointer = createArray(x, "float");
    backward_substitution(x.length, uPointer, yPointer, xPointer);
    expect(
      arrayIsCloseTo(readArray(3, xPointer, "float"), [-1.4, 2.2, 0.6])
    ).toBe(true);
  });
});

describe("LUP decomposition", () => {
  it("should factorize a square matrix into a unit-lower-triangular matrix, an upper triangular matrix and a permutation matrix", () => {
    const lup = wasmModule.cwrap("LUP_decomposition", null, [
      "number",
      "number",
      "number",
      "number",
      "number",
    ]);
    const A = [
      [2, 0, 2, 0.6],
      [3, 3, 4, -2],
      [5, 5, 4, 2],
      [-1, -2, 3.4, -1],
    ];
    const L = zeroMatrix(4, 4);
    const U = zeroMatrix(4, 4);
    const P = zeroArray(4);
    const aPointer = createMatrix(A, "float");
    const lPointer = createMatrix(L, "float");
    const uPointer = createMatrix(U, "float");
    const pPointer = createArray(P, "i32");
    lup(rowCount(A), aPointer, lPointer, uPointer, pPointer);
    const lResult = readMatrix(rowCount(L), columnCount(L), lPointer, "float");
    const uResult = readMatrix(rowCount(U), columnCount(U), uPointer, "float");
    const pResult = readArray(P.length, pPointer, "i32");
    const aResult = readMatrix(rowCount(U), columnCount(U), aPointer, "float");
    expect(isZeroMatrix(lResult)).toBe(false);
    expect(isUnitLowerTriangularMatrix(lResult)).toBe(true);
    expect(isZeroMatrix(uResult)).toBe(false);
    expect(isUpperTriangularMatrix(uResult)).toBe(true);
    expect(isPermutationArray(pResult)).toBe(true);
    expect(
      // TODO - we'll need to actually convert pResult to a matrix for this to work...
      matrixIsCloseTo(
        multiply(permutationMatrixFromArray(pResult), A),
        multiply(lResult, uResult)
      )
    ).toBe(true);
  });
});
