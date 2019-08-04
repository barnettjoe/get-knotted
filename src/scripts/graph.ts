import config from './config.js';
import Grid from './grid';
import { pixelCoords } from './mouse.js';
import Line from './line';

import { GridOptions } from 'types';

export default class Graph extends Grid {
  constructor() {
    const options: GridOptions = {
      startCol: 0,
      startRow: 0,
      cols: config.graphCols,
      rows: config.graphRows,
      style: config.graphLine,
    };
    super(options);
    this.createHorizontalLines(options);
    this.createVerticalLines(options);
  }

  // draw all horizontal lines
  createHorizontalLines(options: GridOptions) {
    for (let i = options.startRow; i <= options.startRow + options.rows; i += 1) {
      const [startX, startY] = pixelCoords([options.startCol, i]);
      const [endX, endY] = pixelCoords([options.startCol + options.cols, i]);

      this.lines.push(new Line({
        startX,
        startY,
        endX,
        endY,
        method: 'position',
        style: options.style,
      }));
    }
  }

  // draw all vertical lines
  createVerticalLines(options: GridOptions) {
    for (let i = options.startCol; i <= options.startCol + options.cols; i += 1) {
      const [startX, startY] = pixelCoords([i, options.startRow]);
      const [endX, endY] = pixelCoords([i, options.startRow + options.rows]);

      this.lines.push(new Line({
        startX,
        startY,
        endX,
        endY,
        method: 'position',
        style: options.style,
      }));
    }
  }
}
