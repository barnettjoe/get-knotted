import drawing from "./drawing";
import Graph from "./graph";
import { Mode, MODES } from "./types";

import Snap from "snapsvg";

export default Snap("#surface");

function drawSquareGrid() {
  drawing.graph = new Graph();
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
    drawing.addMouseListeners();
    MODES.forEach(setUpButton);
    drawSquareGrid();
  },
  false
);
