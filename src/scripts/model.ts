import { Frame, Knot } from "./types";

let currentFrame: Frame | null = null;
let currentKnot: Knot | null = null;

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
};
