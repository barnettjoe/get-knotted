import config from "./config";
import { Model } from "./types";

const model: Model = {
  userLine: null,
  gridLines: null,
  mouseTracker: null,
  canvasWidth: 0,
  canvasHeight: 0,
  columns: 0,
  rows: 0,
  squareSize: config.targetSquareSize,
};

export default model;
