const wasmModuleWrapper = require("../built-wasm/matrix.test.js");

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

function splitIntoLU(matrix) {
  const L = zeroMatrix(rowCount(matrix), columnCount(matrix));
  const U = zeroMatrix(rowCount(matrix), columnCount(matrix));
  for (let i = 0; i < rowCount(matrix); i++) {
    for (let j = 0; j < columnCount(matrix); j++) {
      if (i === j) {
        L[i][j] = 1;
      }
      (i > j ? L : U)[i][j] = matrix[i][j];
    }
  }
  return [L, U];
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
    ]);
    const A = [
      [2, 0, 2, 0.6],
      [3, 3, 4, -2],
      [5, 5, 4, 2],
      [-1, -2, 3.4, -1],
    ];
    const P = zeroArray(4);
    const aPointer = createMatrix(A, "float");
    const pPointer = createArray(P, "i32");
    lup(rowCount(A), aPointer, pPointer);
    const pResult = readArray(P.length, pPointer, "i32");
    const aResult = readMatrix(rowCount(A), columnCount(A), aPointer, "float");
    const [L, U] = splitIntoLU(aResult);
    expect(isZeroMatrix(L)).toBe(false);
    expect(isUnitLowerTriangularMatrix(L)).toBe(true);
    expect(isZeroMatrix(U)).toBe(false);
    expect(isUpperTriangularMatrix(U)).toBe(true);
    expect(isPermutationArray(pResult)).toBe(true);
    expect(
      matrixIsCloseTo(
        multiply(permutationMatrixFromArray(pResult), A),
        multiply(L, U)
      )
    ).toBe(true);
  });
});

describe("solve", () => {
  it("can solve a system of linear equations", () => {
    const solve = wasmModule.cwrap("solve", null, [
      "number",
      "number",
      "number",
      "number",
      "number",
    ]);
    const LU = [
      [5, 6, 3],
      [0.2, 0.8, -0.6],
      [0.6, 0.5, 2.5],
    ];
    const b = [3, 7, 8];
    const pi = [2, 0, 1];
    const x = zeroArray(3);
    const luPointer = createMatrix(LU, "float");
    const bPointer = createArray(b, "float");
    const xPointer = createArray(x, "float");
    const piPointer = createArray(pi, "i32");
    solve(3, luPointer, piPointer, bPointer, xPointer);
    const xResult = readArray(x.length, xPointer, "float");
    const columnX = transpose([xResult]);
    const columnB = transpose([b]);
    const [L, U] = splitIntoLU(LU);
    expect(
      matrixIsCloseTo(
        multiply(multiply(L, U), columnX),
        multiply(permutationMatrixFromArray(pi), columnB)
      )
    ).toBe(true);
  });
});
