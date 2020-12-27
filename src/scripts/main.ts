import drawing from "./drawing";
import graphLines from "./graph";
import { Mode, MODES } from "./types";

import Snap from "snapsvg";
import model from "./model";

const surface = Snap("#surface");
export default surface;

function drawSquareGrid() {
  model.setGridLines(graphLines());
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

document.addEventListener(
  "DOMContentLoaded",
  () => {
    drawing.setupWebglContext();
    drawing.addMouseListeners();
    drawing.startDrawLoop();
    MODES.forEach(setUpButton);
    drawSquareGrid();
  },
  false
);
