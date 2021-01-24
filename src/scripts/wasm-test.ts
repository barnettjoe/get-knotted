import wasmWrapperModule from "../../wasm/output/add";

// TODO - can this be better typed?
interface WasmModule {
  cwrap(fnName: string, returnType: string, paramTypes: string[]): any;
  _malloc(size: number): number;
  _free(address: number): void;
  HEAPF32: { set(data: Float32Array, address: number): void };
}

// testing wasm
wasmWrapperModule().then((wasmModule: WasmModule) => {
  const typedArray = new Float32Array([1, 2, 3, 4, 5]);
  const buffer = wasmModule._malloc(
    typedArray.length * typedArray.BYTES_PER_ELEMENT
  );
  wasmModule.HEAPF32.set(typedArray, buffer >> 2);
  const add = wasmModule.cwrap("add", "number", ["number"]);
  console.log(add(buffer));
  wasmModule._free(buffer);
});
