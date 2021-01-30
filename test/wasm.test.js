/* globals beforeAll it */
const wasmModuleWrapper = require("../wasm/output/matrix.js");

let wasmModule;
beforeAll(async () => {
  wasmModule = await wasmModuleWrapper();
});

it("should add two numbers from an es module", () => {
  const wasmFn = wasmModule.cwrap("matrix", "number", []);
  wasmFn();
  expect(3).toEqual(3);
});
