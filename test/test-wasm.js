require = require("esm")(module);
const { default: wasmWrapperModule } = require("../wasm/output/matrix.js");

// testing wasm
wasmWrapperModule().then((wasmModule) => {
  const wasmFn = wasmModule.cwrap("matrix", "number", []);
  wasmFn();
});
