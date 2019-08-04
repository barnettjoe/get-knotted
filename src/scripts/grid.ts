import { GridOptions } from './types';
import Line from './line';

export default class Grid {
  // TODO - check following prinicple of least privelege
  public lines: Line[];
  public nodes?: Snap.Element[];
  public options: GridOptions;

  constructor(options: GridOptions) {
    this.lines = [];
    this.options = options;
  }

  remove() {
    this.lines.forEach(line => line.snapObj.remove());
    this.lines = [];

    if (this.nodes) {
      this.nodes.forEach(node => node.remove());
    }
  }
}
