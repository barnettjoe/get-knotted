import { Bezier } from "bezier-js";

export type Matrix = number[][];

export type ArrayElement<A extends unknown[]> = A extends (infer T)[]
  ? T
  : never;

export interface FrameNode {
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
  cols: number;
  rows: number;
}

export interface FrameLineOptions {
  endNode: FrameNode;
  startNode: FrameNode;
}

export type PolyLine = Point[];

export interface OrganizedPolylines {
  innerInboundPolyline: PolyLine;
  innerOutboundPolyline: PolyLine;
  outerInboundPolyline: PolyLine;
  outerOutboundPolyline: PolyLine;
}

export interface Frame {
  nodes: FrameNode[];
  adjacencyList: Matrix;
  lines: FrameLine[];
}

export type Direction = "L" | "R";

interface OffsetInfo {
  underOutLeft: PolyLine;
  underOutRight: PolyLine;
  underInLeft: PolyLine;
  underInRight: PolyLine;
  overOutLeft: PolyLine;
  overOutRight: PolyLine;
  overInLeft: PolyLine;
  overInRight: PolyLine;
}
export interface FrameWithOffsetInfo extends Frame {
  lines: FrameLineWithOffsetInfo[];
}

export type OverUnders = Map<CrossingPoint, OffsetInfo>;

export type ContourElement = StrandElement & {
  outboundBezier: Bezier;
};

type ContourElementWithOffsetInfo = StrandElementWithOffsetInfo & {
  outboundBezier: Bezier;
};

export type Contour = ContourElement[];
export type ContourWithOffsetInfo = ContourElementWithOffsetInfo[];
export type Strand = StrandElement[];

export const MODES = ["add-grid", "add-node", "add-line"] as const;
export type Mode = typeof MODES[number];

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
  coords: Vector;
}

export type CrossingPointWithOffsetInfo = CrossingPoint & OffsetInfo;

export interface PointedReturnPoint {
  coords: Vector;
}

export type PointedReturnPointWithOffsetInfo = PointedReturnPoint & OffsetInfo;

export interface CrossingPointStrandElement {
  direction: Direction;
  point: CrossingPoint;
  pr: null;
  outboundBezier?: Bezier;
  inboundBezier?: Bezier;
}

interface CrossingPointWithOffsetInfoStrandElement
  extends CrossingPointStrandElement {
  point: CrossingPointWithOffsetInfo;
}

interface PointedReturnStrandElement {
  direction: null;
  point: PointedReturnPoint;
  pr: Direction;
  outboundBezier?: Bezier;
  inboundBezier?: Bezier;
}

interface PointedReturnPointWithOffsetInfoStrandElement
  extends PointedReturnStrandElement {
  point: PointedReturnPointWithOffsetInfo;
}

export type StrandElement =
  | CrossingPointStrandElement
  | PointedReturnStrandElement;

export type StrandElementWithOffsetInfo =
  | CrossingPointWithOffsetInfoStrandElement
  | PointedReturnPointWithOffsetInfoStrandElement;
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
  contours: ContourWithOffsetInfo[];
  polylines: Set<PolyLine>;
}

interface UserLine {
  startNode: FrameNode;
  toCoords: Vector;
}

export interface Line {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface FrameLine {
  startNode: FrameNode;
  endNode: FrameNode;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  crossingPoint: CrossingPoint;
}

interface FrameLineWithOffsetInfo extends FrameLine {
  crossingPoint: CrossingPointWithOffsetInfo;
}

export interface Model {
  userLine: UserLine | null;
  gridLines: Line[] | null;
  mouseTracker: Vector | null;
  canvasWidth: number;
  canvasHeight: number;
  columns: number;
  rows: number;
  squareSize: number;
}

export type PolyLines = number[][];
export interface CollectionIntersectionResult {
  idxA: number;
  idxB: number;
  intersection: Point;
}

export enum BezierControlPoint {
  P0,
  P1,
  P2,
  P3,
}

export enum Dimension {
  x = 0,
  y,
}

export enum PointType {
  LeftPointedReturn = 0,
  RightPointedReturn,
  CrossingPoint,
}

export interface LineCrossingState {
  crossedLeft: boolean;
  crossedRight: boolean;
}

export type CrossingState = Map<FrameLine, LineCrossingState>;

export interface StrandState {
  frame: Frame;
  currentLine: FrameLine;
  direction: Direction;
  targetNode: FrameNode;
}

export type ContouringStrategyName =
  | "fullMatrixSolution"
  | "splitMatrixSolution";

export type ContouringStrategy = (
  strandTopology: Int8Array,
  points: Float32Array
) => { xControlPoints: number[]; yControlPoints: number[] };
