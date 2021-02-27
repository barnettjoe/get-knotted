import { isCrossed, uncrossedDirection } from "./crossing-point";
import { linesOutFrom, firstUncrossedLine } from "./frame";
import { angleOutFrom, angleOutCP, uncrossed } from "./line";
import { sameNode } from "./node";
import {
  Vector,
  Direction,
  FrameNode,
  Frame,
  FrameLine,
  Strand,
  StrandElement as StrandElementType,
  StrandElement,
  PointType,
} from "./types";

interface StrandState {
  frame: Frame;
  currentLine: FrameLine;
  direction: Direction;
  targetNode: FrameNode;
}

let strandState: StrandState | null = null;

// Produce a more data-oriented representation of a strand,
// suitable for being passed into wasm. Eventually, this should
// be the only representation used, so we don't need to convert
// back and forth.
export function compactRepresentation(
  strand: Strand
): [Int8Array, Float32Array] {
  const map = new Map<StrandElement["pr"], PointType>([
    ["L", PointType.LeftPointedReturn],
    ["R", PointType.RightPointedReturn],
    [null, PointType.CrossingPoint],
  ]);
  // for each point:
  // - whether it's a PR, and if so which direction,
  const topology = new Int8Array(strand.length);
  const points = new Float32Array(strand.length * 2);
  for (let i = 0; i < strand.length; i++) {
    const strandElement = strand[i];
    const num = map.get(strandElement.pr);
    if (num === undefined) {
      throw new Error("could not encode point type as number");
    }
    topology[i] = num;
    const { coords } = strandElement.point;
    points[2 * i] = coords[0];
    points[2 * i + 1] = coords[1];
  }
  return [topology, points];
}

export function makeStrand(frame: Frame): Strand {
  const result: Strand = [];
  addAllElements.call(result, frame);
  return result;
}

export function makeStrands(frame: Frame): Strand[] {
  const strands = [];
  while (frame.lines.some(uncrossed)) {
    strands.push(makeStrand(frame));
  }
  return strands;
}

export function pointFollowing(
  index: number,
  strand: Strand
): StrandElementType {
  return strand[(index + 1) % strand.length];
}

export function pointPreceding<T>(index: number, elementList: T[]): T {
  return elementList[index - 1] || elementList[elementList.length - 1];
}

function initialStrandState(frame: Frame) {
  const currentLine = firstUncrossedLine(frame.lines);
  if (currentLine === null) {
    throw new Error("no uncrossed line to initialize strand state");
  }
  const direction = uncrossedDirection(currentLine.crossingPoint);
  if (direction === null) {
    throw new Error(
      "could not find uncrossed direction for initializing strand state"
    );
  }
  const targetNode = currentLine.endNode;
  return { currentLine, direction, targetNode, frame };
}

function addAllElements(this: Strand, frame: Frame) {
  strandState = initialStrandState(frame);

  addElement.call(this);

  while (!endOfStrand()) {
    strandState.currentLine = nextLine();
    strandState.direction = oppositeDirection();
    strandState.targetNode = nextTargetNode();
    addElement.call(this);
  }
}
function addElement(this: Strand) {
  if (strandState === null) {
    throw new Error("strand state is uninitialized");
  }
  this.push({
    point: strandState.currentLine.crossingPoint,
    pr: null,
    direction: strandState.direction,
  });

  if (pointedReturn()) {
    const startCoords = strandState.currentLine.crossingPoint.coords;
    const endCoords = nextLine().crossingPoint.coords;
    const prCoords = getApexCoords(startCoords, endCoords);
    this.push({
      direction: null,
      // horrible hack to make unique id for the Map...
      point: {
        coords: prCoords,
      },
      pr: oppositeDirection(),
    });
  }
  logCrossing();
}
function currentBearing() {
  if (strandState === null) {
    throw new Error("strand state is uninitialized");
  }
  return angleOutCP(strandState.currentLine, {
    direction: strandState.direction,
    reverse: goingBackwards(),
  });
}
function oppositeDirection() {
  if (strandState === null) {
    throw new Error("strand state is uninitialized");
  }
  return strandState.direction === "R" ? "L" : "R";
}
function logCrossing() {
  if (strandState === null) {
    throw new Error("strand state is uninitialized");
  }
  if (strandState.direction === "R") {
    strandState.currentLine.crossingPoint.crossedRight = true;
  } else {
    strandState.currentLine.crossingPoint.crossedLeft = true;
  }
}
function traverseNextBackwards(): boolean {
  if (strandState === null) {
    throw new Error("strand state is uninitialized");
  }
  return sameNode(nextLine().endNode, strandState.targetNode);
}
function compareByAngle(lineA: FrameLine, lineB: FrameLine) {
  if (strandState === null) {
    throw new Error("strand state is uninitialized");
  }
  if (
    angleOutFrom(lineA, strandState.targetNode) <
    angleOutFrom(lineB, strandState.targetNode)
  ) {
    return -1;
  } else {
    return 1;
  }
}
function nextTargetNode() {
  if (strandState === null) {
    throw new Error("strand state is uninitialized");
  }
  if (goingBackwards()) {
    return strandState.currentLine.endNode;
  } else {
    return strandState.currentLine.startNode;
  }
}
function endOfStrand() {
  if (strandState === null) {
    throw new Error("strand state is uninitialized");
  }
  return isCrossed(nextLine().crossingPoint, oppositeDirection());
}
function getApexCoords(startPoint: Vector, endPoint: Vector): Vector {
  if (strandState === null) {
    throw new Error("strand state is uninitialized");
  }
  const startToEnd = [endPoint[0] - startPoint[0], endPoint[1] - startPoint[1]];
  let normal;
  if (strandState.direction === "R") {
    normal = [-startToEnd[1], startToEnd[0]];
  } else {
    normal = [startToEnd[1], -startToEnd[0]];
  }
  return [
    startPoint[0] + startToEnd[0] / 2 + normal[0],
    startPoint[1] + startToEnd[1] / 2 + normal[1],
  ];
}
function nextLine() {
  if (strandState === null) {
    throw new Error("strand state is uninitialized");
  }
  const roundabout = linesOutFrom(
    strandState.targetNode,
    strandState.frame.lines
  );
  const orderedLinesOut = roundabout.slice().sort(compareByAngle);
  const inIndex = orderedLinesOut.indexOf(strandState.currentLine);

  if (strandState.direction === "R") {
    // pad out list with first element...
    // to allow going all way thru to start again
    const previousLine = orderedLinesOut[inIndex - 1];
    const lastLine = orderedLinesOut[orderedLinesOut.length - 1];
    return previousLine || lastLine;
  } else {
    orderedLinesOut.push(orderedLinesOut[0]);
    return orderedLinesOut[inIndex + 1];
  }
}
function nextBearing() {
  return angleOutCP(nextLine(), {
    direction: oppositeDirection(),
    reverse: traverseNextBackwards(),
  });
}
function goingBackwards() {
  if (strandState === null) {
    throw new Error("strand state is uninitialized");
  }
  return sameNode(strandState.currentLine.startNode, strandState.targetNode);
}
function pointedReturn() {
  const angleDelta = Math.abs(currentBearing() - nextBearing());
  const smallerAngle = Math.min(angleDelta, Math.PI * 2 - angleDelta);
  return smallerAngle > 1.6;
}
