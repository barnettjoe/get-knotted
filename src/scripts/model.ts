import { Frame, Knot } from "./types";

let currentFrame: Frame | null = null;
let currentKnot: Knot | null = null;
let gridLines = [];

export default {
  setFrame(frame: Frame) {
    currentFrame = frame;
  },
  getFrame() {
    return currentFrame;
  },
  setCurrentKnot(knot: Knot) {
    currentKnot = knot;
  },
  getCurrentKnot() {
    return currentKnot;
  },
  setGridLines(lines) {
    gridLines = lines;
  },
  getGridLines() {
    return gridLines;
  },
};
