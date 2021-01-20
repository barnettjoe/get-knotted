import wasmWrapperModule from "../../wasm/output/add";
import drawing from "./drawing";
import { Mode, MODES } from "./types";

// TODO - can this be better typed?
interface WasmModule {
  cwrap(...args: any): any;
}

// testing wasm
wasmWrapperModule().then((wasmModule: WasmModule) => {
  const add = wasmModule.cwrap("add", "number", ["number", "number"]);
  console.log(add(1, 2));
});

function changeDrawingMode(newMode: Mode) {
  return () => (drawing.mode = newMode);
}

function setUpButton(id: Mode) {
  const button = document.getElementById(id);
  if (button) {
    button.addEventListener("click", changeDrawingMode(id), false);
  } else {
    throw new Error("button not present in the DOM");
  }
}

document.addEventListener(
  "DOMContentLoaded",
  () => {
    drawing.setupWebglContext();
    drawing.addMouseListeners();
    drawing.startDrawLoop();
    MODES.forEach(setUpButton);
  },
  false
);
