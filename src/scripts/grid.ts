import { GridOptions } from "./types";
import { GraphLine } from "./line";

export default class Grid {
  // TODO - check following prinicple of least privilege
  public lines: GraphLine[];
  public nodes?: Snap.Element[];
  public options: GridOptions;

  constructor(options: GridOptions) {
    this.lines = [];
    this.options = options;
  }
}
