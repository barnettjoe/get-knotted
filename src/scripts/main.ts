import drawing from "./drawing";
import { Mode, MODES } from "./types";
import { setup as setupWasm } from "./wasm-interface";
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
  async () => {
    await setupWasm();
    drawing.setupWebglContext();
    drawing.addMouseListeners();
    drawing.startDrawLoop();
    MODES.forEach(setUpButton);
  },
  false
);
