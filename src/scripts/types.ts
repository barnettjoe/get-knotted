import Knot from './knot';
import Bezier from './bezier/bezier';

// TODO - give this a better name
export interface INode {
  snapObject: Snap.Element;
  x: number;
  y: number;
}

export type Coords = [number, number];

export interface Frame {
  nodes: INode[];
  lines: Line[];
  draw(): void;
  drawLines(): void;
  findProximalNode(coords: Coords): INode;
  remove(): void;
  merge(otherFrame: Frame): Frame;
  markAsAdjacent(lineStart: INode, lineEnd: INode): void;
  overlapsExistingNode(x: number, y: number): boolean;
}

export type IStrand = StrandElement[];

export interface StrandElement {
  direction: 'L' | 'R',
  point: IPoint;
  pr: boolean;
  outboundBezier: Bezier;
  inboundBezier: Bezier;
}

export interface IPoint {
  trimmed: boolean;
  underOutLeft: PolyLine;
  underOutRight: PolyLine;
  underInLeft: PolyLine;
  underInRight: PolyLine;
  overOutLeft: PolyLine;
  overOutRight: PolyLine;
  overInLeft: PolyLine;
  overInRight: PolyLine;
}

export interface CollectionIntersect {
  intersection: Coords;
  idxA: number;
  idxB: number;
}

export type PolyLine = Coords[];

export interface IContour {

}

export interface Line {
  uncrossed(): boolean;
}

export interface OffsetSketch {
  foo: string;
}

export interface KnotElement {
  remove(): void;
}

export const MODES = ['add-grid', 'add-node', 'add-line'] as const;
export type Mode = typeof MODES[number];

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
