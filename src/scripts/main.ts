import drawing from "./drawing";
import graphLines from "./graph";
import { Mode, MODES } from "./types";

import Snap from "snapsvg";

export default Snap("#surface");

function drawSquareGrid() {
  // TODO - do the drawing here instead of in line.ts
  graphLines();
}

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

// this is where the impurities will surface
document.addEventListener(
  "DOMContentLoaded",
  () => {
    drawing.addMouseListeners();
    MODES.forEach(setUpButton);
    drawSquareGrid();
  },
  false
);
