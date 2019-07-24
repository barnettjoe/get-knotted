// TODO - give this a better name
export interface INode {
  snapObject: Snap.Element;
  x: number;
  y: number;
}

export type Coords = [number, number];

export interface Frame {
  nodes: INode[];
  drawLines(): void;
}

export type Mode = 'add-grid' | 'add-node' | 'add-line';

export interface Drawing {
  addMouseListeners(): void;
  addNode(coords: Coords): void;
  dragFrame(e: MouseEvent): void;
  drawKnot(): void;
  drawFrame(): void;
  drawUserLine(startNode: INode, coords: Coords): void;
  findKnotWith(node: INode): Knot | null;
  finishDrawingLine(e: MouseEvent): void;
  handleMouseDown(this: Drawing, e: MouseEvent): void;
  handleMouseMove(this: Drawing, e: MouseEvent): void;
  handleMouseUp(this: Drawing, e: MouseEvent): void;
  isNodeOverlapping(pixelCoords: Coords): boolean;
  makeNewLine(startNode: INode, endNode: INode): void;
  mergeKnots(knotA: Knot, knotB: Knot, lineStart: INode, lineEnd: INode): void;
  newLineIsValid(lineStart: INode, lineEnd: INode): boolean;
  nodeAt(coords: Coords): INode | null;
  placeNode(e: MouseEvent): void;
  remove(knot: Knot): void;
  removeUserLine(): void;
  singleNodeFrame(coords: Coords): Frame;
  startDrawingGrid(e: MouseEvent): void;
  startDrawingLine(coords: Coords): void;
  graph?: Graph; // TODO -- ??
  frame?: Frame;
  knots: Knot[]; // TODO -- array of what??
  mode: Mode;
  mouseIsDown: boolean;
}
