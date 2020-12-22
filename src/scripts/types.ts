import Knot from "./knot";
import Bezier from "./bezier/bezier";

export type Matrix = number[][];

// TODO - give this a better name
export interface INode {
  snapObject: Snap.Element;
  sameNode(otherNode: INode): boolean;
  x: number;
  y: number;
}

export enum GridSystem {
  square,
  freeform,
}

export interface NodeOptions {
  gridSystem: GridSystem;
  x: number;
  y: number;
}

export interface GridOptions {
  startRow: number;
  startCol: number;
  cols: number;
  rows: number;
  style: LineStyle;
}

interface LineOptions {
  style: LineStyle;
}

export interface FrameLineOptions extends LineOptions {
  endNode: INode;
  startNode: INode;
}

export interface GraphLineOptions extends LineOptions {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface LineStyle {
  // TODO - part of config type
}

export type Coords = [number, number];
export type Vector = Coords;

// export interface Frame {
//   nodes: INode[];
//   lines: FrameLine[];
//   draw(): void;
//   drawLines(): void;
//   findProximalNode(coords: Coords): INode;
//   remove(): void;
//   merge(otherFrame: Frame): Frame;
//   markAsAdjacent(lineStart: INode, lineEnd: INode): void;
//   overlapsExistingNode(x: number, y: number): boolean;
// }

export type IStrand = StrandElement[];

export type Direction = "L" | "R";

export interface StrandElement {
  x: number;
  y: number;
  direction: Direction;
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

export interface Contour {}
export type Strand = StrandElement[];

export interface OffsetSketch {
  foo: string;
}

export interface KnotElement {
  remove(): void;
}

export const MODES = ["add-grid", "add-node", "add-line"] as const;
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
  setupWebglContext(): void;
  singleNodeFrame(coords: Coords): Frame;
  startDrawingGrid(e: MouseEvent): void;
  startDrawingLine(coords: Coords): void;
  graph?: Graph; // TODO -- ??
  frame?: Frame;
  knots: Knot[]; // TODO -- array of what??
  mode: Mode;
  mouseIsDown: boolean;
}

export type OnscreenWebglContext = WebGLRenderingContext & {
  canvas: HTMLCanvasElement;
};

export function isOnscreenWebglContext(
  value: unknown
): value is OnscreenWebglContext {
  return (
    value instanceof WebGLRenderingContext &&
    value.canvas instanceof HTMLCanvasElement
  );
}

export type Polygon = number[][];
