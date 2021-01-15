import Knot from "./knot";
import Bezier from "./bezier/bezier";

export type Matrix = number[][];

// TODO - give this a better name
export interface INode {
  x: number;
  y: number;
  gridX: number;
  gridY: number;
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
export interface Frame {
  nodes: INode[];
  adjacencyList: Matrix;
  lines: FrameLine[];
}

export type IStrand = Partial<StrandElement>[];

export type Direction = "L" | "R";

export interface OffsetInfo {
  underOutLeft: PolyLine;
  underOutRight: PolyLine;
  underInLeft: PolyLine;
  underInRight: PolyLine;
  overOutLeft: PolyLine;
  overOutRight: PolyLine;
  overInLeft: PolyLine;
  overInRight: PolyLine;
}

export type OverUnders = Map<CrossingPoint, OffsetInfo>;
export interface CollectionIntersect {
  intersection: Coords;
  idxA: number;
  idxB: number;
}

export type PolyLine = Coords[];
export type ContourElement = StrandElement & {
  outboundBezier: Bezier;
};
export type Contour = ContourElement[];
export type Strand = StrandElement[];

export interface OffsetSketch {
  foo: string;
}

export const MODES = ["add-grid", "add-node", "add-line"] as const;
export type Mode = typeof MODES[number];

export interface Drawing {
  addMouseListeners(): void;
  addNode(coords: Coords): void;
  dragFrame(e: MouseEvent): void;
  createKnot(): void;
  updateFrame(): void;
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
  setupWebglContext(): void;
  singleNodeFrame(coords: Coords): Frame;
  startDrawLoop(): void;
  startDrawingGrid(e: MouseEvent): void;
  startDrawingLine(coords: Coords): void;
  startDrawingLine(coords: Coords): void;
  frame?: Frame;
  knots: Knot[]; // TODO -- array of what??
  mode: Mode;
  mouseIsDown: boolean;
}

export type OnscreenWebglContext = WebGL2RenderingContext & {
  canvas: HTMLCanvasElement;
};

export function isOnscreenWebglContext(
  value: unknown
): value is OnscreenWebglContext {
  return (
    value instanceof WebGL2RenderingContext &&
    value.canvas instanceof HTMLCanvasElement
  );
}

export type Polygon = number[][];

export interface CrossingPoint {
  crossedLeft: boolean;
  crossedRight: boolean;
  coords: [number, number];
}

export type CrossingPointWithOffsetInfo = CrossingPoint & OffsetInfo;

export interface PointedReturnPoint {
  coords: [number, number];
}

export type PointedReturnPointWithOffsetInfo = PointedReturnPoint & OffsetInfo;

interface CrossingPointStrandElement {
  direction: Direction;
  point: CrossingPoint;
  pr: Direction;
  outboundBezier?: Bezier;
  inboundBezier?: Bezier;
}
interface PointedReturnStrandElement {
  direction: Direction;
  point: PointedReturnPoint;
  pr: Direction | null;
  outboundBezier?: Bezier;
  inboundBezier?: Bezier;
}

export type StrandElement =
  | CrossingPointStrandElement
  | PointedReturnStrandElement;

export interface Point {
  x: number;
  y: number;
}

export type Vector = [number, number];

export interface Primitives {
  lines: number[][];
  singlePixelLines: number[][];
  circles: number[][];
}

export interface Knot {
  frame: Frame;
  contours: Contour[];
  overUnders: OverUnders;
}

export interface UserLine {
  startNode: INode;
  toCoords: Coords;
}

export interface Line {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface FrameLine {
  startNode: INode;
  endNode: INode;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  crossingPoint: CrossingPoint;
}
export interface Model {
  frame: Frame | null;
  knot: Knot | null;
  userLine: UserLine | null;
  gridLines: Line[] | null;
  mouseTracker: Coords | null;
  canvasWidth: number;
  canvasHeight: number;
  columns: number;
  rows: number;
  squareSize: number;
}

export type PolyLines = number[][];
