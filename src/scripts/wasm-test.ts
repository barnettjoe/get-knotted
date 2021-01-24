import wasmWrapperModule from "../../wasm/output/add";

type BaseDataType = "i8" | "i16" | "i32" | "i64" | "float" | "double";
type DataType = BaseDataType | `${BaseDataType}*` | "*";

interface WasmModule {
  cwrap(fnName: string, returnType: string, paramTypes: string[]): any;
  _malloc(size: number): number;
  _free(address: number): void;
  getValue(address: number, dataType: DataType): void;
  setValue(address: number, value: number, dataType: DataType): void;
}

// testing wasm
wasmWrapperModule().then((wasmModule: WasmModule) => {
  // create an array to pass in to wasm
  const inputArray = new Uint16Array([11, 22, 33, 44]);
  const inputPointer = wasmModule._malloc(
    inputArray.length * inputArray.BYTES_PER_ELEMENT
  );
  inputArray.forEach((val, idx) => {
    wasmModule.setValue(
      inputPointer + idx * inputArray.BYTES_PER_ELEMENT,
      val,
      "i16"
    );
  });
  const wasmFn = wasmModule.cwrap("add", "number", ["number"]);
  const pointer = wasmFn(inputPointer);
  // log out values from the array whose pointer was returned from wasm-land
  for (let i = 0; i < 5; i++) {
    console.log(wasmModule.getValue(pointer + 4 * i, "i16"));
  }
  // cleanup
  wasmModule._free(pointer);
  wasmModule._free(inputPointer);
});
