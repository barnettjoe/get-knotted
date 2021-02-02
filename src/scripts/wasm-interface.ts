import { default as wasmWrapper } from "../../built-wasm/matrix.js";

const wasmModule = {};
const loadWasmPromise = wasmWrapper().then((mod) => {
  wasmModule.lup = mod.cwrap("LUP_decomposition", null, [
    "number",
    "number",
    "number",
  ]);
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

  return;
});

export async function lup(A) {
  await loadWasmPromise;
  wasmModule.lup();
}
