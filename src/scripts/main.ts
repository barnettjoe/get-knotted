import drawing from "./drawing";
import graphLines from "./graph";
import { Mode, MODES } from "./types";

import Snap from "snapsvg";

const surface = Snap("#surface");
export default surface;

function drawSquareGrid() {
  graphLines().forEach(({ startX, startY, endX, endY, style }) => {
    surface.line(startX, startY, endX, endY).attr(style);
  });
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
