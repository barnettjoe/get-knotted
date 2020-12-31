import { Frame, Knot } from "./types";

let currentFrame: Frame | null = null;
let currentKnot: Knot | null = null;
let gridLines = [];
let mouseTracker = null;

export default {
  setMouseTracker(coords) {
    mouseTracker = coords;
  },
  getMouseTracker() {
    return mouseTracker;
  },
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
